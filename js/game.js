/**
 * Runner Legends v3.1 — Game engine (Mega Directiva v2.0)
 * Depends: RLWorlds, RLPortal (loaded first).
 */
(function () {
  'use strict';
  if (!window.RLWorlds || !window.RLPortal) {
    console.error('RL: missing worlds/portal modules');
    return;
  }

  const { WORLDS, getWorld, buildRuntimeConfig } = RLWorlds;
  const { PortalOutcomeResolver, WorldTransitionManager } = RLPortal;

  const CFG = {
    logicalH: 540, ground: 96,
    gravity: 2050, jumpVel: -790, jumpCut: 0.42,
    coyote: 0.10, buffer: 0.10,
    runStart: 340, runMax: 560, runAccel: 6.5,
    player: { w: 46, h: 66, x: 0.26 },
    iframes: 1.1, maxHP: 3,
    superChargePerCoin: 0.01, superChargePerSec: 1 / 45,
    portalAt: 220
  };

  const DIFF = {
    normal: { id: 'normal', label: 'Normal', scroll: 1.0, coyote: 0.1, buffer: 0.1, density: 1.0, reward: 1.0, chip: 'NORMAL' },
    hard: { id: 'hard', label: 'Difícil', scroll: 1.15, coyote: 0.08, buffer: 0.08, density: 1.2, reward: 1.25, chip: 'DIFÍCIL' },
    expert: { id: 'expert', label: 'Experto', scroll: 1.3, coyote: 0.06, buffer: 0.06, density: 1.35, reward: 1.5, chip: 'EXPERTO' },
    legendary: { id: 'legendary', label: 'Legendario', scroll: 1.45, coyote: 0.04, buffer: 0.04, density: 1.5, reward: 2.0, chip: 'LEGENDARIO' }
  };

  let activeDiff = DIFF.normal;
  let runtime = buildRuntimeConfig('neon', 'clear_night', 'extreme_speed', 'normal');
  let preferredOrigin = 'neon';

  const SAVE_KEY = 'rl_save_v2';
  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      coins: 0, xp: 0, level: 1, name: 'Jugador',
      unlocked: ['neon'], legendary: false, intro: false,
      portalHistory: [], combos: [], bestDist: 0
    };
  }
  let save = loadSave();
  function persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {}
  }

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const aabb = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const $ = (id) => document.getElementById(id);

  class ObjectPool {
    constructor(factory) { this.factory = factory; this.free = []; this.active = []; }
    spawn(init) {
      const o = this.free.pop() || this.factory();
      o.alive = true; init && init(o); this.active.push(o); return o;
    }
    sweep() {
      for (let i = this.active.length - 1; i >= 0; i--)
        if (!this.active[i].alive) { this.free.push(this.active[i]); this.active.splice(i, 1); }
    }
    clear() { while (this.active.length) { const o = this.active.pop(); o.alive = false; this.free.push(o); } }
    forEach(fn) { for (let i = 0; i < this.active.length; i++) fn(this.active[i]); }
  }

  class EventBus {
    constructor() { this.map = new Map(); }
    on(ev, fn) { (this.map.get(ev) || this.map.set(ev, []).get(ev)).push(fn); }
    emit(ev, p) { const l = this.map.get(ev); if (l) for (let i = 0; i < l.length; i++) l[i](p); }
  }
  const bus = new EventBus();

  class Clock {
    constructor() { this.scale = 1; this._freeze = 0; }
    freeze(sec) { this._freeze = Math.max(this._freeze, sec); }
    step(rawDt) {
      if (this._freeze > 0) { this._freeze -= rawDt; return 0; }
      return rawDt * this.scale;
    }
  }
  const clock = new Clock();

  const audio = {
    ctx: null,
    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    },
    beep(freq, dur, type, gain) {
      if (!this.ctx) return;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.value = gain || 0.04;
      o.connect(g); g.connect(this.ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      o.stop(this.ctx.currentTime + dur + 0.02);
    },
    jump() { this.beep(420, 0.08, 'triangle', 0.05); },
    land() { this.beep(120, 0.06, 'sine', 0.04); },
    coin() { this.beep(880, 0.05, 'square', 0.03); },
    hurt() { this.beep(90, 0.15, 'sawtooth', 0.05); },
    portal() { this.beep(180, 0.25, 'sine', 0.06); this.beep(360, 0.35, 'triangle', 0.04); },
    superFx() { this.beep(220, 0.2, 'sawtooth', 0.05); this.beep(440, 0.3, 'square', 0.03); }
  };
  bus.on('jump', () => audio.jump());
  bus.on('land', () => audio.land());
  bus.on('hurt', () => audio.hurt());

  class InputReader {
    constructor() {
      this.jumpQueued = false; this.holding = false; this._release = false; this.superPressed = false;
      const dn = () => { this.jumpQueued = true; this.holding = true; };
      const up = () => { this.holding = false; this._release = true; };
      const stage = $('stage');
      stage.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button,a,input,.panel,.nav-tab,.diff-btn,.world-tile')) return;
        dn();
      });
      stage.addEventListener('pointerup', up);
      stage.addEventListener('pointercancel', up);
      window.addEventListener('keydown', (e) => {
        if (e.repeat) return;
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); dn(); }
        if (e.code === 'KeyE' || e.code === 'ShiftLeft') this.superPressed = true;
      });
      window.addEventListener('keyup', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') up();
      });
      const sb = $('superBtn');
      if (sb) sb.addEventListener('pointerdown', (e) => { e.preventDefault(); this.superPressed = true; });
    }
    consumeJump() { const q = this.jumpQueued; this.jumpQueued = false; return q; }
    consumeRelease() { const r = this._release; this._release = false; return r; }
    consumeSuper() { const s = this.superPressed; this.superPressed = false; return s; }
  }

  class View {
    constructor(canvas) {
      this.c = canvas; this.ctx = canvas.getContext('2d');
      this.dpr = 1; this.w = 0; this.h = CFG.logicalH; this.scale = 1; this.lookAhead = 0;
      const onResize = () => this.resize();
      window.addEventListener('resize', onResize);
      window.addEventListener('orientationchange', onResize);
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', onResize);
        window.visualViewport.addEventListener('scroll', onResize);
      }
      this.resize();
    }
    resize() {
      const vv = window.visualViewport;
      const vw = Math.max(1, Math.round((vv && vv.width) || window.innerWidth || document.documentElement.clientWidth));
      const vh = Math.max(1, Math.round((vv && vv.height) || window.innerHeight || document.documentElement.clientHeight));
      this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      this.c.width = Math.round(vw * this.dpr); this.c.height = Math.round(vh * this.dpr);
      this.scale = vh / CFG.logicalH; this.h = CFG.logicalH; this.w = vw / this.scale;
    }
    begin(sx, sy) {
      this.ctx.setTransform(
        this.dpr * this.scale, 0, 0, this.dpr * this.scale,
        this.dpr * (sx - this.lookAhead) * this.scale, this.dpr * sy * this.scale
      );
    }
    get groundY() { return this.h - CFG.ground; }
  }

  class CameraShake {
    constructor() { this.trauma = 0; this.t = 0; }
    add(a) { this.trauma = clamp(this.trauma + a, 0, 1); }
    update(dt) { this.t += dt * 30; this.trauma = Math.max(0, this.trauma - dt * 1.6); }
    get offset() {
      const s = this.trauma * this.trauma * 12;
      return { x: Math.sin(this.t * 1.7) * s, y: Math.cos(this.t * 2.3) * s };
    }
  }

  class Particles {
    constructor() {
      this.pool = new ObjectPool(() => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 2, col: '#fff', g: 0, alive: false }));
    }
    burst(x, y, n, opt) {
      opt = opt || {};
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(opt.spMin || 40, opt.spMax || 220);
        this.pool.spawn((p) => {
          p.x = x; p.y = y; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - (opt.up || 0);
          p.life = p.max = rand(opt.lifeMin || 0.25, opt.lifeMax || 0.7);
          p.size = rand(opt.sMin || 2, opt.sMax || 5); p.col = opt.col || '#ffd24a'; p.g = opt.g != null ? opt.g : 900;
        });
      }
    }
    dust(x, y) { this.burst(x, y, 2, { spMin: 20, spMax: 70, lifeMin: 0.2, lifeMax: 0.4, sMin: 2, sMax: 4, col: 'rgba(180,220,255,0.7)', g: 200, up: 10 }); }
    update(dt) {
      this.pool.forEach((p) => {
        p.life -= dt; if (p.life <= 0) { p.alive = false; return; }
        p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      });
      this.pool.sweep();
    }
    scroll(dx) { this.pool.forEach((p) => { p.x -= dx; }); }
    draw(ctx) {
      this.pool.forEach((p) => {
        const a = clamp(p.life / p.max, 0, 1);
        ctx.globalAlpha = a; ctx.fillStyle = p.col;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.283); ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
  }

  /** Weather overlay particles (composition over resolution). */
  class WeatherFX {
    constructor() { this.drops = []; this.t = 0; }
    rebuild(view) {
      this.drops = [];
      const n = runtime.particle ? 48 : 0;
      for (let i = 0; i < n; i++) {
        this.drops.push({
          x: rand(0, view.w), y: rand(0, view.h),
          sp: rand(180, 420), len: rand(6, 16), w: rand(1, 2)
        });
      }
    }
    update(dt, view) {
      this.t += dt;
      if (!runtime.particle) return;
      const push = (runtime.lateralPush || 0) * 0.4;
      for (const d of this.drops) {
        d.y += d.sp * dt * (runtime.particle === 'snow' || runtime.particle === 'ash' ? 0.35 : 1);
        d.x += push * dt + Math.sin(this.t + d.y * 0.01) * 8 * dt;
        if (d.y > view.h) { d.y = -10; d.x = rand(0, view.w); }
        if (d.x < -20) d.x = view.w + 10;
        if (d.x > view.w + 20) d.x = -10;
      }
    }
    draw(ctx, view) {
      if (!runtime.particle) return;
      const pal = runtime.world.palette;
      ctx.save();
      ctx.globalAlpha = 0.35 + (1 - runtime.visibility) * 0.35;
      if (runtime.particle === 'rain' || runtime.particle === 'blizzard') {
        ctx.strokeStyle = '#9fdcff'; ctx.lineWidth = 1.2;
        for (const d of this.drops) {
          ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - 3, d.y + d.len); ctx.stroke();
        }
      } else if (runtime.particle === 'snow' || runtime.particle === 'ash' || runtime.particle === 'sand') {
        ctx.fillStyle = runtime.particle === 'ash' ? '#888' : runtime.particle === 'sand' ? '#e8c070' : '#e8f6ff';
        for (const d of this.drops) { ctx.beginPath(); ctx.arc(d.x, d.y, 1.6, 0, 6.283); ctx.fill(); }
      } else if (runtime.particle === 'bubbles' || runtime.particle === 'spores') {
        ctx.strokeStyle = pal.accent; ctx.lineWidth = 1;
        for (const d of this.drops) { ctx.beginPath(); ctx.arc(d.x, d.y, 2.5, 0, 6.283); ctx.stroke(); }
      } else if (runtime.particle === 'heat' || runtime.particle === 'embers') {
        ctx.fillStyle = 'rgba(255,100,40,0.5)';
        for (const d of this.drops) { ctx.fillRect(d.x, d.y, 2, 3); }
      } else {
        ctx.fillStyle = pal.accent;
        for (const d of this.drops) { ctx.globalAlpha = 0.25; ctx.fillRect(d.x, d.y, 2, 2); }
      }
      // Fog / visibility veil
      if (runtime.visibility < 0.95) {
        ctx.globalAlpha = (1 - runtime.visibility) * 0.55;
        ctx.fillStyle = pal.sky1;
        ctx.fillRect(-40, -20, view.w + 80, view.h + 40);
      }
      ctx.restore();
    }
  }

  class Backdrop {
    constructor() {
      this.layers = [
        { sp: 0.12, y0: 0.28, col: '#0b0630', bld: [], w: 220, h: 260 },
        { sp: 0.28, y0: 0.42, col: '#160a44', bld: [], w: 150, h: 200 },
        { sp: 0.48, y0: 0.58, col: '#241058', bld: [], w: 100, h: 150 },
        { sp: 0.72, y0: 0.70, col: '#2e1468', bld: [], w: 70, h: 100 }
      ];
      this.t = 0; this.portalFlash = 0; this.reflect = 0.35;
    }
    seed(view) {
      for (const L of this.layers) {
        L.bld = []; let x = -100;
        while (x < view.w + 300) {
          L.bld.push({ x, h: rand(0.5, 1) * L.h, lit: Math.random() < 0.6 });
          x += rand(L.w * 0.7, L.w * 1.2);
        }
      }
    }
    scroll(dx) {
      for (const L of this.layers) for (const b of L.bld) b.x -= dx * L.sp;
      for (const L of this.layers) {
        if (L.bld.length && L.bld[0].x < -300) L.bld.shift();
        const last = L.bld[L.bld.length - 1];
        if (last && last.x < view.w + 200)
          L.bld.push({ x: last.x + rand(L.w * 0.7, L.w * 1.2), h: rand(0.5, 1) * L.h, lit: Math.random() < 0.6 });
      }
    }
    update(dt) { this.t += dt; if (this.portalFlash > 0) this.portalFlash = Math.max(0, this.portalFlash - dt); }
    draw(ctx, view) {
      const pal = runtime.world.palette;
      const g = ctx.createLinearGradient(0, 0, 0, view.h);
      g.addColorStop(0, pal.sky0); g.addColorStop(0.55, pal.sky1); g.addColorStop(1, pal.sky2);
      ctx.fillStyle = g; ctx.fillRect(-80, -40, view.w + 160, view.h + 80);
      const gx = view.w * 0.72, gy = view.h * 0.26, gr = 150;
      const rg = ctx.createRadialGradient(gx, gy, 10, gx, gy, gr);
      rg.addColorStop(0, pal.glow); rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(gx, gy, gr, 0, 6.283); ctx.fill();
      const base = view.groundY;
      for (const L of this.layers) {
        for (const b of L.bld) {
          const h = b.h, y = base - h;
          ctx.fillStyle = pal.mid;
          ctx.fillRect(b.x, y, L.w * 0.62, h);
          if (b.lit) {
            ctx.fillStyle = pal.accent.replace(')', ',0.18)').replace('rgb', 'rgba').replace('#', '');
            // simple neon windows
            ctx.fillStyle = 'rgba(34,230,255,0.12)';
            if (runtime.worldId === 'neon') ctx.fillStyle = 'rgba(255,43,214,0.1)';
            for (let wy = y + 14; wy < base - 12; wy += 22) ctx.fillRect(b.x + 8, wy, L.w * 0.46, 3);
          }
        }
      }
      // Wet ground reflection strip (neon) — composition, not texture res
      if (runtime.worldId === 'neon' || runtime.weatherId === 'rain') {
        ctx.globalAlpha = 0.22;
        const rg2 = ctx.createLinearGradient(0, base, 0, view.h);
        rg2.addColorStop(0, pal.accent); rg2.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rg2; ctx.fillRect(-40, base, view.w + 80, CFG.ground);
        ctx.globalAlpha = 1;
      }
      if (this.portalFlash > 0) {
        ctx.fillStyle = `rgba(180,240,255,${0.35 * this.portalFlash})`;
        ctx.fillRect(-80, -40, view.w + 160, view.h + 80);
      }
    }
  }

  const PS = { GROUND: 0, AIR: 1 };
  class Player {
    constructor() { this.reset(); this.slideVx = 0; }
    reset() {
      this.state = PS.GROUND; this.vy = 0; this.y = 0; this.onGround = true;
      this.coyoteT = 0; this.bufferT = 0; this.jumpsUsed = 0;
      this.sx = 1; this.sy = 1; this.hp = CFG.maxHP; this.iframe = 0; this.dead = false;
      this.jumpMul = 1; this._wasAir = false; this.runPhase = 0; this.slideVx = 0; this.heatAcc = 0;
    }
    get x() { return view.w * CFG.player.x + this.slideVx; }
    get w() { return CFG.player.w; }
    get h() { return CFG.player.h; }
    get feetY() { return this.y + this.h; }
    update(dt, input, world) {
      const gY = view.groundY;
      const coyote = activeDiff.coyote * (runtime.reactionWindow || 1);
      const buffer = activeDiff.buffer;
      const grav = CFG.gravity * runtime.gravityMul;
      if (input.consumeJump()) this.bufferT = buffer;
      this.bufferT = Math.max(0, this.bufferT - dt);
      const supported = world.groundAt(this.x) && this.feetY >= gY - 1.5;
      if (supported && this.vy >= 0) {
        this.onGround = true; this.state = PS.GROUND; this.coyoteT = coyote; this.jumpsUsed = 0;
        this.y = gY - this.h; this.vy = 0;
      } else {
        this.onGround = false; this.state = PS.AIR; this.coyoteT = Math.max(0, this.coyoteT - dt);
      }
      const canGround = (this.onGround || this.coyoteT > 0) && this.jumpsUsed === 0;
      if (this.bufferT > 0 && canGround) {
        this.vy = CFG.jumpVel * this.jumpMul * runtime.jumpMul;
        this.bufferT = 0; this.coyoteT = 0; this.jumpsUsed = 1;
        this.onGround = false; this.state = PS.AIR; this.sx = 0.78; this.sy = 1.28;
        particles.dust(this.x, gY); bus.emit('jump');
      }
      if (input.consumeRelease() && this.vy < 0) this.vy *= CFG.jumpCut;
      this.vy += grav * dt; this.y += this.vy * dt;
      // Slippery slide after land
      if (this.onGround && this.state === PS.GROUND && this._wasAir) {
        this.sx = 1.28; this.sy = 0.74; particles.dust(this.x, gY); shake.add(0.14); bus.emit('land');
        if (runtime.slideOnLand) this.slideVx = rand(6, 14) * (Math.random() < 0.5 ? 1 : -1);
      }
      this._wasAir = !this.onGround;
      this.slideVx = lerp(this.slideVx, 0, clamp(dt * (2 + runtime.friction * 4), 0, 1));
      // Lateral weather push
      if (runtime.lateralPush) this.slideVx += Math.sin(performance.now() * 0.002) * runtime.lateralPush * dt * 0.02;
      this.slideVx = clamp(this.slideVx, -28, 28);
      if (this.y > view.h + 40) this.kill(true);
      this.sx = lerp(this.sx, 1, clamp(dt * 12, 0, 1));
      this.sy = lerp(this.sy, 1, clamp(dt * 12, 0, 1));
      this.iframe = Math.max(0, this.iframe - dt);
      if (runtime.heatZones || runtime.heatDps) {
        this.heatAcc += (runtime.heatDps || 0.08) * dt;
        if (this.heatAcc > 1.2) { this.heatAcc = 0; this.hurt(); }
      }
      if (runtime.ovations && Math.random() < dt * 0.08) shake.add(0.08);
    }
    hurt() {
      if (this.iframe > 0 || this.dead) return;
      this.hp--; this.iframe = CFG.iframes; shake.add(0.55); clock.freeze(0.06);
      particles.burst(this.x, this.y + this.h * 0.4, 18, { col: '#ff5a7a', spMax: 260, up: 60 });
      bus.emit('hurt');
      if (this.hp <= 0) this.kill(false);
    }
    kill(fell) {
      if (this.dead) return; this.dead = true; shake.add(0.8); clock.freeze(0.09);
      particles.burst(this.x, this.y + this.h * 0.4, 34, { col: fell ? '#7fd0ff' : '#ffd24a', spMax: 320, up: 80 });
      bus.emit('dead');
    }
    rect() { return { x: this.x - this.w / 2, y: this.y, w: this.w, h: this.h }; }
  }

  class Economy {
    constructor() { this.reset(); }
    reset() { this.coins = 0; this.combo = 0; this.maxCombo = 0; this.super = 0; this.buffT = 0; this.mult = 1; }
    addCoin() {
      const m = this.buffT > 0 ? 2 : 1;
      this.coins += Math.round(1 * activeDiff.reward * m);
      this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.super = Math.min(1, this.super + CFG.superChargePerCoin * 1.2);
      audio.coin();
    }
    buff(mult, t) { this.mult = mult; this.buffT = t; }
    update(dt) {
      this.super = Math.min(1, this.super + CFG.superChargePerSec * dt);
      if (this.buffT > 0) this.buffT -= dt; else this.mult = 1;
    }
  }

  class World {
    constructor() {
      this.crates = new ObjectPool(() => ({ x: 0, y: 0, w: 44, h: 44, alive: false, reactive: false }));
      this.drones = new ObjectPool(() => ({ x: 0, y: 0, w: 42, h: 34, ph: 0, alive: false }));
      this.coins = new ObjectPool(() => ({ x: 0, y: 0, r: 11, taken: false, ph: 0, alive: false }));
      this.holes = new ObjectPool(() => ({ x: 0, w: 0, alive: false }));
      this.portals = new ObjectPool(() => ({ x: 0, w: 40, h: 100, used: false, alive: false, bleed: [] }));
      this.reset();
    }
    reset() {
      this.crates.clear(); this.drones.clear(); this.coins.clear(); this.holes.clear(); this.portals.clear();
      this.speed = CFG.runStart * activeDiff.scroll * runtime.speedMul;
      this.dist = 0; this.nextGap = (view ? view.w : 800) + 80;
      this.portalSpawned = false; this.segmentDist = 0;
    }
    groundAt(x) {
      let ok = true;
      this.holes.forEach((h) => { if (x > h.x && x < h.x + h.w) ok = false; });
      return ok;
    }
    _spawnCoinArc(x, y, n) {
      for (let i = 0; i < n; i++)
        this.coins.spawn((c) => {
          c.x = x + i * 30; c.y = y - Math.sin(i / (n - 1 || 1) * Math.PI) * 70;
          c.taken = false; c.ph = rand(0, 6);
        });
    }
    _director() {
      const gY = view.groundY; const dens = activeDiff.density; const r = Math.random();
      const gapMul = 1 / Math.sqrt(dens);
      if (r < 0.28) {
        const w = rand(90, 160); this.holes.spawn((h) => { h.x = view.w + 40; h.w = w; });
        this._spawnCoinArc(view.w + 40 + w * 0.2, gY - 30, 4);
        this.nextGap = view.w + 40 + w + rand(240, 360) * gapMul;
      } else if (r < 0.55) {
        const h = rand(34, 58);
        this.crates.spawn((c) => {
          c.x = view.w + 40; c.y = gY - h; c.w = 44; c.h = h;
          c.reactive = !!runtime.reactiveObstacles;
        });
        this._spawnCoinArc(view.w + 18, gY - h - 70, 5);
        this.nextGap = view.w + 40 + rand(240, 340) * gapMul;
      } else if (r < 0.78) {
        this.drones.spawn((d) => { d.x = view.w + 40; d.y = gY - rand(70, 140); d.ph = rand(0, 6); });
        this.nextGap = view.w + 40 + rand(230, 320) * gapMul;
      } else {
        this._spawnCoinArc(view.w + 30, gY - rand(40, 90), 7);
        this.nextGap = view.w + 40 + rand(200, 280) * gapMul;
      }
    }
    update(dt, player) {
      const maxSp = CFG.runMax * activeDiff.scroll * runtime.speedMul * (runtime.heatZones ? runtime.heatSlow : 1);
      this.speed = Math.min(maxSp, this.speed + CFG.runAccel * activeDiff.scroll * dt);
      const dx = this.speed * dt; this.dist += dx / 26; this.segmentDist += dx / 26;
      view.lookAhead = lerp(view.lookAhead, Math.min(28, this.speed * 0.04), clamp(dt * 4, 0, 1));
      backdrop.scroll(dx); particles.scroll(dx);
      this.crates.forEach((o) => {
        o.x -= dx;
        if (o.reactive && player) o.y += Math.sin(performance.now() * 0.004 + o.x) * 12 * dt;
      });
      this.drones.forEach((o) => { o.x -= dx; o.ph += dt * 3; });
      this.coins.forEach((o) => { o.x -= dx; o.ph += dt * 6; });
      this.holes.forEach((o) => { o.x -= dx; });
      this.portals.forEach((o) => { o.x -= dx; });
      if (!this.portalSpawned && this.segmentDist > CFG.portalAt) {
        this.portalSpawned = true;
        this.portals.spawn((p) => {
          p.x = view.w + 60; p.w = 44; p.h = 110; p.used = false;
          p.bleed = makeBleedProps(runtime.world.bleed);
        });
      }
      this.nextGap -= dx; if (this.nextGap <= view.w - 4) this._director();
      this.crates.forEach((o) => { if (o.x < -120) o.alive = false; }); this.crates.sweep();
      this.drones.forEach((o) => { if (o.x < -120) o.alive = false; }); this.drones.sweep();
      this.coins.forEach((o) => { if (o.x < -60) o.alive = false; }); this.coins.sweep();
      this.holes.forEach((o) => { if (o.x + o.w < -40) o.alive = false; }); this.holes.sweep();
      this.portals.forEach((o) => { if (o.x < -80) o.alive = false; }); this.portals.sweep();
      this._collisions(player);
      return dx;
    }
    _collisions(p) {
      const pr = p.rect();
      this.crates.forEach((o) => {
        if (aabb(pr, o)) {
          if (pr.y + pr.h - o.y < 18 && p.vy >= 0) { p.y = o.y - p.h; p.vy = 0; p.onGround = true; }
          else p.hurt();
        }
      });
      this.drones.forEach((o) => {
        if (aabb(pr, { x: o.x - o.w / 2, y: o.y - o.h / 2, w: o.w, h: o.h })) p.hurt();
      });
      this.coins.forEach((o) => {
        if (o.taken) return;
        const dxp = p.x - o.x, dyp = p.y + p.h / 2 - o.y;
        if (dxp * dxp + dyp * dyp < (o.r + 28) * (o.r + 28)) {
          o.taken = true; o.alive = false; economy.addCoin();
          particles.burst(o.x, o.y, 8, { col: '#ffd24a', spMax: 140, lifeMax: 0.4, g: 300 });
        }
      });
      this.portals.forEach((o) => {
        if (o.used) return;
        const gY = view.groundY;
        if (aabb(pr, { x: o.x - o.w / 2, y: gY - o.h, w: o.w, h: o.h })) {
          o.used = true; o.alive = false;
          enterPortal(runtime.worldId);
        }
      });
    }
    clearEnemies() {
      let n = 0;
      this.drones.forEach((o) => { o.alive = false; n++; });
      this.crates.forEach((o) => { o.alive = false; n++; });
      this.drones.sweep(); this.crates.sweep();
      return n;
    }
  }

  function makeBleedProps(kind) {
    const items = [];
    for (let i = 0; i < 5; i++) {
      items.push({
        kind: kind || 'shards',
        ox: rand(-50, 50), oy: rand(-80, -10),
        ph: rand(0, 6), size: rand(4, 12)
      });
    }
    return items;
  }

  // —— Transition iris (shared) ——
  const iris = {
    active: false, phase: 'close', t: 0, dur: 0.28, cb: null,
    start(cb) {
      if (this.active) { this.cb = cb; return; }
      this.active = true; this.phase = 'close'; this.t = 0; this.cb = cb;
    },
    update(dt) {
      if (!this.active) return;
      this.t += dt;
      if (this.phase === 'close' && this.t >= this.dur) {
        const fn = this.cb; this.cb = null; if (fn) fn();
        this.phase = 'open'; this.t = 0;
      } else if (this.phase === 'open' && this.t >= this.dur) this.active = false;
    },
    draw(ctx, view) {
      if (!this.active) return;
      const p = clamp(this.t / this.dur, 0, 1);
      const maxR = Math.hypot(view.w, view.h) * 0.72, cx = view.w / 2, cy = view.h / 2;
      const r = this.phase === 'close' ? lerp(maxR, 0, p) : lerp(0, maxR, p);
      ctx.save();
      ctx.beginPath(); ctx.rect(-80, -80, view.w + 160, view.h + 160);
      ctx.arc(cx, cy, Math.max(0.1, r), 0, 6.283, true);
      ctx.fillStyle = '#04010c'; ctx.fill('evenodd');
      ctx.restore();
    }
  };

  let view, backdrop, particles, shake, weatherFX, economy, player, world, input;
  let resolver, transit;
  let runOver = false;
  let pendingOutcome = null;

  const mgr = {
    state: 'BOOT', t: 0, pending: null,
    set(s) { this.state = s; this.t = 0; this.pending = null; onEnter(s); },
    go(s) {
      if (this.pending === s || (this.state === s && !this.pending)) return;
      this.pending = s;
      iris.start(() => this.set(s));
    }
  };

  function showLayer(id) {
    ['menu', 'hud', 'results', 'panel'].forEach((k) => {
      const el = $(k); if (!el) return;
      el.classList.add('hidden'); el.classList.remove('active');
    });
    if (id) { $(id).classList.remove('hidden'); $(id).classList.add('active'); }
  }
  function showSkip(v) { $('skipBtn').classList.toggle('hidden', !v); }

  function onEnter(s) {
    showLayer(null); showSkip(false);
    if (s === 'LOGO' || s === 'INTRO' || s === 'TRANSIT') showSkip(true);
    else if (s === 'MENU') { showLayer('menu'); refreshMenuUI(); }
    else if (s === 'PLAY') { startRun(false); showLayer('hud'); syncHUD(); }
    else if (s === 'RESULTS') { showResults(); showLayer('results'); }
  }

  function startRun(keepWorld) {
    if (!keepWorld) {
      runtime = buildRuntimeConfig(
        preferredOrigin,
        getWorld(preferredOrigin).weatherPool[0],
        getWorld(preferredOrigin).specialRule,
        activeDiff.id
      );
    }
    player.reset();
    player.jumpMul = 1 + (runtime.jumpMul - 1);
    world.reset();
    economy.reset();
    weatherFX.rebuild(view);
    backdrop.seed(view);
    backdrop.portalFlash = 0; view.lookAhead = 0;
    world.nextGap = view.w + 80; runOver = false;
    $('diffChip').textContent = activeDiff.chip;
    $('ruleChip').textContent = runtime.rule.icon + ' ' + runtime.rule.label;
    $('worldChip').textContent = runtime.world.name.toUpperCase();
    $('weatherChip').textContent = runtime.weather.label;
  }

  function enterPortal(originId) {
    audio.portal();
    shake.add(0.5); clock.freeze(0.1);
    backdrop.portalFlash = 1;
    particles.burst(player.x + 40, view.groundY - 50, 48, { col: '#9ff0ff', spMax: 380, up: 90, lifeMax: 0.9 });
    pendingOutcome = resolver.resolve({
      originId,
      difficultyId: activeDiff.id,
      unlockedIds: save.unlocked,
      streak: save.combos.length
    });
    save.portalHistory = resolver.history.slice();
    persist();
    flashToast('PORTAL · ' + pendingOutcome.world.name.toUpperCase());
    mgr.set('TRANSIT');
    transit.start(pendingOutcome, (outcome) => {
      runtime = outcome;
      // Unlock destination if not final-gated wrongly
      if (!save.unlocked.includes(outcome.worldId) && !outcome.world.finalBoss) {
        save.unlocked.push(outcome.worldId);
        persist();
      }
      world.portalSpawned = false;
      world.segmentDist = 0;
      weatherFX.rebuild(view);
      backdrop.seed(view);
      player.iframe = 0.6;
      mgr.set('PLAY');
      flashToast(outcome.world.name.toUpperCase() + ' · ' + outcome.weather.label);
      showLayer('hud');
      syncHUD();
    });
  }

  function flashToast(txt) {
    const el = $('toast');
    el.textContent = txt;
    el.style.transition = 'none'; el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) scale(1.08)';
    requestAnimationFrame(() => {
      el.style.transition = 'opacity .9s ease, transform .9s ease';
      el.style.opacity = '0'; el.style.transform = 'translateX(-50%) scale(1)';
    });
  }

  function fireSuper() {
    if (economy.super < 1 || player.dead) return;
    economy.super = 0; shake.add(1); clock.freeze(0.09); audio.superFx();
    particles.burst(player.x, player.y + player.h * 0.4, 60, { col: '#ffd24a', spMax: 520, up: 120, lifeMax: 0.9 });
    const n = world.clearEnemies(); economy.buff(2, 2.0);
    economy.coins += Math.round(n * 5 * activeDiff.reward);
    flashToast('¡EXPLOSIÓN ESTELAR!');
  }

  function showResults() {
    const d = Math.round(world.dist), c = economy.coins, mc = economy.maxCombo;
    const stars = d > 600 ? 3 : d > 300 ? 2 : 1;
    $('stars').textContent = ['★', '★', '★'].map((s, i) => (i < stars ? '★' : '☆')).join(' ');
    $('rDist').textContent = d; $('rCoins').textContent = c; $('rCombo').textContent = mc;
    $('rDiff').textContent = activeDiff.label;
    $('rWorld').textContent = runtime.world.name + ' · ' + runtime.weather.label;
    save.coins += c;
    save.xp += Math.round(d / 10 + c * 2);
    save.bestDist = Math.max(save.bestDist || 0, d);
    while (save.xp >= save.level * 100) { save.xp -= save.level * 100; save.level++; }
    if (activeDiff.id === 'expert' && stars === 3) {
      save.legendary = true;
      const btn = document.querySelector('[data-diff="legendary"]');
      if (btn) { btn.disabled = false; btn.title = 'Desbloqueado'; }
    }
    // Unlock next world by distance milestones
    const order = WORLDS.map((w) => w.id);
    const idx = order.indexOf(runtime.worldId);
    if (stars >= 2 && idx >= 0 && idx < order.length - 1) {
      const next = order[idx + 1];
      if (!save.unlocked.includes(next) && next !== 'final') {
        save.unlocked.push(next);
        flashToast('DESBLOQUEADO · ' + getWorld(next).name);
      }
    }
    if (save.unlocked.length >= 9 && !save.unlocked.includes('final')) {
      save.unlocked.push('final');
    }
    persist();
    refreshMenuUI();
  }

  function syncHUD() {
    $('coins').textContent = economy.coins;
    $('dist').textContent = Math.round(world.dist);
    const hp = Math.max(0, player.hp);
    $('hearts').innerHTML =
      '<span style="color:#ff5a7a">' + '●'.repeat(hp) + '</span>' +
      '<span style="color:#4a2740">' + '●'.repeat(CFG.maxHP - hp) + '</span>';
    const pct = Math.round(economy.super * 100);
    $('superBar').firstElementChild.style.width = pct + '%';
    const ready = economy.super >= 1;
    $('superBar').classList.toggle('ready', ready);
    $('superBtn').classList.toggle('ready', ready);
    $('energyArc').style.setProperty('--p', String(economy.super));
    $('resistArc').style.setProperty('--p', String(hp / CFG.maxHP));
    $('ruleChip').textContent = runtime.rule.icon + ' ' + runtime.rule.label;
    $('worldChip').textContent = runtime.world.name.toUpperCase();
    $('weatherChip').textContent = runtime.weather.label;
  }

  // —— Draw helpers ——
  function drawGround(ctx, v) {
    const gY = v.groundY;
    ctx.fillStyle = runtime.world.palette.ground;
    ctx.fillRect(-60, gY, v.w + 120, CFG.ground + 40);
    ctx.strokeStyle = runtime.world.palette.accent;
    ctx.globalAlpha = 0.85; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-60, gY); ctx.lineTo(v.w + 60, gY); ctx.stroke();
    ctx.globalAlpha = 1;
    world.holes.forEach((h) => {
      ctx.fillStyle = '#020010';
      ctx.fillRect(h.x, gY - 2, h.w, CFG.ground + 20);
    });
  }

  function drawWorld(ctx, v) {
    const gY = v.groundY;
    world.crates.forEach((o) => {
      ctx.fillStyle = '#3a2060'; ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.strokeStyle = runtime.world.palette.accent; ctx.strokeRect(o.x, o.y, o.w, o.h);
    });
    world.drones.forEach((o) => {
      const bob = Math.sin(o.ph) * 6;
      ctx.fillStyle = '#2a4060';
      ctx.beginPath(); ctx.ellipse(o.x, o.y + bob, o.w / 2, o.h / 2, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#ff4060'; ctx.fillRect(o.x - 4, o.y + bob - 2, 8, 4);
    });
    world.coins.forEach((o) => {
      if (o.taken) return;
      ctx.fillStyle = '#ffd24a';
      ctx.beginPath(); ctx.arc(o.x, o.y + Math.sin(o.ph) * 3, o.r, 0, 6.283); ctx.fill();
    });
    world.portals.forEach((o) => {
      drawPortalEntity(ctx, o, gY);
    });
  }

  function drawPortalEntity(ctx, o, gY) {
    const cx = o.x, cy = gY - o.h * 0.5;
    // Sangrado dimensional — fragments around vortex
    (o.bleed || []).forEach((b, i) => {
      const ang = performance.now() * 0.001 + b.ph;
      const x = cx + b.ox + Math.cos(ang) * 8;
      const y = cy + b.oy + Math.sin(ang * 1.3) * 6;
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = i % 2 ? '#c8a060' : runtime.world.palette.accent;
      ctx.fillRect(x, y, b.size, b.size * 0.7);
    });
    ctx.globalAlpha = 1;
    const grd = ctx.createRadialGradient(cx, cy, 4, cx, cy, 50);
    grd.addColorStop(0, 'rgba(255,255,255,0.95)');
    grd.addColorStop(0.4, 'rgba(120,220,255,0.7)');
    grd.addColorStop(1, 'rgba(34,230,255,0.05)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.ellipse(cx, cy, 22, 48, 0, 0, 6.283); ctx.fill();
    ctx.strokeStyle = 'rgba(180,240,255,0.95)'; ctx.lineWidth = 2; ctx.stroke();
  }

  function drawKori(ctx, v, idle) {
    const p = player;
    const cx = idle ? v.w * 0.5 : p.x;
    const top = idle ? v.groundY - p.h : p.y;
    const w = p.w * p.sx, h = p.h * p.sy;
    ctx.save();
    ctx.translate(cx, top + h / 2);
    ctx.fillStyle = '#1a3a8a';
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = '#ff2bd6';
    ctx.fillRect(-w / 2 + 4, -h / 2 + 10, w - 8, 8);
    ctx.fillStyle = '#ffd24a';
    ctx.fillRect(-w / 2 - 2, h / 2 - 10, 8, 8);
    ctx.fillRect(w / 2 - 6, h / 2 - 10, 8, 8);
    ctx.restore();
  }

  function drawTransit(ctx, v) {
    const o = transit.outcome || pendingOutcome;
    const p = transit.progress;
    const name = transit.phaseName;
    const pal = (o && o.world.palette) || runtime.world.palette;
    // Tunnel base
    const g = ctx.createRadialGradient(v.w / 2, v.h / 2, 10, v.w / 2, v.h / 2, v.w * 0.6);
    g.addColorStop(0, 'rgba(255,255,255,' + (0.15 + p * 0.2) + ')');
    g.addColorStop(0.35, pal.glow);
    g.addColorStop(1, '#020008');
    ctx.fillStyle = g; ctx.fillRect(0, 0, v.w, v.h);
    // Layers
    const layers = (o && o.transitionLayers) || ['tunnel', 'galaxy'];
    const li = Math.min(layers.length - 1, Math.floor(p * layers.length));
    ctx.fillStyle = '#fff';
    ctx.font = '700 14px Rajdhani,sans-serif';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.7;
    ctx.fillText(layers.slice(0, li + 1).join('  →  ').toUpperCase(), v.w / 2, v.h * 0.18);
    ctx.globalAlpha = 1;
    // Stars / debris
    for (let i = 0; i < 40; i++) {
      const x = ((i * 97 + p * 800) % v.w);
      const y = (i * 53) % v.h;
      ctx.fillStyle = i % 5 === 0 ? pal.accent : '#fff';
      ctx.globalAlpha = 0.4; ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;
    // Destination preview
    if (p > 0.45 && o) {
      ctx.fillStyle = '#fff';
      ctx.font = '900 ' + Math.round(v.h * 0.06) + 'px Orbitron,sans-serif';
      ctx.shadowColor = pal.accent; ctx.shadowBlur = 18;
      ctx.fillText(o.world.name.toUpperCase(), v.w / 2, v.h * 0.42);
      ctx.shadowBlur = 0;
      ctx.font = '600 16px Rajdhani,sans-serif';
      ctx.fillStyle = '#cfe9ff';
      ctx.fillText(o.weather.label + ' · ' + o.rule.label, v.w / 2, v.h * 0.5);
    }
    // Progress
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(v.w * 0.25, v.h * 0.82, v.w * 0.5, 6);
    ctx.fillStyle = pal.accent;
    ctx.fillRect(v.w * 0.25, v.h * 0.82, v.w * 0.5 * p, 6);
    ctx.font = '600 12px Rajdhani,sans-serif';
    ctx.fillStyle = 'rgba(200,230,255,0.8)';
    ctx.fillText(name.toUpperCase(), v.w / 2, v.h * 0.78);
    ctx.textAlign = 'start';
  }

  function drawLogo(ctx, v) {
    const t = mgr.t, cx = v.w / 2, cy = v.h * 0.42;
    const burst = clamp(t / 1.0, 0, 1);
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 280 * burst);
    g.addColorStop(0, `rgba(120,240,255,${0.5 * burst})`);
    g.addColorStop(0.5, `rgba(255,43,214,${0.22 * burst})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, v.w, v.h);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '900 ' + Math.round(v.h * 0.08) + 'px Orbitron,sans-serif';
    ctx.fillStyle = '#fff'; ctx.shadowColor = '#22e6ff'; ctx.shadowBlur = 26;
    ctx.fillText('RUNNER LEGENDS', cx, cy + 40); ctx.shadowBlur = 0;
    ctx.font = '700 13px Rajdhani,sans-serif';
    ctx.fillStyle = 'rgba(180,230,255,' + clamp(t - 0.5, 0, 1) + ')';
    ctx.fillText('LOGIC CODE SPOT · DISTRITO NEÓN', cx, cy + 90);
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
  }

  function drawMenuBg(ctx, v) {
    backdrop.draw(ctx, v);
    drawGround(ctx, v);
    weatherFX.draw(ctx, v);
    drawKori(ctx, v, true);
    particles.draw(ctx);
  }

  // —— Loop ——
  let last = performance.now();
  function frame(now) {
    let raw = (now - last) / 1000; last = now; if (raw > 0.05) raw = 0.05;
    const dt = clock.step(raw);
    update(raw, dt); render();
    requestAnimationFrame(frame);
  }

  function update(raw, dt) {
    iris.update(raw); shake.update(raw); mgr.t += raw;
    if (mgr.state === 'PLAY') {
      if (input.consumeSuper()) fireSuper();
      if (!player.dead) {
        world.update(dt, player);
        player.runPhase = (player.runPhase || 0) + dt;
        player.update(dt, input, world);
        economy.update(dt);
      } else world.update(0, player);
      particles.update(raw); backdrop.update(raw); weatherFX.update(raw, view); syncHUD();
    } else if (mgr.state === 'TRANSIT') {
      transit.update(raw);
      particles.update(raw);
      input.consumeJump(); input.consumeRelease(); input.consumeSuper();
    } else {
      backdrop.scroll(14 * raw); backdrop.update(raw); particles.update(raw);
      weatherFX.update(raw, view);
      input.consumeJump(); input.consumeRelease(); input.consumeSuper();
      if (mgr.state === 'BOOT' && mgr.t > 0.2) mgr.set('LOGO');
      if (mgr.state === 'LOGO' && mgr.t > 1.5) mgr.go(save.intro ? 'MENU' : 'INTRO');
      if (mgr.state === 'INTRO' && mgr.t > 8) { save.intro = true; persist(); mgr.go('MENU'); }
    }
  }

  function render() {
    const ctx = view.ctx; const o = shake.offset;
    view.begin(o.x, o.y);
    if (mgr.state === 'TRANSIT') {
      drawTransit(ctx, view);
    } else {
      backdrop.draw(ctx, view);
      if (mgr.state === 'PLAY' || mgr.state === 'RESULTS') {
        drawGround(ctx, view); drawWorld(ctx, view); particles.draw(ctx);
        if (!player.dead || mgr.state === 'PLAY') drawKori(ctx, view, false);
        weatherFX.draw(ctx, view);
      } else {
        drawGround(ctx, view); particles.draw(ctx);
        if (mgr.state === 'MENU') drawKori(ctx, view, true);
        weatherFX.draw(ctx, view);
      }
      if (mgr.state === 'LOGO') drawLogo(ctx, view);
      if (mgr.state === 'INTRO') drawIntro(ctx, view);
    }
    iris.draw(ctx, view);
  }

  const introScenes = [
    { title: 'DISTRITO NEÓN', body: 'Calles mojadas. Neón. Velocidad. El portal nunca lleva al mismo lugar dos veces.' },
    { title: 'KORI VOLTZ', body: 'Canaliza ki en cada salto. Explosión Estelar lista.' },
    { title: 'PORTALES VIVOS', body: 'Sangrado dimensional: otros mundos se filtran antes de cruzar.' },
    { title: 'REGLAS ÚNICAS', body: 'Cada dimensión impone su física: hielo, gravedad, arena, fractales.' }
  ];
  function drawIntro(ctx, v) {
    const scene = Math.min(introScenes.length - 1, Math.floor(mgr.t / 2));
    const s = introScenes[scene];
    drawMenuBg(ctx, v);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = '900 ' + Math.round(v.h * 0.06) + 'px Orbitron,sans-serif';
    ctx.fillText(s.title, v.w / 2, v.h * 0.28);
    ctx.fillStyle = '#cfe9ff';
    ctx.font = '600 16px Rajdhani,sans-serif';
    wrapText(ctx, s.body, v.w / 2, v.h * 0.4, v.w * 0.75, 22);
    ctx.textAlign = 'start';
  }
  function wrapText(ctx, text, x, y, maxW, lh) {
    const words = text.split(' '); let line = '', yy = y;
    for (const w of words) {
      const test = line + w + ' ';
      if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, yy); line = w + ' '; yy += lh; }
      else line = test;
    }
    ctx.fillText(line, x, yy);
  }

  // —— UI wiring ——
  function setDifficulty(id) {
    if (id === 'legendary' && !save.legendary) return;
    activeDiff = DIFF[id] || DIFF.normal;
    document.querySelectorAll('.diff-btn').forEach((b) => b.classList.toggle('on', b.dataset.diff === activeDiff.id));
    $('diffHint').textContent = `Coyote ${Math.round(activeDiff.coyote * 1000)}ms · recompensa ×${activeDiff.reward.toFixed(2)} · portal ±extremo`;
  }

  function refreshMenuUI() {
    $('profileName').textContent = save.name;
    $('profileLevel').textContent = 'Nivel ' + save.level;
    $('profileCoins').textContent = save.coins.toLocaleString();
    const xpNeed = save.level * 100;
    $('xpBar').style.width = Math.min(100, (save.xp / xpNeed) * 100) + '%';
    const grid = $('worldGrid');
    if (grid) {
      grid.innerHTML = WORLDS.map((w) => {
        const unlocked = save.unlocked.includes(w.id);
        const on = preferredOrigin === w.id;
        return `<button type="button" class="world-tile${on ? ' on' : ''}${unlocked ? '' : ' lock'}" data-world="${w.id}" ${unlocked ? '' : 'disabled'}>
          <b>${w.short}</b><span>${w.name}</span>${unlocked ? '' : '<i>🔒</i>'}
        </button>`;
      }).join('');
      grid.querySelectorAll('[data-world]').forEach((btn) => {
        btn.addEventListener('click', () => {
          preferredOrigin = btn.dataset.world;
          refreshMenuUI();
        });
      });
    }
    if (save.legendary) {
      const btn = document.querySelector('[data-diff="legendary"]');
      if (btn) { btn.disabled = false; btn.title = 'Desbloqueado'; }
    }
  }

  function openPanel(which) {
    const panel = $('panel');
    const body = $('panelBody');
    const title = $('panelTitle');
    showLayer('panel');
    if (which === 'worlds') {
      title.textContent = 'Mundos';
      body.innerHTML = WORLDS.map((w) => {
        const u = save.unlocked.includes(w.id);
        return `<div class="info-card"><h3>${w.short} · ${w.name}${u ? '' : ' 🔒'}</h3>
          <p>${w.description}</p>
          <p class="meta">Regla: ${RLWorlds.getRule(w.specialRule).label} · Climas: ${w.weatherPool.map((id) => RLWorlds.getWeather(id).label).join(', ')}</p></div>`;
      }).join('');
    } else if (which === 'profile') {
      title.textContent = 'Perfil';
      body.innerHTML = `<div class="info-card"><h3>${save.name}</h3>
        <p>Nivel ${save.level} · XP ${save.xp}/${save.level * 100}</p>
        <p>Monedas: ${save.coins} · Mejor distancia: ${save.bestDist || 0} m</p>
        <p>Mundos: ${save.unlocked.length}/10</p>
        <p class="meta">Historial portal: ${(save.portalHistory || []).slice(-5).join(' → ') || '—'}</p></div>`;
    } else if (which === 'shop') {
      title.textContent = 'Tienda';
      body.innerHTML = `<div class="info-card empty"><h3>Cosméticos</h3>
        <p>Arquitectura lista. Sin monetización real en esta build.</p>
        <p class="meta">Saldo: ${save.coins} monedas (persistente)</p></div>`;
    } else if (which === 'tournament') {
      title.textContent = 'Torneo';
      body.innerHTML = `<div class="info-card empty"><h3>Ranking de temporada</h3>
        <p>Modo determinista del portal listo para retos semanales.</p>
        <p class="meta">Conecta tournament-service cuando el backend esté online. Cero rankings falsos.</p></div>`;
    } else if (which === 'settings') {
      title.textContent = 'Ajustes';
      body.innerHTML = `<div class="info-card">
        <label>Nombre <input id="nameInput" maxlength="16" value="${save.name.replace(/"/g, '')}" /></label>
        <button type="button" class="btn ghost" id="saveName">Guardar</button>
        <button type="button" class="btn ghost" id="resetIntro">Ver intro de nuevo</button>
        <p class="meta">Audio: WebAudio on-demand · Master preparado</p></div>`;
      setTimeout(() => {
        $('saveName')?.addEventListener('click', () => {
          const v = ($('nameInput').value || 'Jugador').trim().slice(0, 16);
          save.name = v || 'Jugador'; persist(); refreshMenuUI();
        });
        $('resetIntro')?.addEventListener('click', () => { save.intro = false; persist(); mgr.go('INTRO'); });
      }, 0);
    } else if (which === 'roster') {
      title.textContent = 'Roster';
      body.innerHTML = `<div class="info-card"><h3>Kori Voltz</h3>
        <p>Guerrero de energía. Stats afectan salto/velocidad/combo reales.</p>
        <p class="meta">VEL · SALTO · COMBO — conectados al feel. Más personajes: arquitectura lista.</p></div>`;
    }
  }

  function boot() {
    view = new View($('game'));
    backdrop = new Backdrop(); backdrop.seed(view);
    particles = new Particles(); shake = new CameraShake();
    weatherFX = new WeatherFX(); weatherFX.rebuild(view);
    economy = new Economy(); player = new Player(); world = new World(); world.reset();
    input = new InputReader();
    resolver = new PortalOutcomeResolver({
      getWorld, buildRuntimeConfig: buildRuntimeConfig,
      history: save.portalHistory || [],
      seed: null
    });
    transit = new WorldTransitionManager();

    if (save.legendary) {
      const btn = document.querySelector('[data-diff="legendary"]');
      if (btn) { btn.disabled = false; }
    }

    document.querySelectorAll('.diff-btn').forEach((b) => {
      b.addEventListener('click', () => { audio.init(); setDifficulty(b.dataset.diff); });
    });
    setDifficulty('normal');
    refreshMenuUI();

    $('playBtn').addEventListener('click', () => { audio.init(); mgr.go('PLAY'); });
    $('againBtn').addEventListener('click', () => mgr.go('PLAY'));
    $('menuBtn').addEventListener('click', () => mgr.go('MENU'));
    $('introBtn').addEventListener('click', () => { audio.init(); save.intro = false; mgr.go('INTRO'); });
    $('skipBtn').addEventListener('click', () => {
      if (mgr.state === 'INTRO') { save.intro = true; persist(); mgr.go('MENU'); }
      else if (mgr.state === 'LOGO') mgr.go(save.intro ? 'MENU' : 'INTRO');
      else if (mgr.state === 'TRANSIT') transit.skip();
    });
    $('panelClose').addEventListener('click', () => { showLayer('menu'); });

    document.querySelectorAll('[data-nav]').forEach((b) => {
      b.addEventListener('click', () => {
        document.querySelectorAll('[data-nav]').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        const n = b.dataset.nav;
        if (n === 'home') showLayer('menu');
        else if (n === 'worlds') openPanel('worlds');
        else if (n === 'shop') openPanel('shop');
        else if (n === 'achievements') openPanel('profile');
        else if (n === 'settings') openPanel('settings');
      });
    });
    document.querySelectorAll('[data-panel]').forEach((b) => {
      b.addEventListener('click', () => openPanel(b.dataset.panel));
    });

    bus.on('dead', () => {
      if (!runOver) { runOver = true; setTimeout(() => mgr.go('RESULTS'), 650); }
    });

    const q = location.search;
    if (/[?&]play(?:=|&|$)/.test(q)) mgr.set('PLAY');
    else if (/[?&]menu(?:=|&|$)/.test(q)) mgr.set('MENU');
    else mgr.set('BOOT');
    requestAnimationFrame(frame);

    if (/[?&]qa(?:=|&|$)/.test(q)) {
      window.__rl = {
        mgr, transit, resolver, runtime: () => runtime, save,
        sample: (n) => resolver.sample(n, { originId: 'neon', difficultyId: 'normal', unlockedIds: save.unlocked }),
        player: () => player, world: () => world, econ: () => economy
      };
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
