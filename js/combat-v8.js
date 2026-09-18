/**
 * Runner Legends v8 — combate (pisotón + haz ocular). Original LCS.
 * EXTEND: el runner nunca frena en X; el hitstop usa freeze de Clock, no rAF.
 */
(function (global) {
  'use strict';

  const STOMP_VY = 50;
  const STOMP_TOP = 56;
  const BOUNCE = 720;
  const CHAIN_BONUS_CAP = 3;
  const CHAIN_MULT = 1.12;
  const MAX_CHAIN = 8;

  const combat = {
    chain: 0,
    beams: [],
    pops: [],
    maxBeams: 8,
    chargeSpent: 0,

    reset() {
      this.chain = 0;
      this.beams.length = 0;
      this.pops.length = 0;
      this.chargeSpent = 0;
    },

    land() { this.chain = 0; },

    isStomp(player, enemyTop) {
      if (!player || player.dead) return false;
      if (player.vy <= STOMP_VY) return false;
      const feet = player.y + player.h;
      const pen = feet - enemyTop;
      return pen >= -10 && pen <= STOMP_TOP;
    },

    bounce(player) {
      const bonus = Math.min(CHAIN_BONUS_CAP, this.chain);
      const mul = 1 + bonus * 0.06;
      player.vy = -BOUNCE * mul;
      player.onGround = false;
      player.state = 1;
      player.sx = 1.25;
      player.sy = 0.75;
      this.chain = Math.min(MAX_CHAIN, this.chain + 1);
      return { chain: this.chain, scoreMul: Math.pow(CHAIN_MULT, bonus) };
    },

    fireHaz(fromX, fromY, toX, toY, col) {
      if (this.beams.length >= this.maxBeams) this.beams.shift();
      this.beams.push({
        x0: fromX, y0: fromY, x1: toX, y1: toY,
        col: col || '#ec4899', life: 0.42, max: 0.42
      });
    },

    damageEnemy(o, amount) {
      if (!o || !o.alive || o.immortal) return false;
      const dmg = Math.max(1, amount | 0);
      const hp = o.hp == null ? 1 : o.hp;
      o.hp = hp - dmg;
      o.flash = 0.12;
      this.pop(o.x, (o.y || 0) - 18, '-' + dmg, '#fff');
      if (o.hp <= 0) { o.alive = false; return true; }
      return false;
    },

    pop(x, y, text, col) {
      if (this.pops.length >= 16) this.pops.shift();
      this.pops.push({ x: x, y: y, text: String(text), col: col || '#ffffff', life: 0.55 });
    },

    weaken(o, stun, slow) {
      if (!o || !o.alive) return;
      if (stun) o.stun = Math.max(o.stun || 0, stun);
      if (slow && slow > 0 && slow < 1) o.slow = Math.min(o.slow == null ? 1 : o.slow, slow);
    },

    powerAgainst(o, powerId) {
      const E = typeof RLEnemies !== 'undefined' ? RLEnemies : (window && window.RLEnemies);
      const p = E && E.profile ? E.profile(powerId) : { dmg: 90, stun: 0.2, slow: 0 };
      if (p.stun || p.slow) this.weaken(o, p.stun, p.slow || 1);
      if (p.dmg <= 0) return false;
      return this.damageEnemy(o, p.dmg);
    },

    update(dt) {
      for (let i = this.beams.length - 1; i >= 0; i--) {
        this.beams[i].life -= dt;
        if (this.beams[i].life <= 0) this.beams.splice(i, 1);
      }
      for (let i = this.pops.length - 1; i >= 0; i--) {
        this.pops[i].life -= dt;
        this.pops[i].y -= 40 * dt;
        if (this.pops[i].life <= 0) this.pops.splice(i, 1);
      }
    },

    draw(ctx) {
      if (this.beams.length) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < this.beams.length; i++) {
        const b = this.beams[i];
        const a = Math.max(0, b.life / b.max);
        ctx.strokeStyle = b.col;
        ctx.globalAlpha = a * 0.85;
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(b.x0, b.y0);
        ctx.lineTo(b.x1, b.y1);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = a;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(b.x0, b.y0);
        ctx.lineTo(b.x1, b.y1);
        ctx.stroke();
      }
      ctx.restore();
      }
      if (this.pops.length) {
        ctx.save();
        ctx.font = '700 14px Rajdhani,sans-serif';
        ctx.textAlign = 'center';
        for (let i = 0; i < this.pops.length; i++) {
          const p = this.pops[i];
          ctx.globalAlpha = Math.max(0, p.life / 0.55);
          ctx.fillStyle = p.col;
          ctx.fillText(p.text, p.x, p.y);
        }
        ctx.restore();
      }
    }
  };

  global.RLCombat = combat;
})(typeof window !== 'undefined' ? window : globalThis);
