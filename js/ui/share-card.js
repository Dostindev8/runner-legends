/**
 * Share card — captura canvas + stats (descarga PNG). Sin innerHTML inseguro.
 */
(function (global) {
  'use strict';

  function escText(s) {
    return String(s == null ? '' : s).slice(0, 48);
  }

  function build(opts) {
    opts = opts || {};
    var W = 720, H = 405;
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var ctx = c.getContext('2d');
    if (!ctx) return null;

    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#050218');
    g.addColorStop(1, '#1a0750');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    try {
      var src = opts.canvas;
      if (src && src.width) {
        ctx.globalAlpha = 0.55;
        ctx.drawImage(src, 0, 0, W, H);
        ctx.globalAlpha = 1;
      }
    } catch (e) { /* tainted / ignore */ }

    ctx.fillStyle = 'rgba(4,8,20,0.72)';
    ctx.fillRect(36, 48, W - 72, H - 96);

    ctx.fillStyle = '#22e6ff';
    ctx.font = '800 28px Orbitron, sans-serif';
    ctx.fillText('RUNNER LEGENDS', 56, 100);

    ctx.fillStyle = '#f4f7ff';
    ctx.font = '700 22px Rajdhani, sans-serif';
    ctx.fillText(escText(opts.title || 'Carrera'), 56, 140);

    ctx.fillStyle = '#9aa6c3';
    ctx.font = '600 18px Rajdhani, sans-serif';
    var lines = [
      'Distancia ' + Math.floor(opts.dist || 0) + ' m',
      'KO ' + Math.floor(opts.kills || 0) + ' · Combo ×' + Math.floor(opts.combo || 0),
      escText(opts.world || '') + ' · ' + escText(opts.diff || ''),
      'Logic Code Spot · Dostin Santana · IP original'
    ];
    for (var i = 0; i < lines.length; i++) ctx.fillText(lines[i], 56, 180 + i * 32);

    return c;
  }

  function download(opts) {
    var c = build(opts);
    if (!c) return false;
    try {
      var a = document.createElement('a');
      a.download = 'runner-legends-' + Math.floor(opts.dist || 0) + 'm.png';
      a.href = c.toDataURL('image/png');
      a.click();
      return true;
    } catch (e) {
      return false;
    }
  }

  global.RLShareCard = { build: build, download: download };
})(typeof window !== 'undefined' ? window : globalThis);
