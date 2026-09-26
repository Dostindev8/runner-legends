/**
 * RL 2.5D showcase layer — parallax FX, ambient particles, post, light follow.
 * EXTEND-NEVER-OVERWRITE: hooks only; no gameplay balance changes.
 */
(function (global) {
  'use strict';

  var reduced = false;
  var quality = { tier: 'high', particleMul: 1 };
  var ambient = [];
  var AMBIENT_CAP = 80;
  var fxCanvas = null;
  var fxCtx = null;
  var t = 0;
  var lastCueAt = 0;
  var api = null;

  function prefersReduced() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) { return false; }
  }

  function syncReduced() {
    reduced = prefersReduced();
    try {
      if (localStorage.getItem('rl_v7_reduced') === '1') reduced = true;
    } catch (e) { /* ignore */ }
  }

  function ensureFx(view) {
    if (!fxCanvas) {
      fxCanvas = document.createElement('canvas');
      fxCtx = fxCanvas.getContext('2d', { alpha: true });
    }
    var w = Math.max(1, Math.floor(view.c.width));
    var h = Math.max(1, Math.floor(view.c.height));
    if (fxCanvas.width !== w || fxCanvas.height !== h) {
      fxCanvas.width = w;
      fxCanvas.height = h;
    }
  }

  function worldPreset(worldId) {
    var map = {
      neon: { col: '#ff2bd6', mode: 'sparks' },
      golden: { col: '#e8c070', mode: 'sand' },
      ice: { col: '#e8f6ff', mode: 'snow' },
      abyssal: { col: '#2ee8c0', mode: 'bubbles' },
      quantum: { col: '#4aff8a', mode: 'spores' },
      fractal: { col: '#c850ff', mode: 'glitch' },
      igneous: { col: '#ff6030', mode: 'embers' },
      celestial: { col: '#a8c8ff', mode: 'stars' },
      coliseum: { col: '#ffb060', mode: 'sparks' },
      final: { col: '#ffd24a', mode: 'mix' }
    };
    return map[worldId] || map.neon;
  }

  function rebuildAmbient(view, runtime) {
    ambient.length = 0;
    if (reduced || !view) return;
    var n = Math.floor((quality.tier === 'low' ? 18 : quality.tier === 'med' ? 36 : 64) * (quality.particleMul || 1));
    n = Math.min(AMBIENT_CAP, n);
    var pre = worldPreset(runtime && runtime.worldId);
    for (var i = 0; i < n; i++) {
      ambient.push({
        x: Math.random() * view.w,
        y: Math.random() * view.h * 0.85,
        z: 0.15 + Math.random() * 0.85,
        sp: 20 + Math.random() * 60,
        size: 1 + Math.random() * 2.5,
        col: pre.col,
        mode: pre.mode === 'mix' ? (['sparks', 'glitch', 'embers'][i % 3]) : pre.mode,
        ph: Math.random() * 6.28
      });
    }
  }

  function updateAmbient(dt, view, scrollDx) {
    if (!ambient.length) return;
    for (var i = 0; i < ambient.length; i++) {
      var p = ambient[i];
      p.ph += dt;
      p.x -= (scrollDx || 0) * (0.2 + p.z * 0.7);
      p.y += Math.sin(p.ph + p.z) * (reduced ? 0 : 8) * dt;
      if (p.mode === 'snow' || p.mode === 'sand') p.y += p.sp * 0.25 * dt;
      if (p.mode === 'bubbles' || p.mode === 'spores') p.y -= p.sp * 0.2 * dt;
      if (p.x < -20) p.x = view.w + 10;
      if (p.x > view.w + 20) p.x = -10;
      if (p.y < -20) p.y = view.h * 0.8;
      if (p.y > view.h) p.y = -10;
    }
  }

  function drawAmbient(ctx) {
    if (!ambient.length) return;
    ctx.save();
    for (var i = 0; i < ambient.length; i++) {
      var p = ambient[i];
      ctx.globalAlpha = 0.18 + p.z * 0.35;
      ctx.fillStyle = p.col;
      if (p.mode === 'glitch') {
        ctx.fillRect(p.x, p.y, 3 + p.size * 2, 1.5);
      } else if (p.mode === 'sparks' || p.mode === 'embers') {
        ctx.fillRect(p.x, p.y, p.size, p.size * 1.6);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.6 + p.z * 0.5), 0, 6.283);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawFarStars(ctx, view, runtime) {
    if (reduced || quality.tier === 'low') return;
    var pal = (runtime && runtime.world && runtime.world.palette) || { accent: '#22e6ff' };
    ctx.save();
    ctx.globalAlpha = 0.35;
    for (var i = 0; i < 28; i++) {
      var x = ((i * 97 + t * (8 + (i % 4))) % (view.w + 40)) - 20;
      var y = (i * 37) % (view.h * 0.55);
      ctx.fillStyle = i % 3 ? pal.accent : '#ffffff';
      ctx.fillRect(x, y, i % 5 === 0 ? 2.5 : 1.2, i % 5 === 0 ? 2.5 : 1.2);
    }
    ctx.restore();
  }

  function drawPlayerLight(ctx, view, player, runtime) {
    if (!player || reduced) return;
    var pal = (runtime && runtime.world && runtime.world.palette) || { glow: 'rgba(34,230,255,0.35)', accent: '#22e6ff' };
    var cx = player.x;
    var cy = player.y + player.h * 0.4;
    var r = 70 + (player.superGlow || 0) * 50;
    var g = ctx.createRadialGradient(cx, cy, 8, cx, cy, r);
    g.addColorStop(0, pal.glow || 'rgba(34,230,255,0.4)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = quality.tier === 'low' ? 0.25 : 0.45;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 6.283);
    ctx.fill();
    ctx.restore();
  }

  function drawForeground(ctx, view, scrollHint) {
    if (reduced || quality.tier === 'low') return;
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#000';
    var base = view.groundY;
    for (var i = 0; i < 5; i++) {
      var x = ((i * 140 - (scrollHint || 0) * 1.1) % (view.w + 160)) - 80;
      ctx.fillRect(x, base - 18 - (i % 2) * 10, 28, 22 + (i % 3) * 8);
    }
    ctx.restore();
  }

  function postProcess(view, shakeTrauma) {
    if (!view || !view.ctx || quality.tier === 'low' || reduced) return;
    if ((shakeTrauma || 0) < 0.35 && quality.tier !== 'high') return;
    try {
      ensureFx(view);
      var src = view.c;
      var w = fxCanvas.width, h = fxCanvas.height;
      fxCtx.clearRect(0, 0, w, h);
      var ox = Math.round((shakeTrauma || 0) * 3);
      if (ox < 1) return;
      fxCtx.globalCompositeOperation = 'screen';
      fxCtx.globalAlpha = 0.12;
      fxCtx.drawImage(src, ox, 0);
      fxCtx.globalAlpha = 0.1;
      fxCtx.drawImage(src, -ox, 0);
      view.ctx.save();
      view.ctx.setTransform(1, 0, 0, 1, 0, 0);
      view.ctx.globalAlpha = 1;
      view.ctx.globalCompositeOperation = 'screen';
      view.ctx.drawImage(fxCanvas, 0, 0);
      view.ctx.restore();
    } catch (e) { /* ignore */ }
  }

  function afterFrame(ctx, view, bag) {
    if (!ctx || !view || !bag) return;
    t += 0.016;
    var runtime = bag.runtime;
    var player = bag.player;
    var world = bag.world;
    var mgr = bag.mgr;
    var shake = bag.shake;
    var scrollDx = (world && world.speed ? world.speed * 0.016 : 0);

    if (mgr && (mgr.state === 'PLAY' || mgr.state === 'MENU' || mgr.state === 'RESULTS')) {
      if (!ambient.length) rebuildAmbient(view, runtime);
      updateAmbient(0.016, view, scrollDx);
      drawFarStars(ctx, view, runtime);
      drawAmbient(ctx);
      if (mgr.state === 'PLAY') {
        drawPlayerLight(ctx, view, player, runtime);
        drawForeground(ctx, view, world && world.dist);
        maybeCue(world, player, bag.economy);
      }
    }
    postProcess(view, shake && shake.trauma);
  }

  function maybeCue(world, player, economy) {
    if (!global.RLOnboarding || !world) return;
    var now = performance.now();
    if (now - lastCueAt < 2500) return;
    if (economy && economy.super >= 1 && !global.RLOnboarding.seen('super')) {
      lastCueAt = now;
      global.RLOnboarding.onPlayCue('super');
      return;
    }
    var drones = world.drones || [];
    for (var i = 0; i < drones.length; i++) {
      var o = drones[i];
      if (!o || !o.alive) continue;
      var dx = o.x - (player && player.x);
      if (dx > 40 && dx < 160) {
        lastCueAt = now;
        global.RLOnboarding.onPlayCue(o.y < (player && player.y) - 20 ? 'gap' : 'obstacle');
        return;
      }
    }
    var holes = world.holes || [];
    for (var j = 0; j < holes.length; j++) {
      var h = holes[j];
      if (!h) continue;
      if (h.x - (player && player.x) > 30 && h.x - (player && player.x) < 140) {
        lastCueAt = now;
        global.RLOnboarding.onPlayCue('gap');
        return;
      }
    }
  }

  function onWorldChange(view, runtime) {
    rebuildAmbient(view, runtime);
  }

  function shakeScale() {
    return reduced ? 0.25 : 1;
  }

  function onResults(payload) {
    payload = payload || {};
    if (global.RLLeaderboard) {
      global.RLLeaderboard.submit({
        name: payload.name,
        dist: payload.dist,
        combo: payload.combo,
        kills: payload.kills,
        diff: payload.diff,
        world: payload.worldId
      });
    }
    var shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
      shareBtn.onclick = function () {
        if (!global.RLShareCard) return;
        global.RLShareCard.download({
          canvas: payload.canvas,
          dist: payload.dist,
          kills: payload.kills,
          combo: payload.combo,
          world: payload.worldName,
          diff: payload.diff,
          title: payload.cleared ? 'Distrito superado' : 'Carrera terminada'
        });
      };
    }
  }

  function bind(hooks) {
    api = hooks || {};
    syncReduced();
    if (api.quality) quality = api.quality;
    try {
      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', syncReduced);
    } catch (e) { /* ignore */ }
  }

  function setQuality(q) {
    if (q) quality = q;
  }

  global.RL25D = {
    bind: bind,
    afterFrame: afterFrame,
    onWorldChange: onWorldChange,
    onResults: onResults,
    shakeScale: shakeScale,
    setQuality: setQuality,
    syncReduced: syncReduced,
    rebuildAmbient: rebuildAmbient
  };
})(typeof window !== 'undefined' ? window : globalThis);
