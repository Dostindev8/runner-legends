/**
 * Render y navegación del Modo Historia.
 * Oculta la pantalla activa sin desmontarla. JUGAR usa solo el DOM público (#playBtn).
 */
(function (global) {
  'use strict';
  global.RLStory = global.RLStory || {};

  var openFlag = false;
  var selected = null; /* { galaxy, world, level } */
  var prevNav = null;
  var bound = false;

  function $(id) { return document.getElementById(id); }

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function starChars(n) {
    var s = '';
    var i;
    for (i = 1; i <= 3; i++) s += i <= n ? '★' : '☆';
    return s;
  }

  function text(el, value) {
    if (el) el.textContent = value == null ? '' : String(value);
  }

  function playerBits() {
    var nameEl = $('profileName');
    var lvlEl = $('profileLevel');
    var coinsEl = $('profileCoins');
    return {
      name: nameEl ? nameEl.textContent : 'Jugador',
      level: lvlEl ? lvlEl.textContent : 'Nivel 1',
      coins: coinsEl ? coinsEl.textContent : '0'
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

  function buildShell(root) {
    root.innerHTML = '';
    root.className = 'rl-story-hidden';
    root.setAttribute('aria-hidden', 'true');

    var shell = document.createElement('div');
    shell.className = 'rl-story-shell';
    shell.innerHTML =
      '<div class="rl-story-status">' +
        '<div class="rl-story-avatar" aria-hidden="true"></div>' +
        '<div class="rl-story-player"><b data-rl="pname"></b><span data-rl="plvl"></span></div>' +
        '<div class="rl-story-stamina" role="meter" aria-label="Energía" aria-valuemin="0" aria-valuemax="5" aria-valuenow="5"><i></i></div>' +
        '<span class="rl-story-stamina-meta" data-rl="stamina">5 · 03:25</span>' +
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
        '<div class="rl-story-path-line" aria-hidden="true"></div>' +
        '<ol class="rl-story-nodes" data-rl="nodes"></ol>' +
      '</div>' +
      '<button type="button" class="rl-story-next" data-rl="next">Siguiente galaxia</button>' +
      '<section class="rl-story-detail" aria-live="polite">' +
        '<img class="rl-story-thumb" data-rl="thumb" alt="">' +
        '<div>' +
          '<p class="rl-story-lvl" data-rl="lvl"></p>' +
          '<h3 data-rl="lname"></h3>' +
          '<ul class="rl-story-obj" data-rl="obj"></ul>' +
          '<div class="rl-story-detail-meta">' +
            '<span data-rl="reward"></span>' +
            '<span data-rl="stars"></span>' +
          '</div>' +
        '</div>' +
        '<div class="rl-story-play-row">' +
          '<button type="button" class="rl-story-guide-btn" data-rl="guide" aria-label="Ficha del personaje guía">👤</button>' +
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

  function q(root, key) {
    return root.querySelector('[data-rl="' + key + '"]');
  }

  function fillDetail(root, galaxy, world, level, progress) {
    var status = RLStory.state.nodeStatus(galaxy, world, level, progress);
    var stars = RLStory.state.getStars(level.id, progress);
    var thumb = q(root, 'thumb');
    if (thumb) {
      thumb.src = world.thumbnail;
      thumb.alt = 'Miniatura de ' + world.name;
    }
    text(q(root, 'lvl'), 'PLANETA · NIVEL ' + level.index);
    text(q(root, 'lname'), level.name);
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
      btn.setAttribute('aria-label', n.level.name + ', nivel ' + n.level.index + ', ' + stars + ' estrellas, ' + st);
      if (selected && selected.level.id === n.level.id) {
        btn.classList.add('rl-story-node-on');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.setAttribute('aria-pressed', 'false');
      }
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
    var engineId = selected.world.engineWorldId;
    RLStory.ui.close();
    var tile = document.querySelector('[data-world="' + engineId + '"]:not([disabled])');
    if (tile) tile.click();
    var play = $('playBtn');
    if (play) {
      play.click();
    } else {
      console.warn('[RLStory] Integración pendiente: no hay #playBtn para iniciar el nivel', selected.level.id);
    }
  }

  function paint() {
    var root = $('rl-story-root');
    if (!root || !root.firstChild) return;
    var progress = RLStory.state.load();
    RLStory.state.recalculateGalaxyProgress();
    progress = RLStory.state.load();

    var galaxy = RLStory.state.getActiveGalaxy();
    if (!galaxy) return;
    var bits = playerBits();
    text(q(root, 'pname'), bits.name);
    text(q(root, 'plvl'), bits.level);
    text(q(root, 'coins'), bits.coins);
    var st = progress.settings || {};
    text(q(root, 'stamina'), (st.stamina || 5) + ' · ' + (st.staminaTimerLabel || '03:25'));

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
        nxt.textContent = ready ? 'Siguiente galaxia · ' + following.name : 'Siguiente galaxia';
        nxt.onclick = function () {
          if (nxt.disabled) return;
          RLStory.state.setActiveGalaxy(following.id);
          selected = null;
          RLStory.ui.refresh();
        };
      }
    }
  }

  function bindOnce() {
    if (bound) return;
    bound = true;
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
        ev.stopPropagation();
        RLStory.ui.open();
      });
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
      if (t.closest('[data-rl="gear"]')) {
        RLStory.ui.close();
        return;
      }
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
      if (!root.firstChild) buildShell(root);
      bindOnce();
      openFlag = true;
      root.classList.remove('rl-story-hidden');
      root.setAttribute('aria-hidden', 'false');
      hideLayersForStory(true);
      var nav = $('rl-nav-historia');
      prevNav = document.querySelector('[data-nav].on');
      document.querySelectorAll('[data-nav]').forEach(function (x) { x.classList.remove('on'); });
      if (nav) {
        nav.classList.add('on');
        nav.classList.add('rl-story-nav-on');
      }
      paint();
      var play = q(root, 'play');
      if (play) play.focus();
    },
    close: function () {
      var root = $('rl-story-root');
      openFlag = false;
      if (root) {
        root.classList.add('rl-story-hidden');
        root.setAttribute('aria-hidden', 'true');
        var sheet = q(root, 'sheet');
        if (sheet) sheet.classList.add('rl-story-hidden');
      }
      hideLayersForStory(false);
      var nav = $('rl-nav-historia');
      if (nav) {
        nav.classList.remove('on');
        nav.classList.remove('rl-story-nav-on');
      }
      if (prevNav) prevNav.classList.add('on');
      else {
        var home = document.querySelector('[data-nav="home"]');
        if (home) home.classList.add('on');
      }
    }
  };

  function boot() {
    var root = $('rl-story-root');
    if (root) buildShell(root);
    bindOnce();
    if (typeof RLStory.initProgressListener === 'function') RLStory.initProgressListener();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
