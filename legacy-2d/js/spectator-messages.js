/**
 * Runner Legends v7 — Pre-match voice card (skip after 1.2s, aria-live).
 */
(function (global) {
  'use strict';
  let timer = 0;
  let shownAt = 0;
  let onDone = null;
  let sessionTry = 0;
  let losses = 0;

  function noteLoss() { losses++; }
  function noteWin() { losses = 0; }

  function renderCard(msg) {
    const el = document.getElementById('spectatorMsg');
    if (!el) return null;
    el.textContent = '';
    const card = document.createElement('article');
    card.className = 'spec-card';
    const badge = document.createElement('span');
    badge.className = 'spec-badge';
    badge.textContent = msg.category || 'MOTIVACION';
    badge.style.background = (global.RLMessages && RLMessages.COL[msg.category]) || '#22d3ee';
    const p = document.createElement('p');
    p.className = 'spec-text';
    p.textContent = msg.text || msg;
    const cite = document.createElement('cite');
    cite.className = 'spec-sign';
    cite.textContent = '— Dostin Santana';
    const skip = document.createElement('button');
    skip.type = 'button';
    skip.className = 'spec-skip';
    skip.textContent = 'Saltar ›';
    skip.addEventListener('click', () => { if (performance.now() - shownAt >= 1200) finish(); });
    card.appendChild(badge); card.appendChild(p); card.appendChild(cite); card.appendChild(skip);
    el.appendChild(card);
    return el;
  }

  function finish() {
    const el = document.getElementById('spectatorMsg');
    clearTimeout(timer);
    if (el) { el.classList.remove('on'); el.classList.add('hidden'); el.textContent = ''; }
    const cb = onDone; onDone = null;
    if (cb) cb();
  }

  function pickMsg(save) {
    if (global.RLMessages && RLMessages.pick) {
      return RLMessages.pick(save && save.activeChar, { sessionTry: sessionTry, losses: losses });
    }
    const C = global.RLContentV6;
    const pool = (C && C.HYPE_MESSAGES) || ['El Distrito no perdona a los débiles. — Dostin Santana'];
    return { text: pool[Math.floor(Math.random() * pool.length)], category: 'MOTIVACION' };
  }

  function show(done, ms, save) {
    sessionTry++;
    onDone = done;
    const msg = pickMsg(save);
    const el = renderCard(msg);
    const dur = Math.min(4200, Math.max(2800, ms || 3400));
    if (!el) { if (done) done(); return; }
    el.classList.remove('hidden');
    void el.offsetWidth;
    el.classList.add('on');
    shownAt = performance.now();
    clearTimeout(timer);
    timer = setTimeout(finish, dur);
  }

  function skip() {
    if (performance.now() - shownAt < 1200) return;
    finish();
  }

  global.RLSpectator = { show: show, skip: skip, noteLoss: noteLoss, noteWin: noteWin };
})(typeof window !== 'undefined' ? window : globalThis);
