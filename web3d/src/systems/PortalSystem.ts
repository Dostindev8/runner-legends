import { buildRuntime, type RuleId, type RuntimeMods } from './WorldRulesSystem';
import type { DiffId } from '../config';

export interface WorldDef {
  id: string;
  name: string;
  difficulty: number;
  gravity: number;
  speedMultiplier: number;
  weatherPool: string[];
  specialRule: RuleId;
  transitionLayers: string[];
  unlock: boolean;
  finalBoss?: boolean;
}

/** Subset aligned with js/worlds.js — full catalog preserved. */
export const WORLDS: WorldDef[] = [
  { id: 'neon', name: 'Distrito Neón', difficulty: 1, gravity: 1, speedMultiplier: 1.08, weatherPool: ['rain', 'urban_fog', 'clear_night'], specialRule: 'extreme_speed', transitionLayers: ['tunnel', 'galaxy', 'planet', 'storm'], unlock: true },
  { id: 'golden', name: 'Valle Dorado', difficulty: 2, gravity: 1, speedMultiplier: 1, weatherPool: ['sandstorm', 'heat', 'clear_desert'], specialRule: 'sand_push', transitionLayers: ['tunnel', 'galaxy', 'planet', 'sand'], unlock: false },
  { id: 'ice', name: 'Cumbres de Hielo', difficulty: 2, gravity: 1.05, speedMultiplier: 0.98, weatherPool: ['snow', 'blizzard', 'frozen_clear'], specialRule: 'slippery', transitionLayers: ['tunnel', 'aurora', 'planet', 'storm'], unlock: false },
  { id: 'coliseum', name: 'Coliseo', difficulty: 3, gravity: 1, speedMultiplier: 1.05, weatherPool: ['clear', 'electric'], specialRule: 'living_arena', transitionLayers: ['tunnel', 'structures', 'planet'], unlock: false },
  { id: 'abyssal', name: 'Planeta Abisal', difficulty: 3, gravity: 0.6, speedMultiplier: 0.92, weatherPool: ['abyssal_fog', 'bio_glow', 'storm'], specialRule: 'low_gravity', transitionLayers: ['tunnel', 'galaxy', 'ocean', 'planet'], unlock: false },
  { id: 'celestial', name: 'Ciudad Celestial', difficulty: 3, gravity: 0.9, speedMultiplier: 1, weatherPool: ['strong_wind', 'storm', 'clear'], specialRule: 'floating_platforms', transitionLayers: ['tunnel', 'clouds', 'planet', 'storm'], unlock: false },
  { id: 'quantum', name: 'Bosque Cuántico', difficulty: 4, gravity: 1, speedMultiplier: 1, weatherPool: ['urban_fog', 'light_rain', 'clear_night'], specialRule: 'living_obstacles', transitionLayers: ['tunnel', 'spores', 'planet'], unlock: false },
  { id: 'igneous', name: 'Planeta Ígneo', difficulty: 4, gravity: 1.08, speedMultiplier: 1.02, weatherPool: ['ash', 'extreme_heat', 'meteors'], specialRule: 'heat_zones', transitionLayers: ['tunnel', 'galaxy', 'planet', 'ash'], unlock: false },
  { id: 'fractal', name: 'Dimensión Fractal', difficulty: 5, gravity: 1, speedMultiplier: 1.1, weatherPool: ['distortion', 'impossible'], specialRule: 'fractal_shift', transitionLayers: ['tunnel', 'fractures', 'galaxy', 'planet'], unlock: false },
  { id: 'final', name: 'Distrito Final', difficulty: 5, gravity: 1, speedMultiplier: 1.2, weatherPool: ['rotating'], specialRule: 'meta_combo', transitionLayers: ['tunnel', 'galaxy', 'fractures', 'storm', 'planet'], unlock: false, finalBoss: true },
];

function mulberry32(a: number): () => number {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Port of PortalOutcomeResolver — same weights / anti-repeat. */
export class PortalSystem {
  private history: string[] = [];
  private streak = 0;
  private rng: () => number;

  constructor(seed: number | null = null) {
    this.rng = seed != null ? mulberry32(seed >>> 0) : Math.random;
  }

  availablePool(originId: string, unlockedIds: string[]): WorldDef[] {
    const ids = unlockedIds.length ? unlockedIds : ['neon'];
    let lastIdx = 0;
    WORLDS.forEach((w, i) => { if (ids.includes(w.id)) lastIdx = i; });
    const preview = WORLDS[Math.min(lastIdx + 1, WORLDS.length - 1)];
    return WORLDS.filter((w) => {
      if (w.finalBoss && !ids.includes('final')) return false;
      if (ids.includes(w.id) || w.id === 'neon' || w.id === originId) return true;
      return !!(preview && w.id === preview.id && !w.finalBoss && this.streak >= 2);
    });
  }

  resolve(input: { originId: string; difficultyId: DiffId; unlockedIds: string[] }): RuntimeMods {
    try {
      let pool = this.availablePool(input.originId, input.unlockedIds);
      if (!pool.length) pool = [WORLDS[0]!];
      const destCandidates = pool.filter((w) => w.id !== input.originId);
      const destPool = destCandidates.length ? destCandidates : pool;
      const diff = input.difficultyId;
      const weights = destPool.map((w) => {
        let wt = 1 / Math.max(1, w.difficulty);
        if (diff === 'hard') wt *= 1 + w.difficulty * 0.08;
        if (diff === 'expert') wt *= 1 + w.difficulty * 0.15;
        if (diff === 'legendary') wt *= 1 + w.difficulty * 0.25;
        if (w.id === input.originId) wt *= 0.35;
        return wt;
      });
      let world = this.pick(destPool, weights)!;
      let weatherId = this.pick(world.weatherPool)!;
      let ruleId = world.specialRule;
      let key = `${world.id}|${weatherId}|${ruleId}`;
      const last = this.history[this.history.length - 1];
      let tries = 0;
      while (last === key && tries < 12) {
        weatherId = this.pick(world.weatherPool)!;
        if (destPool.length > 1 && tries > 3) {
          world = this.pick(destPool, weights)!;
          weatherId = this.pick(world.weatherPool)!;
          ruleId = world.specialRule;
        }
        key = `${world.id}|${weatherId}|${ruleId}`;
        tries++;
      }
      const runtime = buildRuntime(world.id, weatherId, ruleId, world.speedMultiplier, world.gravity, world.transitionLayers);
      this.history.push(key);
      if (this.history.length > 8) this.history.shift();
      this.streak++;
      return runtime;
    } catch {
      return buildRuntime('neon', 'clear_night', 'extreme_speed', 1.08, 1);
    }
  }

  private pick<T>(arr: T[], weights?: number[]): T | null {
    if (!arr.length) return null;
    if (!weights) return arr[Math.floor(this.rng() * arr.length)] ?? null;
    let sum = 0;
    for (const w of weights) sum += w;
    let r = this.rng() * sum;
    for (let i = 0; i < arr.length; i++) {
      r -= weights[i] ?? 0;
      if (r <= 0) return arr[i] ?? null;
    }
    return arr[arr.length - 1] ?? null;
  }
}
