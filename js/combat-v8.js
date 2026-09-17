/**
 * Runner Legends v8 — combate (pisotón + haz ocular). Original LCS.
 * EXTEND: el runner nunca frena en X; el hitstop usa freeze de Clock, no rAF.
 */
(function (global) {
  'use strict';

  const STOMP_VY = 120;
  const STOMP_TOP = 18;
  const BOUNCE = 720;
  const CHAIN_BONUS_CAP = 3;
  const CHAIN_MULT = 1.12;
  const MAX_CHAIN = 8;

  const combat = {
    chain: 0,
    beams: [],
    maxBeams: 8,
    chargeSpent: 0,

    reset() {
      this.chain = 0;
      this.beams.length = 0;
      this.chargeSpent = 0;
    },

    land() { this.chain = 0; },

    isStomp(player, enemyTop) {
      if (!player || player.dead) return false;
      if (player.vy <= STOMP_VY) return false;
      const feet = player.y + player.h;
      return feet < enemyTop + STOMP_TOP;
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

    update(dt) {
      for (let i = this.beams.length - 1; i >= 0; i--) {
        this.beams[i].life -= dt;
        if (this.beams[i].life <= 0) this.beams.splice(i, 1);
      }
    },

    draw(ctx) {
      if (!this.beams.length) return;
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
  };

  global.RLCombat = combat;
})(typeof window !== 'undefined' ? window : globalThis);
