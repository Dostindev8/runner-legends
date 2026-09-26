import * as THREE from 'three';

export type TickFn = (dt: number, elapsed: number) => void;

/**
 * rAF loop. `pause()` freezes simulation callbacks but keeps rendering
 * so the menu always shows a live 3D backdrop (never a black canvas).
 */
export class Loop {
  private clock = new THREE.Clock(false);
  private running = false;
  private simPaused = false;
  private raf = 0;
  private readonly onTick: TickFn;
  private readonly onRender: (() => void) | null;
  private elapsed = 0;

  constructor(onTick: TickFn, onRender: (() => void) | null = null) {
    this.onTick = onTick;
    this.onRender = onRender;
    document.addEventListener('visibilitychange', this.onVis);
  }

  private onVis = (): void => {
    if (document.hidden) this.pauseSim();
    else if (this.running) this.resumeSim();
  };

  start(): void {
    if (this.running) return;
    this.running = true;
    this.simPaused = false;
    this.clock.start();
    this.clock.getDelta();
    this.frame();
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.clock.stop();
  }

  /** Freeze gameplay systems; rendering continues. */
  pauseSim(): void {
    this.simPaused = true;
    this.clock.stop();
  }

  resumeSim(): void {
    if (!this.running) return;
    this.simPaused = false;
    this.clock.start();
    this.clock.getDelta();
  }

  /** @deprecated use pauseSim — kept for call sites */
  pause(): void { this.pauseSim(); }
  resume(): void { this.resumeSim(); }

  get isPaused(): boolean {
    return this.simPaused;
  }

  private frame = (): void => {
    this.raf = requestAnimationFrame(this.frame);
    if (!this.running) return;

    if (!this.simPaused) {
      const dt = Math.min(0.05, this.clock.getDelta());
      this.elapsed += dt;
      this.onTick(dt, this.elapsed);
    } else if (this.onRender) {
      this.onRender();
    }
  };

  dispose(): void {
    this.stop();
    document.removeEventListener('visibilitychange', this.onVis);
  }
}
