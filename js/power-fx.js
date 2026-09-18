/**
 * Runner Legends — unique per-power presentation (Gameplay overlay).
 * Does not replace Player/World/Audio. Pools only. IP: LCS / Kori Voltz.
 */
(function (global) {
  'use strict';

  const sparks = [];
  for (let i = 0; i < 36; i++) sparks.push({ a: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, col: '#fff', r: 2 });

  const st = { id: null, t: 0, swing: 0, hit: 0, lastFt: 16 };

  function spark(x, y, n, col) {
    const cap = st.lastFt > 22 ? Math.min(n, 4) : n;
    let used = 0;
    for (let i = 0; i < sparks.length && used < cap; i++) {
      const p = sparks[i];
      if (p.a) continue;
      const a = Math.random() * 6.283, sp = 50 + Math.random() * 160;
      p.a = true; p.x = x; p.y = y; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - 30;
      p.life = 0.28 + Math.random() * 0.25; p.col = col || '#fff'; p.r = 1.5 + Math.random() * 2.5;
      used++;
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  const FX = {
    begin(id) {
      st.id = id; st.t = 0; st.swing = -0.7; st.hit = 0;
    },
    end() { st.id = null; st.t = 0; },
    update(dt, raw) {
      st.lastFt = (raw || dt) * 1000;
      if (dt <= 0) return;
      st.t += dt;
      if (st.id === 'freight_bat') {
        if (st.t < 0.45) st.swing = -0.85;
        else if (st.t < 0.62) st.swing = -0.85 + (st.t - 0.45) / 0.17 * 2.4;
        else st.swing = 1.45 + Math.sin(st.t * 18) * 0.04;
        if (st.t > 0.45 && st.t < 0.7) spark(0, 0, 2, '#fde68a');
      }
      for (let i = 0; i < sparks.length; i++) {
        const p = sparks[i];
        if (!p.a) continue;
        p.life -= dt; p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.life <= 0) p.a = false;
      }
    },

    /** Truck / rings under Kori. */
    drawUnder(ctx, view, player) {
      if (!st.id || !ctx || !player || !view) return;
      const x = player.x, gy = view.groundY, id = st.id;
      ctx.save();
      if (id === 'freight_bat') {
        const tx = x - 18, ty = gy - 38;
        ctx.fillStyle = '#1e293b';
        roundRect(ctx, tx - 52, ty, 128, 28, 6); ctx.fill();
        ctx.fillStyle = '#0f172a';
        roundRect(ctx, tx - 52, ty - 22, 46, 24, 5); ctx.fill();
        ctx.fillStyle = '#22d3ee';
        ctx.fillRect(tx - 46, ty - 16, 18, 8);
        ctx.fillStyle = '#ffd24a';
        ctx.fillRect(tx + 8, ty + 6, 50, 6);
        ctx.fillStyle = '#111827';
        ctx.beginPath(); ctx.arc(tx - 28, gy - 6, 10, 0, 6.283); ctx.fill();
        ctx.beginPath(); ctx.arc(tx + 48, gy - 6, 10, 0, 6.283); ctx.fill();
        ctx.strokeStyle = 'rgba(34,230,255,0.65)';
        ctx.lineWidth = 2;
        ctx.strokeRect(tx - 54, ty - 24, 132, 50);
        ctx.fillStyle = '#fde68a';
        ctx.font = '700 9px Rajdhani,sans-serif';
        ctx.fillText('LCS CARGA', tx - 8, ty + 16);
      }
      if (id === 'flight') {
        ctx.strokeStyle = 'rgba(56,189,248,0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(x, player.y + player.h * 0.7, 28 + Math.sin(st.t * 8) * 6, 8, 0, 0, 6.283); ctx.stroke();
      }
      if (id === 'colossus') {
        ctx.fillStyle = 'rgba(249,115,22,0.25)';
        ctx.beginPath(); ctx.ellipse(x, gy - 4, 48, 10, 0, 0, 6.283); ctx.fill();
      }
      ctx.restore();
    },

    drawOver(ctx, view, player) {
      if (!st.id || !ctx || !player) return;
      const x = player.x, y = player.y, h = player.h, id = st.id;
      ctx.save();
      if (id === 'freight_bat') {
        const pivotX = x + 10, pivotY = y + 8;
        ctx.translate(pivotX, pivotY);
        ctx.rotate(st.swing);
        ctx.fillStyle = '#7c2d12';
        ctx.fillRect(8, -5, 62, 10);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(62, -9, 18, 18);
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;
        ctx.strokeRect(62, -9, 18, 18);
        ctx.restore();
        ctx.save();
        if (st.t > 0.45 && st.t < 0.85) {
          ctx.strokeStyle = 'rgba(253,224,71,0.7)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(x + 24, y + 20, 70, -0.4, 1.4);
          ctx.stroke();
        }
      } else if (id === 'double_laser') {
        ctx.strokeStyle = '#ec4899';
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = 3;
        const y1 = y + 18, y2 = y + 32;
        ctx.beginPath(); ctx.moveTo(x + 16, y1); ctx.lineTo(x + 420, y1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 16, y2); ctx.lineTo(x + 400, y2); ctx.stroke();
      } else if (id === 'voltz_sphere') {
        const r = 10 + st.t * 40;
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x + 28 + st.t * 180, y + 24, Math.max(6, 16 - st.t * 20), 0, 6.283); ctx.stroke();
        ctx.globalAlpha = 0.35;
        ctx.beginPath(); ctx.arc(x + 20, y + 22, r, 0, 6.283); ctx.stroke();
      } else if (id === 'nova_pulse') {
        const r = 30 + st.t * 520;
        ctx.strokeStyle = '#67e8f9';
        ctx.globalAlpha = Math.max(0, 0.7 - st.t * 1.4);
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(x, y + h * 0.4, r, 0, 6.283); ctx.stroke();
      } else if (id === 'star_lance') {
        ctx.strokeStyle = '#fde68a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 12, y + 22);
        ctx.lineTo(x + 90 + st.t * 280, y + 10);
        ctx.stroke();
      } else if (id === 'quantum_shield') {
        ctx.strokeStyle = 'rgba(196,181,253,0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, y + h * 0.4, 44 + Math.sin(st.t * 10) * 3, 0, 6.283); ctx.stroke();
      } else if (id === 'volt_storm') {
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(x, y + 20);
          ctx.lineTo(x + 80 + i * 90, y - 10 + Math.sin(st.t * 20 + i) * 40);
          ctx.lineTo(x + 140 + i * 90, y + 50);
          ctx.stroke();
        }
      } else if (id === 'dance') {
        ctx.strokeStyle = '#ec4899';
        ctx.globalAlpha = 0.45 + Math.sin(st.t * 12) * 0.2;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(x, view.groundY - 8, 36 + (st.t % 0.7) * 80, 0, 6.283); ctx.stroke();
      } else if (id === 'invincible') {
        ctx.strokeStyle = '#c084fc';
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, y + h * 0.4, 50, st.t, st.t + 4.2); ctx.stroke();
      } else if (id === 'shadow') {
        ctx.fillStyle = 'rgba(148,163,184,0.25)';
        ctx.fillRect(x - 40, y, 28, h);
      } else if (id === 'bullet_time') {
        ctx.fillStyle = 'rgba(245,158,11,0.12)';
        ctx.fillRect(-40, -40, view.w + 80, view.h + 80);
      } else if (id === 'ascended') {
        ctx.strokeStyle = '#22d3ee';
        ctx.globalAlpha = 0.7;
        ctx.strokeRect(x - 38, y - 8, 76, h + 12);
      } else if (id === 'flight') {
        ctx.fillStyle = 'rgba(56,189,248,0.35)';
        ctx.beginPath(); ctx.moveTo(x - 10, y + h); ctx.lineTo(x, y + h + 18); ctx.lineTo(x + 10, y + h); ctx.fill();
      }

      for (let i = 0; i < sparks.length; i++) {
        const p = sparks[i];
        if (!p.a) continue;
        ctx.globalAlpha = Math.max(0, p.life * 3);
        ctx.fillStyle = p.col;
        ctx.fillRect(player.x + p.x, player.y + 20 + p.y, p.r, p.r);
      }
      ctx.restore();
    }
  };

  global.RLPowerFX = FX;
})(typeof window !== 'undefined' ? window : globalThis);
