/**
 * Runner Legends — PortalOutcomeResolver + WorldTransitionManager
 * Mega Directiva v2.0 §8.3 / §24. Testeable, desacoplado del render.
 */
(function (global) {
  'use strict';

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * @param {object} opts
   * @param {function} opts.getWorld
   * @param {function} opts.buildRuntimeConfig
   * @param {string[]} [opts.history]
   * @param {number|null} [opts.seed] — null = random; number = deterministic season
   */
  class PortalOutcomeResolver {
    constructor(opts) {
      this.getWorld = opts.getWorld;
      this.build = opts.buildRuntimeConfig;
      this.history = Array.isArray(opts.history) ? opts.history.slice(-8) : [];
      this.seed = opts.seed != null ? opts.seed : null;
      this._rng = this.seed != null ? mulberry32(this.seed >>> 0) : Math.random.bind(Math);
      this.streak = opts.streak || 0;
    }

    setSeed(seed) {
      this.seed = seed;
      this._rng = seed != null ? mulberry32(seed >>> 0) : Math.random.bind(Math);
    }

    _pick(arr, weights) {
      if (!arr.length) return null;
      if (!weights) return arr[Math.floor(this._rng() * arr.length)];
      let sum = 0;
      for (let i = 0; i < weights.length; i++) sum += weights[i];
      let r = this._rng() * sum;
      for (let i = 0; i < arr.length; i++) {
        r -= weights[i];
        if (r <= 0) return arr[i];
      }
      return arr[arr.length - 1];
    }

    /** Worlds available as destinations. Never dumps the full catalog. */
    availablePool(originId, unlockedIds) {
      const W = global.RLWorlds.WORLDS;
      const ids = Array.isArray(unlockedIds) ? unlockedIds : ['neon'];
      let lastIdx = 0;
      W.forEach((w, i) => { if (ids.includes(w.id)) lastIdx = i; });
      const preview = W[Math.min(lastIdx + 1, W.length - 1)];
      return W.filter((w) => {
        if (w.finalBoss && !ids.includes('final')) return false;
        if (ids.includes(w.id) || w.id === 'neon' || w.id === originId) return true;
        return preview && w.id === preview.id && !w.finalBoss && this.streak >= 2;
      });
    }

    /**
     * Resolve outcome BEFORE transit so layers match destination.
     * Never repeats exact (world+weather+rule) from last result if pool allows.
     */
    resolve(input) {
      try {
        const originId = input.originId || 'neon';
        const diff = input.difficultyId || 'normal';
        const unlocked = input.unlockedIds || ['neon'];
        let pool = this.availablePool(originId, unlocked);
        if (!pool.length) pool = [global.RLWorlds.getWorld('neon')];

        // Prefer leaving origin when possible
        const destCandidates = pool.filter((w) => w.id !== originId);
        const destPool = destCandidates.length ? destCandidates : pool;

        const weights = destPool.map((w) => {
          let wt = 1 / Math.max(1, w.difficulty);
          if (diff === 'hard') wt *= 1 + w.difficulty * 0.08;
          if (diff === 'expert') wt *= 1 + w.difficulty * 0.15;
          if (diff === 'legendary') wt *= 1 + w.difficulty * 0.25;
          if (w.id === originId) wt *= 0.35;
          return wt;
        });

        let world = this._pick(destPool, weights);
        let weatherId = this._pick(world.weatherPool);
        let ruleId = world.specialRule;
        let key = world.id + '|' + weatherId + '|' + ruleId;
        const last = this.history[this.history.length - 1];

        // Avoid consecutive identical outcome
        let tries = 0;
        while (last === key && tries < 12) {
          weatherId = this._pick(world.weatherPool);
          if (destPool.length > 1 && tries > 3) {
            world = this._pick(destPool, weights);
            weatherId = this._pick(world.weatherPool);
            ruleId = world.specialRule;
          }
          key = world.id + '|' + weatherId + '|' + ruleId;
          tries++;
        }

        const runtime = this.build(world, weatherId, ruleId, diff);
        // Layers from destination, order may shuffle lightly for variety
        const layers = runtime.layers.slice();
        if (layers.length > 2 && this._rng() > 0.45) {
          const i = 1 + Math.floor(this._rng() * (layers.length - 2));
          const j = 1 + Math.floor(this._rng() * (layers.length - 2));
          const tmp = layers[i]; layers[i] = layers[j]; layers[j] = tmp;
        }
        runtime.transitionLayers = layers;
        runtime.originId = originId;
        runtime.outcomeKey = key;

        this.history.push(key);
        if (this.history.length > 8) this.history.shift();

        return runtime;
      } catch (err) {
        // Safe fallback — never trap player in transit (§30)
        console.error('[PortalOutcomeResolver]', err);
        return this.build('neon', 'clear_night', 'extreme_speed', input.difficultyId || 'normal');
      }
    }

    /** Distribution helper for QA (§33) */
    sample(n, input) {
      const counts = Object.create(null);
      for (let i = 0; i < n; i++) {
        const o = this.resolve(input);
        const k = o.worldId + '/' + o.weatherId;
        counts[k] = (counts[k] || 0) + 1;
      }
      return counts;
    }
  }

  /**
   * Phases of portal cinema (~4.5–6.5s). Consumes resolver output.
   */
  class WorldTransitionManager {
    constructor() {
      this.active = false;
      this.phase = 0;
      this.t = 0;
      this.outcome = null;
      this.onArrive = null;
      this.durations = [0.35, 0.4, 0.45, 0.5, 0.55, 0.4, 0.9, 0.7, 0.55, 0.4, 0.35, 0.3, 0.25];
      // maps to §8.1 steps 1–13 (compressed timings)
    }

    start(outcome, onArrive) {
      this.active = true;
      this.phase = 0;
      this.t = 0;
      this.outcome = outcome;
      this.onArrive = onArrive;
    }

    get totalDuration() {
      return this.durations.reduce((a, b) => a + b, 0);
    }

    get progress() {
      if (!this.active) return 1;
      let elapsed = this.t;
      for (let i = 0; i < this.phase; i++) elapsed += this.durations[i];
      return Math.min(1, elapsed / this.totalDuration);
    }

    get phaseName() {
      const names = [
        'prep', 'energy', 'charge', 'distort', 'open', 'enter',
        'tunnel', 'travel', 'preview', 'light', 'ambient', 'arrive', 'resume'
      ];
      return names[this.phase] || 'done';
    }

    update(dt) {
      if (!this.active) return false;
      this.t += dt;
      while (this.active && this.t >= this.durations[this.phase]) {
        this.t -= this.durations[this.phase];
        this.phase++;
        if (this.phase >= this.durations.length) {
          this.active = false;
          const cb = this.onArrive;
          this.onArrive = null;
          if (cb) cb(this.outcome);
          return true;
        }
      }
      return false;
    }

    skip() {
      if (!this.active) return;
      this.active = false;
      const cb = this.onArrive;
      const o = this.outcome;
      this.onArrive = null;
      if (cb) cb(o);
    }
  }

  global.RLPortal = { PortalOutcomeResolver, WorldTransitionManager, mulberry32 };
})(typeof window !== 'undefined' ? window : globalThis);
