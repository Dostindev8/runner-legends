/**
 * Runner Legends Ω.3 — Power system (GTA-style pause selector).
 * Isolated module: game.js only injects an API and queries pure getters,
 * so removing this <script> degrades the game back to the classic super.
 */
(function (global) {
  'use strict';

  const RLPowers = {
    active: null,          // power object in flight
    timeLeft: 0,
    charge: 0,             // internal stage timer for staged powers
    stage: 0,
    open: false,
    api: null,
    _onKey: null,

    /** @param {object} api {getSave,getEconomy,getPlayer,getRuntime,fx,persist} */
    init(api) {
      this.api = api;
      const grid = document.getElementById('powerGrid');
      if (grid && !grid._wired) {
        grid._wired = true;
        grid.addEventListener('click', (ev) => {
          const card = ev.target.closest('[data-power]');
          if (!card || card.classList.contains('lock')) return;
          this.choose(card.getAttribute('data-power'));
        });
      }
      const close = document.getElementById('powerClose');
      if (close && !close._wired) {
        close._wired = true;
        close.addEventListener('click', () => this.dismiss());
      }
    },

    list() {
      const C = global.RLContentV6;
      return (C && C.POWERS) ? C.POWERS : [];
    },

    unlockedIds(save) {
      const C = global.RLContentV6;
      if (!C || !C.isPowerUnlocked) return [];
      return this.list().filter((p) => C.isPowerUnlocked(p, save)).map((p) => p.id);
    },

    /* ── selector ─────────────────────────────────────────────── */

    openSelector() {
      if (this.open || this.active) return false;
      const el = document.getElementById('powerSelect');
      if (!el) return false;
      const st = document.getElementById('stage');
      if (st) st.classList.add('frozen');
      this.renderGrid(this.api.getSave());
      el.classList.remove('hidden');
      this.open = true;
      this._onKey = (ev) => {
        if (ev.key === 'Escape') this.dismiss();
      };
      document.addEventListener('keydown', this._onKey);
      const first = el.querySelector('[data-power]:not(.lock)');
      if (first) first.focus();
      return true;
    },

    _closeSelector() {
      const el = document.getElementById('powerSelect');
      if (el) el.classList.add('hidden');
      const st = document.getElementById('stage');
      if (st) st.classList.remove('frozen');
      if (this._onKey) { document.removeEventListener('keydown', this._onKey); this._onKey = null; }
      this.open = false;
    },

    /** Close without spending the super charge. */
    dismiss() { this._closeSelector(); },

    renderGrid(save) {
      const grid = document.getElementById('powerGrid');
      if (!grid) return;
      const C = global.RLContentV6;
      grid.textContent = '';
      this.list().forEach((p) => {
        const unlocked = C && C.isPowerUnlocked ? C.isPowerUnlocked(p, save) : false;
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'power-card' + (unlocked ? '' : ' lock');
        card.setAttribute('data-power', p.id);
        card.setAttribute('role', 'option');
        card.setAttribute('aria-selected', 'false');
        if (!unlocked) card.setAttribute('aria-disabled', 'true');
        card.style.setProperty('--pc', p.col);
        const ico = document.createElement('span');
        ico.className = 'power-ico';
        ico.textContent = unlocked ? p.icon : '🔒';
        const nm = document.createElement('span');
        nm.className = 'power-name';
        nm.textContent = p.name;
        const ds = document.createElement('span');
        ds.className = 'power-desc';
        ds.textContent = unlocked ? p.desc : this.hint(p);
        card.appendChild(ico); card.appendChild(nm); card.appendChild(ds);
        if (unlocked && p.cost) {
          const ct = document.createElement('span');
          ct.className = 'power-desc';
          ct.textContent = p.cost + '% · ' + (p.duration ? p.duration + 's' : 'impacto');
          card.appendChild(ct);
        }
        grid.appendChild(card);
      });
    },

    hint(p) {
      const u = p.unlock || {};
      if (u.type === 'bosses') return 'Derrota ' + u.n + ' jefe(s)';
      if (u.type === 'worlds') return 'Desbloquea ' + u.n + ' mundos';
      if (u.type === 'characters') return 'Consigue ' + u.n + ' personajes';
      if (u.type === 'achievement') return 'Logro: ' + u.id;
      return 'Bloqueado';
    },

    /* ── activation ───────────────────────────────────────────── */

    choose(id) {
      const p = this.list().find((x) => x.id === id);
      if (!p) return;
      if (this.active) return;
      const save = this.api.getSave();
      const C = global.RLContentV6;
      if (C && C.isPowerUnlocked && !C.isPowerUnlocked(p, save)) return;
      const eco = this.api.getEconomy();
      const cost = Math.max(0.1, (p.cost || 100) / 100);
      if (!eco || eco.super < cost - 0.001) return;
      this._closeSelector();
      eco.super = Math.max(0, eco.super - cost);
      if (global.RLPowerLog) {
        global.RLPowerLog.record(p.id, Date.now(), p.cost || 100);
        global.RLPowerLog.addGenerated(0);
      }
      if (save && typeof save.supers === 'number') {
        save.supers += 1;
        if (this.api.persist) this.api.persist();
      }
      this.activate(p);
    },

    activate(p) {
      const player = this.api.getPlayer();
      const rt = this.api.getRuntime();
      const fx = this.api.fx || {};
      this.active = p; this.timeLeft = p.duration; this.stage = 0; this.charge = 0;
      // Keep the exact runtime object we mutated: a portal can swap runtime mid-power.
      this._saved = { rt, gravityMul: rt.gravityMul, speedMul: rt.speedMul };
      if (p.id === 'flight') rt.gravityMul = rt.gravityMul * 0.08;
      if (p.id === 'ascended') rt.speedMul = rt.speedMul * 1.45;
      // Invuln windows: dance/invincible/guardian/colossus (desc + physics-config)
      if (p.id === 'invincible' || p.id === 'ascended' || p.id === 'colossus' || p.id === 'dance') {
        if (player) player.iframe = Math.max(player.iframe, Math.max(0.2, p.duration || 0.4));
      }
      if (player) player.superGlow = 1.4;
      if (fx.burst) fx.burst(p.col);
      if (fx.sfx) fx.sfx(p.id);
      if (fx.toast) fx.toast('PODER: ' + p.name.toUpperCase());
      if ((p.id === 'ascended' || p.id === 'colossus' || p.id === 'dance') && fx.hitFromPower) fx.hitFromPower(p.id, p.col);
      // Instant impacts: esfera + haz first beam + tormenta kickoff
      if ((p.id === 'voltz_sphere' || p.id === 'double_laser' || p.id === 'volt_storm') && fx.hitFromPower) {
        /* staged in update — voltz waits charge; laser fires stage 0 next tick */
      }
      if (global.RLNova && (p.id === 'nova_pulse' || p.id === 'star_lance' || p.id === 'quantum_shield')) {
        global.RLNova.onPower(p.id);
      }
    },

    update(dt) {
      if (!this.active) return;
      const p = this.active;
      const player = this.api.getPlayer();
      const fx = this.api.fx || {};
      this.timeLeft -= dt;
      if (p.id === 'invincible' || p.id === 'ascended' || p.id === 'colossus' || p.id === 'dance') {
        if (player) player.iframe = Math.max(player.iframe, Math.max(0, this.timeLeft));
      }
      if (p.id === 'voltz_sphere') {
        this.charge += dt;
        if (this.stage === 0 && this.charge >= 0.35) { this.stage = 1; if (fx.hitFromPower) fx.hitFromPower(p.id, p.col); }
      }
      if (p.id === 'double_laser') {
        this.charge += dt;
        if (this.stage === 0) { this.stage = 1; if (fx.hitFromPower) fx.hitFromPower(p.id, p.col); }
        if (this.stage === 1 && this.charge >= 0.3) { this.stage = 2; if (fx.hitFromPower) fx.hitFromPower(p.id, p.col); }
      }
      if (p.id === 'volt_storm') {
        this.charge += dt;
        if (this.stage === 0) { this.stage = 1; if (fx.hitFromPower) fx.hitFromPower(p.id, p.col); }
        if (this.charge >= 0.5) { this.charge = 0; if (fx.hitFromPower) fx.hitFromPower(p.id, p.col); }
      }
      if (p.id === 'dance' || p.id === 'invincible' || p.id === 'shadow') {
        this.charge += dt;
        const pulse = p.id === 'dance' ? 0.7 : 0.85;
        if (this.charge >= pulse) { this.charge = 0; if (fx.hitFromPower) fx.hitFromPower(p.id, p.col); }
      }
      if (p.id === 'bullet_time' && fx.weakenAll) fx.weakenAll(0, 0.35);
      if (p.id === 'colossus' && player) {
        player.iframe = Math.max(player.iframe, Math.max(0, this.timeLeft));
        player.sx = 1.25; player.sy = 1.35;
      }
      if ((p.id === 'flight' || p.id === 'ascended' || p.id === 'shadow' || p.id === 'volt_storm') && fx.trail && Math.random() < 0.5) {
        fx.trail(p.col);
      }
      // Instant powers with duration 0 / near-zero: close after impact
      if (p.duration <= 0 && this.stage >= 1) this.deactivate();
      else if (this.timeLeft <= 0) this.deactivate();
    },

    deactivate() {
      const p = this.active;
      if (!p) return;
      const fx = this.api.fx || {};
      const player = this.api.getPlayer && this.api.getPlayer();
      if (this._saved) {
        this._saved.rt.gravityMul = this._saved.gravityMul;
        this._saved.rt.speedMul = this._saved.speedMul;
        this._saved = null;
      }
      if (player && (p.id === 'colossus' || p.id === 'ascended')) {
        player.sx = 1; player.sy = 1;
      }
      this.active = null; this.timeLeft = 0; this.stage = 0; this.charge = 0;
      if (global.RLPowerLog) global.RLPowerLog.closeLast(Date.now());
      if (fx.toast) fx.toast(p.name.toUpperCase() + ' AGOTADO');
    },

    /** Called when a run ends / restarts — never leak state across runs. */
    reset() {
      if (this.active) this.deactivate();
      this._closeSelector();
    },

    /* ── pure getters consumed by the core loop ──────────────── */

    isPaused() { return this.open; },
    freeFlight() { return !!(this.active && this.active.id === 'flight'); },
    jumpLocked() { return !!(this.active && this.active.id === 'dance'); },
    worldSpeedMul() { return (this.active && this.active.id === 'bullet_time') ? 0.35 : 1; },
    alphaMul() { return (this.active && this.active.id === 'shadow') ? 0.45 : 1; },
    label() {
      if (!this.active) return '';
      return this.active.name.toUpperCase() + ' ' + Math.max(0, this.timeLeft).toFixed(1) + 's';
    }
  };

  global.RLPowers = RLPowers;
})(typeof window !== 'undefined' ? window : globalThis);
