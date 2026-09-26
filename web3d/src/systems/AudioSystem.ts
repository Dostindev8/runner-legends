/**
 * Layered ambient + UI SFX. Non-blocking Web Audio.
 */
export class AudioSystem {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambient: OscillatorNode | null = null;
  private muted = false;

  warm = (): void => {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.18;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  };

  startAmbient(toneHz = 220): void {
    this.warm();
    if (!this.ctx || !this.master || this.muted) return;
    this.stopAmbient();
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = toneHz;
    g.gain.value = 0.03;
    osc.connect(g);
    g.connect(this.master);
    osc.start();
    this.ambient = osc;
  }

  stopAmbient(): void {
    try { this.ambient?.stop(); } catch { /* already stopped */ }
    this.ambient = null;
  }

  uiBeep(freq = 520, dur = 0.06): void {
    this.warm();
    if (!this.ctx || !this.master || this.muted) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'triangle';
    g.gain.setValueAtTime(0.08, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  jump(): void { this.uiBeep(460, 0.07); }
  coin(): void { this.uiBeep(880, 0.05); }
  hurt(): void { this.uiBeep(180, 0.12); }

  setMuted(v: boolean): void {
    this.muted = v;
    if (v) this.stopAmbient();
  }

  dispose(): void {
    this.stopAmbient();
    void this.ctx?.close();
    this.ctx = null;
  }
}
