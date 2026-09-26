export interface PowerDef {
  id: string;
  label: string;
  desc: string;
  unlocked: boolean;
}

const POWERS: PowerDef[] = [
  { id: 'star_burst', label: 'Explosión Estelar', desc: 'Onda de energía que limpia el carril', unlocked: true },
  { id: 'neon_dash', label: 'Dash Neón', desc: 'Invulnerabilidad breve + velocidad', unlocked: true },
  { id: 'shield', label: 'Escudo Voltz', desc: 'Bloquea un golpe', unlocked: false },
  { id: 'magnet', label: 'Imán Estelar', desc: 'Atrae monedas', unlocked: false },
];

/**
 * SÚPER meter + GTA-style pause menu. Loop pause is owned by the game shell.
 */
export class PowerSystem {
  charge = 0;
  active: PowerDef | null = null;
  menuOpen = false;
  private readonly onPause: (paused: boolean) => void;
  private readonly onSelect: (p: PowerDef | null) => void;

  constructor(onPause: (paused: boolean) => void, onSelect: (p: PowerDef | null) => void) {
    this.onPause = onPause;
    this.onSelect = onSelect;
  }

  /** Mirrors game.js: coins + passive fill. */
  tick(dt: number, coinsThisFrame: number): void {
    if (this.menuOpen || this.active) return;
    this.charge = Math.min(1, this.charge + coinsThisFrame * 0.012 + dt / 40);
  }

  get ready(): boolean {
    return this.charge >= 1 && !this.active;
  }

  tryOpenMenu(): boolean {
    if (!this.ready || this.menuOpen) return false;
    this.menuOpen = true;
    this.onPause(true);
    return true;
  }

  list(): PowerDef[] {
    return POWERS.filter((p) => p.unlocked);
  }

  select(id: string | null): void {
    this.menuOpen = false;
    this.onPause(false);
    if (!id) {
      this.onSelect(null);
      return;
    }
    const p = POWERS.find((x) => x.id === id) ?? null;
    if (p) {
      this.active = p;
      this.charge = 0;
      this.onSelect(p);
      window.setTimeout(() => { this.active = null; }, 4000);
    } else {
      this.onSelect(null);
    }
  }

  addCharge(n: number): void {
    this.charge = Math.min(1, this.charge + n);
  }
}
