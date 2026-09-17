/**
 * Runner Legends v8 — PowerLog firmable para el anti-cheat (physics-config v2).
 */
(function (global) {
  'use strict';

  const log = {
    entries: [],
    generated: 0,

    reset() { this.entries = []; this.generated = 0; },

    addGenerated(n) { this.generated += Math.max(0, n || 0); },

    record(powerId, startMs, cost) {
      this.entries.push({
        powerId: String(powerId),
        startMs: startMs | 0,
        endMs: 0,
        chargeConsumed: Math.max(0, Number(cost) || 0)
      });
    },

    closeLast(endMs) {
      const last = this.entries[this.entries.length - 1];
      if (last && !last.endMs) last.endMs = endMs | 0;
    },

    snapshot() {
      return {
        entries: this.entries.map((e) => ({
          powerId: e.powerId,
          startMs: e.startMs,
          endMs: e.endMs,
          chargeConsumed: e.chargeConsumed
        })),
        generated: this.generated
      };
    }
  };

  global.RLPowerLog = log;
})(typeof window !== 'undefined' ? window : globalThis);
