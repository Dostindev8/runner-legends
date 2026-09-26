import * as THREE from 'three';

export type TickFn = (dt: number, elapsed: number) => void;

/**
 * rAF loop with pause on visibilitychange and optional fixed-step physics.
 */
export class Loop {
  private clock = new THREE.Clock(false);
  private running = false;
  private paused = false;
  private raf = 0;
  private readonly onTick: TickFn;
  private readonly fixedStep: number | null;
  private accum = 0;
  private elapsed = 0;

  constructor(onTick: TickFn, fixedStep: number | null = null) {
    this.onTick = onTick;
    this.fixedStep = fixedStep;
    document.addEventListener('visibilitychange', this.onVis);
  }

  private onVis = (): void => {
    if (document.hidden) this.pause();
    else if (this.running) this.resume();
  };

  start(): void {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.clock.start();
    this.clock.getDelta();
    this.frame();
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.clock.stop();
  }

  pause(): void {
    this.paused = true;
    this.clock.stop();
  }

  resume(): void {
    if (!this.running) return;
    this.paused = false;
    this.clock.start();
    this.clock.getDelta();
  }

  get isPaused(): boolean {
    return this.paused;
  }

  private frame = (): void => {
    this.raf = requestAnimationFrame(this.frame);
    if (this.paused || !this.running) return;
    let dt = Math.min(0.05, this.clock.getDelta());
    if (this.fixedStep) {
      this.accum += dt;
      while (this.accum >= this.fixedStep) {
        this.elapsed += this.fixedStep;
        this.onTick(this.fixedStep, this.elapsed);
        this.accum -= this.fixedStep;
      }
    } else {
      this.elapsed += dt;
      this.onTick(dt, this.elapsed);
    }
  };

  dispose(): void {
    this.stop();
    document.removeEventListener('visibilitychange', this.onVis);
  }
}
