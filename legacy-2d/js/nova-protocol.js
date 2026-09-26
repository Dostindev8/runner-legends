/**
 * Runner Legends — Nova Protocol v3.1 (Gameplay overlay).
 * EXTEND: does not replace drones, Player, World director, Economy, Backdrop, Audio.
 * Pools only. Simulation uses the same dt the core Clock already steps.
 * IP: Logic Code Spot. No third-party characters.
 */
(function (global) {
  'use strict';

  const TELEGRAPH = 0.6;
  const MAX_FX = 48;
  const MAX_PROJ = 12;
  const MAX_HOLO = 4;
  const MAX_POPS = 12;

  function pool(n, make) {
    const free = [], live = [];
    for (let i = 0; i < n; i++) free.push(make());
    return {
      acquire(fn) {
        const o = free.pop() || make();
        o.alive = true;
        if (fn) fn(o);
        live.push(o);
        return o;
      },
      release(o) {
        o.alive = false;
      },
      forEach(fn) {
        for (let i = 0; i < live.length; i++) if (live[i].alive) fn(live[i]);
      },
      sweep() {
        for (let i = live.length - 1; i >= 0; i--) {
          if (!live[i].alive) { free.push(live[i]); live.splice(i, 1); }
        }
      },
      clear() {
        while (live.length) { const o = live.pop(); o.alive = false; free.push(o); }
      },
      live: live
    };
  }

  const fx = pool(MAX_FX, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, r: 2, col: '#fff', g: 0, alive: false }));
  const proj = pool(MAX_PROJ, () => ({ x: 0, y: 0, vx: 0, vy: 0, w: 10, h: 6, life: 0, kind: 'laser', telegraph: 0, armed: false, alive: false }));
  const holo = pool(MAX_HOLO, () => ({ x: 0, y: 0, w: 70, h: 90, life: 0, ph: 0, tempted: 0, alive: false }));
  const pops = pool(MAX_POPS, () => ({ x: 0, y: 0, text: '', life: 0, col: '#fff', alive: false }));

  const hunter = {
    alive: false, hp: 6, maxHp: 6, shownHp: 6, x: 0, y: 0, w: 52, h: 44,
    flash: 0, phase: 'idle', t: 0, telegraph: 0, atk: 'laser', lane: 0
  };

  const state = {
    api: null,
    kills: 0,
    novaMode: false,
    novaStack: 0,
    novaT: 0,
    collapse: 0,
    exposure: 1,
    weatherPh: 0,
    weatherKind: 'base',
    invaderT: 0,
    invaderKind: null,
    shield: 0,
    lanceCd: 0,
    pulseCd: 0,
    lastFt: 16,
    budget: { fx: MAX_FX, proj: MAX_PROJ },
    mysteryHint: '',
    distracted: 0,
    focusBonus: 0
  };

  const AGRO = {
    neon: 1, golden: 1.08, ice: 1.05, coliseum: 1.12, abyssal: 0.95,
    celestial: 1.1, quantum: 1.15, igneous: 1.18, fractal: 1.2, final: 1.28
  };
  const DIFF = { normal: 1, hard: 1.12, expert: 1.24, legendary: 1.38 };

  function api() { return state.api || {}; }
  function view() { const a = api(); return a.getView ? a.getView() : null; }
  function player() { const a = api(); return a.getPlayer ? a.getPlayer() : null; }
  function world() { const a = api(); return a.getWorld ? a.getWorld() : null; }
  function runtime() { const a = api(); return a.getRuntime ? a.getRuntime() : { worldId: 'neon' }; }

  function agro() {
    const rt = runtime();
    const w = AGRO[rt.worldId] || 1;
    const d = DIFF[(rt.difficultyId || (api().getDiff && api().getDiff()) || 'normal')] || 1;
    return w * d * (state.novaMode ? 1 + state.kills * 0.08 : 1);
  }

  function pop(x, y, text, col) {
    pops.acquire((o) => { o.x = x; o.y = y; o.text = String(text); o.life = 0.55; o.col = col || '#fff'; });
  }

  function burst(x, y, n, col, g) {
    const cap = state.lastFt > 22 ? Math.min(n, 6) : n;
    for (let i = 0; i < cap; i++) {
      const a = Math.random() * 6.283, sp = 40 + Math.random() * 180;
      fx.acquire((p) => {
        p.x = x; p.y = y; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - 40;
        p.life = p.max = 0.25 + Math.random() * 0.4; p.r = 2 + Math.random() * 3;
        p.col = col || '#9ff0ff'; p.g = g != null ? g : 500;
      });
    }
  }

  function spawnHunter() {
    const v = view(), p = player();
    if (!v || !p || hunter.alive) return;
    const extra = Math.floor((agro() - 1) * 4);
    hunter.alive = true;
    hunter.maxHp = hunter.hp = hunter.shownHp = Math.max(4, 5 + extra);
    hunter.x = v.w * 0.78; hunter.y = v.groundY - 140;
    hunter.flash = 0; hunter.phase = 'idle'; hunter.t = 0; hunter.lane = 0;
  }

  function hitHunter(dmg) {
    if (!hunter.alive) return false;
    hunter.hp -= Math.max(1, dmg | 0);
    hunter.flash = 0.12;
    pop(hunter.x, hunter.y - 24, '-' + (dmg | 0), '#fff');
    const a = api();
    if (a.shake) a.shake.add(0.28);
    if (hunter.hp <= 0) {
      hunter.alive = false;
      const clk = a.clock;
      if (clk && clk.freeze) clk.freeze(0.08);
      if (a.shake) a.shake.add(0.7);
      burst(hunter.x, hunter.y, 22, '#ffe58a', 200);
      if (a.rewardHunter) a.rewardHunter();
      startNova(hunter.x, hunter.y);
      return true;
    }
    return false;
  }

  function startNova(x, y) {
    state.novaT = 2.8 + Math.min(1.2, state.novaStack * 0.2);
    state.novaStack = Math.min(6, state.novaStack + 1);
    state.collapse = Math.min(1, state.collapse + 0.22);
    state.kills += 1;
    if (state.kills >= 2) {
      state.novaMode = true;
      const rt = runtime();
      if (rt) rt.speedMul = (rt.speedMul || 1) * 1.08;
    }
    const a = api();
    if (a.clock) a.clock.scale = 0.45;
    if (a.audioNova) a.audioNova();
    burst(x, y, 18, '#c4f4ff', -40);
    if (a.toast) a.toast(state.novaMode ? 'MODO NOVA' : 'NOVA');
  }

  function telegraphAtk() {
    const roll = Math.random();
    if (state.novaMode && roll < 0.35) hunter.atk = 'combo';
    else if (agro() > 1.2 && roll < 0.45) hunter.atk = 'rain';
    else hunter.atk = roll < 0.5 ? 'laser' : 'rush';
    hunter.phase = 'telegraph';
    hunter.telegraph = Math.max(0.4, TELEGRAPH / Math.max(1, agro() * 0.85));
    hunter.t = 0;
  }

  function fireLaser() {
    const v = view(), p = player();
    if (!v || !p) return;
    proj.acquire((o) => {
      o.kind = 'laser'; o.x = hunter.x; o.y = hunter.y;
      o.vx = -280 * agro(); o.vy = 0; o.w = 28; o.h = 5;
      o.life = 1.4; o.telegraph = 0; o.armed = true;
    });
  }

  function fireRain() {
    const v = view();
    if (!v) return;
    const n = state.lastFt > 22 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      proj.acquire((o) => {
        o.kind = 'meteor'; o.x = v.w * (0.35 + i * 0.18); o.y = -20;
        o.vx = -40; o.vy = 160; o.w = 12; o.h = 16;
        o.life = 2.2; o.telegraph = TELEGRAPH; o.armed = false;
      });
    }
  }

  function maybeHolo(dt) {
    const v = view(), w = world();
    if (!v || !w) return;
    if (holo.live.filter((h) => h.alive).length >= 2) return;
    if (Math.random() > dt * 0.08) return;
    holo.acquire((o) => {
      o.x = v.w + 40; o.y = v.groundY - 120; o.w = 64; o.h = 86;
      o.life = 6; o.ph = Math.random() * 6; o.tempted = 0;
    });
  }

  const Nova = {
    init(hooks) { state.api = hooks || {}; },
    reset() {
      hunter.alive = false;
      fx.clear(); proj.clear(); holo.clear(); pops.clear();
      state.kills = 0; state.novaMode = false; state.novaStack = 0; state.novaT = 0;
      state.collapse = 0; state.exposure = 1; state.weatherPh = 0; state.weatherKind = 'base';
      state.invaderT = 0; state.invaderKind = null; state.shield = 0;
      state.lanceCd = 0; state.pulseCd = 0; state.distracted = 0; state.focusBonus = 0;
      const a = api();
      if (a.clock) a.clock.scale = 1;
      const rt = runtime();
      const hints = {
        neon: 'Señales perdidas. No confíes en tus ojos.',
        golden: 'El viento miente sobre la distancia.',
        ice: 'El suelo recuerda cada aterrizaje.',
        coliseum: 'La ovación no es tu aliada.',
        abyssal: 'Abajo no hay suelo. Solo presión.',
        celestial: 'Las nubes no perdonan el timing.',
        quantum: 'Lo que parpadea te está mirando.',
        igneous: 'El calor cobra peaje.',
        fractal: 'El mapa se reescribe a cada paso.',
        final: 'No hay nombres públicos aquí.'
      };
      state.mysteryHint = hints[rt.worldId] || hints.neon;
    },

    onKill() {
      if (!hunter.alive && Math.random() < 0.55) spawnHunter();
    },

    onPower(id) {
      const p = player(), v = view();
      if (!p || !v) return;
      if (id === 'nova_pulse') {
        state.pulseCd = 4;
        burst(p.x, p.y, 16, '#a5f3fc', 80);
        if (hunter.alive) hitHunter(3);
        const w = world();
        if (w && w.drones && window.RLCombat) {
          w.drones.forEach((o) => {
            if (!o.alive) return;
            const dead = window.RLCombat.damageEnemy(o, 2);
            if (dead && api().rewardFoe) api().rewardFoe(o, '#67e8f9');
          });
          w.drones.sweep();
        }
        if (w && w.boss && w.boss.active) w.boss.hitBySuper();
      }
      if (id === 'star_lance') {
        state.lanceCd = 3.2;
        const tx = hunter.alive ? hunter.x : v.w * 0.75;
        const ty = hunter.alive ? hunter.y : v.groundY - 80;
        proj.acquire((o) => {
          o.kind = 'lance'; o.x = p.x + 20; o.y = p.y + 24;
          const dx = tx - o.x, dy = ty - o.y, m = Math.max(40, Math.hypot(dx, dy));
          o.vx = dx / m * 520; o.vy = dy / m * 520; o.w = 18; o.h = 6;
          o.life = 1.1; o.telegraph = 0; o.armed = true;
        });
      }
      if (id === 'quantum_shield') {
        state.shield = 1;
        p.iframe = Math.max(p.iframe, 1.6);
      }
    },

    damageHunter(n) { return hitHunter(n); },

    update(dt, raw) {
      state.lastFt = (raw || dt) * 1000;
      if (dt <= 0) return;
      const v = view(), p = player(), w = world(), a = api();
      if (!v || !p) return;

      state.weatherPh += dt * 0.12;
      const breath = 0.92 + Math.sin(state.weatherPh) * 0.08;
      state.exposure = breath * (1 - state.collapse * 0.18) * (state.novaT > 0 ? 1.25 : 1);

      if (state.novaT > 0) {
        state.novaT -= dt;
        if (state.novaT < 2.5 && a.clock && a.clock.scale < 1) {
          a.clock.scale = Math.min(1, a.clock.scale + dt * 1.8);
        }
        if (state.novaT <= 0 && a.clock) a.clock.scale = 1;
      }
      state.lanceCd = Math.max(0, state.lanceCd - dt);
      state.pulseCd = Math.max(0, state.pulseCd - dt);
      state.distracted = Math.max(0, state.distracted - dt);

      if (state.collapse > 0 && w) {
        p.slideVx = (p.slideVx || 0) - dt * 8 * state.collapse;
      }

      if (!hunter.alive && w && (w.dist || 0) > 40 && Math.random() < dt * 0.12) spawnHunter();

      if (hunter.alive) {
        hunter.shownHp += (hunter.hp - hunter.shownHp) * Math.min(1, dt * 8);
        hunter.flash = Math.max(0, hunter.flash - dt);
        hunter.lane = Math.sin((w && w.dist || 0) * 0.04) * 18;
        hunter.t += dt;
        if (hunter.phase !== 'attack' || hunter.atk !== 'rush') {
          hunter.x += ((v.w * 0.74) - hunter.x) * Math.min(1, dt * 2);
        }
        hunter.y = v.groundY - 130 + hunter.lane;
        if (hunter.phase === 'idle' && hunter.t > 2.2 / agro()) telegraphAtk();
        else if (hunter.phase === 'telegraph' && hunter.t >= hunter.telegraph) {
          hunter.phase = 'attack'; hunter.t = 0;
          if (hunter.atk === 'laser' || hunter.atk === 'combo') fireLaser();
          if (hunter.atk === 'rain' || hunter.atk === 'combo') fireRain();
          if (hunter.atk === 'rush') burst(hunter.x, hunter.y, 8, '#fb7185', 200);
        } else if (hunter.phase === 'attack') {
          if (hunter.atk === 'rush') {
            hunter.x -= 380 * dt;
            const pr = p.rect ? p.rect() : { x: p.x - 20, y: p.y, w: 40, h: p.h };
            if (p.iframe <= 0 && !p.dead && hunter.x < pr.x + pr.w && hunter.x + 20 > pr.x && Math.abs(hunter.y - (pr.y + pr.h * 0.5)) < 50) {
              if (state.shield > 0) { state.shield = 0; hitHunter(2); hunter.phase = 'idle'; hunter.t = 0; }
              else if (p.hurt) p.hurt();
            }
          }
          if (hunter.t > 0.55) { hunter.phase = 'idle'; hunter.t = 0; }
        }
      }

      proj.forEach((o) => {
        if (o.telegraph > 0) {
          o.telegraph -= dt;
          if (o.telegraph <= 0) o.armed = true;
          return;
        }
        o.x += o.vx * dt; o.y += o.vy * dt; o.life -= dt;
        if (o.kind === 'lance' && hunter.alive) {
          const dx = hunter.x - o.x, dy = hunter.y - o.y;
          if (dx * dx + dy * dy < 900) { hitHunter(4); o.alive = false; burst(o.x, o.y, 10, '#fde68a'); }
        }
        if (o.armed && p.iframe <= 0 && !p.dead) {
          const pr = p.rect ? p.rect() : { x: p.x - 20, y: p.y, w: 40, h: p.h };
          if (o.x < pr.x + pr.w && o.x + o.w > pr.x && o.y < pr.y + pr.h && o.y + o.h > pr.y) {
            if (state.shield > 0) {
              state.shield = 0;
              o.alive = false;
              if (hunter.alive) hitHunter(2);
              burst(p.x, p.y, 10, '#c4b5fd');
            } else if (p.hurt) p.hurt();
            o.alive = false;
          }
        }
        if (o.life <= 0 || o.x < -80 || o.y > v.h + 40) o.alive = false;
      });
      proj.sweep();

      maybeHolo(dt);
      holo.forEach((o) => {
        o.x -= (w ? w.speed : 340) * dt;
        o.ph += dt * 8; o.life -= dt;
        const near = p.x + 80 > o.x && p.x < o.x + o.w && Math.abs((p.y + p.h) - (o.y + o.h)) < 140;
        if (near) o.tempted += dt;
        else if (o.tempted > 0.15 && o.tempted < 0.85) {
          state.focusBonus += 1;
          if (api().getEconomy) {
            const e = api().getEconomy();
            e.combo = (e.combo || 0) + 2;
            e.coins = (e.coins || 0) + 4;
          }
          pop(o.x, o.y, 'FOCO ×3', '#ffd24a');
          o.tempted = 99;
        }
        if (o.tempted >= 0.85 && o.tempted < 90) {
          state.distracted = 1.1;
          if (api().getEconomy) api().getEconomy().combo = 0;
          o.tempted = 90;
        }
        if (o.life <= 0 || o.x < -100) o.alive = false;
      });
      holo.sweep();

      fx.forEach((p2) => {
        p2.life -= dt; p2.vy += p2.g * dt; p2.x += p2.vx * dt; p2.y += p2.vy * dt;
        if (state.collapse > 0) p2.x -= 40 * state.collapse * dt;
        if (p2.life <= 0) p2.alive = false;
      });
      fx.sweep();
      pops.forEach((q) => { q.life -= dt; q.y -= 36 * dt; if (q.life <= 0) q.alive = false; });
      pops.sweep();

      state.invaderT += dt;
      if (state.collapse > 0.3 && state.invaderT > 7) {
        state.invaderT = 0;
        state.invaderKind = Math.random() < 0.5 ? 'alien' : 'gov';
        fireRain();
      }
    },

    draw(ctx, v) {
      if (!ctx || !v) return;
      ctx.save();
      if (state.exposure !== 1) ctx.globalAlpha = Math.min(1, state.exposure);

      // Sky breath / collapse tint
      if (state.collapse > 0.02 || state.novaT > 0) {
        ctx.fillStyle = 'rgba(80,12,18,' + (state.collapse * 0.22 + (state.novaT > 0 ? 0.08 : 0)) + ')';
        ctx.fillRect(-40, -40, v.w + 80, v.h + 80);
      }
      if (state.novaT > 2.2) {
        ctx.fillStyle = 'rgba(220,245,255,' + ((state.novaT - 2.2) * 0.35) + ')';
        ctx.fillRect(-40, -40, v.w + 80, v.h + 80);
      }

      holo.forEach((o) => {
        ctx.save();
        ctx.globalAlpha = 0.55 + Math.sin(o.ph) * 0.2;
        ctx.fillStyle = '#22e6ff';
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.fillStyle = '#ff2bd6';
        ctx.fillRect(o.x + 6, o.y + 10 + Math.sin(o.ph * 2) * 4, o.w - 12, 8);
        ctx.restore();
      });

      proj.forEach((o) => {
        if (o.telegraph > 0) {
          ctx.setLineDash([6, 6]);
          ctx.strokeStyle = 'rgba(255,80,90,0.85)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(o.x, v.groundY);
          ctx.lineTo(o.x, o.y);
          ctx.stroke();
          ctx.setLineDash([]);
          return;
        }
        ctx.fillStyle = o.kind === 'lance' ? '#fde68a' : o.kind === 'meteor' ? '#fb923c' : '#fb7185';
        ctx.fillRect(o.x, o.y, o.w, o.h);
      });

      if (hunter.alive) {
        ctx.fillStyle = hunter.flash > 0 ? '#ffffff' : '#7c3aed';
        ctx.fillRect(hunter.x - hunter.w / 2, hunter.y - hunter.h / 2, hunter.w, hunter.h);
        if (hunter.phase === 'telegraph') {
          ctx.setLineDash([8, 7]);
          ctx.strokeStyle = 'rgba(255,210,74,0.9)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(hunter.x, hunter.y);
          const pl = player();
          if (pl) ctx.lineTo(pl.x, v.groundY);
          else ctx.lineTo(40, v.groundY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(255,64,96,0.85)';
          ctx.fillRect(hunter.x - 28, hunter.y - hunter.h / 2 - 18, 56, 6);
          ctx.fillStyle = '#ffd24a';
          ctx.font = '700 11px Rajdhani,sans-serif';
          ctx.fillText('¡ESQUIVA!', hunter.x - 26, hunter.y - hunter.h / 2 - 22);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(hunter.x - 22, hunter.y - hunter.h / 2 - 10, 44, 5);
        ctx.fillStyle = '#22d3ee';
        ctx.fillRect(hunter.x - 22, hunter.y - hunter.h / 2 - 10, 44 * Math.max(0, hunter.shownHp / hunter.maxHp), 5);
      }

      fx.forEach((p2) => {
        ctx.globalAlpha = Math.max(0, p2.life / p2.max);
        ctx.fillStyle = p2.col;
        ctx.beginPath(); ctx.arc(p2.x, p2.y, p2.r, 0, 6.283); ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.font = '700 13px Rajdhani,sans-serif';
      ctx.textAlign = 'center';
      pops.forEach((q) => {
        ctx.globalAlpha = Math.max(0, q.life / 0.55);
        ctx.fillStyle = q.col;
        ctx.fillText(q.text, q.x, q.y);
      });
      ctx.textAlign = 'start';
      ctx.globalAlpha = 1;

      if (state.distracted > 0) {
        ctx.fillStyle = 'rgba(255,43,214,' + (0.12 * state.distracted) + ')';
        ctx.fillRect(-40, -40, v.w + 80, v.h + 80);
      }
      if (state.shield > 0 && player()) {
        const pl = player();
        ctx.strokeStyle = 'rgba(196,181,253,0.85)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(pl.x, pl.y + pl.h * 0.4, 46, 0, 6.283); ctx.stroke();
      }
      ctx.restore();
    },

    snapshot() {
      return {
        hunterHp: hunter.alive ? hunter.hp : 0,
        hunterAlive: hunter.alive,
        hunterPhase: hunter.phase,
        kills: state.kills,
        novaMode: state.novaMode,
        novaT: state.novaT,
        collapse: state.collapse,
        weatherKind: state.weatherKind,
        shield: state.shield,
        lanceCd: state.lanceCd,
        pulseCd: state.pulseCd,
        agro: agro(),
        mysteryHint: state.mysteryHint,
        fxLive: fx.live.length,
        lastFt: state.lastFt
      };
    },

    qaHit(n) { return hitHunter(n || 3); },
    qaSpawn() { spawnHunter(); return hunter.hp; }
  };

  global.RLNova = Nova;
})(typeof window !== 'undefined' ? window : globalThis);
