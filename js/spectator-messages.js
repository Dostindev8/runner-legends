/**
 * Runner Legends Ω.3 — Spectator hype overlay.
 * Offline-first: pool embedded, no fetch. Anti-repetition within session.
 */
(function (global) {
  'use strict';

  const FALLBACK = ['El Distrito no perdona a los débiles. — Dostin Santana'];
  const recent = [];
  let timer = 0;

  function pool() {
    const C = global.RLContentV6;
    return (C && Array.isArray(C.HYPE_MESSAGES) && C.HYPE_MESSAGES.length) ? C.HYPE_MESSAGES : FALLBACK;
  }

  function pick() {
    const all = pool();
    const fresh = all.filter((m) => recent.indexOf(m) === -1);
    const src = fresh.length ? fresh : all;
    const msg = src[Math.floor(Math.random() * src.length)];
    recent.push(msg);
    while (recent.length > Math.max(4, Math.floor(all.length / 2))) recent.shift();
    return msg;
  }

  /**
   * Show the overlay, then run onDone after the cinematic beat.
   * @param {function} onDone
   * @param {number} [ms] 2500–3500
   */
  function show(onDone, ms) {
    const el = document.getElementById('spectatorMsg');
    const dur = Math.min(3500, Math.max(2500, ms || 2900));
    if (!el) { if (onDone) onDone(); return; }
    el.textContent = pick();
    el.classList.remove('hidden');
    // Force reflow so the fade restarts on repeated runs
    void el.offsetWidth;
    el.classList.add('on');
    clearTimeout(timer);
    timer = setTimeout(() => {
      el.classList.remove('on');
      setTimeout(() => {
        el.classList.add('hidden');
        if (onDone) onDone();
      }, 320);
    }, dur - 320);
  }

  function skip() {
    const el = document.getElementById('spectatorMsg');
    clearTimeout(timer);
    if (el) { el.classList.remove('on'); el.classList.add('hidden'); }
  }

  global.RLSpectator = { pick, show, skip };
})(typeof window !== 'undefined' ? window : globalThis);
