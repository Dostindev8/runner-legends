/**
 * Progreso del Modo Historia: localStorage + evento rl:levelResult.
 * Nunca lee ni escribe variables internas de game.js.
 */
(function (global) {
  'use strict';
  global.RLStory = global.RLStory || {};
  RLStory.state = RLStory.state || {};
  RLStory.config = RLStory.config || {};

  /** Open World Beta: todos los nodos jugables. En modo de pago futuro = false. */
  RLStory.config.forceUnlockAll = true;

  var STORAGE_KEY = 'rl_story_progress_v1';

  var RL_STORY_DEFAULT_PROGRESS = {
    galaxyProgress: { 'galaxy-01': { planetsCompleted: 0, totalPlanets: 6 } },
    levelResults: {},
    settings: { forceUnlockAll: true, stamina: 5, staminaMax: 5, staminaTimerLabel: '03:25' },
    activeGalaxyId: 'galaxy-01'
  };

  function clone(obj) {
    if (typeof structuredClone === 'function') return structuredClone(obj);
    return JSON.parse(JSON.stringify(obj));
  }

  function persist(progress) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      return true;
    } catch (e) {
      console.error('[RLStory] No se pudo guardar el progreso:', e);
      return false;
    }
  }

  /**
   * Valida el payload del evento de progreso.
   * Devuelve { valid: true, data } o { valid: false, error }.
   */
  RLStory.validateLevelResult = function (detail) {
    if (!detail || typeof detail !== 'object') {
      return { valid: false, error: 'Payload vacío o no es objeto' };
    }
    var levelId = detail.levelId;
    var stars = detail.stars;
    var bestTimeMs = detail.bestTimeMs;
    var completed = detail.completed;

    if (typeof levelId !== 'string' || levelId.trim() === '') {
      return { valid: false, error: 'levelId inválido o ausente' };
    }
    if (typeof stars !== 'number' || !Number.isInteger(stars) || stars < 0 || stars > 3) {
      return { valid: false, error: 'stars debe ser entero entre 0 y 3' };
    }
    if (bestTimeMs !== null && (typeof bestTimeMs !== 'number' || bestTimeMs < 0 || !Number.isFinite(bestTimeMs))) {
      return { valid: false, error: 'bestTimeMs debe ser número ≥ 0 o null' };
    }
    if (typeof completed !== 'boolean') {
      return { valid: false, error: 'completed debe ser boolean' };
    }
    if (!completed && stars > 0) {
      return { valid: false, error: 'No se pueden otorgar estrellas si completed = false' };
    }
    if (completed && stars === 0) {
      console.warn('[RLStory] Nivel completado con 0 estrellas:', levelId);
    }

    return {
      valid: true,
      data: {
        levelId: levelId.trim(),
        stars: stars,
        bestTimeMs: bestTimeMs === null ? null : Math.round(bestTimeMs),
        completed: completed
      }
    };
  };

  /** Stub de pago: siempre true hasta definir proveedor. Único punto de cobro futuro. */
  RLStory.paywall = {
    check: function (worldId) {
      void worldId;
      return true;
    }
  };

  /** Lee el progreso actual de localStorage de forma defensiva. */
  RLStory.state.load = function () {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return clone(RL_STORY_DEFAULT_PROGRESS);
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return clone(RL_STORY_DEFAULT_PROGRESS);
      if (!parsed.levelResults || typeof parsed.levelResults !== 'object') parsed.levelResults = {};
      if (!parsed.galaxyProgress || typeof parsed.galaxyProgress !== 'object') parsed.galaxyProgress = {};
      if (!parsed.settings || typeof parsed.settings !== 'object') parsed.settings = clone(RL_STORY_DEFAULT_PROGRESS.settings);
      if (typeof parsed.settings.forceUnlockAll !== 'boolean') {
        parsed.settings.forceUnlockAll = RLStory.config.forceUnlockAll;
      }
      return parsed;
    } catch (e) {
      console.error('[RLStory] Error leyendo localStorage, se reinicia progreso:', e);
      return clone(RL_STORY_DEFAULT_PROGRESS);
    }
  };

  /** Guarda un resultado de nivel conservando el mejor histórico. */
  RLStory.state.saveLevelResult = function (levelId, result) {
    var progress = RLStory.state.load();
    var previous = progress.levelResults[levelId];
    var next = {
      stars: result.stars,
      bestTimeMs: result.bestTimeMs,
      completed: result.completed
    };

    if (previous) {
      next.stars = Math.max(previous.stars || 0, next.stars);
      if (previous.bestTimeMs !== null && previous.bestTimeMs !== undefined && next.bestTimeMs !== null) {
        next.bestTimeMs = Math.min(previous.bestTimeMs, next.bestTimeMs);
      } else if (previous.bestTimeMs !== null && previous.bestTimeMs !== undefined) {
        next.bestTimeMs = previous.bestTimeMs;
      }
      next.completed = previous.completed || next.completed;
    }

    progress.levelResults[levelId] = {
      stars: next.stars,
      bestTimeMs: next.bestTimeMs,
      completed: next.completed,
      updatedAt: Date.now()
    };
    persist(progress);
  };

  /** Recalcula planetsCompleted por galaxia a partir de levelResults. */
  RLStory.state.recalculateGalaxyProgress = function () {
    var progress = RLStory.state.load();
    if (!RLStory.data || !RLStory.data.galaxies) return progress;
    RLStory.data.galaxies.forEach(function (galaxy) {
      var totalPlanets = galaxy.worlds.length;
      var completedPlanets = galaxy.worlds.filter(function (world) {
        return world.levels.every(function (lvl) {
          return progress.levelResults[lvl.id] && progress.levelResults[lvl.id].completed;
        });
      }).length;
      progress.galaxyProgress[galaxy.id] = { planetsCompleted: completedPlanets, totalPlanets: totalPlanets };
    });
    persist(progress);
    return progress;
  };

  /** Contador X/Y de nodos (niveles) completados — nunca hardcodeado. */
  RLStory.state.countGalaxyNodes = function (galaxy, progress) {
    progress = progress || RLStory.state.load();
    var nodes = RLStory.data.levelsOfGalaxy(galaxy);
    var completed = 0;
    nodes.forEach(function (n) {
      if (progress.levelResults[n.level.id] && progress.levelResults[n.level.id].completed) completed += 1;
    });
    return { completed: completed, total: nodes.length };
  };

  RLStory.state.isForceUnlock = function (progress) {
    progress = progress || RLStory.state.load();
    if (RLStory.config.forceUnlockAll) return true;
    return !!(progress.settings && progress.settings.forceUnlockAll);
  };

  /** ¿La galaxia está desbloqueada? (Open World: sí). */
  RLStory.state.isGalaxyUnlocked = function (galaxy, progress) {
    if (RLStory.state.isForceUnlock(progress)) return true;
    if (!galaxy || !galaxy.unlockRule) return false;
    if (galaxy.unlockRule.type === 'always') return true;
    if (galaxy.unlockRule.type === 'previous_galaxy_completed') {
      progress = progress || RLStory.state.load();
      var prevId = galaxy.unlockRule.galaxyId;
      var gp = progress.galaxyProgress[prevId];
      return !!(gp && gp.planetsCompleted >= gp.totalPlanets && gp.totalPlanets > 0);
    }
    return false;
  };

  /** Estado visual de un nivel: completed | available | locked. */
  RLStory.state.nodeStatus = function (galaxy, world, level, progress) {
    progress = progress || RLStory.state.load();
    var result = progress.levelResults[level.id];
    if (result && result.completed) return 'completed';
    if (RLStory.state.isForceUnlock(progress)) return 'available';
    if (!RLStory.paywall.check(world.id)) return 'locked';
    if (!RLStory.state.isGalaxyUnlocked(galaxy, progress)) return 'locked';
    var rule = (level.unlockRule && level.unlockRule.type) || 'always';
    if (rule === 'always') return 'available';
    if (rule === 'previous_level_completed') {
      var idx = world.levels.indexOf(level);
      if (idx <= 0) return 'available';
      var prev = world.levels[idx - 1];
      var prevRes = progress.levelResults[prev.id];
      return prevRes && prevRes.completed ? 'available' : 'locked';
    }
    return 'locked';
  };

  RLStory.state.getStars = function (levelId, progress) {
    progress = progress || RLStory.state.load();
    var r = progress.levelResults[levelId];
    return r && typeof r.stars === 'number' ? r.stars : 0;
  };

  RLStory.state.setActiveGalaxy = function (galaxyId) {
    var progress = RLStory.state.load();
    progress.activeGalaxyId = galaxyId;
    persist(progress);
  };

  RLStory.state.getActiveGalaxy = function () {
    var progress = RLStory.state.load();
    var id = progress.activeGalaxyId || 'galaxy-01';
    var list = (RLStory.data && RLStory.data.galaxies) || [];
    var found = null;
    list.forEach(function (g) { if (g.id === id) found = g; });
    return found || list[0] || null;
  };

  var listenerBound = false;

  /** Listener único y seguro del evento de progreso. Nunca confiar en el payload sin validar. */
  RLStory.initProgressListener = function () {
    if (listenerBound) return;
    listenerBound = true;
    window.addEventListener('rl:levelResult', function (event) {
      var validation = RLStory.validateLevelResult(event.detail);
      if (!validation.valid) {
        console.error('[RLStory] Evento de progreso rechazado →', validation.error, event.detail);
        return;
      }
      var data = validation.data;
      RLStory.state.saveLevelResult(data.levelId, {
        stars: data.stars,
        bestTimeMs: data.bestTimeMs,
        completed: data.completed
      });
      RLStory.state.recalculateGalaxyProgress();
      if (typeof RLStory.ui !== 'undefined' && RLStory.ui.isOpen()) {
        RLStory.ui.refresh();
      }
      console.info('[RLStory] Progreso guardado →', data.levelId, '★' + data.stars);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', RLStory.initProgressListener);
  } else {
    RLStory.initProgressListener();
  }
})(window);
