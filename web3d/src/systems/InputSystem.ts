export interface InputState {
  jumpQueued: boolean;
  jumpHeld: boolean;
  jumpReleased: boolean;
  left: boolean;
  right: boolean;
  superPressed: boolean;
}

/**
 * Unified keyboard + touch + gamepad → per-frame consume API (parity with 2D Input).
 */
export class InputSystem {
  private state: InputState = {
    jumpQueued: false,
    jumpHeld: false,
    jumpReleased: false,
    left: false,
    right: false,
    superPressed: false,
  };
  private enabled = true;

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  bindTouch(left: HTMLElement, jump: HTMLElement, right: HTMLElement, superBtn?: HTMLElement): void {
    const press = (fn: () => void) => (e: Event) => {
      e.preventDefault();
      fn();
    };
    left.addEventListener('pointerdown', press(() => { this.state.left = true; }));
    left.addEventListener('pointerup', press(() => { this.state.left = false; }));
    left.addEventListener('pointercancel', press(() => { this.state.left = false; }));
    right.addEventListener('pointerdown', press(() => { this.state.right = true; }));
    right.addEventListener('pointerup', press(() => { this.state.right = false; }));
    right.addEventListener('pointercancel', press(() => { this.state.right = false; }));
    jump.addEventListener('pointerdown', press(() => {
      this.state.jumpQueued = true;
      this.state.jumpHeld = true;
    }));
    jump.addEventListener('pointerup', press(() => {
      this.state.jumpHeld = false;
      this.state.jumpReleased = true;
    }));
    if (superBtn) {
      superBtn.addEventListener('click', () => { this.state.superPressed = true; });
    }
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (!this.enabled) return;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      if (!e.repeat) this.state.jumpQueued = true;
      this.state.jumpHeld = true;
      e.preventDefault();
    }
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.state.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.state.right = true;
    if (e.code === 'KeyE' || e.code === 'ShiftLeft') this.state.superPressed = true;
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      this.state.jumpHeld = false;
      this.state.jumpReleased = true;
    }
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.state.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.state.right = false;
  };

  pollGamepad(): void {
    const pads = navigator.getGamepads?.() ?? [];
    const g = pads[0];
    if (!g) return;
    if (g.buttons[0]?.pressed) {
      if (!this.state.jumpHeld) this.state.jumpQueued = true;
      this.state.jumpHeld = true;
    } else if (this.state.jumpHeld && !g.buttons[0]?.pressed) {
      this.state.jumpHeld = false;
      this.state.jumpReleased = true;
    }
    this.state.left = this.state.left || (g.axes[0] ?? 0) < -0.35 || !!g.buttons[14]?.pressed;
    this.state.right = this.state.right || (g.axes[0] ?? 0) > 0.35 || !!g.buttons[15]?.pressed;
  }

  consumeJump(): boolean {
    const q = this.state.jumpQueued;
    this.state.jumpQueued = false;
    return q;
  }

  consumeRelease(): boolean {
    const r = this.state.jumpReleased;
    this.state.jumpReleased = false;
    return r;
  }

  consumeSuper(): boolean {
    const s = this.state.superPressed;
    this.state.superPressed = false;
    return s;
  }

  get left(): boolean { return this.state.left; }
  get right(): boolean { return this.state.right; }
  get jumpHeld(): boolean { return this.state.jumpHeld; }

  setEnabled(v: boolean): void { this.enabled = v; }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
