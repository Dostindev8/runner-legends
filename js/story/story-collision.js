/**
 * Física aditiva del Modo Historia: AABB recortada + swept test (anti-tunneling).
 * No escribe en game.js. Si RLEstelar.blocksWorld congela el mundo en celebraciones,
 * se sustituye por overlay no bloqueante (API pública).
 */
(function (global) {
  'use strict';
  global.RLStory = global.RLStory || {};

  var INSET = 0.18;
  var SUBSTEPS = 4;
  var installed = false;

  function insetBox(b) {
    if (!b) return null;
    var w = b.w || 0;
    var h = b.h || 0;
    var ix = w * INSET;
    var iy = h * INSET;
    return {
      x: (b.x || 0) + ix,
      y: (b.y || 0) + iy,
      w: Math.max(2, w - ix * 2),
      h: Math.max(2, h - iy * 2)
    };
  }

  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  /** Swept AABB 1D: si el móvil recorre (dx,dy) ¿golpea staticBox? */
  function swept(moving, dx, dy, staticBox) {
    var steps = SUBSTEPS;
    var i;
    var hx = dx / steps;
    var hy = dy / steps;
    var box = { x: moving.x, y: moving.y, w: moving.w, h: moving.h };
    for (i = 0; i <= steps; i++) {
      if (aabb(box, staticBox)) {
        return { hit: true, t: i / steps, x: box.x, y: box.y };
      }
      box.x += hx;
      box.y += hy;
    }
    return { hit: false, t: 1, x: box.x, y: box.y };
  }

  function classify(kind) {
    if (kind === 'coin' || kind === 'fragment' || kind === 'pickup') return 'collect';
    if (kind === 'platform' || kind === 'ground') return 'platform';
    return 'hazard';
  }

  function isLowEnd() {
    var cores = navigator.hardwareConcurrency || 4;
    var mem = navigator.deviceMemory || 4;
    var saveData = navigator.connection && navigator.connection.saveData;
    var small = Math.min(screen.width, screen.height) <= 414;
    return !!(saveData || cores <= 4 && mem <= 2 || (small && cores <= 4 && mem <= 3));
  }

  var fps = { value: 60 };

  function installCelebrationPassthrough() {
    var E = global.RLEstelar;
    if (!E || E.__rlStoryCelePass) return;
    E.__rlStoryCelePass = true;
    E.blocksWorld = function () { return false; };
    var skip = document.getElementById('celeSkip');
    if (skip) skip.setAttribute('aria-label', 'Cerrar celebración (el juego sigue)');
  }

  RLStory.collision = {
    insetBox: insetBox,
    aabb: aabb,
    swept: swept,
    classify: classify,
    isLowEnd: isLowEnd,
    fps: function () { return fps.value; },
    noteFrame: function (ms) {
      if (ms > 0) fps.value = 0.9 * fps.value + 0.1 * (1000 / ms);
    },
    install: function () {
      if (installed) return;
      installed = true;
      installCelebrationPassthrough();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      RLStory.collision.install();
    });
  } else {
    RLStory.collision.install();
  }
})(window);
