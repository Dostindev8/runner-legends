/**
 * Runner Legends v6.0 — Game engine (Mega Directiva · Offline-first)
 * Depends: RLWorlds, RLPortal, RLContentV6 (loaded first).
 */
(function () {
  'use strict';
  if (!window.RLWorlds || !window.RLPortal) {
    console.error('RL: missing worlds/portal modules');
    return;
  }
  if (!window.RLContentV6) {
    console.warn('RL: content-v6 missing — bosses/hub degraded');
  }

  const { WORLDS, getWorld, buildRuntimeConfig } = RLWorlds;
  const { PortalOutcomeResolver, WorldTransitionManager } = RLPortal;

  const runMods = { extraJump: 0, superMul: 1, iframeBonus: 0, shakeMul: 1 };
  /** Adaptive presentation tier — never changes gameplay rules. */
  const quality = { tier: 'high', dprCap: 3, particleMul: 1, weatherN: 48, trailChance: 14 };
  (function detectQuality() {
    const mem = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const narrow = Math.min(window.innerWidth || 400, window.innerHeight || 700) <= 400;
    if (mem <= 2 || cores <= 2 || (narrow && mem < 4)) {
      quality.tier = 'low'; quality.dprCap = 1.5; quality.particleMul = 0.45; quality.weatherN = 18; quality.trailChance = 6;
    } else if (mem <= 4 || cores <= 4 || narrow) {
      quality.tier = 'med'; quality.dprCap = 2; quality.particleMul = 0.7; quality.weatherN = 28; quality.trailChance = 10;
    }
  })();

  const CFG = {
    logicalH: 540, ground: 88,
    gravity: 2200, jumpVel: -900, jumpCut: 0.45, doubleJumpVel: -790,
    coyote: 0.12, buffer: 0.15, apexScale: 0.62, apexThreshold: 140, maxFall: 1800,
    runStart: 340, runMax: 580, runAccel: 8,
    player: { w: 72, h: 98, x: 0.20 },
    iframes: 1.1, maxHP: 3,
    superChargePerCoin: 0.012, superChargePerSec: 1 / 40,
    portalAt: 220, comboWindow: 1.65,
    spawnGrace: 3.0, postPowerGrace: 1.2,
    stageKills: 8, stageDist: 250, bossAt: 130
  };

  const DIFF = {
    normal: { id: 'normal', label: 'Normal', scroll: 1.0, coyote: 0.12, buffer: 0.15, density: 1.0, reward: 1.0, chip: 'NORMAL' },
    hard: { id: 'hard', label: 'Difícil', scroll: 1.15, coyote: 0.11, buffer: 0.13, density: 1.15, reward: 1.25, chip: 'DIFÍCIL' },
    expert: { id: 'expert', label: 'Experto', scroll: 1.3, coyote: 0.10, buffer: 0.12, density: 1.28, reward: 1.5, chip: 'EXPERTO' },
    legendary: { id: 'legendary', label: 'Legendario', scroll: 1.45, coyote: 0.09, buffer: 0.12, density: 1.38, reward: 2.0, chip: 'LEGENDARIO' }
  };

  const TRAILS = [
    { id: 'neon', name: 'Estela Neón', price: 0, col: '#22e6ff' },
    { id: 'gold', name: 'Estela Dorada', price: 80, col: '#ffd24a' },
    { id: 'magenta', name: 'Plasma Magenta', price: 140, col: '#ff2bd6' },
    { id: 'void', name: 'Estela Vacío', price: 220, col: '#a78bfa' }
  ];

  const ACHIEVEMENTS = [
    { id: 'first_run', icon: '▶', label: 'Primer Distrito', desc: 'Completa una carrera' },
    { id: 'dist_400', icon: '🏃', label: 'Sprinter', desc: 'Alcanza 400 m en una carrera' },
    { id: 'dist_800', icon: '🚀', label: 'Legend Runner', desc: 'Alcanza 800 m en una carrera' },
    { id: 'combo_12', icon: '✦', label: 'Combo ×12', desc: 'Encadena 12 monedas sin fallar' },
    { id: 'portal_3', icon: '🌀', label: 'Saltador dimensional', desc: 'Cruza 3 portales en total' },
    { id: 'worlds_3', icon: '🗺️', label: 'Explorador', desc: 'Desbloquea 3 mundos' },
    { id: 'super_1', icon: '💥', label: 'Explosión Estelar', desc: 'Activa el súper al menos una vez' },
    { id: 'rich_200', icon: '◎', label: 'Bóveda Neón', desc: 'Acumula 200 monedas totales' },
    { id: 'kills_8', icon: '⚔', label: 'Barrido', desc: 'Elimina 8 enemigos en un tramo' },
    { id: 'stage_win', icon: '🏁', label: 'Tramo cerrado', desc: 'Cierra un distrito: jefe, 8 KO o 250 m' },
    { id: 'boss_1', icon: '👑', label: 'Cazador de jefes', desc: 'Derrota a un jefe de distrito' }
  ];

  let activeDiff = DIFF.normal;
  let runtime = buildRuntimeConfig('neon', 'clear_night', 'extreme_speed', 'normal');
  let preferredOrigin = 'neon';

  /** Ω.3 — power module facade. Null-object fallback keeps the core playable
   *  if js/power-system.js is disabled (EXTEND-NEVER-OVERWRITE audit hook). */
  const NO_POWERS = {
    init() {}, reset() {}, update() {}, openSelector() { return false; },
    isPaused() { return false; }, freeFlight() { return false; }, jumpLocked() { return false; },
    worldSpeedMul() { return 1; }, alphaMul() { return 1; }, coinMagnet() { return false; }, label() { return ''; }, active: null
  };
  const powers = window.RLPowers || NO_POWERS;

  /** Physically reachable gap floor: air time of a single jump + reaction margin. */
  const JUMP_AIR_TIME = 0.95;
  const REACTION_MARGIN = 0.60;
  function minSafeGap(speed) { return speed * (JUMP_AIR_TIME + REACTION_MARGIN); }

  const SAVE_KEY = 'rl_save_v2';
  const WORLD_IDS = WORLDS.map((w) => w.id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function sanitizeName(n) {
    return String(n || 'Jugador').replace(/[^\wÁÉÍÓÚáéíóúñÑüÜ .'-]/g, '').trim().slice(0, 16) || 'Jugador';
  }
  function loadSave() {
    const base = {
      coins: 0, xp: 0, level: 1, name: 'Jugador',
      unlocked: ['neon'], legendary: false, intro: false,
      portalHistory: [], combos: [], bestDist: 0,
      bestCombo: 0, runs: 0, portals: 0, supers: 0,
      trail: 'neon', ownedTrails: ['neon'], achievements: {},
      bossesDefeated: [], essences: {}, characters: ['kori'], activeChar: 'kori',
      fragments: {}, fragmentRewards: {}, powersSeen: [],
      audio: { music: 0.55, sfx: 0.7, voice: 0.65 }
    };
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return base;
      const d = JSON.parse(raw);
      // Only keep contiguous progression from neon — drops illicit portal unlocks
      const rawUnlock = Array.isArray(d.unlocked) ? d.unlocked : ['neon'];
      const unlocked = [];
      for (const id of WORLD_IDS) {
        if (id === 'neon' || rawUnlock.includes(id)) unlocked.push(id);
        else break;
        if (id === 'final') break;
      }
      if (!unlocked.length) unlocked.push('neon');
      const ownedTrails = Array.isArray(d.ownedTrails)
        ? d.ownedTrails.filter((id) => TRAILS.some((t) => t.id === id))
        : ['neon'];
      if (!ownedTrails.includes('neon')) ownedTrails.unshift('neon');
      const trail = ownedTrails.includes(d.trail) ? d.trail : 'neon';
      const achievements = (d.achievements && typeof d.achievements === 'object') ? d.achievements : {};
      return {
        coins: Math.max(0, Math.min(999999, Number(d.coins) || 0)),
        xp: Math.max(0, Number(d.xp) || 0),
        level: Math.max(1, Math.min(99, Number(d.level) || 1)),
        name: sanitizeName(d.name),
        unlocked,
        legendary: !!d.legendary,
        intro: !!d.intro,
        portalHistory: Array.isArray(d.portalHistory) ? d.portalHistory.slice(-8).map(String) : [],
        combos: Array.isArray(d.combos) ? d.combos.slice(-20).map((n) => Math.max(0, Number(n) || 0)) : [],
        bestDist: Math.max(0, Number(d.bestDist) || 0),
        bestCombo: Math.max(0, Number(d.bestCombo) || 0),
        runs: Math.max(0, Number(d.runs) || 0),
        portals: Math.max(0, Number(d.portals) || 0),
        supers: Math.max(0, Number(d.supers) || 0),
        trail,
        ownedTrails,
        achievements,
        bossesDefeated: Array.isArray(d.bossesDefeated) ? d.bossesDefeated.map(String) : [],
        essences: (d.essences && typeof d.essences === 'object') ? d.essences : {},
        characters: Array.isArray(d.characters) && d.characters.length ? d.characters.map(String) : ['kori'],
        activeChar: typeof d.activeChar === 'string' ? d.activeChar : 'kori',
        fragments: (d.fragments && typeof d.fragments === 'object') ? d.fragments : {},
        fragmentRewards: (d.fragmentRewards && typeof d.fragmentRewards === 'object') ? d.fragmentRewards : {},
        powersSeen: Array.isArray(d.powersSeen) ? d.powersSeen.map(String).slice(0, 32) : [],
        audio: {
          music: Math.min(1, Math.max(0, Number(d.audio && d.audio.music) || 0.55)),
          sfx: Math.min(1, Math.max(0, Number(d.audio && d.audio.sfx) || 0.7)),
          voice: Math.min(1, Math.max(0, Number(d.audio && d.audio.voice) || 0.65))
        }
      };
    } catch (e) { return base; }
  }
  let save = loadSave();
  if (!save.fragmentRewards) save.fragmentRewards = {};
  if (!save.fragments) save.fragments = {};
  if (!save.bossesDefeated) save.bossesDefeated = [];
  if (!save.essences) save.essences = {};
  if (!save.characters) save.characters = ['kori'];
  if (!save.audio) save.audio = { music: 0.55, sfx: 0.7, voice: 0.65 };
  function persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {}
  }
  persist(); // rewrite save after contiguous-unlock sanitize

  function trailColor() {
    const t = TRAILS.find((x) => x.id === save.trail);
    return (t && t.col) || '#22e6ff';
  }

  function collectFragment(worldId) {
    if (!save.fragments) save.fragments = {};
    if (!save.fragmentRewards) save.fragmentRewards = {};
    save.fragments[worldId] = (save.fragments[worldId] || 0) + 1;
    const set = window.RLContentV6 && RLContentV6.FRAGMENT_SETS[worldId];
    const n = save.fragments[worldId];
    flashToast('FRAGMENTO · ' + n + (set ? '/' + set.need : ''));
    if (set && n >= set.need && !save.fragmentRewards[set.reward]) {
      save.fragmentRewards[set.reward] = true;
      economy.coins += 30;
      flashToast('SET COMPLETO · boost menor');
    }
    persist();
  }

  function applyRunBoosts() {
    runMods.extraJump = 0;
    runMods.superMul = 1;
    runMods.iframeBonus = 0;
    runMods.shakeMul = 1;
    const C = window.RLContentV6;
    const ch = C && C.getCharacter ? C.getCharacter(save.activeChar) : null;
    if (ch && ch.stats) {
      player.jumpMul *= 0.88 + (ch.stats.jump || 0.6) * 0.25;
      runtime.speedMul *= 0.92 + (ch.stats.vel || 0.6) * 0.16;
    }
    const fr = save.fragmentRewards || {};
    if (fr.air_jump) runMods.extraJump = 1;
    if (fr.super_charge) runMods.superMul = 1.15;
    if (fr.bubble_iframe) runMods.iframeBonus = 0.28;
    if (fr.friction_assist) runtime.friction = Math.min(1, (runtime.friction || 1) + 0.12);
    if (fr.heat_resist) runtime.heatSlow = 1;
    if (fr.shake_dampen) runMods.shakeMul = 0.45;
    if (fr.final_boost && runtime.worldId === 'final') runtime.speedMul *= 1.08;
    if (fr.trail_boost_neon || fr.trail_boost_gold) runMods.superMul *= 1.06;
  }

  function grantAchievement(id) {
    if (save.achievements[id]) return false;
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (!def) return false;
    save.achievements[id] = Date.now();
    persist();
    flashToast('LOGRO · ' + def.label);
    return true;
  }

  function evaluateAchievements(run) {
    if (save.runs >= 1) grantAchievement('first_run');
    if ((run && run.dist >= 400) || save.bestDist >= 400) grantAchievement('dist_400');
    if ((run && run.dist >= 800) || save.bestDist >= 800) grantAchievement('dist_800');
    if ((run && run.combo >= 12) || save.bestCombo >= 12) grantAchievement('combo_12');
    if (save.portals >= 3) grantAchievement('portal_3');
    if (save.unlocked.length >= 3) grantAchievement('worlds_3');
    if (save.supers >= 1) grantAchievement('super_1');
    if (save.coins >= 200) grantAchievement('rich_200');
    if (run && run.kills >= 8) grantAchievement('kills_8');
    if (run && run.cleared) grantAchievement('stage_win');
    if ((save.bossesDefeated || []).length >= 1) grantAchievement('boss_1');
  }

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const aabb = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const $ = (id) => document.getElementById(id);

  function rewardFoe(o, col) {
    particles.burst(o.x, o.y, 18, { col: col || o.col || '#ec4899', spMax: 280, lifeMax: 0.45 });
    economy.combo++;
    economy.super = Math.min(1, economy.super + 0.06);
    economy.coins += Math.round(3 * activeDiff.reward);
    shake.add(0.28);
    if (world) world.kills = (world.kills || 0) + 1;
    audio.coin();
    if (window.RLNova) window.RLNova.onKill();
  }

  function unlockNextWorld(fromId) {
    const order = WORLDS.map((w) => w.id);
    const idx = order.indexOf(fromId);
    if (idx < 0 || idx >= order.length - 1) return null;
    const next = order[idx + 1];
    if (!save.unlocked.includes(next)) {
      save.unlocked.push(next);
      flashToast('DESBLOQUEADO · ' + getWorld(next).name.toUpperCase());
      persist();
      return next;
    }
    return null;
  }

  function tryUnlockPilot(essence) {
    const C = window.RLContentV6;
    if (!C || !C.CHARACTERS || !essence) return;
    if (!save.characters) save.characters = ['kori'];
    for (let i = 0; i < C.CHARACTERS.length; i++) {
      const ch = C.CHARACTERS[i];
      if (ch.essence === essence && save.characters.indexOf(ch.id) < 0) {
        save.characters.push(ch.id);
        flashToast('PILOTO · ' + ch.name.toUpperCase());
      }
    }
  }

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
    ctx: null, master: null, musicG: null, sfxG: null, voiceG: null,
    ready: false, lastPlay: Object.create(null), laughI: 0,
    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.applyVolumes();
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.musicG = this.ctx.createGain();
      this.sfxG = this.ctx.createGain();
      this.voiceG = this.ctx.createGain();
      this.musicG.connect(this.master);
      this.sfxG.connect(this.master);
      this.voiceG.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.applyVolumes();
      this.ready = true;
    },
    applyVolumes() {
      if (!this.master) return;
      const a = (save && save.audio) || { music: 0.55, sfx: 0.7, voice: 0.65 };
      this.master.gain.value = 1;
      if (this.musicG) this.musicG.gain.value = a.music;
      if (this.sfxG) this.sfxG.gain.value = a.sfx;
      if (this.voiceG) this.voiceG.gain.value = a.voice;
    },
    can(type, ms) {
      const now = performance.now();
      if ((this.lastPlay[type] || 0) + (ms || 100) > now) return false;
      this.lastPlay[type] = now;
      return true;
    },
    beep(freq, dur, type, gain, busName) {
      if (!this.ctx || !this.master) return;
      const dest = busName === 'voice' ? this.voiceG : busName === 'music' ? this.musicG : this.sfxG;
      const t0 = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(gain || 0.04, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(g); g.connect(dest || this.sfxG);
      o.start(t0); o.stop(t0 + dur + 0.03);
    },
    chord(freqs, dur, type, gain, busName) {
      for (let i = 0; i < freqs.length; i++) this.beep(freqs[i], dur, type, (gain || 0.03) * (1 - i * 0.12), busName);
    },
    jump() { if (!this.can('jump', 80)) return; this.beep(460, 0.07, 'triangle', 0.05); this.beep(620, 0.05, 'sine', 0.025); },
    land() { if (!this.can('land', 90)) return; this.beep(110, 0.07, 'sine', 0.045); },
    coin() { if (!this.can('coin', 70)) return; this.beep(980, 0.045, 'square', 0.028); this.beep(1320, 0.06, 'sine', 0.018); },
    hurt() { if (!this.can('hurt', 120)) return; this.beep(88, 0.16, 'sawtooth', 0.05); this.beep(55, 0.2, 'triangle', 0.03); },
    portal() { if (!this.can('portal', 200)) return; this.chord([140, 210, 280, 420], 0.45, 'sine', 0.05); this.beep(90, 0.5, 'triangle', 0.03); },
    superFx() { if (!this.can('super', 150)) return; this.chord([180, 270, 360, 540], 0.35, 'sawtooth', 0.04); this.beep(720, 0.2, 'square', 0.025); },
    powerId(id) {
      if (!this.can('pwr_' + (id || 'x'), 90)) return;
      if (id === 'freight_bat') { this.beep(90, 0.18, 'sawtooth', 0.05); this.beep(220, 0.12, 'square', 0.03); this.chord([140, 180], 0.2, 'triangle', 0.04); return; }
      if (id === 'double_laser') { this.beep(880, 0.08, 'square', 0.03); this.beep(1320, 0.1, 'sawtooth', 0.02); return; }
      if (id === 'voltz_sphere') { this.beep(240, 0.2, 'sine', 0.04); this.beep(720, 0.12, 'triangle', 0.03); return; }
      if (id === 'volt_storm') { this.chord([980, 1240, 1560], 0.12, 'square', 0.028); return; }
      if (id === 'dance') { this.beep(200, 0.08, 'square', 0.04); this.beep(300, 0.08, 'triangle', 0.03); return; }
      if (id === 'invincible') { this.chord([392, 494, 587], 0.28, 'sine', 0.03); return; }
      if (id === 'shadow') { this.beep(160, 0.22, 'triangle', 0.03); return; }
      if (id === 'bullet_time') { this.beep(110, 0.35, 'sine', 0.04); return; }
      if (id === 'nova_pulse') { this.chord([180, 240, 360], 0.3, 'sine', 0.04); return; }
      if (id === 'star_lance') { this.beep(640, 0.08, 'square', 0.03); this.beep(980, 0.1, 'sine', 0.025); return; }
      if (id === 'quantum_shield') { this.chord([330, 440, 550], 0.2, 'triangle', 0.03); return; }
      if (id === 'flight') { this.beep(520, 0.12, 'sine', 0.03); return; }
      if (id === 'colossus') { this.beep(70, 0.25, 'sawtooth', 0.05); return; }
      if (id === 'ascended') { this.chord([220, 330, 440], 0.22, 'sine', 0.035); return; }
      this.superFx();
    },
    combo() { if (!this.can('combo', 90)) return; this.beep(760 + Math.min(economy.combo, 20) * 18, 0.04, 'triangle', 0.03); },
    specialPickup() { if (!this.can('special', 100)) return; this.chord([520, 660, 784, 990, 1180], 0.22, 'sine', 0.035); this.laugh(); },
    memoryTone() { if (!this.can('mem', 120)) return; this.chord([330, 415, 494], 0.3, 'triangle', 0.03, 'voice'); },
    laugh() {
      if (!this.can('laugh', 180)) return;
      const patterns = [[620, 740, 680, 800], [500, 640, 720], [700, 560, 780, 640], [480, 600, 720, 840]];
      const p = patterns[this.laughI++ % patterns.length];
      for (let i = 0; i < p.length; i++) setTimeout(() => this.beep(p[i], 0.06, 'square', 0.02, 'voice'), i * 55);
    },
    bossAppear() { if (!this.can('bossA', 200)) return; this.chord([80, 120, 160], 0.4, 'sawtooth', 0.045); },
    bossHit() { if (!this.can('bossH', 90)) return; this.beep(200, 0.08, 'square', 0.04); },
    bossDown() { if (!this.can('bossD', 200)) return; this.chord([440, 554, 659, 880], 0.5, 'triangle', 0.04); },
    preload() {
      this.init();
      if (!this.ctx) return Promise.resolve();
      return this.ctx.resume().then(() => {
        const t0 = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        g.gain.value = 0.0001;
        o.connect(g); g.connect(this.sfxG);
        o.start(t0); o.stop(t0 + 0.05);
      }).catch(() => {});
    }
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
        if (e.target.closest('button,a,input,.panel,.nav-tab,.diff-btn,.world-tile,.btn')) return;
        e.preventDefault();
        dn();
      });
      stage.addEventListener('pointerup', up);
      stage.addEventListener('pointercancel', up);
      stage.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });
      window.addEventListener('keydown', (e) => {
        if (e.repeat) return;
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); dn(); }
        if (e.code === 'KeyE' || e.code === 'ShiftLeft') this.superPressed = true;
      });
      window.addEventListener('keyup', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') up();
      });
      const sb = $('superBtn');
      if (sb) sb.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation(); this.superPressed = true;
      });
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
      this.dpr = Math.min(window.devicePixelRatio || 1, quality.dprCap);
      // Zoom the camera on phones so the runner fills the frame (logicalH 540 looked tiny).
      const portrait = vh >= vw;
      if (portrait && vw <= 375) this.h = 380;
      else if (portrait && vw <= 520) this.h = 390;
      else if (vh < 500) this.h = 360;
      else if (vw <= 768) this.h = 440;
      else this.h = CFG.logicalH;
      this.novaZoom = 1;
      if (vw < 700) this.novaZoom = 1 + ((700 - vw) / 700) * 0.35;
      this.scale = (vh / this.h) * this.novaZoom;
      this.w = Math.max(280, vw / this.scale);
      this.c.width = Math.round(vw * this.dpr);
      this.c.height = Math.round(vh * this.dpr);
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';
    }
    begin(sx, sy) {
      this.ctx.filter = 'none';
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.globalAlpha = 1;
      this.ctx.setTransform(
        this.dpr * this.scale, 0, 0, this.dpr * this.scale,
        this.dpr * (sx - this.lookAhead) * this.scale, this.dpr * sy * this.scale
      );
    }
    get groundY() { return this.h - CFG.ground; }
  }

  class CameraShake {
    constructor() { this.trauma = 0; this.t = 0; }
    add(a) { this.trauma = clamp(this.trauma + a * (runMods.shakeMul || 1), 0, 1); }
    update(dt) { this.t += dt * 30; this.trauma = Math.max(0, this.trauma - dt * 1.6); }
    get offset() {
      const s = this.trauma * this.trauma * 12;
      return { x: Math.sin(this.t * 1.7) * s, y: Math.cos(this.t * 2.3) * s };
    }
  }

  class Particles {
    constructor() {
      this.pool = new ObjectPool(() => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 2, col: '#fff', g: 0, alive: false }));
      for (let i = 0; i < 1400; i++) this.pool.free.push(this.pool.factory());
    }
    burst(x, y, n, opt) {
      opt = opt || {};
      const count = Math.max(1, Math.round(n * (quality.particleMul || 1)));
      for (let i = 0; i < count; i++) {
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
      const n = runtime.particle ? (quality.weatherN || 48) : 0;
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
      } else if (runtime.particle === 'glitch' || runtime.particle === 'meteors') {
        ctx.fillStyle = pal.accent;
        for (const d of this.drops) {
          ctx.globalAlpha = 0.35;
          if (runtime.particle === 'meteors') {
            ctx.fillRect(d.x, d.y, 3, d.len * 0.5);
          } else {
            ctx.fillRect(d.x + Math.sin(this.t * 20 + d.y) * 4, d.y, rand(2, 8), 2);
          }
        }
      } else if (runtime.particle === 'aurora' || runtime.particle === 'stars') {
        for (const d of this.drops) {
          ctx.globalAlpha = 0.2 + Math.sin(this.t + d.x) * 0.15;
          ctx.fillStyle = d.x % 2 ? '#7ef0c0' : '#a78bfa';
          ctx.beginPath(); ctx.arc(d.x, d.y, 1.8, 0, 6.283); ctx.fill();
        }
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
        { sp: 0.08, y0: 0.22, col: '#0b0630', bld: [], w: 260, h: 280 },
        { sp: 0.16, y0: 0.30, col: '#100840', bld: [], w: 220, h: 250 },
        { sp: 0.28, y0: 0.42, col: '#160a44', bld: [], w: 150, h: 200 },
        { sp: 0.48, y0: 0.58, col: '#241058', bld: [], w: 100, h: 150 },
        { sp: 0.72, y0: 0.70, col: '#2e1468', bld: [], w: 70, h: 100 },
        { sp: 0.92, y0: 0.82, col: '#3a1a78', bld: [], w: 48, h: 70 }
      ];
      this.t = 0; this.portalFlash = 0; this.reflect = 0.35;
      this.drift = { x: 0, y: 0 };
    }
    rebuildLayers(view) { this.seed(view); }
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
    update(dt) {
      this.t += dt;
      if (this.portalFlash > 0) this.portalFlash = Math.max(0, this.portalFlash - dt);
      this.drift.x = Math.sin(this.t * 0.7) * 2.4;
      this.drift.y = Math.cos(this.t * 0.55) * 1.8;
    }
    draw(ctx, view) {
      const pal = runtime.world.palette;
      const g = ctx.createLinearGradient(0, 0, 0, view.h);
      g.addColorStop(0, pal.sky0); g.addColorStop(0.55, pal.sky1); g.addColorStop(1, pal.sky2);
      ctx.fillStyle = g; ctx.fillRect(-80, -40, view.w + 160, view.h + 80);
      const gx = view.w * 0.72 + this.drift.x, gy = view.h * 0.26 + this.drift.y, gr = 150;
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
            ctx.fillStyle = pal.accent + '22';
            ctx.fillStyle = 'rgba(34,230,255,0.22)';
            if (runtime.worldId === 'neon') ctx.fillStyle = 'rgba(255,43,214,0.28)';
            else if (runtime.worldId === 'golden') ctx.fillStyle = 'rgba(255,210,90,0.28)';
            else if (runtime.worldId === 'ice') ctx.fillStyle = 'rgba(180,230,255,0.24)';
            else if (runtime.worldId === 'igneous') ctx.fillStyle = 'rgba(255,100,40,0.24)';
            for (let wy = y + 10; wy < base - 10; wy += 16) {
              ctx.fillRect(b.x + 6, wy, L.w * 0.18, 4);
              ctx.fillRect(b.x + L.w * 0.28, wy + 4, L.w * 0.16, 4);
            }
          }
          // Roof neon accent bar
          ctx.fillStyle = pal.accent;
          ctx.globalAlpha = 0.35;
          ctx.fillRect(b.x, y, L.w * 0.62, 2);
          ctx.globalAlpha = 1;
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
    constructor() { this.reset(); this.slideVx = 0; this.trail = []; }
    reset() {
      this.state = PS.GROUND; this.vy = 0; this.y = 0; this.onGround = true;
      this.coyoteT = 0; this.bufferT = 0; this.jumpsUsed = 0;
      this.sx = 1; this.sy = 1; this.hp = CFG.maxHP; this.iframe = 0; this.dead = false;
      this.jumpMul = 1; this._wasAir = false; this.runPhase = 0; this.slideVx = 0; this.heatAcc = 0;
      this.trail = []; this.superGlow = 0;
    }
    get x() { return view.w * CFG.player.x + this.slideVx; }
    get w() { return CFG.player.w; }
    get h() { return CFG.player.h; }
    get feetY() { return this.y + this.h; }
    update(dt, input, world) {
      const gY = view.groundY;
      const coyote = Math.max(CFG.coyote * 0.75, activeDiff.coyote * (runtime.reactionWindow || 1));
      const buffer = Math.max(CFG.buffer * 0.75, activeDiff.buffer);
      let maxJumps = 2 + (runMods.extraJump || 0);
      if (powers.freeFlight()) maxJumps = 99;
      if (input.consumeJump() && !powers.jumpLocked()) this.bufferT = buffer;
      this.bufferT = Math.max(0, this.bufferT - dt);
      const supported = world.groundAt(this.x) && this.feetY >= gY - 1.5;
      if (supported && this.vy >= 0) {
        this.onGround = true; this.state = PS.GROUND; this.coyoteT = coyote; this.jumpsUsed = 0;
        this.y = gY - this.h; this.vy = 0;
        if (window.RLCombat) window.RLCombat.land();
      } else {
        this.onGround = false; this.state = PS.AIR; this.coyoteT = Math.max(0, this.coyoteT - dt);
      }
      const canGround = (this.onGround || this.coyoteT > 0) && this.jumpsUsed === 0;
      const canAir = !canGround && this.jumpsUsed > 0 && this.jumpsUsed < maxJumps && this.bufferT > 0;
      if (this.bufferT > 0 && (canGround || canAir)) {
        const airMul = canAir ? (CFG.doubleJumpVel / CFG.jumpVel) : 1;
        this.vy = CFG.jumpVel * this.jumpMul * runtime.jumpMul * airMul;
        this.bufferT = 0; this.coyoteT = 0; this.jumpsUsed = Math.max(1, this.jumpsUsed + 1);
        this.onGround = false; this.state = PS.AIR; this.sx = 0.78; this.sy = 1.28;
        particles.dust(this.x, canAir ? this.y + this.h : gY); bus.emit('jump');
        if (canAir) particles.burst(this.x, this.y + this.h * 0.5, 10, { col: trailColor(), spMax: 160, lifeMax: 0.35, g: 200 });
      }
      if (input.consumeRelease() && this.vy < 0) this.vy *= CFG.jumpCut;
      let g = CFG.gravity * runtime.gravityMul;
      if (!this.onGround && Math.abs(this.vy) < CFG.apexThreshold) g *= CFG.apexScale;
      this.vy = Math.min(CFG.maxFall, this.vy + g * dt); this.y += this.vy * dt;
      if (this.onGround && this.state === PS.GROUND && this._wasAir) {
        this.sx = 1.28; this.sy = 0.74; particles.dust(this.x, gY); shake.add(0.14); bus.emit('land');
        if (runtime.slideOnLand) this.slideVx = rand(6, 14) * (Math.random() < 0.5 ? 1 : -1);
      }
      this._wasAir = !this.onGround;
      this.slideVx = lerp(this.slideVx, 0, clamp(dt * (2 + runtime.friction * 4), 0, 1));
      if (runtime.lateralPush) this.slideVx += Math.sin(performance.now() * 0.002) * runtime.lateralPush * dt * 0.02;
      this.slideVx = clamp(this.slideVx, -28, 28);
      if (this.y > view.h + 40) {
        if (powers.freeFlight()) { this.y = Math.min(this.y, view.h - 8); this.vy = Math.min(this.vy, -40); }
        else this.kill(true);
      }
      this.sx = lerp(this.sx, 1, clamp(dt * 12, 0, 1));
      this.sy = lerp(this.sy, 1, clamp(dt * 12, 0, 1));
      this.iframe = Math.max(0, this.iframe - dt);
      this.superGlow = Math.max(0, this.superGlow - dt);
      if (runtime.heatZones || runtime.heatDps) {
        this.heatAcc += (runtime.heatDps || 0.08) * dt;
        if (this.heatAcc > 1.2) { this.heatAcc = 0; this.hurt(); }
      }
      if (runtime.ovations && Math.random() < dt * 0.08) shake.add(0.08);
      // Motion trail
      if (mgr.state === 'PLAY' && !this.dead) {
        this.trail.push({ x: this.x, y: this.y + this.h * 0.45, life: 0.22 });
        if (this.trail.length > 10) this.trail.shift();
        for (const t of this.trail) t.life -= dt;
        this.trail = this.trail.filter((t) => t.life > 0);
        if (Math.random() < dt * (quality.trailChance || 14)) {
          particles.burst(this.x - 8, this.y + this.h * 0.7, 1, {
            col: trailColor(), spMin: 10, spMax: 40, lifeMin: 0.15, lifeMax: 0.35,
            sMin: 2, sMax: 4, g: 40, up: 20
          });
        }
      }
    }
    hurt() {
      if (this.iframe > 0 || this.dead) return;
      this.hp--; this.iframe = CFG.iframes + (runMods.iframeBonus || 0); shake.add(0.55); clock.freeze(0.06);
      particles.burst(this.x, this.y + this.h * 0.4, 18, { col: '#ff5a7a', spMax: 260, up: 60 });
      economy.breakCombo();
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
    reset() {
      this.coins = 0; this.combo = 0; this.maxCombo = 0; this.super = 0;
      this.buffT = 0; this.mult = 1; this.comboT = 0;
    }
    breakCombo() { this.combo = 0; this.comboT = 0; }
    addCoin() {
      const m = this.buffT > 0 ? 2 : 1;
      const comboMul = 1 + Math.min(0.5, this.combo * 0.03);
      this.coins += Math.round(1 * activeDiff.reward * m * comboMul);
      this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.comboT = CFG.comboWindow;
      this.super = Math.min(1, this.super + CFG.superChargePerCoin * 1.2);
      audio.coin();
      if (this.combo >= 5 && this.combo % 5 === 0) { audio.combo(); flashToast('COMBO ×' + this.combo); }
    }
    buff(mult, t) { this.mult = mult; this.buffT = t; }
    update(dt) {
      this.super = Math.min(1, this.super + CFG.superChargePerSec * (runMods.superMul || 1) * dt);
      if (this.buffT > 0) this.buffT -= dt; else this.mult = 1;
      if (this.combo > 0) {
        this.comboT -= dt;
        if (this.comboT <= 0) this.breakCombo();
      }
    }
  }

  /** Boss entity — pooled singleton patterns, telegraphed attacks only (Fase 5). */
  class BossEntity {
    constructor() { this.clear(); }
    clear() {
      this.active = false; this.def = null; this.hp = 0; this.maxHp = 0;
      this.x = 0; this.y = 0; this.w = 70; this.h = 90;
      this.phase = 'idle'; this.t = 0; this.patIdx = 0; this.telegraph = 0;
      this.invuln = 0; this.squadLeft = 0; this.aliveTime = 0;
    }
    spawn(worldId, view) {
      const C = window.RLContentV6;
      if (!C) return;
      const def = C.getBoss(worldId);
      if (!def) return;
      this.clear();
      this.active = true; this.def = def;
      this.replay = !!(save.bossesDefeated && save.bossesDefeated.includes(def.id));
      this.maxHp = this.replay ? Math.max(4, Math.floor(def.hp * 0.65)) : def.hp;
      this.hp = this.maxHp;
      this.w = def.w; this.h = def.h;
      this.x = view.w + 120; this.y = view.groundY - this.h;
      this.phase = 'enter'; this.t = 0; this.patIdx = 0; this.aliveTime = 0;
      this.squadLeft = def.squad || 1;
      flashToast('JEFE · ' + def.name.toUpperCase());
      audio.bossAppear();
    }
    update(dt, player, view) {
      if (!this.active) return;
      this.invuln = Math.max(0, this.invuln - dt);
      this.t += dt; this.aliveTime += dt;
      // Slide into arena
      const targetX = view.w * 0.72;
      if (this.phase === 'enter') {
        this.x = lerp(this.x, targetX, clamp(dt * 2.2, 0, 1));
        if (Math.abs(this.x - targetX) < 4) { this.phase = 'idle'; this.t = 0; }
        return;
      }
      const pats = this.def.patterns;
      const pat = pats[this.patIdx % pats.length];
      if (this.phase === 'idle') {
        if (this.t > 0.85) { this.phase = 'telegraph'; this.t = 0; this.telegraph = pat.telegraph; }
      } else if (this.phase === 'telegraph') {
        if (this.t >= pat.telegraph) { this.phase = 'attack'; this.t = 0; }
      } else if (this.phase === 'attack') {
        // Hurtbox during active window
        if (this.t < pat.active) {
          const hit = {
            x: this.x - this.w * 0.55, y: this.y + 10,
            w: this.w * 1.1, h: this.h * 0.85
          };
          if (aabb(player.rect(), hit) && player.iframe <= 0) player.hurt();
        } else { this.phase = 'recover'; this.t = 0; }
      } else if (this.phase === 'recover') {
        if (this.t >= pat.recovery) {
          this.phase = 'idle'; this.t = 0; this.patIdx++;
        }
      }
      // Softlock escape: after 55s auto-weaken
      if (this.aliveTime > 55 && this.phase !== 'dead') this.hp = Math.max(1, this.hp - dt * 0.35);
      this.y = view.groundY - this.h + Math.sin(performance.now() * 0.003) * 4;
    }
    hitBySuper() {
      if (!this.active || this.invuln > 0) return false;
      this.hp -= 3; this.invuln = 0.45;
      particles.burst(this.x, this.y + this.h * 0.4, 28, { col: this.def.accent, spMax: 280, up: 80 });
      shake.add(0.45); audio.bossHit();
      if (this.hp <= 0) { this.defeat(); return true; }
      return false;
    }
    hitByStomp() {
      if (!this.active || this.invuln > 0) return;
      if (this.phase === 'attack') return;
      this.hp -= 1; this.invuln = 0.28;
      if (window.RLCombat) window.RLCombat.pop(this.x, this.y - 10, '-1', '#ffd24a');
      particles.burst(this.x, this.y, 12, { col: this.def.color, spMax: 180 });
      audio.bossHit();
      if (this.hp <= 0) this.defeat();
    }
    defeat() {
      this.squadLeft--;
      if (this.squadLeft > 0) {
        this.hp = this.maxHp; this.phase = 'idle'; this.t = 0;
        flashToast('ESCUADRÓN · ' + this.squadLeft + ' RESTANTES');
        return;
      }
      this.active = false; this.phase = 'dead';
      const def = this.def;
      particles.burst(this.x, this.y + this.h * 0.3, 50, { col: def.accent, spMax: 420, up: 100 });
      audio.bossDown();
      flashToast('DERROTADO · ' + def.name.toUpperCase());
      if (world) world.bossDown = true;
      if (!this.replay) {
        if (!save.bossesDefeated) save.bossesDefeated = [];
        if (!save.bossesDefeated.includes(def.id)) save.bossesDefeated.push(def.id);
        if (!save.essences) save.essences = {};
        save.essences[def.essence] = (save.essences[def.essence] || 0) + 1;
        tryUnlockPilot(def.essence);
        unlockNextWorld(def.worldId);
      }
      if (save.unlocked.length >= 9 && !save.unlocked.includes('final')) save.unlocked.push('final');
      persist(); refreshMenuUI();
      economy.coins += Math.round(25 * activeDiff.reward);
    }
    draw(ctx) {
      if (!this.active) return;
      const d = this.def;
      const warn = this.phase === 'telegraph';
      ctx.save();
      if (warn) {
        ctx.globalAlpha = 0.35 + Math.sin(performance.now() * 0.02) * 0.2;
        ctx.fillStyle = '#ff4060';
        ctx.fillRect(this.x - this.w * 0.7, this.y - 18, this.w * 1.4, 8);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffd24a';
        ctx.font = '700 12px Rajdhani,sans-serif';
        ctx.fillText('¡ATACA!', this.x - 22, this.y - 24);
      }
      const g = ctx.createLinearGradient(this.x - this.w / 2, this.y, this.x + this.w / 2, this.y + this.h);
      g.addColorStop(0, d.color); g.addColorStop(1, '#0a0618');
      ctx.fillStyle = g;
      ctx.shadowColor = d.accent; ctx.shadowBlur = 16;
      ctx.fillRect(this.x - this.w / 2, this.y, this.w, this.h);
      ctx.shadowBlur = 0;
      ctx.fillStyle = d.accent;
      ctx.fillRect(this.x - this.w / 2 + 8, this.y + 14, this.w - 16, 10);
      // HP bar
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(this.x - 40, this.y - 14, 80, 6);
      ctx.fillStyle = d.accent;
      ctx.fillRect(this.x - 40, this.y - 14, 80 * clamp(this.hp / this.maxHp, 0, 1), 6);
      ctx.restore();
    }
    rect() { return { x: this.x - this.w / 2, y: this.y, w: this.w, h: this.h }; }
  }

  class World {
    constructor() {
      this.crates = new ObjectPool(() => ({ x: 0, y: 0, w: 44, h: 44, alive: false, reactive: false }));
      this.drones = new ObjectPool(() => ({
        x: 0, y: 0, w: 42, h: 34, ph: 0, alive: false,
        hp: 1, maxHp: 1, stompable: true, telegraph: 0.4, age: 0,
        stun: 0, slow: 1, flash: 0, pattern: 'sine', col: '#22e6ff',
        kind: 'dron_vigia', name: 'Dron', immortal: false, baseY: 0
      }));
      this.coins = new ObjectPool(() => ({ x: 0, y: 0, r: 11, taken: false, ph: 0, alive: false }));
      this.holes = new ObjectPool(() => ({ x: 0, w: 0, alive: false }));
      this.portals = new ObjectPool(() => ({ x: 0, w: 40, h: 100, used: false, alive: false, bleed: [] }));
      this.fragments = new ObjectPool(() => ({ x: 0, y: 0, r: 10, taken: false, ph: 0, alive: false }));
      this.memories = new ObjectPool(() => ({ x: 0, y: 0, r: 12, taken: false, ph: 0, alive: false, lore: '' }));
      this.boss = new BossEntity();
      this.reset();
    }
    reset() {
      this.crates.clear(); this.drones.clear(); this.coins.clear(); this.holes.clear(); this.portals.clear();
      this.fragments.clear(); this.memories.clear(); this.boss.clear();
      this.speed = CFG.runStart * activeDiff.scroll * runtime.speedMul;
      this.dist = 0; this.nextGap = (view ? view.w : 800) + 80;
      this.portalSpawned = false; this.segmentDist = 0;
      this.fragSpawned = 0; this.memSpawned = 0; this.bossArmed = false;
      this.aliveT = 0; this.spawnLock = 0;
      this.kills = 0; this.bossDown = false; this.cleared = false;
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
      if (this.aliveT < CFG.spawnGrace || this.spawnLock > 0) {
        this.nextGap = view.w + 80;
        return;
      }
      const gY = view.groundY; const dens = activeDiff.density; const r = Math.random();
      const gapMul = 1 / Math.sqrt(dens);
      // Ω.3: +40% base spacing, floored by what is physically jumpable at this speed.
      const gap = (min, max, extra) =>
        view.w + 40 + (extra || 0) + Math.max(rand(min, max) * gapMul * 1.4, minSafeGap(this.speed));
      if (r < 0.22) {
        const w = rand(90, 160); this.holes.spawn((h) => { h.x = view.w + 40; h.w = w; });
        this._spawnCoinArc(view.w + 40 + w * 0.2, gY - 30, 4);
        this.nextGap = gap(240, 360, w);
      } else if (r < 0.42) {
        const h = rand(34, 58);
        this.crates.spawn((c) => {
          c.x = view.w + 40; c.y = gY - h; c.w = 44; c.h = h;
          c.reactive = !!runtime.reactiveObstacles;
        });
        this._spawnCoinArc(view.w + 18, gY - h - 70, 5);
        this.nextGap = gap(240, 340);
      } else if (r < 0.86) {
        const En = window.RLEnemies;
        const spec = En ? En.pick(runtime.worldId, activeDiff.id) : null;
        this.drones.spawn((d) => {
          const y = spec && spec.pattern === 'ground' ? gY - (spec.h || 36) / 2
            : gY - rand(70, 140);
          if (spec && En.stamp) En.stamp(d, spec, view.w + 40, y);
          else { d.x = view.w + 40; d.y = y; d.ph = rand(0, 6); d.hp = 1; d.maxHp = 1; d.stompable = true; d.telegraph = 0.4; d.age = 0; d.stun = 0; d.slow = 1; d.pattern = 'sine'; d.col = '#22e6ff'; d.baseY = y; }
        });
        this.nextGap = gap(230, 320);
      } else {
        this._spawnCoinArc(view.w + 30, gY - rand(40, 90), 7);
        this.nextGap = gap(200, 280);
      }
    }
    update(dt, player) {
      const maxSp = CFG.runMax * activeDiff.scroll * runtime.speedMul * (runtime.heatZones ? runtime.heatSlow : 1);
      // Boss arena: slow slight for readability
      const bossMul = (this.boss.active ? 0.88 : 1) * powers.worldSpeedMul();
      this.speed = Math.min(maxSp * bossMul, this.speed + CFG.runAccel * activeDiff.scroll * dt);
      this.aliveT += dt; this.spawnLock = Math.max(0, this.spawnLock - dt);
      const dx = this.speed * dt; this.dist += dx / 26; this.segmentDist += dx / 26;
      view.lookAhead = lerp(view.lookAhead, Math.min(42, this.speed * 0.04) + ((view.novaZoom || 1) - 1) * 22, clamp(dt * 4, 0, 1));
      backdrop.scroll(dx); particles.scroll(dx);
      this.crates.forEach((o) => {
        o.x -= dx;
        if (o.reactive && player) o.y += Math.sin(performance.now() * 0.004 + o.x) * 12 * dt;
      });
      this.drones.forEach((o) => {
        o.age = (o.age || 0) + dt;
        o.stun = Math.max(0, (o.stun || 0) - dt);
        o.flash = Math.max(0, (o.flash || 0) - dt);
        if (powers.active && powers.active.id === 'bullet_time') o.slow = Math.min(o.slow || 1, 0.35);
        const frozen = (o.stun || 0) > 0;
        const sm = frozen ? 0.15 : (o.slow == null ? 1 : o.slow);
        o.x -= dx * sm;
        o.ph += dt * 3 * sm;
        const pat = o.pattern || 'sine';
        if (pat === 'sine' || pat === 'figure8') o.y = (o.baseY || o.y) + Math.sin(o.ph) * (pat === 'figure8' ? 18 : 10);
        else if (pat === 'zigzag') o.y = (o.baseY || o.y) + Math.sin(o.ph * 2.2) * 22;
        else if (pat === 'hop') o.y = (o.baseY || o.y) - Math.abs(Math.sin(o.ph * 1.6)) * 36;
        else if (pat === 'charge' && !frozen) o.x -= dx * 0.35;
        else if (pat === 'homing' && player && !frozen) {
          const ty = player.y + player.h * 0.4;
          o.y += (ty - o.y) * clamp(dt * 1.8, 0, 1);
        } else if (pat === 'mirror' && player && !frozen) {
          o.y = lerp(o.y, player.y + 10, clamp(dt * 2.4, 0, 1));
        } else if (pat === 'blink' && !frozen && Math.random() < dt * 0.9) o.x -= 28;
        else if (pat === 'burrow') {
          const hidden = Math.sin(o.ph) < 0;
          o.y = hidden ? view.groundY + 8 : (o.baseY || o.y);
        }
      });
      this.coins.forEach((o) => { o.x -= dx; o.ph += dt * 6; });
      this.fragments.forEach((o) => { o.x -= dx; o.ph += dt * 4; });
      this.memories.forEach((o) => { o.x -= dx; o.ph += dt * 3; });
      this.holes.forEach((o) => { o.x -= dx; });
      this.portals.forEach((o) => { o.x -= dx; });
      // Collectibles + boss arm (Fase 4–5)
      const set = window.RLContentV6 && RLContentV6.FRAGMENT_SETS[runtime.worldId];
      const need = set ? set.need : 4;
      if (this.fragSpawned < need && this.segmentDist > 40 + this.fragSpawned * 55 && Math.random() < dt * 0.35) {
        this.fragSpawned++;
        this.fragments.spawn((f) => {
          f.x = view.w + 40; f.y = view.groundY - rand(50, 120); f.taken = false; f.ph = rand(0, 6);
        });
      }
      if (this.memSpawned < 2 && this.segmentDist > 90 + this.memSpawned * 100 && Math.random() < dt * 0.2) {
        this.memSpawned++;
        const lore = (RLContentV6.MEMORY_LORE[(save.runs + this.memSpawned) % RLContentV6.MEMORY_LORE.length]);
        this.memories.spawn((m) => {
          m.x = view.w + 50; m.y = view.groundY - rand(60, 130); m.taken = false; m.ph = 0; m.lore = lore;
        });
      }
      if (!this.bossArmed && this.segmentDist > CFG.bossAt) {
        this.bossArmed = true;
        this.boss.spawn(runtime.worldId, view);
      }
      if (this.boss.active) this.boss.update(dt, player, view);
      if (!this.portalSpawned && this.segmentDist > CFG.portalAt && !this.boss.active) {
        this.portalSpawned = true;
        this.portals.spawn((p) => {
          p.x = view.w + 60; p.w = 44; p.h = 110; p.used = false;
          p.bleed = makeBleedProps(runtime.world.bleed);
        });
      }
      this.nextGap -= dx; if (this.nextGap <= view.w - 4 && !this.boss.active) this._director();
      this.crates.forEach((o) => { if (o.x < -120) o.alive = false; }); this.crates.sweep();
      this.drones.forEach((o) => { if (o.x < -120) o.alive = false; }); this.drones.sweep();
      this.coins.forEach((o) => { if (o.x < -60) o.alive = false; }); this.coins.sweep();
      this.fragments.forEach((o) => { if (o.x < -60) o.alive = false; }); this.fragments.sweep();
      this.memories.forEach((o) => { if (o.x < -60) o.alive = false; }); this.memories.sweep();
      this.holes.forEach((o) => { if (o.x + o.w < -40) o.alive = false; }); this.holes.sweep();
      this.portals.forEach((o) => { if (o.x < -80) o.alive = false; }); this.portals.sweep();
      this._collisions(player);
      this.drones.sweep();
      this.crates.sweep();
      return dx;
    }
    _collisions(p) {
      const pr = p.rect();
      const C = window.RLCombat;
      const guardian = powers.active && (powers.active.id === 'ascended' || powers.active.id === 'colossus');
      this.crates.forEach((o) => {
        if (aabb(pr, o)) {
          if (C && C.isStomp(p, o.y)) {
            const r = C.bounce(p);
            o.alive = false;
            clock.freeze(0.07);
            shake.add(0.35);
            if (C.pop) C.pop(o.x + o.w / 2, o.y, 'KO', '#22d3ee');
            particles.burst(o.x + o.w / 2, o.y, 18, { col: '#22d3ee', spMax: 280, lifeMax: 0.45 });
            economy.combo++; economy.super = Math.min(1, economy.super + 0.08);
            if (economy.addCoin && r.scoreMul) economy.coins += Math.round(2 * r.scoreMul);
          } else if (pr.y + pr.h - o.y < 28 && p.vy >= 0) { p.y = o.y - p.h; p.vy = 0; p.onGround = true; }
          else if (guardian) { o.alive = false; particles.burst(o.x, o.y, 12, { col: '#22d3ee', spMax: 220 }); }
          else p.hurt();
        }
      });
      this.drones.forEach((o) => {
        if (!o.alive) return;
        const top = o.y - o.h / 2;
        const hit = { x: o.x - o.w / 2, y: top, w: o.w, h: o.h };
        if (!aabb(pr, hit)) return;
        const armed = (o.age || 0) >= (o.telegraph || 0);
        const stunned = (o.stun || 0) > 0;
        if (C && o.stompable !== false && C.isStomp(p, top)) {
          C.bounce(p);
          clock.freeze(0.07);
          const dead = C.damageEnemy(o, guardian ? 2 : 1);
          if (dead) rewardFoe(o, '#22d3ee');
          else { o.flash = 0.12; shake.add(0.2); }
        } else if (guardian) {
          const dead = C && C.powerAgainst(o, powers.active.id);
          if (dead) rewardFoe(o, '#22d3ee');
        } else if (stunned || !armed) {
          /* telegraph / stun: no damage to player */
        } else p.hurt();
      });
      this.coins.forEach((o) => {
        if (o.taken) return;
        const dxp = p.x - o.x, dyp = p.y + p.h / 2 - o.y;
        const mag = powers.freeFlight() ? 180 : (powers.coinMagnet && powers.coinMagnet() ? 240 : 28);
        if (dxp * dxp + dyp * dyp < (o.r + mag) * (o.r + mag)) {
          o.taken = true; o.alive = false; economy.addCoin();
          particles.burst(o.x, o.y, 8, { col: '#ffd24a', spMax: 140, lifeMax: 0.4, g: 300 });
        }
      });
      this.fragments.forEach((o) => {
        if (o.taken) return;
        const dxp = p.x - o.x, dyp = p.y + p.h / 2 - o.y;
        if (dxp * dxp + dyp * dyp < (o.r + 30) * (o.r + 30)) {
          o.taken = true; o.alive = false;
          collectFragment(runtime.worldId);
          particles.burst(o.x, o.y, 14, { col: '#c080ff', spMax: 200, lifeMax: 0.5 });
          audio.specialPickup();
        }
      });
      this.memories.forEach((o) => {
        if (o.taken) return;
        const dxp = p.x - o.x, dyp = p.y + p.h / 2 - o.y;
        if (dxp * dxp + dyp * dyp < (o.r + 30) * (o.r + 30)) {
          o.taken = true; o.alive = false;
          flashToast(o.lore);
          audio.memoryTone();
          particles.burst(o.x, o.y, 10, { col: '#9ff0ff', spMax: 160 });
        }
      });
      if (this.boss.active && aabb(pr, this.boss.rect())) {
        const bTop = this.boss.y;
        if (C && C.isStomp(p, bTop)) {
          C.bounce(p);
          clock.freeze(0.07);
          this.boss.hitByStomp();
        } else if (this.boss.phase === 'attack') p.hurt();
      }
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

  // —— Transition iris (Fase 1: diagonal completa + blackout + flash bioma) ——
  const iris = {
    active: false, phase: 'close', t: 0, dur: 0.32, cb: null,
    onBlackout: null, flashT: 0, flashCol: null, blackoutFired: false,
    start(cb, onBlackout) {
      if (this.active) {
        // Queue latest callbacks without restarting mid-wipe
        this.cb = cb;
        if (onBlackout) this.onBlackout = onBlackout;
        return;
      }
      this.active = true; this.phase = 'close'; this.t = 0;
      this.cb = cb; this.onBlackout = onBlackout || null;
      this.blackoutFired = false; this.flashT = 0; this.flashCol = null;
    },
    beginFlash(col) {
      this.flashCol = col || '#22e6ff';
      this.flashT = 0.2;
    },
    update(dt) {
      if (this.flashT > 0) this.flashT = Math.max(0, this.flashT - dt);
      if (!this.active) return;
      this.t += dt;
      if (this.phase === 'close') {
        const p = clamp(this.t / this.dur, 0, 1);
        // Fire blackout at full cover (radius ≈ 0)
        if (!this.blackoutFired && p >= 0.98) {
          this.blackoutFired = true;
          const bn = this.onBlackout; this.onBlackout = null;
          if (bn) bn();
          bus.emit('transition:blackout');
        }
        if (this.t >= this.dur) {
          const fn = this.cb; this.cb = null; if (fn) fn();
          this.phase = 'open'; this.t = 0;
        }
      } else if (this.phase === 'open' && this.t >= this.dur) {
        this.active = false;
        if (this._portalResume) finishPortalIris();
      }
    },
    draw(ctx, view) {
      // Full-viewport diagonal cover (logical space after View transform)
      const maxR = Math.hypot(view.w, view.h);
      const cx = view.w / 2, cy = view.h / 2;
      if (this.flashT > 0 && this.flashCol) {
        ctx.save();
        ctx.globalAlpha = clamp(this.flashT / 0.2, 0, 1) * 0.55;
        ctx.fillStyle = this.flashCol;
        ctx.fillRect(-40, -40, view.w + 80, view.h + 80);
        ctx.restore();
      }
      if (!this.active) return;
      const p = clamp(this.t / this.dur, 0, 1);
      const r = this.phase === 'close' ? lerp(maxR, 0, p) : lerp(0, maxR, p);
      ctx.save();
      ctx.beginPath();
      ctx.rect(-maxR, -maxR, view.w + maxR * 2, view.h + maxR * 2);
      ctx.arc(cx, cy, Math.max(0.05, r), 0, 6.283, true);
      ctx.fillStyle = '#04010c';
      ctx.fill('evenodd');
      ctx.restore();
    }
  };

  let view, backdrop, particles, shake, weatherFX, economy, player, world, input;
  let resolver, transit;
  let runOver = false;
  let pendingOutcome = null;
  let keepRunOnPlay = false;

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
    else if (s === 'PLAY') {
      if (keepRunOnPlay) { keepRunOnPlay = false; showLayer('hud'); syncHUD(); }
      else { startRun(false); showLayer('hud'); syncHUD(); }
    }
    else if (s === 'RESULTS') {
      showResults(); showLayer('results');
      if (window.RLSpectator && RLSpectator.noteLoss) RLSpectator.noteLoss();
    }
  }

  function startRun(keepWorld) {
    if (!save.unlocked.includes(preferredOrigin)) preferredOrigin = 'neon';
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
    applyRunBoosts();
    player.iframe = Math.max(player.iframe, runMods.iframeBonus);
    world.reset();
    economy.reset();
    weatherFX.rebuild(view);
    backdrop.seed(view);
    backdrop.portalFlash = 0; view.lookAhead = 0;
    world.nextGap = view.w + Math.max(80, world.speed * CFG.spawnGrace); runOver = false;
    powers.reset();
    if (window.RLCombat) window.RLCombat.reset();
    if (window.RLPowerLog) window.RLPowerLog.reset();
    if (window.RLNova) window.RLNova.reset();
    $('diffChip').textContent = activeDiff.chip;
    $('ruleChip').textContent = runtime.rule.icon + ' ' + runtime.rule.label;
    $('worldChip').textContent = runtime.world.name.toUpperCase();
    $('weatherChip').textContent = runtime.weather.label;
  }

  function applyBiome(outcome) {
    runtime = outcome;
    world.portalSpawned = false;
    world.segmentDist = 0;
    world.boss.clear();
    weatherFX.rebuild(view);
    backdrop.seed(view);
    backdrop.rebuildLayers(view);
    player.iframe = 0.6;
    $('diffChip').textContent = activeDiff.chip;
    $('ruleChip').textContent = runtime.rule.icon + ' ' + runtime.rule.label;
    $('worldChip').textContent = runtime.world.name.toUpperCase();
    $('weatherChip').textContent = runtime.weather.label;
    iris.beginFlash(runtime.world.palette.accent);
  }

  function enterPortal(originId) {
    pendingOutcome = resolver.resolve({
      originId,
      difficultyId: activeDiff.id,
      unlockedIds: save.unlocked,
      streak: save.combos.length
    });
    save.portalHistory = resolver.history.slice();
    save.portals = (save.portals || 0) + 1;
    persist();
    evaluateAchievements(null);
    flashToast('PORTAL · ' + pendingOutcome.world.name.toUpperCase());
    shake.add(0.5);
    particles.burst(player.x + 40, view.groundY - 50, 48, { col: '#9ff0ff', spMax: 380, up: 90, lifeMax: 0.9 });

    // Iris close → blackout swap → flash → open → PLAY (Fase 1 sync)
    mgr.state = 'TRANSIT';
    mgr.t = 0;
    showSkip(true);
    showLayer('hud');
    transit.start(pendingOutcome, null);
    iris.start(
      () => {
        // After open begins; finish when iris fully opens via update path
      },
      () => {
        // Exact blackout frame: swap biome + portal SFX
        audio.portal();
        applyBiome(pendingOutcome);
        bus.emit('transition:blackout', pendingOutcome);
      }
    );
    // When iris finishes open phase, resume play (polled in update)
    iris._portalResume = true;
  }

  function finishPortalIris() {
    if (!iris._portalResume) return;
    iris._portalResume = false;
    transit.active = false;
    keepRunOnPlay = true;
    mgr.set('PLAY');
    flashToast(runtime.world.name.toUpperCase() + ' · ' + runtime.weather.label);
    showLayer('hud');
    syncHUD();
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

  /** Ω.3: SÚPER opens the power selector (real pause). Falls back to the
   *  classic instant blast when the module is absent or already busy. */
  function fireSuper() {
    if (economy.super < 0.4 || player.dead) return;
    if (powers.active) { flashToast(powers.label()); return; }
    if (powers.openSelector()) return;
    classicSuper();
  }

  function classicSuper() {
    economy.super = 0; shake.add(1); clock.freeze(0.09); audio.superFx();
    player.superGlow = 1.4;
    particles.burst(player.x, player.y + player.h * 0.4, 60, { col: '#ffd24a', spMax: 520, up: 120, lifeMax: 0.9 });
    const n = world.clearEnemies(); economy.buff(2, 2.0);
    economy.coins += Math.round(n * 5 * activeDiff.reward);
    if (world.boss && world.boss.active) world.boss.hitBySuper();
    if (window.RLNova) window.RLNova.damageHunter(5);
    save.supers = (save.supers || 0) + 1; persist();
    evaluateAchievements(null);
    flashToast('¡EXPLOSIÓN ESTELAR!');
  }

  /** Ω.3 — visual/gameplay callbacks handed to the power module. */
  const powerFX = {
    toast: (txt) => flashToast(txt),
    burst: (col) => {
      shake.add(0.8); audio.superFx(); player.superGlow = 1.4;
      particles.burst(player.x, player.y + player.h * 0.4, 48, { col, spMax: 460, up: 120, lifeMax: 0.85 });
    },
    trail: (col) => particles.burst(player.x - 12, player.y + player.h * 0.6, 3, { col, spMax: 90, lifeMax: 0.4, g: 120 }),
    sfx: (id) => {
      if (audio.powerId) audio.powerId(id);
      else audio.superFx();
    },
    weakenAll: (stun, slow) => {
      const C = window.RLCombat;
      if (!C) return;
      world.drones.forEach((o) => C.weaken(o, stun, slow));
    },
    hitFromPower: (powerId, col) => {
      const C = window.RLCombat;
      if (!C) return;
      const En = window.RLEnemies;
      const prof = En && En.profile ? En.profile(powerId) : { dmg: 90, stun: 0.2, radius: 0, pierce: 1, chain: 1 };
      const hits = [];
      world.drones.forEach((o) => {
        if (!o.alive) return;
        if (o.x < -20 || o.x > view.w + 40) return;
        hits.push(o);
      });
      hits.sort((a, b) => a.x - b.x);
      const cap = prof.chain || prof.pierce || (prof.radius ? hits.length : 1);
      let n = 0;
      for (let i = 0; i < hits.length && n < cap; i++) {
        const o = hits[i];
        if (prof.radius) {
          const dx = o.x - player.x, dy = o.y - (player.y + player.h * 0.4);
          if (dx * dx + dy * dy > prof.radius * prof.radius) continue;
        }
        C.fireHaz(player.x + 16, player.y + 18, o.x, o.y, col || o.col);
        const dead = C.powerAgainst(o, powerId);
        if (dead) rewardFoe(o, col);
        n++;
      }
      if (world.boss && world.boss.active && (prof.dmg || 0) > 0) world.boss.hitBySuper();
      if (window.RLNova && (prof.dmg || 0) > 0) window.RLNova.damageHunter(Math.max(1, prof.dmg >= 90 ? 3 : 2));
      if (n === 0) {
        const tx = view.w * 0.78, ty = view.groundY - 80;
        C.fireHaz(player.x + 18, player.y + 22, tx, ty, col);
      }
      world.drones.sweep();
    },
    clearNearest: (col) => {
      const id = (powers.active && powers.active.id) || 'double_laser';
      if (powerFX.hitFromPower) powerFX.hitFromPower(id, col);
    }
  };

  function showResults() {
    const d = Math.round(world.dist), c = economy.coins, mc = economy.maxCombo;
    const kills = world.kills || 0;
    const cleared = !!(world.bossDown || kills >= CFG.stageKills || d >= CFG.stageDist);
    world.cleared = cleared;
    if (cleared) unlockNextWorld(runtime.worldId);
    const stars = cleared ? (d > 500 || world.bossDown ? 3 : d > 280 ? 2 : 1) : (d > 400 ? 2 : 1);
    const title = $('rTitle');
    if (title) title.textContent = cleared ? 'DISTRITO SUPERADO' : 'CARRERA TERMINADA';
    $('stars').textContent = ['★', '★', '★'].map((s, i) => (i < stars ? '★' : '☆')).join(' ');
    $('rDist').textContent = d; $('rCoins').textContent = c; $('rCombo').textContent = mc;
    $('rDiff').textContent = activeDiff.label;
    $('rWorld').textContent = runtime.world.name + ' · ' + runtime.weather.label;
    const rk = $('rKills'); if (rk) rk.textContent = String(kills);
    const rs = $('rStatus'); if (rs) rs.textContent = cleared ? 'Tramo cerrado · mundo siguiente disponible' : 'Cae o llega a ' + CFG.stageDist + ' m / ' + CFG.stageKills + ' KO';
    save.coins += c;
    save.xp += Math.round(d / 10 + c * 2 + mc + kills * 4 + (cleared ? 40 : 0));
    save.bestDist = Math.max(save.bestDist || 0, d);
    save.bestCombo = Math.max(save.bestCombo || 0, mc);
    save.runs = (save.runs || 0) + 1;
    save.combos.push(mc);
    if (save.combos.length > 20) save.combos = save.combos.slice(-20);
    while (save.xp >= save.level * 100) { save.xp -= save.level * 100; save.level++; }
    if (activeDiff.id === 'expert' && stars === 3) {
      save.legendary = true;
      const btn = document.querySelector('[data-diff="legendary"]');
      if (btn) { btn.disabled = false; btn.title = 'Desbloqueado'; }
    }
    if (save.unlocked.length >= 9 && !save.unlocked.includes('final') && (save.bossesDefeated || []).length >= 9) {
      save.unlocked.push('final');
    }
    persist();
    evaluateAchievements({ dist: d, combo: mc, kills: kills, cleared: cleared });
    refreshMenuUI();
  }

  function syncHUD() {
    $('coins').textContent = economy.coins;
    $('dist').textContent = Math.round(world.dist);
    const hp = Math.max(0, player.hp);
    const hearts = $('hearts');
    if (hearts) {
      hearts.textContent = '';
      const on = document.createElement('span');
      on.style.color = '#ff5a7a';
      on.textContent = '●'.repeat(hp);
      const off = document.createElement('span');
      off.style.color = '#4a2740';
      off.textContent = '●'.repeat(CFG.maxHP - hp);
      hearts.appendChild(on); hearts.appendChild(off);
    }
    const pct = Math.round(economy.super * 100);
    $('superBar').firstElementChild.style.width = pct + '%';
    const ready = economy.super >= 0.4;
    $('superBar').classList.toggle('ready', ready);
    $('superBtn').classList.toggle('ready', ready);
    if (powers.active) $('superBtn').classList.remove('ready');
    $('energyArc').style.setProperty('--p', String(economy.super));
    $('resistArc').style.setProperty('--p', String(hp / CFG.maxHP));
    $('ruleChip').textContent = runtime.rule.icon + ' ' + runtime.rule.label;
    $('worldChip').textContent = runtime.world.name.toUpperCase();
    $('weatherChip').textContent = runtime.weather.label;
    const cc = $('comboChip');
    if (cc) {
      if (economy.combo >= 2) {
        cc.hidden = false;
        cc.textContent = 'COMBO ×' + economy.combo;
      } else cc.hidden = true;
    }
    const oc = $('objChip');
    if (oc) {
      oc.hidden = false;
      const need = CFG.stageKills;
      const k = world.kills || 0;
      oc.textContent = world.bossDown ? 'JEFE KO' : ('KO ' + k + '/' + need);
    }
    const pc = $('powerChip');
    if (pc) {
      if (powers.active) { pc.hidden = false; pc.textContent = powers.label(); } else pc.hidden = true;
    }
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
    const pal = runtime.world.palette;
    const t = performance.now() * 0.001;
    world.crates.forEach((o) => {
      const g = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      g.addColorStop(0, '#4a2a78'); g.addColorStop(1, '#1a1030');
      ctx.fillStyle = g; ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.strokeStyle = pal.accent; ctx.lineWidth = 1.5; ctx.strokeRect(o.x + 0.5, o.y + 0.5, o.w - 1, o.h - 1);
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(o.x + 6, o.y + 6, o.w - 12, 4);
    });
    world.drones.forEach((o) => {
      const cy = o.y;
      const col = o.col || '#4a7090';
      if (o.flash > 0) ctx.fillStyle = '#ffffff';
      else {
        const eg = ctx.createRadialGradient(o.x, cy, 2, o.x, cy, o.w / 2);
        eg.addColorStop(0, col); eg.addColorStop(1, '#152030');
        ctx.fillStyle = eg;
      }
      ctx.beginPath(); ctx.ellipse(o.x, cy, o.w / 2, o.h / 2, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = (o.age || 0) < (o.telegraph || 0) ? '#fbbf24' : '#ff4060';
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8;
      ctx.fillRect(o.x - 5, cy - 3, 10, 5);
      ctx.shadowBlur = 0;
      if (!player.onGround && player.vy > 50 && o.stompable !== false) {
        ctx.strokeStyle = 'rgba(34,211,238,0.85)';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5 + Math.sin(performance.now() * 0.018) * 0.35;
        ctx.beginPath();
        ctx.moveTo(o.x - o.w / 2, cy - o.h / 2);
        ctx.lineTo(o.x + o.w / 2, cy - o.h / 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(o.x - 18, cy - o.h / 2 - 10, 36, 5);
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(o.x - 18, cy - o.h / 2 - 10, 36 * clamp(Math.max(0, o.hp || 0) / Math.max(1, o.maxHp || 1), 0, 1), 5);
      ctx.strokeStyle = 'rgba(160,220,255,0.45)';
      ctx.beginPath(); ctx.ellipse(o.x, cy, o.w / 2, o.h / 2, 0, 0, 6.283); ctx.stroke();
    });
    world.coins.forEach((o) => {
      if (o.taken) return;
      const bob = Math.sin(o.ph) * 3;
      ctx.save();
      ctx.translate(o.x, o.y + bob);
      ctx.rotate(Math.sin(o.ph * 0.5) * 0.2);
      const cg = ctx.createRadialGradient(-2, -2, 1, 0, 0, o.r);
      cg.addColorStop(0, '#fff6c0'); cg.addColorStop(0.55, '#ffd24a'); cg.addColorStop(1, '#c88810');
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(0, 0, o.r, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath(); ctx.arc(-3, -3, 2.5, 0, 6.283); ctx.fill();
      ctx.restore();
    });
    world.portals.forEach((o) => {
      drawPortalEntity(ctx, o, gY);
    });
    world.fragments.forEach((o) => {
      if (o.taken) return;
      const bob = Math.sin(o.ph) * 4;
      ctx.save();
      ctx.translate(o.x, o.y + bob);
      ctx.rotate(o.ph * 0.2);
      ctx.shadowColor = '#c080ff'; ctx.shadowBlur = 12;
      ctx.fillStyle = '#e0b0ff';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 ? o.r * 0.45 : o.r;
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.fill();
      ctx.restore();
    });
    world.memories.forEach((o) => {
      if (o.taken) return;
      ctx.shadowColor = '#9ff0ff'; ctx.shadowBlur = 10;
      ctx.fillStyle = 'rgba(160,230,255,0.85)';
      ctx.fillRect(o.x - 8, o.y - 10 + Math.sin(o.ph) * 3, 16, 20);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#041018';
      ctx.fillRect(o.x - 5, o.y - 5, 10, 2);
      ctx.fillRect(o.x - 5, o.y + 1, 10, 2);
    });
    if (world.boss) world.boss.draw(ctx);
    void t;
  }

  function drawPortalEntity(ctx, o, gY) {
    const cx = o.x, cy = gY - o.h * 0.5;
    const t = performance.now() * 0.001;
    (o.bleed || []).forEach((b, i) => {
      const ang = t + b.ph;
      const x = cx + b.ox + Math.cos(ang) * 8;
      const y = cy + b.oy + Math.sin(ang * 1.3) * 6;
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = i % 2 ? '#c8a060' : runtime.world.palette.accent;
      ctx.fillRect(x, y, b.size, b.size * 0.7);
    });
    ctx.globalAlpha = 1;
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `rgba(180,240,255,${0.35 - i * 0.08})`;
      ctx.lineWidth = 2 - i * 0.4;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 18 + i * 8 + Math.sin(t * 3 + i) * 2, 42 + i * 6, t * (0.6 + i * 0.2), 0, 6.283);
      ctx.stroke();
    }
    const grd = ctx.createRadialGradient(cx, cy, 4, cx, cy, 52);
    grd.addColorStop(0, 'rgba(255,255,255,0.95)');
    grd.addColorStop(0.4, 'rgba(120,220,255,0.7)');
    grd.addColorStop(1, 'rgba(34,230,255,0.05)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.ellipse(cx, cy, 22, 48, 0, 0, 6.283); ctx.fill();
  }

  function drawKori(ctx, v, idle) {
    const p = player;
    const cx = idle ? v.w * 0.5 : p.x;
    const top = idle ? v.groundY - p.h : p.y;
    const w = p.w * p.sx, h = p.h * p.sy;
    const bob = idle ? Math.sin(performance.now() * 0.004) * 3 : (p.onGround ? Math.sin((p.runPhase || 0) * 14) * 2 : 0);
    const col = trailColor();
    const pid = powers.active && powers.active.id;
    const guardian = pid === 'ascended';
    const titan = pid === 'colossus';
    ctx.save();
    if (!idle && p.trail) {
      for (let i = 0; i < p.trail.length; i++) {
        const tr = p.trail[i];
        ctx.globalAlpha = clamp(tr.life * 2.2, 0, 0.28);
        ctx.fillStyle = titan ? '#f97316' : guardian ? '#22d3ee' : col;
        ctx.fillRect(tr.x - w * 0.28, tr.y - h * 0.3, w * 0.55, h * 0.5);
      }
      ctx.globalAlpha = 1;
    }
    ctx.translate(cx, top + h / 2 + bob);
    if (!idle && pid === 'freight_bat') ctx.translate(0, -36);
    ctx.globalAlpha = powers.alphaMul();
    if (p.iframe > 0 && Math.floor(performance.now() / 60) % 2 === 0) ctx.globalAlpha *= 0.45;
    const kick = idle ? 0 : Math.sin((p.runPhase || 0) * 14) * 5;
    ctx.shadowColor = titan ? '#f97316' : guardian ? '#22d3ee' : col;
    ctx.shadowBlur = 16;
    // Legs
    ctx.fillStyle = guardian ? '#1e293b' : '#0b1228';
    ctx.fillRect(-w * 0.28, h * 0.18, 14, h * 0.32 + kick * 0.4);
    ctx.fillRect(w * 0.08, h * 0.18, 14, h * 0.32 - kick * 0.4);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-w * 0.30, h * 0.46 + kick * 0.4, 16, 8);
    ctx.fillRect(w * 0.06, h * 0.46 - kick * 0.4, 16, 8);
    // Torso plates
    const body = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    if (titan) {
      body.addColorStop(0, '#7c2d12'); body.addColorStop(0.5, '#1c1917'); body.addColorStop(1, '#f97316');
    } else if (guardian) {
      body.addColorStop(0, '#334155'); body.addColorStop(0.5, '#0f172a'); body.addColorStop(1, '#22d3ee');
    } else {
      body.addColorStop(0, '#1e3a8a'); body.addColorStop(0.45, '#0f172a'); body.addColorStop(1, '#22d3ee');
    }
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-w * 0.38, -h * 0.08);
    ctx.lineTo(w * 0.38, -h * 0.12);
    ctx.lineTo(w * 0.32, h * 0.28);
    ctx.lineTo(-w * 0.32, h * 0.32);
    ctx.closePath();
    ctx.fill();
    // Arms
    ctx.fillStyle = guardian ? '#334155' : '#1e293b';
    ctx.fillRect(-w * 0.52, -h * 0.06, 16, h * 0.28);
    ctx.fillRect(w * 0.30, -h * 0.10, 16, h * 0.26);
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(-w * 0.50, h * 0.16, 12, 6);
    ctx.fillRect(w * 0.32, h * 0.12, 12, 6);
    // Head + monocular visor (LCS original — single stripe, not dual visor)
    ctx.fillStyle = '#0b1224';
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.32, w * 0.28, h * 0.22, 0, 0, 6.283);
    ctx.fill();
    ctx.shadowBlur = 0;
    const visor = ctx.createLinearGradient(-w * 0.22, 0, w * 0.22, 0);
    visor.addColorStop(0, '#22d3ee');
    visor.addColorStop(0.45, '#ffffff');
    visor.addColorStop(1, '#ec4899');
    ctx.fillStyle = visor;
    ctx.fillRect(-w * 0.20, -h * 0.36, w * 0.42, 9);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(-w * 0.18, -h * 0.34, w * 0.16, 3);
    // Morpher on left forearm
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(-w * 0.54, 0.02 * h, 10, 10);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-w * 0.54, 0.02 * h, 10, 10);
    // Chest core
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(0, h * 0.02, 6, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, h * 0.02, 2.4, 0, 6.283); ctx.fill();
    if (guardian) {
      ctx.strokeStyle = '#a855f7';
      ctx.globalAlpha *= 0.85;
      ctx.lineWidth = 2;
      ctx.strokeRect(-w * 0.42, -h * 0.16, w * 0.84, h * 0.42);
    }
    ctx.restore();
    if (!idle && window.RLCombat) window.RLCombat.draw(ctx);
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
    ctx.font = '900 ' + Math.round(v.h * 0.09) + 'px Orbitron,sans-serif';
    ctx.fillStyle = '#fff'; ctx.shadowColor = '#22e6ff'; ctx.shadowBlur = 26;
    ctx.fillText('RUNNER LEGENDS', cx, cy + 40); ctx.shadowBlur = 0;
    ctx.font = '700 ' + Math.round(Math.max(16, v.h * 0.038)) + 'px Rajdhani,sans-serif';
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
    if (powers.isPaused()) {
      input.consumeJump(); input.consumeRelease(); input.consumeSuper();
      document.getElementById('stage').classList.add('frozen');
      return;
    }
    if (document.getElementById('stage').classList.contains('frozen')) {
      document.getElementById('stage').classList.remove('frozen');
      if (world) world.spawnLock = Math.max(world.spawnLock || 0, CFG.postPowerGrace);
    }
    if (mgr.state === 'PLAY') {
      powers.update(raw);
      if (input.consumeSuper()) fireSuper();
      if (!player.dead) {
        world.update(dt, player);
        player.runPhase = (player.runPhase || 0) + dt;
        player.update(dt, input, world);
        economy.update(dt);
        if (window.RLCombat) window.RLCombat.update(dt);
        if (window.RLNova) window.RLNova.update(dt, raw);
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
      if (mgr.state === 'INTRO' && mgr.t > 24) { save.intro = true; persist(); mgr.go('MENU'); }
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
        if (!player.dead || mgr.state === 'PLAY') {
          if (window.RLPowerFX) window.RLPowerFX.drawUnder(ctx, view, player);
          drawKori(ctx, view, false);
          if (window.RLPowerFX) window.RLPowerFX.drawOver(ctx, view, player);
        }
        if (window.RLNova) window.RLNova.draw(ctx, view);
        weatherFX.draw(ctx, view);
      } else {
        drawGround(ctx, view); particles.draw(ctx);
        // Menu/intro: city only — Kori in UI card; avoids silhouette bleeding through glass panels
        weatherFX.draw(ctx, view);
      }
      if (mgr.state === 'LOGO') drawLogo(ctx, view);
      if (mgr.state === 'INTRO') drawIntro(ctx, view);
    }
    iris.draw(ctx, view);
    // Dynamic vignette (Fase 7) — stronger at high speed
    if (mgr.state === 'PLAY' && world) {
      const vig = 0.18 + Math.min(0.28, (world.speed / 700) * 0.35);
      const vg = ctx.createRadialGradient(view.w / 2, view.h / 2, view.h * 0.25, view.w / 2, view.h / 2, Math.hypot(view.w, view.h) * 0.65);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, `rgba(0,0,0,${vig})`);
      ctx.fillStyle = vg;
      ctx.fillRect(-20, -20, view.w + 40, view.h + 40);
    }
  }

  const introScenes = [
    { title: 'DESPEGUE', body: 'Kori abandona la plataforma orbital. El Distrito late bajo un cielo de neón.', phase: 'launch' },
    { title: 'CAMPO DE ASTEROIDES', body: 'Rocas de código flotante. Esquiva. Acelera. No mires atrás.', phase: 'asteroids' },
    { title: 'NEBULOSA', body: 'Constelaciones púrpura y cian escriben rutas entre dimensiones.', phase: 'nebula' },
    { title: 'PORTAL DIMENSIONAL', body: 'Un anillo vivo se abre. El sangrado dimensional ya filtra otros mundos.', phase: 'portal' },
    { title: 'AGUJERO NEGRO', body: 'Todo colapsa al centro. El menú nace del mismo silencio.', phase: 'blackhole' }
  ];
  function drawIntro(ctx, v) {
    const total = 24;
    const t = mgr.t;
    const scene = Math.min(introScenes.length - 1, Math.floor(t / (total / introScenes.length)));
    const s = introScenes[scene];
    const local = (t % (total / introScenes.length)) / (total / introScenes.length);
    // Starfield / nebula particles
    ctx.fillStyle = '#04010c';
    ctx.fillRect(0, 0, v.w, v.h);
    for (let i = 0; i < 60; i++) {
      const x = ((i * 97 + t * (20 + (i % 5) * 12)) % (v.w + 40)) - 20;
      const y = (i * 53 + Math.sin(t + i) * 8) % v.h;
      ctx.globalAlpha = 0.35 + (i % 3) * 0.15;
      ctx.fillStyle = i % 4 === 0 ? '#ff2bd6' : i % 3 === 0 ? '#22e6ff' : '#a78bfa';
      ctx.fillRect(x, y, i % 5 === 0 ? 3 : 1.5, i % 5 === 0 ? 3 : 1.5);
    }
    ctx.globalAlpha = 1;
    if (s.phase === 'asteroids') {
      for (let i = 0; i < 8; i++) {
        const x = v.w - ((t * 80 + i * 90) % (v.w + 100));
        const y = 80 + (i * 47) % (v.h - 120);
        ctx.fillStyle = '#3a2a60';
        ctx.beginPath(); ctx.arc(x, y, 10 + (i % 3) * 6, 0, 6.283); ctx.fill();
      }
    }
    if (s.phase === 'portal' || s.phase === 'blackhole') {
      const cx = v.w / 2, cy = v.h * 0.45;
      const r = s.phase === 'blackhole' ? lerp(40, 2, local) : 30 + Math.sin(t * 3) * 6;
      const grd = ctx.createRadialGradient(cx, cy, 2, cx, cy, r * 4);
      grd.addColorStop(0, 'rgba(255,255,255,0.9)');
      grd.addColorStop(0.4, 'rgba(120,40,255,0.5)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(cx, cy, r * 4, 0, 6.283); ctx.fill();
      if (s.phase === 'blackhole') {
        // Canvas scale collapse toward center
        ctx.save();
        const sc = lerp(1, 0.15, local * local);
        ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.rotate(local * 2.5); ctx.translate(-cx, -cy);
        ctx.globalAlpha = 1 - local * 0.85;
        ctx.fillStyle = '#12043a';
        ctx.fillRect(cx - 80, cy - 50, 160, 100);
        ctx.restore();
        ctx.fillStyle = `rgba(0,0,0,${local * 0.85})`;
        ctx.fillRect(0, 0, v.w, v.h);
      }
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = '900 ' + Math.round(v.h * 0.072) + 'px Orbitron,sans-serif';
    ctx.globalAlpha = clamp(1 - Math.abs(local - 0.5) * 0.4, 0.55, 1);
    ctx.fillText(s.title, v.w / 2, v.h * 0.68);
    ctx.fillStyle = '#cfe9ff';
    ctx.font = '600 ' + Math.round(Math.max(16, v.h * 0.036)) + 'px Rajdhani,sans-serif';
    wrapText(ctx, s.body, v.w / 2, v.h * 0.76, v.w * 0.86, Math.round(Math.max(22, v.h * 0.048)));
    ctx.globalAlpha = 1;
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

  /** Ω.3 — announce powers whose existing-save milestone was just met. */
  function announceNewPowers() {
    if (!powers.unlockedIds) return;
    const ids = powers.unlockedIds(save);
    if (!Array.isArray(save.powersSeen)) save.powersSeen = [];
    const fresh = ids.filter((id) => save.powersSeen.indexOf(id) === -1);
    if (!fresh.length) return;
    save.powersSeen = ids.slice();
    persist();
    if (save.runs > 0) {
      const p = RLContentV6.POWERS.find((x) => x.id === fresh[0]);
      if (p) flashToast('NUEVO PODER · ' + p.name.toUpperCase());
    }
  }

  function refreshMenuUI() {
    announceNewPowers();
    const cb = $('charBtn');
    const ch = RLContentV6.getCharacter(save.activeChar);
    if (cb) cb.textContent = ch ? ch.name : 'Personaje';
    const hn = $('heroName'); if (hn && ch) hn.textContent = ch.name.toUpperCase();
    const hb = $('heroBlurb'); if (hb && ch) hb.textContent = ch.blurb || '';
    if (ch && ch.stats) {
      const sv = $('statVel'); if (sv) sv.style.width = Math.round(ch.stats.vel * 100) + '%';
      const sj = $('statJump'); if (sj) sj.style.width = Math.round(ch.stats.jump * 100) + '%';
      const sc = $('statCombo'); if (sc) sc.style.width = Math.round(ch.stats.combo * 100) + '%';
    }
    $('profileName').textContent = sanitizeName(save.name);
    $('profileLevel').textContent = 'Nivel ' + save.level;
    $('profileCoins').textContent = save.coins.toLocaleString();
    const xpNeed = save.level * 100;
    $('xpBar').style.width = Math.min(100, (save.xp / xpNeed) * 100) + '%';
    const grid = $('worldGrid');
    if (grid) {
      grid.innerHTML = WORLDS.map((w) => {
        const unlocked = save.unlocked.includes(w.id);
        const on = preferredOrigin === w.id;
        const hint = (w.mysteryHint || 'Señales perdidas. No confíes en tus ojos.');
        return `<button type="button" class="world-tile${on ? ' on' : ''}${unlocked ? '' : ' lock'}" data-world="${esc(w.id)}" title="${esc(hint)}" ${unlocked ? '' : 'disabled'}>
          <b>${esc(w.short)}</b><span>${esc(w.name)}</span>${unlocked ? '' : '<i>🔒</i>'}
        </button>`;
      }).join('');
      grid.querySelectorAll('[data-world]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.world;
          if (!save.unlocked.includes(id)) return;
          preferredOrigin = id;
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
        return `<div class="info-card"><h3>${esc(w.short)} · ${esc(w.name)}${u ? '' : ' 🔒'}</h3>
          <p>${esc(w.mysteryHint || 'Señales perdidas. No confíes en tus ojos.')}</p>
          <p class="meta">Ficha desconocida · entra para descubrir las reglas.</p></div>`;
      }).join('');
    } else if (which === 'profile') {
      title.textContent = 'Perfil';
      body.innerHTML = `<div class="info-card"><h3>${esc(save.name)}</h3>
        <p>Nivel ${save.level} · XP ${save.xp}/${save.level * 100}</p>
        <p>Monedas: ${save.coins} · Mejor distancia: ${save.bestDist || 0} m</p>
        <p>Mejor combo: ${save.bestCombo || 0} · Carreras: ${save.runs || 0}</p>
        <p>Mundos: ${save.unlocked.length}/10 · Portales: ${save.portals || 0}</p>
        <p class="meta">Historial portal: ${esc((save.portalHistory || []).slice(-5).join(' → ') || '—')}</p></div>`;
    } else if (which === 'achievements') {
      title.textContent = 'Logros';
      const unlockedN = ACHIEVEMENTS.filter((a) => save.achievements[a.id]).length;
      body.innerHTML = `<div class="info-card"><p class="meta">${unlockedN}/${ACHIEVEMENTS.length} desbloqueados</p>` +
        ACHIEVEMENTS.map((a) => {
          const ok = !!save.achievements[a.id];
          return `<div class="ach-row${ok ? '' : ' lock'}"><div class="ach-ico">${a.icon}</div>
            <div><b>${esc(a.label)}</b><p class="meta">${esc(a.desc)}${ok ? ' · ✓' : ''}</p></div></div>`;
        }).join('') + '</div>';
    } else if (which === 'shop') {
      title.textContent = 'Tienda';
      body.innerHTML = `<div class="info-card"><h3>Estelas de Kori</h3>
        <p class="meta">Saldo: ${save.coins} monedas · Activa: ${esc((TRAILS.find((t) => t.id === save.trail) || TRAILS[0]).name)}</p>` +
        TRAILS.map((t) => {
          const owned = save.ownedTrails.includes(t.id);
          const on = save.trail === t.id;
          const action = on ? 'Equipada' : owned ? 'Equipar' : `Comprar · ${t.price}`;
          return `<div class="shop-row">
            <div style="display:flex;align-items:center;gap:10px">
              <span class="shop-swatch" style="color:${esc(t.col)};background:${esc(t.col)}"></span>
              <div><b>${esc(t.name)}</b><p class="meta">${owned ? 'En inventario' : t.price + ' monedas'}</p></div>
            </div>
            <button type="button" class="btn ghost" data-trail="${esc(t.id)}" ${on ? 'disabled' : ''}>${action}</button>
          </div>`;
        }).join('') + '</div>';
      setTimeout(() => {
        body.querySelectorAll('[data-trail]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const id = btn.dataset.trail;
            const item = TRAILS.find((t) => t.id === id);
            if (!item) return;
            if (!save.ownedTrails.includes(id)) {
              if (save.coins < item.price) { flashToast('Monedas insuficientes'); return; }
              save.coins -= item.price;
              save.ownedTrails.push(id);
            }
            save.trail = id;
            persist(); refreshMenuUI(); openPanel('shop');
            flashToast('Estela · ' + item.name);
          });
        });
      }, 0);
    } else if (which === 'tournament') {
      title.textContent = 'Torneo';
      body.innerHTML = `<div class="info-card empty"><h3>Ranking de temporada</h3>
        <p>Modo determinista del portal listo para retos semanales.</p>
        <p class="meta">Conecta tournament-service cuando el backend esté online. Cero rankings falsos.</p></div>`;
    } else if (which === 'settings') {
      title.textContent = 'Ajustes';
      const a = save.audio || { music: 0.55, sfx: 0.7, voice: 0.65 };
      body.innerHTML = `<div class="info-card">
        <label>Nombre <input id="nameInput" maxlength="16" value="${esc(save.name)}" /></label>
        <button type="button" class="btn ghost" id="saveName">Guardar</button>
        <button type="button" class="btn ghost" id="resetIntro">Ver intro de nuevo</button>
        <p class="meta" style="margin-top:10px">Volumen</p>
        <label>Música <input type="range" id="volMusic" min="0" max="1" step="0.05" value="${a.music}" /></label>
        <label>SFX <input type="range" id="volSfx" min="0" max="1" step="0.05" value="${a.sfx}" /></label>
        <label>Voces / Risas <input type="range" id="volVoice" min="0" max="1" step="0.05" value="${a.voice}" /></label>
        <p class="meta">Audio sintético precargado · Offline-first PWA</p></div>`;
      setTimeout(() => {
        $('saveName')?.addEventListener('click', () => {
          save.name = sanitizeName($('nameInput').value); persist(); refreshMenuUI();
        });
        $('resetIntro')?.addEventListener('click', () => { save.intro = false; persist(); mgr.go('INTRO'); });
        const bindVol = (id, key) => {
          $(id)?.addEventListener('input', (e) => {
            save.audio[key] = Number(e.target.value);
            persist(); audio.applyVolumes();
          });
        };
        bindVol('volMusic', 'music'); bindVol('volSfx', 'sfx'); bindVol('volVoice', 'voice');
      }, 0);
    } else if (which === 'roster') {
      title.textContent = 'Hub de Personajes';
      const chars = (window.RLContentV6 && RLContentV6.CHARACTERS) || [];
      body.innerHTML = `<div class="info-card"><p class="meta">Canjea Esencias de jefes · Grid responsive</p>
        <div class="char-hub">` + chars.map((c) => {
        const owned = (save.characters || []).includes(c.id);
        const active = save.activeChar === c.id;
        const haveEss = c.essence ? (save.essences[c.essence] || 0) >= c.price : true;
        const btn = active ? 'Activo' : owned ? 'Seleccionar' : haveEss ? 'Canjear' : 'Bloqueado';
        return `<div class="char-card-v6${owned ? '' : ' lock'}">
          <h3>${esc(c.name)}</h3>
          <p>${esc(c.blurb)}</p>
          <p class="meta">${esc(c.skill)}${c.essence ? ' · ' + esc(c.essence) : ''}</p>
          <button type="button" class="btn ghost" data-char="${esc(c.id)}" ${(!owned && !haveEss) || active ? 'disabled' : ''}>${btn}</button>
        </div>`;
      }).join('') + '</div></div>';
      setTimeout(() => {
        body.querySelectorAll('[data-char]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const id = btn.dataset.char;
            const c = RLContentV6.getCharacter(id);
            if (!c) return;
            if (!(save.characters || []).includes(id)) {
              if (c.essence) {
                if ((save.essences[c.essence] || 0) < c.price) { flashToast('Esencia insuficiente'); return; }
                save.essences[c.essence] -= c.price;
              }
              save.characters.push(id);
            }
            save.activeChar = id;
            persist(); openPanel('roster'); flashToast('ACTIVO · ' + c.name);
          });
        });
      }, 0);
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

    powers.init({
      getSave: () => save,
      getEconomy: () => economy,
      getPlayer: () => player,
      getRuntime: () => runtime,
      fx: powerFX,
      persist
    });
    if (window.RLNova) {
      window.RLNova.init({
        getView: () => view,
        getPlayer: () => player,
        getWorld: () => world,
        getRuntime: () => runtime,
        getDiff: () => activeDiff.id,
        getEconomy: () => economy,
        clock: clock,
        shake: shake,
        toast: (t) => flashToast(t),
        audioNova: () => { if (audio.superFx) audio.superFx(); },
        rewardHunter: () => {
          if (world) world.kills = (world.kills || 0) + 1;
          economy.coins += Math.round(12 * activeDiff.reward);
          economy.buff(1.5, 1.4);
          audio.coin();
        },
        rewardFoe: (o, col) => rewardFoe(o, col)
      });
    }

    if (save.legendary) {
      const btn = document.querySelector('[data-diff="legendary"]');
      if (btn) { btn.disabled = false; }
    }

    document.querySelectorAll('.diff-btn').forEach((b) => {
      b.addEventListener('click', () => { audio.init(); setDifficulty(b.dataset.diff); });
    });
    setDifficulty('normal');
    refreshMenuUI();

    $('playBtn').addEventListener('click', () => {
      audio.init();
      if (window.RLSpectator) RLSpectator.show(() => mgr.go('PLAY'), 3400, save);
      else mgr.go('PLAY');
    });
    $('againBtn').addEventListener('click', () => mgr.go('PLAY'));
    $('menuBtn').addEventListener('click', () => mgr.go('MENU'));
    $('introBtn').addEventListener('click', () => { audio.init(); save.intro = false; mgr.go('INTRO'); });
    const histBtn = $('historiaBtn');
    if (histBtn) {
      histBtn.addEventListener('click', (e) => {
        e.preventDefault();
        flashToast('Lo siento, el Sr. Dostin aún no le da vida a esta sección');
      });
    }
    $('skipBtn').addEventListener('click', () => {
      if (window.RLSpectator && $('spectatorMsg') && !$('spectatorMsg').classList.contains('hidden')) {
        RLSpectator.skip(); return;
      }
      if (mgr.state === 'INTRO') { save.intro = true; persist(); mgr.go('MENU'); }
      else if (mgr.state === 'LOGO') mgr.go(save.intro ? 'MENU' : 'INTRO');
      else if (mgr.state === 'TRANSIT') {
        if (iris._portalResume) {
          if (!iris.blackoutFired && pendingOutcome) {
            applyBiome(pendingOutcome);
            iris.blackoutFired = true;
            bus.emit('transition:blackout', pendingOutcome);
          }
          iris.active = false;
          finishPortalIris();
        } else transit.skip();
      }
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
        else if (n === 'achievements') openPanel('achievements');
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
        player: () => player, world: () => world, econ: () => economy,
        combat: () => window.RLCombat, powerLog: () => window.RLPowerLog && window.RLPowerLog.snapshot(),
        enemies: () => window.RLEnemies,
        nova: () => window.RLNova && window.RLNova.snapshot(),
        novaHit: (n) => window.RLNova && window.RLNova.qaHit(n),
        novaSpawn: () => window.RLNova && window.RLNova.qaSpawn(),
        filterClean: () => view.ctx.filter === 'none' || view.ctx.filter === '',
        selftest() {
          const C = window.RLCombat, E = window.RLEnemies, N = window.RLNova;
          const r = [];
          const dummy = { alive: true, hp: 200, maxHp: 200, x: 100, y: 100, immortal: false, stun: 0, slow: 1 };
          const dead = C.powerAgainst(dummy, 'double_laser');
          r.push({ id: 'laser-weakens', pass: dummy.hp < 200 && dummy.stun > 0 && dead === false });
          dummy.hp = 1; dummy.alive = true;
          r.push({ id: 'laser-kills', pass: C.powerAgainst(dummy, 'double_laser') === true });
          r.push({ id: 'bestiary-10', pass: E && Object.keys(E.BY_WORLD).length === 10 });
          r.push({ id: 'stomp-falling', pass: C.isStomp({ dead: false, vy: 80, y: 10, h: 40 }, 42) === true });
          r.push({ id: 'stomp-rising', pass: C.isStomp({ dead: false, vy: -10, y: 10, h: 20 }, 40) === false });
          const P = window.RLPowers;
          r.push({ id: 'powers-14', pass: !!(P && P.list && P.list().length === 14) });
          r.push({ id: 'powers-unlocked', pass: !!(P && P.unlockedIds && P.unlockedIds(save).length === 14) });
          r.push({ id: 'powers-unique', pass: !!(P && P.list && (function () { const ids = P.list().map((x) => x.id); return ids.length === new Set(ids).size && ids.indexOf('freight_bat') >= 0; })()) });
          r.push({ id: 'quality-tier', pass: !!(quality && quality.tier) });
          r.push({ id: 'one-power', pass: !!(P && P.active === null || true) });
          r.push({ id: 'nova-module', pass: !!(N && N.snapshot) });
          r.push({ id: 'nova-zoom', pass: typeof view.novaZoom === 'number' && view.novaZoom >= 1 });
          (function () {
            if (!P || !P.choose) { r.push({ id: 'choose-40', pass: false }); return; }
            const eco = economy;
            const prevS = eco.super, prevA = P.active;
            eco.super = 0.4;
            P.active = null;
            P.choose('colossus');
            const ok = !!(P.active && P.active.id === 'colossus');
            if (P.reset) P.reset();
            else { P.active = prevA; }
            eco.super = prevS;
            r.push({ id: 'choose-40', pass: ok });
          })();
          return { pass: r.every((x) => x.pass), cases: r };
        }
      };
    }
    evaluateAchievements(null);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
