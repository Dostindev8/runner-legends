/**
 * Onboarding contextual ~10s — prompts 1 vez, persistidos en localStorage.
 */
(function (global) {
  'use strict';

  var KEY = 'rl_onboard_v1';
  var root = null;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function save(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
  }

  function ensureRoot() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'rl-onboard';
    root.setAttribute('aria-live', 'polite');
    document.body.appendChild(root);
    return root;
  }

  function show(id, text) {
    var st = load();
    if (st[id]) return;
    st[id] = 1;
    save(st);
    var el = ensureRoot();
    el.className = 'rl-onboard show';
    el.textContent = '';
    var tip = document.createElement('div');
    tip.className = 'rl-onboard-tip';
    tip.textContent = String(text || '').slice(0, 80);
    el.appendChild(tip);
    clearTimeout(show._t);
    show._t = setTimeout(function () { el.className = 'rl-onboard'; }, 3200);
  }

  function mark(id) {
    var st = load();
    if (st[id]) return;
    st[id] = 1;
    save(st);
  }

  function onPlayCue(kind) {
    if (kind === 'obstacle') show('jump', '▲ Salta el obstáculo');
    else if (kind === 'gap') show('double', '▲▲ Doble salto en el vacío');
    else if (kind === 'super') show('super', 'SÚPER listo · elige un poder');
  }

  global.RLOnboarding = {
    show: show,
    mark: mark,
    onPlayCue: onPlayCue,
    seen: function (id) { return !!load()[id]; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
