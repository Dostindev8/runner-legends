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
      const save = this.api.getSave();
      const C = global.RLContentV6;
      if (C && C.isPowerUnlocked && !C.isPowerUnlocked(p, save)) return;
      this._closeSelector();
      const eco = this.api.getEconomy();
      if (eco) eco.super = 0;
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
      if (p.id === 'ascended') rt.speedMul = rt.speedMul * 1.15;
      if (p.id === 'invincible' || p.id === 'ascended') player.iframe = Math.max(player.iframe, p.duration);
      if (player) player.superGlow = 1.4;
      if (fx.burst) fx.burst(p.col);
      if (fx.sfx) fx.sfx(p.id);
      if (fx.toast) fx.toast('PODER: ' + p.name.toUpperCase());
    },

    update(dt) {
      if (!this.active) return;
      const p = this.active;
      const player = this.api.getPlayer();
      const fx = this.api.fx || {};
      this.timeLeft -= dt;
      if (p.id === 'invincible' || p.id === 'ascended') {
        if (player) player.iframe = Math.max(player.iframe, Math.max(0, this.timeLeft));
      }
      if (p.id === 'voltz_sphere') {
        this.charge += dt;
        if (this.stage === 0 && this.charge >= 0.4) { this.stage = 1; if (fx.clearNearest) fx.clearNearest(p.col); }
      }
      if (p.id === 'double_laser') {
        this.charge += dt;
        if (this.stage === 0) { this.stage = 1; if (fx.clearNearest) fx.clearNearest(p.col); }
        if (this.stage === 1 && this.charge >= 0.3) { this.stage = 2; if (fx.clearNearest) fx.clearNearest(p.col); }
      }
      if ((p.id === 'flight' || p.id === 'ascended' || p.id === 'shadow') && fx.trail && Math.random() < 0.5) {
        fx.trail(p.col);
      }
      if (this.timeLeft <= 0) this.deactivate();
    },

    deactivate() {
      const p = this.active;
      if (!p) return;
      const fx = this.api.fx || {};
      if (this._saved) {
        this._saved.rt.gravityMul = this._saved.gravityMul;
        this._saved.rt.speedMul = this._saved.speedMul;
        this._saved = null;
      }
      this.active = null; this.timeLeft = 0; this.stage = 0; this.charge = 0;
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
    worldSpeedMul() { return (this.active && this.active.id === 'bullet_time') ? 0.5 : 1; },
    alphaMul() { return (this.active && this.active.id === 'shadow') ? 0.45 : 1; },
    label() {
      if (!this.active) return '';
      return this.active.name.toUpperCase() + ' ' + Math.max(0, this.timeLeft).toFixed(1) + 's';
    }
  };

  global.RLPowers = RLPowers;
})(typeof window !== 'undefined' ? window : globalThis);
