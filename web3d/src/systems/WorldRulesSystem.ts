/**
 * Port of js/worlds.js RULES + runtime builder — values must stay 1:1.
 */

export interface RuntimeMods {
  worldId: string;
  weatherId: string;
  ruleId: string;
  speedMul: number;
  gravityMul: number;
  jumpMul: number;
  friction: number;
  visibility: number;
  reactionWindow: number;
  lateralPush: number;
  slideOnLand: boolean;
  extraJump: boolean;
  layers: string[];
}

export type RuleId =
  | 'extreme_speed'
  | 'sand_push'
  | 'slippery'
  | 'living_arena'
  | 'low_gravity'
  | 'floating_platforms'
  | 'living_obstacles'
  | 'heat_zones'
  | 'fractal_shift'
  | 'cosmic_float'
  | 'meta_combo';

const RULE_APPLY: Record<RuleId, (rt: RuntimeMods) => void> = {
  extreme_speed: (rt) => { rt.speedMul *= 1.22; rt.reactionWindow = 0.78; },
  sand_push: (rt) => { rt.lateralPush = Math.max(rt.lateralPush, 38); rt.visibility *= 0.85; },
  slippery: (rt) => { rt.friction *= 0.62; rt.slideOnLand = true; },
  living_arena: () => { /* ovations / moving sync — VFX hook */ },
  low_gravity: (rt) => { rt.gravityMul *= 0.55; rt.jumpMul *= 1.15; },
  floating_platforms: () => { /* jump timing crit */ },
  living_obstacles: () => { /* reactive */ },
  heat_zones: (rt) => { rt.speedMul *= 0.95; },
  fractal_shift: (rt) => { rt.gravityMul *= 0.9; },
  cosmic_float: (rt) => { rt.gravityMul *= 0.35; },
  meta_combo: (rt) => { rt.speedMul *= 1.15; rt.friction *= 0.8; },
};

const WEATHER: Record<string, Partial<RuntimeMods>> = {
  clear_night: {},
  rain: { friction: 0.92, visibility: 0.88 },
  urban_fog: { visibility: 0.72, speedMul: 0.98 },
  sandstorm: { visibility: 0.55, friction: 0.95, speedMul: 0.94, lateralPush: 42 },
  snow: { friction: 0.78, visibility: 0.85 },
  blizzard: { friction: 0.65, visibility: 0.5, speedMul: 0.9, lateralPush: 28 },
  frozen_clear: { friction: 0.7 },
  abyssal_fog: { visibility: 0.6, friction: 0.88, speedMul: 0.92 },
};

export function buildRuntime(
  worldId: string,
  weatherId: string,
  ruleId: RuleId,
  worldSpeed = 1,
  worldGravity = 1,
  layers: string[] = ['tunnel', 'galaxy', 'planet'],
): RuntimeMods {
  const rt: RuntimeMods = {
    worldId,
    weatherId,
    ruleId,
    speedMul: worldSpeed,
    gravityMul: worldGravity,
    jumpMul: 1,
    friction: 1,
    visibility: 1,
    reactionWindow: 1,
    lateralPush: 0,
    slideOnLand: false,
    extraJump: false,
    layers: layers.slice(),
  };
  const w = WEATHER[weatherId];
  if (w) {
    if (w.friction != null) rt.friction *= w.friction;
    if (w.visibility != null) rt.visibility *= w.visibility;
    if (w.speedMul != null) rt.speedMul *= w.speedMul;
    if (w.lateralPush != null) rt.lateralPush = Math.max(rt.lateralPush, w.lateralPush);
  }
  const apply = RULE_APPLY[ruleId];
  if (apply) apply(rt);
  return rt;
}

export class WorldRulesSystem {
  private rt: RuntimeMods;

  constructor(initial: RuntimeMods) {
    this.rt = initial;
  }

  get current(): RuntimeMods {
    return this.rt;
  }

  apply(next: RuntimeMods): void {
    this.rt = next;
  }
}
