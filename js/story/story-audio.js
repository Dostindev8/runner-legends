/**
 * Audio espacial ligero (Web Audio). Nunca bloquea el hilo principal.
 * UI = no espacial. Mundo = paneo + atenuación por distancia relativa.
 */
(function (global) {
  'use strict';
  global.RLStory = global.RLStory || {};

  var ctx = null;
  var master = null;
  var enabled = true;

  function ac() {
    if (ctx) return ctx;
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
    return ctx;
  }

  function resume() {
    var c = ac();
    if (c && c.state === 'suspended') {
      c.resume().catch(function () {});
    }
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  /**
   * @param {number} relX -1 izquierda … +1 derecha respecto al oyente
   * @param {number} dist 0 cerca … 1 lejos
   */
  function tone(freq, dur, relX, dist, type) {
    if (!enabled) return;
    var c = ac();
    if (!c || !master) return;
    resume();
    var now = c.currentTime;
    var osc = c.createOscillator();
    var gain = c.createGain();
    var panNode = c.createStereoPanner ? c.createStereoPanner() : null;
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    var vol = 0.35 * (1 - clamp(dist, 0, 1) * 0.75);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    if (panNode) {
      panNode.pan.value = clamp(relX, -1, 1);
      osc.connect(gain);
      gain.connect(panNode);
      panNode.connect(master);
    } else {
      osc.connect(gain);
      gain.connect(master);
    }
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  RLStory.audio = {
    warm: resume,
    ui: function (name) {
      if (name === 'select') tone(660, 0.08, 0, 0, 'triangle');
      else if (name === 'play') tone(523, 0.12, 0, 0, 'sine');
      else if (name === 'open') tone(392, 0.1, 0, 0, 'sine');
      else tone(440, 0.07, 0, 0, 'sine');
    },
    spatial: function (relX, dist, kind) {
      if (kind === 'collect') tone(880, 0.09, relX, dist, 'triangle');
      else if (kind === 'hazard') tone(180, 0.14, relX, dist, 'sawtooth');
      else tone(500, 0.08, relX, dist, 'sine');
    },
    panFromX: function (objX, listenerX, viewW) {
      var w = viewW || 360;
      var dx = (objX - listenerX) / (w * 0.5);
      var dist = clamp(Math.abs(dx) * 0.5, 0, 1);
      return { relX: clamp(dx, -1, 1), dist: dist };
    },
    setEnabled: function (on) { enabled = !!on; }
  };

  document.addEventListener('pointerdown', resume, { once: true, passive: true });
})(window);
