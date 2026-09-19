/**
 * Runner Legends V7.0 Estelar — overlay (EXTEND-NEVER-OVERWRITE).
 * Quality, HUD helpers, enemy lasers, celebration, star pistol, winged mount.
 * Does not rewrite Player/World/Economy/Audio/Transition.
 */
(function (global) {
  'use strict';

  const LS_Q = 'rl_v7_quality';
  const LS_RM = 'rl_v7_reduced';
  const LS_HAP = 'rl_v7_haptic';

  const laserPool = [];
  for (let i = 0; i < 24; i++) {
    laserPool.push({
      a: false, kind: 'bolt_low', phase: 'tele', t: 0, tele: 0.7, x: 0, y: 0, vx: 0,
      w: 48, h: 10, life: 0, srcX: 0, srcY: 0
    });
  }
  const shells = [];
  for (let i = 0; i < 32; i++) shells.push({ a: false, x: 0, y: 0, vx: 0, vy: 0, life: 0 });
  const bits = [];
  for (let i = 0; i < 40; i++) bits.push({ a: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, col: '#ff6ad5' });

  const st = {
    t: 0,
    reduced: false,
    haptic: false,
    tier: 'ALTA',
    cele: { on: false, t: 0, skip: false, charId: 'kori_voltz', dance: 0, saved: false },
    pistol: { shots: 0, acc: 0, assemble: 0, burst: false },
    laserCd: 2.4,
    lastDodge: 0,
    aimHeld: false,
    frames: [],
    p95: 16,
    lastFt: 16,
    view: null
  };

  function loadPref(k, def) {
    try {
      const v = localStorage.getItem(k);
      if (v == null || v === '') return def;
      return v;
    } catch (e) { return def; }
  }

  function savePref(k, v) {
    try { localStorage.setItem(k, v); } catch (e) { /* ignore */ }
  }

  function applyTier(name, quality) {
    const n = String(name || 'ALTA').toUpperCase();
    st.tier = n;
    if (!quality) return;
    if (n === 'BAJA') {
      quality.tier = 'low'; quality.dprCap = 1.5; quality.particleMul = 0.4; quality.weatherN = 16; quality.trailChance = 5;
    } else if (n === 'MEDIA') {
      quality.tier = 'med'; quality.dprCap = 2; quality.particleMul = 0.7; quality.weatherN = 28; quality.trailChance = 10;
    } else if (n === 'ULTRA_4K') {
      quality.tier = 'ultra'; quality.dprCap = 3; quality.particleMul = 1.15; quality.weatherN = 56; quality.trailChance = 16;
    } else {
      quality.tier = 'high'; quality.dprCap = 2.5; quality.particleMul = 1; quality.weatherN = 48; quality.trailChance = 14;
    }
  }

  function teleMs(diffId) {
    if (diffId === 'legendary') return 0.42;
    if (diffId === 'expert') return 0.5;
    if (diffId === 'hard') return 0.6;
    return 0.7;
  }

  function allocLaser() {
    for (let i = 0; i < laserPool.length; i++) if (!laserPool[i].a) return laserPool[i];
    return null;
  }

  function spawnLaser(kind, view, world, diffId) {
    const L = allocLaser();
    if (!L || !view) return null;
    const gy = view.groundY;
    L.a = true; L.kind = kind || 'bolt_low'; L.phase = 'tele'; L.t = 0;
    L.tele = teleMs(diffId); L.life = 1.6;
    L.srcX = view.w * 0.78; L.srcY = gy - 48;
    if (world && world.drones && world.drones.forEach) {
      world.drones.forEach(function (d) {
        if (d && d.alive && d.x > view.w * 0.35) { L.srcX = d.x; L.srcY = d.y + (d.h || 32) * 0.35; }
      });
    }
    L.x = L.srcX; L.vx = -(220 + (world && world.speed ? world.speed * 0.35 : 80));
    if (L.kind === 'bolt_high') { L.y = gy - 78; L.h = 12; L.w = 52; }
    else if (L.kind === 'wave') { L.y = gy - 14; L.h = 16; L.w = 90; L.vx *= 0.7; }
    else if (L.kind === 'beam') { L.y = gy - 50; L.h = 18; L.w = view.w * 0.45; L.vx = 0; }
    else { L.y = gy - 22; L.h = 10; L.w = 48; }
    return L;
  }

  function spawnVolley(view, world, diffId) {
    spawnLaser('bolt_low', view, world, diffId);
    setTimeout(function () { spawnLaser('bolt_high', view, world, diffId); }, 280);
    setTimeout(function () { spawnLaser('bolt_low', view, world, diffId); }, 560);
  }

  function dodged(L, player, view) {
    if (!player || player.dead) return false;
    const gy = view.groundY;
    const air = !player.onGround && (gy - (player.y + player.h) > 28);
    if (L.kind === 'bolt_low' || L.kind === 'wave') return air;
    if (L.kind === 'bolt_high') return !!player.onGround && !air;
    if (L.kind === 'beam') {
      const safe = player.x < view.w * 0.22 || player.x > view.w * 0.55;
      return safe;
    }
    return air;
  }

  function hitsPlayer(L, player) {
    if (!player || player.iframe > 0 || player.dead) return false;
    const hw = L.w * 0.85, hh = L.h * 0.85;
    const px = player.x, py = player.y, pw = player.w, ph = player.h;
    return px < L.x + hw && px + pw > L.x && py < L.y + hh && py + ph > L.y;
  }

  function emit(name, detail) {
    try { document.dispatchEvent(new CustomEvent('rl:' + name, { detail: detail || {} })); } catch (e) { /* ignore */ }
  }

  function burstBits(x, y) {
    let n = 0;
    for (let i = 0; i < bits.length && n < 12; i++) {
      const p = bits[i];
      if (p.a) continue;
      p.a = true; p.x = x; p.y = y;
      p.vx = (Math.random() - 0.3) * 220; p.vy = -40 - Math.random() * 180;
      p.life = 0.45; p.col = Math.random() > 0.5 ? '#ff6ad5' : '#22e6ff';
      n++;
    }
  }

  function shellCasing(x, y) {
    for (let i = 0; i < shells.length; i++) {
      const s = shells[i];
      if (s.a) continue;
      s.a = true; s.x = x; s.y = y; s.vx = -40 - Math.random() * 40; s.vy = -120 - Math.random() * 80; s.life = 0.5;
      return;
    }
  }

  const API = {
    init: function (quality) {
      st.reduced = loadPref(LS_RM, '') === '1' || !!(global.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
      st.haptic = loadPref(LS_HAP, '1') === '1';
      const q = loadPref(LS_Q, '');
      if (q) applyTier(q, quality);
      else applyTier(quality && quality.tier === 'low' ? 'BAJA' : quality && quality.tier === 'med' ? 'MEDIA' : 'ALTA', quality);
      const aim = document.getElementById('aimBtn');
      if (aim && !aim._v7) {
        aim._v7 = true;
        const down = function (e) { e.preventDefault(); st.aimHeld = true; };
        const up = function () { st.aimHeld = false; };
        aim.addEventListener('pointerdown', down);
        aim.addEventListener('pointerup', up);
        aim.addEventListener('pointerleave', up);
      }
      const skip = document.getElementById('celeSkip');
      if (skip && !skip._v7) {
        skip._v7 = true;
        skip.addEventListener('click', function () { if (st.cele.t > 1.2) st.cele.skip = true; });
      }
    },

    applyTier: applyTier,
    setQuality: function (tier, quality) { applyTier(tier, quality); savePref(LS_Q, st.tier); },
    setReduced: function (on) { st.reduced = !!on; savePref(LS_RM, on ? '1' : '0'); },
    setHaptic: function (on) { st.haptic = !!on; savePref(LS_HAP, on ? '1' : '0'); },
    reduced: function () { return st.reduced; },
    blocksWorld: function () { return !!(st.cele.on && !st.cele.skip && st.cele.t < (st.reduced ? 1.4 : 3.2)); },

    spawnLaser: function (kind, view, world, diffId) {
      if (kind === 'volley') spawnVolley(view, world, diffId);
      else if (kind === 'cross') {
        spawnLaser('bolt_low', view, world, diffId);
        spawnLaser('bolt_high', view, world, diffId);
      } else spawnLaser(kind, view, world, diffId);
    },

    startCele: function (hooks) {
      if (st.cele.on) return;
      st.cele.on = true; st.cele.t = 0; st.cele.skip = false;
      st.cele.charId = (hooks && hooks.charId) || 'kori_voltz';
      st.cele.dance = (st.cele.dance + 1 + Math.floor(Math.random() * 2)) % 3;
      st.cele.saved = false;
      const layer = document.getElementById('celeLayer');
      if (layer) layer.classList.remove('hidden');
      if (hooks && hooks.persist && !st.cele.saved) { hooks.persist(); st.cele.saved = true; }
      emit('celebration:start', { charId: st.cele.charId });
    },

    forceGoal: function (hooks) { this.startCele(hooks || {}); },

    resetRun: function () {
      st.cele.on = false; st.cele.t = 0;
      st.pistol.shots = 0; st.pistol.acc = 0; st.pistol.assemble = 0;
      laserPool.forEach(function (L) { L.a = false; });
      const layer = document.getElementById('celeLayer');
      if (layer) layer.classList.add('hidden');
      const aim = document.getElementById('aimBtn');
      if (aim) aim.hidden = true;
    },

    setView: function (view) { st.view = view; },

    update: function (dt, raw) {
      st.t += raw;
      st.lastFt = raw * 1000;
      st.frames.push(st.lastFt);
      if (st.frames.length > 60) st.frames.shift();
      const sorted = st.frames.slice().sort(function (a, b) { return a - b; });
      st.p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] || 16;

      if (st.cele.on) {
        st.cele.t += raw;
        if (st.cele.t > 1.2) {
          const skipEl = document.getElementById('celeSkip');
          if (skipEl) skipEl.hidden = false;
        }
        if (st.cele.skip || st.cele.t >= (st.reduced ? 1.4 : 3.4)) {
          st.cele.on = false;
          const layer = document.getElementById('celeLayer');
          if (layer) layer.classList.add('hidden');
          emit('celebration:end', {});
        }
      }

      const P = global.RLPowers;
      const pistolOn = !!(P && P.active && P.active.id === 'star_pistol');
      const aim = document.getElementById('aimBtn');
      if (aim) aim.hidden = !pistolOn;
      if (pistolOn) {
        st.pistol.assemble = Math.min(0.9, st.pistol.assemble + dt);
        if (st.pistol.assemble >= 0.9) {
          st.pistol.acc += dt;
          const rate = st.aimHeld ? 3.3 : 2.0;
          const gap = 1 / rate;
          if (st.pistol.acc >= gap && st.pistol.shots < 12) {
            st.pistol.acc = 0; st.pistol.shots++;
            if (P.api && P.api.fx && P.api.fx.hitFromPower) P.api.fx.hitFromPower('star_pistol', '#fde68a');
            const pl = P.api && P.api.getPlayer && P.api.getPlayer();
            if (pl) shellCasing(pl.x + 36, pl.y + 28);
            emit('power:starPistol:fire', {});
            laserPool.forEach(function (L) {
              if (L.a && L.phase === 'live' && (L.kind === 'bolt_low' || L.kind === 'bolt_high') && L.x < 520) {
                L.a = false; burstBits(L.x, L.y); emit('laser:hit', { intercept: true });
              }
            });
          }
        }
      } else {
        st.pistol.assemble = 0; st.pistol.shots = 0; st.pistol.acc = 0;
      }

      for (let i = 0; i < shells.length; i++) {
        const s = shells[i];
        if (!s.a) continue;
        s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 900 * dt;
        if (s.life <= 0) s.a = false;
      }
      for (let i = 0; i < bits.length; i++) {
        const p = bits[i];
        if (!p.a) continue;
        p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 400 * dt;
        if (p.life <= 0) p.a = false;
      }

      if (st.cele.on) return;

      st.laserCd -= dt;
      const view = st.view;
      const world = (P && P.api && P.api.getWorld) ? P.api.getWorld() : null;
      const player = P && P.api && P.api.getPlayer && P.api.getPlayer();
      const diff = (P && P.api && P.api.getDiff && P.api.getDiff()) || 'normal';
      if (view && world && st.laserCd <= 0 && (world.dist || 0) > 35) {
        st.laserCd = 2.1 + Math.random() * 1.4;
        const kinds = ['bolt_low', 'bolt_high', 'volley', 'wave', 'beam', 'cross'];
        const k = kinds[Math.floor(Math.random() * (diff === 'normal' ? 4 : kinds.length))];
        this.spawnLaser(k, view, world, diff);
        emit('laser:telegraph', { kind: k });
      }

      laserPool.forEach(function (L) {
        if (!L.a) return;
        L.t += dt;
        if (L.phase === 'tele') {
          if (L.t >= L.tele) { L.phase = 'live'; L.t = 0; emit('laser:fire', { kind: L.kind }); }
          return;
        }
        if (L.phase === 'live') {
          L.x += L.vx * dt;
          L.life -= dt;
          if (player && view && dodged(L, player, view) && Math.abs(L.x - player.x) < 60) {
            if (st.lastDodge !== L) {
              st.lastDodge = L;
              emit('laser:dodged', {});
              if (P.api && P.api.fx && P.api.fx.toast) P.api.fx.toast('¡ESQUIVE!');
              const eco = P.api.getEconomy && P.api.getEconomy();
              if (eco) { eco.combo = (eco.combo || 0) + 1; eco.super = Math.min(1, (eco.super || 0) + 0.04); }
            }
          }
          if (player && hitsPlayer(L, player)) {
            player.hurt();
            player.iframe = Math.max(player.iframe, 1.2);
            L.phase = 'cool'; L.t = 0;
            emit('laser:hit', {});
            if (st.haptic && navigator.vibrate) navigator.vibrate(18);
          }
          if (L.life <= 0 || L.x < -80) { L.phase = 'cool'; L.t = 0; }
          return;
        }
        L.t += dt;
        if (L.t > 0.35) L.a = false;
      });
    },

    drawWorld: function (ctx, view, world) {
      if (!ctx || !view) return;
      const gy = view.groundY;
      const t = st.t;
      ctx.save();
      const moonX = view.w * 0.82, moonY = view.h * 0.18, moonR = Math.min(70, view.h * 0.14);
      ctx.fillStyle = 'rgba(192,80,220,0.18)';
      ctx.beginPath(); ctx.arc(moonX, moonY, moonR * 1.6, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#c084fc';
      ctx.beginPath(); ctx.arc(moonX, moonY, moonR, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(80,30,110,0.35)';
      ctx.beginPath(); ctx.arc(moonX - 12, moonY + 8, 10, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.arc(moonX + 16, moonY - 10, 7, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(34,230,255,0.7)';
      ctx.fillRect(((t * 40) % (view.w + 80)) - 40, view.h * 0.12, 10, 3);
      ctx.fillRect(((t * 28 + 200) % (view.w + 80)) - 40, view.h * 0.2, 8, 2);

      ctx.fillStyle = 'rgba(34,230,255,0.12)';
      ctx.fillRect(0, gy, view.w, 18);
      ctx.strokeStyle = 'rgba(34,230,255,0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, gy + 6); ctx.lineTo(view.w, gy + 6); ctx.stroke();
      ctx.fillStyle = '#111';
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = i % 2 ? '#f5c518' : '#111';
        ctx.fillRect((i * 48 - (t * 80) % 48), gy + 22, 24, 7);
      }

      const nearGoal = world && (world.dist > 180 || (world.kills || 0) >= 5);
      ctx.font = '800 11px Orbitron,sans-serif';
      ctx.fillStyle = '#22e6ff';
      ctx.fillText(nearGoal ? 'NEXT LEVEL ›››' : 'DREAM CODE PLAY', view.w * 0.62, gy - view.h * 0.38);

      if (world && world.crates) {
        world.crates.forEach(function (o) {
          ctx.strokeStyle = '#22e6ff';
          ctx.lineWidth = 2;
          ctx.strokeRect(o.x + 3, o.y + 3, o.w - 6, 8);
        });
      }
      ctx.restore();
    },

    drawOver: function (ctx, view, player) {
      if (!ctx || !view || !player) return;
      const P = global.RLPowers;
      const gy = view.groundY;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath(); ctx.ellipse(player.x, gy - 4, 22, 6, 0, 0, 6.283); ctx.fill();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#22e6ff';
      ctx.fillRect(player.x - 16, gy + 8, 32, 10);

      if (P && P.active && P.active.id === 'flight' && !st.reduced) {
        const mx = player.x, my = player.y + player.h * 0.55;
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        ctx.beginPath(); ctx.ellipse(mx, my, 38, 16, 0, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(34,230,255,0.35)';
        const flap = Math.sin(st.t * 10) * 8;
        ctx.beginPath(); ctx.ellipse(mx - 34, my - 8, 22, 10 + flap, -0.4, 0, 6.283); ctx.fill();
        ctx.beginPath(); ctx.ellipse(mx + 34, my - 8, 22, 10 + flap, 0.4, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#fde68a';
        ctx.fillRect(mx - 8, my - 6, 16, 6);
        ctx.strokeStyle = '#22e6ff';
        ctx.beginPath(); ctx.moveTo(mx + 36, my - 4); ctx.lineTo(mx + 52, my - 14); ctx.stroke();
      }

      if (P && P.active && P.active.id === 'star_pistol') {
        const k = Math.min(1, st.pistol.assemble / 0.9);
        const gx = player.x + 28, gy2 = player.y + 26;
        ctx.globalAlpha = 0.35 + k * 0.65;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(gx - 8, gy2, 18 * k, 10);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(gx + 8, gy2 - 4, 28 * k, 14);
        const tubes = st.tier === 'BAJA' ? 3 : 6;
        ctx.fillStyle = '#22e6ff';
        for (let i = 0; i < tubes; i++) ctx.fillRect(gx + 34, gy2 - 6 + i * 3, 22 * k, 2);
        ctx.fillStyle = '#f472b6';
        ctx.beginPath(); ctx.arc(gx + 56 * k, gy2 + 4, 5, 0, 6.283); ctx.fill();
        if (k >= 1) {
          ctx.strokeStyle = 'rgba(34,230,255,0.8)';
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(gx + 58, gy2 + 4); ctx.lineTo(gx + 220, gy2); ctx.stroke();
        }
      }

      laserPool.forEach(function (L) {
        if (!L.a) return;
        ctx.globalAlpha = L.phase === 'tele' ? 0.35 : 0.9;
        ctx.strokeStyle = L.kind === 'bolt_high' ? '#c084fc' : '#22e6ff';
        ctx.fillStyle = L.kind === 'wave' ? 'rgba(236,72,153,0.55)' : 'rgba(34,230,255,0.75)';
        ctx.lineWidth = 2;
        if (L.phase === 'tele') {
          ctx.setLineDash([6, 6]);
          ctx.beginPath(); ctx.moveTo(L.srcX, L.srcY); ctx.lineTo(L.x - 40, L.y); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#fde68a';
          ctx.font = '700 11px Rajdhani,sans-serif';
          ctx.fillText(L.kind === 'bolt_high' ? '▼ SUELO' : '▲ SALTA', L.srcX - 24, L.srcY - 10);
        } else {
          ctx.fillRect(L.x, L.y, L.w, L.h);
        }
      });

      shells.forEach(function (s) {
        if (!s.a) return;
        ctx.globalAlpha = Math.max(0, s.life * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(s.x, s.y, 4, 2);
      });
      bits.forEach(function (p) {
        if (!p.a) return;
        ctx.globalAlpha = Math.max(0, p.life * 2);
        ctx.fillStyle = p.col;
        ctx.fillRect(p.x, p.y, 4, 4);
      });

      if (st.cele.on) {
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#22e6ff';
        ctx.fillRect(0, 0, view.w, view.h);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.font = '800 22px Orbitron,sans-serif';
        ctx.fillText('DISTRITO SUPERADO', view.w * 0.22, view.h * 0.28);
      }
      ctx.restore();
    },

    syncHud: function (economy, world, player) {
      const rail = document.getElementById('comboRail');
      const railN = document.getElementById('comboRailN');
      if (rail && railN) {
        if (economy && economy.combo >= 2) {
          rail.hidden = false; railN.textContent = '×' + economy.combo;
        } else rail.hidden = true;
      }
      const coins = document.getElementById('hudCoins');
      if (coins && economy) coins.textContent = String(economy.coins || 0);
      const ko = document.getElementById('hudKo');
      if (ko && world) ko.textContent = (world.kills || 0) + '/8';
      const hh = document.getElementById('hudHearts');
      if (hh && player) {
        const hp = Math.max(0, player.hp | 0);
        hh.textContent = '';
        for (let i = 0; i < 4; i++) {
          const s = document.createElement('span');
          s.className = 'h' + (i < hp ? ' on' : '');
          s.textContent = '♥';
          hh.appendChild(s);
        }
      }
      const bar = document.getElementById('hudSuperMiniI');
      if (bar && economy) bar.style.width = Math.round((economy.super || 0) * 100) + '%';
    },

    stats: function () {
      let lasers = 0, parts = 0;
      laserPool.forEach(function (L) { if (L.a) lasers++; });
      bits.forEach(function (p) { if (p.a) parts++; });
      shells.forEach(function (s) { if (s.a) parts++; });
      return { fps: st.lastFt > 0 ? Math.round(1000 / st.lastFt) : 60, p95: st.p95, particles: parts, projectiles: lasers, mem: (performance.memory && performance.memory.usedJSHeapSize) || 0, tier: st.tier };
    }
  };

  global.RLEstelar = API;
})(typeof window !== 'undefined' ? window : globalThis);
