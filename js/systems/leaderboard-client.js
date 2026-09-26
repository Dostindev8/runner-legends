/**
 * Leaderboard local + cliente API (validación + rate visual).
 * Sanitiza nombre: longitud, whitelist, sin HTML.
 */
(function (global) {
  'use strict';

  var KEY = 'rl_lb_v1';
  var MAX = 20;
  var NAME_RE = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 _.\-]{1,16}$/;
  var lastPost = 0;

  function sanitizeName(raw) {
    var s = String(raw == null ? 'Jugador' : raw).trim().slice(0, 16);
    if (!NAME_RE.test(s)) s = s.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9 _.\-]/g, '').slice(0, 16);
    return s || 'Jugador';
  }

  function loadLocal() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(d) ? d.slice(0, MAX) : [];
    } catch (e) { return []; }
  }

  function saveLocal(rows) {
    try { localStorage.setItem(KEY, JSON.stringify(rows.slice(0, MAX))); } catch (e) { /* ignore */ }
  }

  function validateScore(entry) {
    var dist = Math.max(0, Math.min(50000, Math.floor(Number(entry.dist) || 0)));
    var combo = Math.max(0, Math.min(999, Math.floor(Number(entry.combo) || 0)));
    var kills = Math.max(0, Math.min(500, Math.floor(Number(entry.kills) || 0)));
    var diff = String(entry.diff || 'normal').slice(0, 16);
    var world = String(entry.world || 'neon').slice(0, 24);
    if (dist > 20000) return null; // físicamente sospechoso sin cheat
    return {
      name: sanitizeName(entry.name),
      dist: dist,
      combo: combo,
      kills: kills,
      diff: diff,
      world: world,
      at: Date.now()
    };
  }

  function submit(entry) {
    var row = validateScore(entry);
    if (!row) return Promise.resolve({ ok: false, local: loadLocal() });
    var list = loadLocal();
    list.push(row);
    list.sort(function (a, b) { return b.dist - a.dist || b.combo - a.combo; });
    list = list.slice(0, MAX);
    saveLocal(list);

    var now = Date.now();
    if (now - lastPost < 4000) return Promise.resolve({ ok: true, local: list, throttled: true });
    lastPost = now;

    return fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
      credentials: 'same-origin'
    }).then(function (r) {
      if (!r.ok) return { ok: true, local: list, remote: false };
      return r.json().then(function (j) {
        return { ok: true, local: list, remote: j && j.top ? j.top : null };
      });
    }).catch(function () {
      return { ok: true, local: list, remote: false };
    });
  }

  function top(n) {
    return loadLocal().slice(0, n || 10);
  }

  global.RLLeaderboard = {
    sanitizeName: sanitizeName,
    submit: submit,
    top: top,
    validateScore: validateScore
  };
})(typeof window !== 'undefined' ? window : globalThis);
