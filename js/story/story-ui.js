/**
 * UI del Modo Historia: universo vivo por galaxia + camino zigzag.
 * No lee variables internas de game.js. JUGAR usa el DOM público.
 */
(function (global) {
  'use strict';
  global.RLStory = global.RLStory || {};

  var openFlag = false;
  var selected = null;
  var prevNav = null;
  var bound = false;
  var cosmosRaf = 0;
  var cosmosStars = [];
  var cosmosThemeId = 'neon';

  var THEMES = {
    neon: { bg: '#050218', neb: ['rgba(255,43,214,0.22)', 'rgba(34,230,255,0.18)'], star: '#c8f7ff', planet: '#22e6ff' },
    golden: { bg: '#120804', neb: ['rgba(255,180,60,0.28)', 'rgba(196,120,20,0.2)'], star: '#ffe9a8', planet: '#ffd24a' },
    ice: { bg: '#040c18', neb: ['rgba(120,220,255,0.28)', 'rgba(180,240,255,0.12)'], star: '#e8fbff', planet: '#9ff0ff' },
    coliseum: { bg: '#100808', neb: ['rgba(255,160,80,0.22)', 'rgba(180,60,30,0.16)'], star: '#ffe0b0', planet: '#ffb060' },
    abyssal: { bg: '#020818', neb: ['rgba(46,232,192,0.22)', 'rgba(20,80,90,0.2)'], star: '#b8fff4', planet: '#2ee8c0' },
    celestial: { bg: '#0c1430', neb: ['rgba(168,200,255,0.26)', 'rgba(255,255,255,0.1)'], star: '#f4f7ff', planet: '#a8c8ff' }
  };

  function $(id) { return document.getElementById(id); }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function starChars(n) {
    var s = '';
    var i;
    for (i = 1; i <= 3; i++) s += i <= n ? '★' : '☆';
    return s;
  }

  function text(el, value) {
    if (el) el.textContent = value == null ? '' : String(value);
  }

  function prefersReduce() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /**
   * Anula la tarjeta "Saltar presentación" (RLSpectator) sin editar game.js.
   * JUGAR entra directo a la partida.
   */
  function silenceSpectator() {
    if (!global.RLSpectator || global.RLSpectator.__rlStoryQuiet) return;
    global.RLSpectator.__rlStoryQuiet = true;
    global.RLSpectator.show = function (done) {
      var el = $('spectatorMsg');
      if (el) {
        el.classList.add('hidden');
        el.classList.remove('on');
        el.textContent = '';
      }
      var skip = $('skipBtn');
      if (skip) skip.classList.add('hidden');
      if (typeof done === 'function') done();
    };
  }

  function playerBits() {
    var nameEl = $('profileName');
    var lvlEl = $('profileLevel');
    var coinsEl = $('profileCoins');
    var lv = 1;
    if (lvlEl) {
      var m = String(lvlEl.textContent || '').match(/\d+/);
      if (m) lv = parseInt(m[0], 10) || 1;
    }
    var cur = Math.min(99, lv * 5);
    var next = lv * 500 + 125;
    return {
      name: nameEl ? nameEl.textContent : 'Jugador',
      level: lvlEl ? lvlEl.textContent : 'Nivel 1',
      coins: coinsEl ? coinsEl.textContent : '0',
      xpCur: cur,
      xpNext: next,
      xpPct: Math.max(8, Math.min(92, (cur / next) * 100))
    };
  }

  function hideLayersForStory(hide) {
    document.body.classList.toggle('rl-story-open', hide);
    var menu = $('menu');
    if (menu) {
      if (hide) menu.setAttribute('aria-hidden', 'true');
      else menu.removeAttribute('aria-hidden');
    }
  }

  function stopCosmos() {
    if (cosmosRaf) {
      cancelAnimationFrame(cosmosRaf);
      cosmosRaf = 0;
    }
  }

  function seedStars(w, h) {
    cosmosStars = [];
    var low = RLStory.collision && RLStory.collision.isLowEnd && RLStory.collision.isLowEnd();
    var n = Math.min(low ? 48 : 140, Math.floor((w * h) / (low ? 18000 : 9000)));
    var i;
    for (i = 0; i < n; i++) {
      cosmosStars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.6 + 0.3,
        tw: Math.random() * Math.PI * 2,
        sp: 0.08 + Math.random() * 0.18
      });
    }
  }

  function drawCosmos(canvas, t) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var w = canvas.width;
    var h = canvas.height;
    var th = THEMES[cosmosThemeId] || THEMES.neon;
    ctx.fillStyle = th.bg;
    ctx.fillRect(0, 0, w, h);

    var gx = w * (0.5 + Math.sin(t * 0.00007) * 0.08);
    var gy = h * (0.42 + Math.cos(t * 0.00009) * 0.06);
    var neb = ctx.createRadialGradient(gx, gy, 10, gx, gy, Math.max(w, h) * 0.55);
    neb.addColorStop(0, th.neb[0]);
    neb.addColorStop(0.55, th.neb[1]);
    neb.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = th.star;
    cosmosStars.forEach(function (s) {
      var a = 0.35 + Math.sin(t * 0.0015 + s.tw) * 0.35;
      ctx.globalAlpha = a;
      s.x += s.sp * 0.15;
      if (s.x > w + 4) s.x = -4;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    var px = w * 0.82 + Math.sin(t * 0.00012) * 18;
    var py = h * 0.22 + Math.cos(t * 0.0001) * 12;
    var pg = ctx.createRadialGradient(px - 12, py - 10, 4, px, py, 46);
    pg.addColorStop(0, '#fff');
    pg.addColorStop(0.25, th.planet);
    pg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(px, py, 46, 0, Math.PI * 2);
    ctx.fill();
  }

  function startCosmos(canvas) {
    stopCosmos();
    if (!canvas) return;
    function size() {
      var r = canvas.parentElement ? canvas.parentElement.getBoundingClientRect() : { width: 375, height: 700 };
      var low = RLStory.collision && RLStory.collision.isLowEnd && RLStory.collision.isLowEnd();
      var dpr = low ? 1 : Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(320, Math.floor(r.width * dpr));
      canvas.height = Math.max(480, Math.floor(r.height * dpr));
      seedStars(canvas.width, canvas.height);
    }
    size();
    if (prefersReduce()) {
      drawCosmos(canvas, 0);
      return;
    }
    var lastC = 0;
    function loop(now) {
      if (!openFlag) return;
      if (lastC && RLStory.collision && RLStory.collision.noteFrame) RLStory.collision.noteFrame(now - lastC);
      lastC = now;
      drawCosmos(canvas, now);
      cosmosRaf = requestAnimationFrame(loop);
    }
    cosmosRaf = requestAnimationFrame(loop);
  }

  function q(root, key) {
    return root.querySelector('[data-rl="' + key + '"]');
  }

  function buildShell(root) {
    root.innerHTML = '';
    root.className = 'rl-story-hidden';
    root.setAttribute('aria-hidden', 'true');

    var cosmos = document.createElement('div');
    cosmos.className = 'rl-story-cosmos';
    cosmos.setAttribute('aria-hidden', 'true');
    cosmos.innerHTML = '<canvas data-rl="cosmos"></canvas>';
    root.appendChild(cosmos);

    var shell = document.createElement('div');
    shell.className = 'rl-story-shell';
    shell.innerHTML =
      '<div class="rl-story-status">' +
        '<div class="rl-story-avatar" aria-hidden="true"></div>' +
        '<div class="rl-story-player"><b data-rl="pname"></b><span data-rl="plvl"></span></div>' +
        '<div class="rl-story-xp" role="meter" aria-label="Experiencia"><i data-rl="xpfill"></i></div>' +
        '<span class="rl-story-xp-meta" data-rl="xpmeta">0 – 100</span>' +
        '<span class="rl-story-coins" aria-label="Monedas">◎ <span data-rl="coins">0</span></span>' +
        '<button type="button" class="rl-story-icon-btn" data-rl="plus" aria-label="Añadir monedas (próximamente)">+</button>' +
        '<button type="button" class="rl-story-icon-btn" data-rl="gear" aria-label="Cerrar Modo Historia">⚙</button>' +
      '</div>' +
      '<header class="rl-story-head">' +
        '<h1 class="rl-story-title">📖 MODO HISTORIA</h1>' +
        '<p class="rl-story-sub">Vive la aventura · Completa las galaxias · Desbloquea nuevos mundos</p>' +
      '</header>' +
      '<div class="rl-story-galaxy-row">' +
        '<span class="rl-story-galaxy-name" data-rl="gname"></span>' +
        '<span class="rl-story-galaxy-count" data-rl="gcount"></span>' +
      '</div>' +
      '<div class="rl-story-path">' +
        '<div class="rl-story-orbit" aria-hidden="true"></div>' +
        '<ol class="rl-story-nodes" data-rl="nodes"></ol>' +
      '</div>' +
      '<button type="button" class="rl-story-next" data-rl="next">Siguiente galaxia</button>' +
      '<section class="rl-story-detail" aria-live="polite">' +
        '<img class="rl-story-thumb" data-rl="thumb" alt="">' +
        '<div>' +
          '<p class="rl-story-lvl" data-rl="lvl"></p>' +
          '<h3 data-rl="lname"></h3>' +
          '<p class="rl-story-flavor" data-rl="flavor"></p>' +
          '<ul class="rl-story-obj" data-rl="obj"></ul>' +
          '<div class="rl-story-detail-meta">' +
            '<span data-rl="reward"></span>' +
            '<span data-rl="stars"></span>' +
          '</div>' +
        '</div>' +
        '<div class="rl-story-play-row">' +
          '<button type="button" class="rl-story-guide-btn" data-rl="guide" aria-label="Ficha del personaje guía"></button>' +
          '<button type="button" class="rl-story-play" data-rl="play">▶ JUGAR</button>' +
        '</div>' +
      '</section>';
    root.appendChild(shell);

    var sheet = document.createElement('div');
    sheet.className = 'rl-story-sheet rl-story-hidden';
    sheet.setAttribute('data-rl', 'sheet');
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', 'Personaje guía');
    sheet.innerHTML = '<div class="rl-story-sheet-card" data-rl="sheet-card"></div>';
    root.appendChild(sheet);
  }

  function fillDetail(root, galaxy, world, level, progress) {
    var status = RLStory.state.nodeStatus(galaxy, world, level, progress);
    var stars = RLStory.state.getStars(level.id, progress);
    var thumb = q(root, 'thumb');
    if (thumb) {
      thumb.loading = 'lazy';
      thumb.decoding = 'async';
      thumb.src = world.thumbnail;
      thumb.alt = 'Miniatura de ' + world.name;
    }
    text(q(root, 'lvl'), 'PLANETA · NIVEL ' + level.index);
    text(q(root, 'lname'), level.name);
    var flavor = [];
    if (world.obstacle) flavor.push(world.obstacle);
    if (world.rival) flavor.push('Rival juguetón: ' + world.rival);
    text(q(root, 'flavor'), flavor.join(' · '));
    var obj = q(root, 'obj');
    if (obj) {
      obj.innerHTML = '';
      (level.objectives || []).forEach(function (line) {
        var li = document.createElement('li');
        li.textContent = line;
        obj.appendChild(li);
      });
    }
    text(q(root, 'reward'), 'Recompensa ◎ ' + (level.reward && level.reward.coins ? level.reward.coins : 0));
    text(q(root, 'stars'), 'Estrellas ' + stars + '/3');
    var play = q(root, 'play');
    if (play) {
      var locked = status === 'locked';
      play.disabled = locked;
      play.setAttribute('aria-disabled', locked ? 'true' : 'false');
    }
    var guideBtn = q(root, 'guide');
    var char = RLStory.getCharacter(world.guideCharacterId);
    if (guideBtn) {
      guideBtn.innerHTML = '';
      if (char) {
        var img = document.createElement('img');
        img.src = char.portrait;
        img.alt = char.name;
        guideBtn.appendChild(img);
        guideBtn.setAttribute('aria-label', 'Ficha de ' + char.name);
      }
    }
  }

  function renderNodes(root, galaxy, progress) {
    var list = q(root, 'nodes');
    if (!list) return;
    list.innerHTML = '';
    var nodes = RLStory.data.levelsOfGalaxy(galaxy);
    nodes.forEach(function (n) {
      var st = RLStory.state.nodeStatus(galaxy, n.world, n.level, progress);
      var stars = RLStory.state.getStars(n.level.id, progress);
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rl-story-node is-' + st;
      btn.style.backgroundImage = 'url("' + n.world.thumbnail + '")';
      btn.setAttribute('aria-label', n.level.name + ', nivel ' + n.level.index + ', ' + stars + ' estrellas');
      btn.setAttribute('aria-pressed', selected && selected.level.id === n.level.id ? 'true' : 'false');
      if (selected && selected.level.id === n.level.id) btn.classList.add('rl-story-node-on');
      var num = document.createElement('span');
      num.className = 'rl-story-node-num';
      num.textContent = pad2(n.level.index);
      var stEl = document.createElement('span');
      stEl.className = 'rl-story-node-stars';
      stEl.textContent = starChars(stars);
      var coins = document.createElement('span');
      coins.className = 'rl-story-node-coins';
      coins.textContent = '◎ ' + n.level.reward.coins;
      btn.appendChild(num);
      btn.appendChild(stEl);
      btn.appendChild(coins);
      if (st === 'locked') {
        var lock = document.createElement('span');
        lock.className = 'rl-story-lock';
        lock.setAttribute('aria-hidden', 'true');
        lock.textContent = '🔒';
        btn.appendChild(lock);
      }
      btn.addEventListener('click', function () {
        selected = { galaxy: galaxy, world: n.world, level: n.level };
        if (RLStory.audio) RLStory.audio.ui('select');
        RLStory.ui.refresh();
      });
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  function nextGalaxy(galaxy) {
    var list = RLStory.data.galaxies;
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i].id === galaxy.id) return list[i + 1] || null;
    }
    return null;
  }

  function openGuide(root, world) {
    var char = RLStory.getCharacter(world.guideCharacterId);
    var sheet = q(root, 'sheet');
    var card = q(root, 'sheet-card');
    if (!sheet || !card || !char) return;
    card.innerHTML = '';
    var img = document.createElement('img');
    img.src = char.portrait;
    img.alt = 'Retrato de ' + char.name;
    var h = document.createElement('h2');
    h.textContent = char.name;
    var role = document.createElement('p');
    role.textContent = char.role + ' · ' + char.worldName;
    var bio = document.createElement('p');
    bio.textContent = char.bio;
    var bars = document.createElement('div');
    bars.className = 'rl-story-bars';
    ['vel', 'salto', 'combo'].forEach(function (k) {
      var lab = document.createElement('div');
      lab.textContent = k.toUpperCase() + ' · ' + char.stats[k];
      var bar = document.createElement('div');
      bar.className = 'rl-story-bar';
      var i = document.createElement('i');
      i.style.width = (char.statBars[k] || 50) + '%';
      bar.appendChild(i);
      bars.appendChild(lab);
      bars.appendChild(bar);
    });
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'rl-story-play rl-story-sheet-close';
    close.setAttribute('data-rl', 'sheet-close');
    close.textContent = 'CERRAR';
    close.addEventListener('click', function (ev) {
      ev.stopPropagation();
      sheet.classList.add('rl-story-hidden');
    });
    card.appendChild(img);
    card.appendChild(h);
    card.appendChild(role);
    card.appendChild(bio);
    card.appendChild(bars);
    card.appendChild(close);
    sheet.classList.remove('rl-story-hidden');
  }

  function startPlay() {
    if (!selected) return;
    var status = RLStory.state.nodeStatus(selected.galaxy, selected.world, selected.level);
    if (status === 'locked') return;
    silenceSpectator();
    if (RLStory.audio) RLStory.audio.ui('play');
    var engineId = selected.world.engineWorldId;
    RLStory.ui.close();
    var tile = document.querySelector('[data-world="' + engineId + '"]:not([disabled])');
    if (tile) tile.click();
    var play = $('playBtn');
    if (play) play.click();
    else console.warn('[RLStory] Integración pendiente: no hay #playBtn', selected.level.id);
  }

  function paint() {
    var root = $('rl-story-root');
    if (!root || !q(root, 'nodes')) return;
    RLStory.state.recalculateGalaxyProgress();
    var progress = RLStory.state.load();
    var galaxy = RLStory.state.getActiveGalaxy();
    if (!galaxy) return;

    var world0 = galaxy.worlds && galaxy.worlds[0];
    cosmosThemeId = (world0 && world0.cosmos) || 'neon';

    var bits = playerBits();
    text(q(root, 'pname'), bits.name);
    text(q(root, 'plvl'), bits.level);
    text(q(root, 'coins'), bits.coins);
    text(q(root, 'xpmeta'), bits.xpCur + ' – ' + bits.xpNext);
    var fill = q(root, 'xpfill');
    if (fill) fill.style.width = bits.xpPct + '%';

    text(q(root, 'gname'), galaxy.shortLabel || galaxy.name);
    var count = RLStory.state.countGalaxyNodes(galaxy, progress);
    text(q(root, 'gcount'), count.completed + '/' + count.total + ' PLANETAS COMPLETADOS');

    var nodes = RLStory.data.levelsOfGalaxy(galaxy);
    if (!selected || selected.galaxy.id !== galaxy.id) {
      selected = nodes[0] ? { galaxy: galaxy, world: nodes[0].world, level: nodes[0].level } : null;
    }
    renderNodes(root, galaxy, progress);
    if (selected) fillDetail(root, selected.galaxy, selected.world, selected.level, progress);

    var nxt = q(root, 'next');
    var following = nextGalaxy(galaxy);
    if (nxt) {
      if (!following) {
        nxt.textContent = 'Fin del camino estelar';
        nxt.disabled = true;
      } else {
        var gp = progress.galaxyProgress[galaxy.id] || { planetsCompleted: 0, totalPlanets: 1 };
        var ready = gp.planetsCompleted >= gp.totalPlanets && gp.totalPlanets > 0;
        if (RLStory.state.isForceUnlock(progress)) ready = true;
        nxt.disabled = !ready;
        nxt.textContent = 'SIGUIENTE GALAXIA · ' + following.name;
        nxt.onclick = function () {
          if (nxt.disabled) return;
          RLStory.state.setActiveGalaxy(following.id);
          selected = null;
          RLStory.ui.refresh();
          startCosmos(q(root, 'cosmos'));
        };
      }
    }
  }

  function bindOnce() {
    if (bound) return;
    bound = true;
    silenceSpectator();
    var root = $('rl-story-root');
    var nav = $('rl-nav-historia');
    if (nav) {
      nav.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        RLStory.ui.open();
      });
    }
    var legacy = $('historiaBtn');
    if (legacy) {
      legacy.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        RLStory.ui.open();
      }, true);
    }
    document.querySelectorAll('[data-nav]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (openFlag) RLStory.ui.close();
      });
    });
    if (!root) return;
    root.addEventListener('click', function (ev) {
      var t = ev.target;
      if (!(t instanceof Element)) return;
      if (t.closest('[data-rl="gear"]')) { RLStory.ui.close(); return; }
      if (t.closest('[data-rl="plus"]')) return;
      if (t.closest('[data-rl="sheet-close"]')) {
        var shClose = q(root, 'sheet');
        if (shClose) shClose.classList.add('rl-story-hidden');
        return;
      }
      if (t.closest('[data-rl="play"]') && !t.closest('[data-rl="sheet"]')) {
        startPlay();
        return;
      }
      if (t.closest('[data-rl="guide"]') && selected) {
        openGuide(root, selected.world);
        return;
      }
      if (t.getAttribute('data-rl') === 'sheet') {
        q(root, 'sheet').classList.add('rl-story-hidden');
      }
    });
  }

  RLStory.ui = {
    isOpen: function () { return openFlag; },
    refresh: function () { if (openFlag) paint(); },
    open: function () {
      var root = $('rl-story-root');
      if (!root) return;
      silenceSpectator();
      if (RLStory.audio) { RLStory.audio.warm(); RLStory.audio.ui('open'); }
      if (RLStory.collision) RLStory.collision.install();
      if (!q(root, 'cosmos')) buildShell(root);
      bindOnce();
      openFlag = true;
      root.classList.remove('rl-story-hidden');
      root.setAttribute('aria-hidden', 'false');
      hideLayersForStory(true);
      var nav = $('rl-nav-historia');
      prevNav = document.querySelector('[data-nav].on');
      document.querySelectorAll('[data-nav]').forEach(function (x) { x.classList.remove('on'); });
      if (nav) { nav.classList.add('on'); nav.classList.add('rl-story-nav-on'); }
      paint();
      startCosmos(q(root, 'cosmos'));
      var play = q(root, 'play');
      if (play) play.focus();
    },
    close: function () {
      var root = $('rl-story-root');
      openFlag = false;
      stopCosmos();
      if (root) {
        root.classList.add('rl-story-hidden');
        root.setAttribute('aria-hidden', 'true');
        var sheet = q(root, 'sheet');
        if (sheet) sheet.classList.add('rl-story-hidden');
      }
      hideLayersForStory(false);
      var nav = $('rl-nav-historia');
      if (nav) { nav.classList.remove('on'); nav.classList.remove('rl-story-nav-on'); }
      if (prevNav) prevNav.classList.add('on');
      else {
        var home = document.querySelector('[data-nav="home"]');
        if (home) home.classList.add('on');
      }
    }
  };

  function boot() {
    silenceSpectator();
    var root = $('rl-story-root');
    if (root) buildShell(root);
    bindOnce();
    if (typeof RLStory.initProgressListener === 'function') RLStory.initProgressListener();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
