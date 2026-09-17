/**
 * Runner Legends — WorldConfig + Tabla Maestra (Mega Directiva v2.0 §13/§21)
 * Fuente de verdad: mundos × clima × regla especial. Sin hardcode en el motor.
 */
(function (global) {
  'use strict';

  const WEATHER = {
    rain: { id: 'rain', label: 'Lluvia', visibility: 0.88, friction: 0.92, speedMul: 1, particle: 'rain' },
    urban_fog: { id: 'urban_fog', label: 'Niebla urbana', visibility: 0.72, friction: 1, speedMul: 0.98, particle: 'fog' },
    clear_night: { id: 'clear_night', label: 'Despejado nocturno', visibility: 1, friction: 1, speedMul: 1, particle: null },
    sandstorm: { id: 'sandstorm', label: 'Tormenta de arena', visibility: 0.55, friction: 0.95, speedMul: 0.94, particle: 'sand', lateralPush: 42 },
    heat: { id: 'heat', label: 'Calor', visibility: 0.9, friction: 1, speedMul: 0.96, particle: 'heat' },
    clear_desert: { id: 'clear_desert', label: 'Despejado', visibility: 1, friction: 1, speedMul: 1, particle: null },
    snow: { id: 'snow', label: 'Nieve', visibility: 0.85, friction: 0.78, speedMul: 0.97, particle: 'snow' },
    blizzard: { id: 'blizzard', label: 'Ventisca', visibility: 0.5, friction: 0.65, speedMul: 0.9, particle: 'blizzard', lateralPush: 28 },
    frozen_clear: { id: 'frozen_clear', label: 'Congelado despejado', visibility: 1, friction: 0.7, speedMul: 1, particle: 'breath' },
    clear: { id: 'clear', label: 'Despejado', visibility: 1, friction: 1, speedMul: 1, particle: null },
    electric: { id: 'electric', label: 'Tormenta eléctrica', visibility: 0.8, friction: 1, speedMul: 1.02, particle: 'sparks' },
    abyssal_fog: { id: 'abyssal_fog', label: 'Niebla submarina', visibility: 0.6, friction: 0.88, speedMul: 0.92, particle: 'bubbles' },
    bio_glow: { id: 'bio_glow', label: 'Bioluminiscencia', visibility: 0.75, friction: 0.9, speedMul: 0.95, particle: 'spores' },
    storm: { id: 'storm', label: 'Tormenta', visibility: 0.65, friction: 0.9, speedMul: 0.95, particle: 'rain' },
    strong_wind: { id: 'strong_wind', label: 'Viento fuerte', visibility: 0.9, friction: 1, speedMul: 1, particle: 'wind', lateralPush: 55 },
    light_rain: { id: 'light_rain', label: 'Lluvia ligera', visibility: 0.92, friction: 0.95, speedMul: 1, particle: 'rain' },
    ash: { id: 'ash', label: 'Tormenta de ceniza', visibility: 0.58, friction: 0.93, speedMul: 0.93, particle: 'ash' },
    extreme_heat: { id: 'extreme_heat', label: 'Calor extremo', visibility: 0.85, friction: 1, speedMul: 0.9, particle: 'heat', heatDps: 0.15 },
    meteors: { id: 'meteors', label: 'Lluvia de meteoritos', visibility: 0.8, friction: 1, speedMul: 1.05, particle: 'meteors' },
    distortion: { id: 'distortion', label: 'Distorsión', visibility: 0.7, friction: 1, speedMul: 1, particle: 'glitch' },
    impossible: { id: 'impossible', label: 'Clima imposible', visibility: 0.65, friction: 1.1, speedMul: 1.08, particle: 'glitch' },
    void: { id: 'void', label: 'Vacío', visibility: 0.95, friction: 0.5, speedMul: 0.88, particle: 'stars' },
    aurora: { id: 'aurora', label: 'Auroras', visibility: 0.9, friction: 0.6, speedMul: 0.95, particle: 'aurora' },
    rotating: { id: 'rotating', label: 'Clima rotativo', visibility: 0.75, friction: 0.85, speedMul: 1.1, particle: 'mixed' }
  };

  const RULES = {
    extreme_speed: {
      id: 'extreme_speed', label: 'Velocidad extrema', icon: '⚡',
      apply(rt) { rt.speedMul *= 1.22; rt.reactionWindow = 0.78; }
    },
    sand_push: {
      id: 'sand_push', label: 'Tormentas de arena', icon: '🌪️',
      apply(rt) { rt.lateralPush = Math.max(rt.lateralPush || 0, 38); rt.visibility *= 0.85; }
    },
    slippery: {
      id: 'slippery', label: 'Superficie resbaladiza', icon: '❄️',
      apply(rt) { rt.friction *= 0.62; rt.slideOnLand = true; }
    },
    living_arena: {
      id: 'living_arena', label: 'Arena viva', icon: '🏛️',
      apply(rt) { rt.ovations = true; rt.movingObstacleSync = true; }
    },
    low_gravity: {
      id: 'low_gravity', label: 'Gravedad reducida', icon: '🌊',
      apply(rt) { rt.gravityMul *= 0.55; rt.jumpMul *= 1.15; }
    },
    floating_platforms: {
      id: 'floating_platforms', label: 'Plataformas flotantes', icon: '☁️',
      apply(rt) { rt.platformDrift = true; rt.jumpTimingCrit = true; }
    },
    living_obstacles: {
      id: 'living_obstacles', label: 'Obstáculos vivos', icon: '🌿',
      apply(rt) { rt.reactiveObstacles = true; }
    },
    heat_zones: {
      id: 'heat_zones', label: 'Zonas de calor', icon: '🌋',
      apply(rt) { rt.heatZones = true; rt.heatSlow = 0.82; }
    },
    fractal_shift: {
      id: 'fractal_shift', label: 'Escenario cambiante', icon: '🌀',
      apply(rt) { rt.geometryShift = true; rt.localGravityFlip = true; }
    },
    cosmic_float: {
      id: 'cosmic_float', label: 'Gravedad alterada', icon: '🌌',
      apply(rt) { rt.gravityMul *= 0.35; rt.floatControl = true; }
    },
    meta_combo: {
      id: 'meta_combo', label: 'Condiciones combinadas', icon: '👑',
      apply(rt) { rt.metaRotate = true; rt.speedMul *= 1.15; rt.friction *= 0.8; }
    }
  };

  /** @type {Array<object>} */
  const WORLDS = [
    {
      id: 'neon', name: 'Distrito Neón', short: '01', unlock: true,
      description: 'Metrópolis nocturna. Calles mojadas, neón cian/magenta.',
      difficulty: 1, environment: 'city_night',
      gravity: 1, speedMultiplier: 1.08,
      weatherPool: ['rain', 'urban_fog', 'clear_night'],
      specialRule: 'extreme_speed',
      specialRuleVariants: [{ weather: 'rain', extra: { friction: 0.88 } }],
      transitionLayers: ['tunnel', 'galaxy', 'planet', 'storm'],
      palette: { sky0: '#050218', sky1: '#12043a', sky2: '#1a0750', glow: 'rgba(255,60,180,0.55)', mid: '#160a44', accent: '#22e6ff', ground: '#0a1830' },
      bleed: 'neon_signs', musicTone: 220
    },
    {
      id: 'golden', name: 'Valle Dorado', short: '02', unlock: false,
      description: 'Desierto vivo. Tormentas que empujan y ciegan.',
      difficulty: 2, environment: 'desert',
      gravity: 1, speedMultiplier: 1,
      weatherPool: ['sandstorm', 'heat', 'clear_desert'],
      specialRule: 'sand_push',
      specialRuleVariants: [],
      transitionLayers: ['tunnel', 'galaxy', 'planet', 'sand'],
      palette: { sky0: '#120804', sky1: '#2a1608', sky2: '#4a2810', glow: 'rgba(255,180,60,0.5)', mid: '#2a180c', accent: '#ffd24a', ground: '#1a1208' },
      bleed: 'dunes', musicTone: 180
    },
    {
      id: 'ice', name: 'Cumbres de Hielo', short: '03', unlock: false,
      description: 'Hielo y auroras. Cada aterrizaje desliza.',
      difficulty: 2, environment: 'ice',
      gravity: 1.05, speedMultiplier: 0.98,
      weatherPool: ['snow', 'blizzard', 'frozen_clear'],
      specialRule: 'slippery',
      specialRuleVariants: [{ weather: 'blizzard', extra: { lateralPush: 30 } }],
      transitionLayers: ['tunnel', 'aurora', 'planet', 'storm'],
      palette: { sky0: '#040c18', sky1: '#0a2a4a', sky2: '#123858', glow: 'rgba(120,220,255,0.5)', mid: '#0e2748', accent: '#9ff0ff', ground: '#0a2038' },
      bleed: 'crystals', musicTone: 260
    },
    {
      id: 'coliseum', name: 'Coliseo', short: '04', unlock: false,
      description: 'Megaestructura. La ovación mueve la cámara.',
      difficulty: 3, environment: 'arena',
      gravity: 1, speedMultiplier: 1.05,
      weatherPool: ['clear', 'electric'],
      specialRule: 'living_arena',
      specialRuleVariants: [],
      transitionLayers: ['tunnel', 'structures', 'planet'],
      palette: { sky0: '#100808', sky1: '#2a1410', sky2: '#3a2018', glow: 'rgba(255,200,120,0.4)', mid: '#241410', accent: '#ffb060', ground: '#1a1010' },
      bleed: 'columns', musicTone: 200
    },
    {
      id: 'abyssal', name: 'Planeta Abisal', short: '05', unlock: false,
      description: 'Océano alienígena. Saltos largos, caídas lentas.',
      difficulty: 3, environment: 'ocean',
      gravity: 0.6, speedMultiplier: 0.92,
      weatherPool: ['abyssal_fog', 'bio_glow', 'storm'],
      specialRule: 'low_gravity',
      specialRuleVariants: [],
      transitionLayers: ['tunnel', 'galaxy', 'ocean', 'planet'],
      palette: { sky0: '#020818', sky1: '#041828', sky2: '#062838', glow: 'rgba(40,220,180,0.45)', mid: '#041820', accent: '#2ee8c0', ground: '#021418' },
      bleed: 'bubbles', musicTone: 140
    },
    {
      id: 'celestial', name: 'Ciudad Celestial', short: '06', unlock: false,
      description: 'Ciudad en nubes. Timing de salto crítico.',
      difficulty: 3, environment: 'clouds',
      gravity: 0.9, speedMultiplier: 1,
      weatherPool: ['strong_wind', 'storm', 'clear'],
      specialRule: 'floating_platforms',
      specialRuleVariants: [],
      transitionLayers: ['tunnel', 'clouds', 'planet', 'storm'],
      palette: { sky0: '#0c1430', sky1: '#1a2860', sky2: '#2a3890', glow: 'rgba(180,200,255,0.5)', mid: '#182850', accent: '#a8c8ff', ground: '#101830' },
      bleed: 'clouds', musicTone: 300
    },
    {
      id: 'quantum', name: 'Bosque Cuántico', short: '07', unlock: false,
      description: 'Vegetación reactiva. Los obstáculos te miran.',
      difficulty: 4, environment: 'forest',
      gravity: 1, speedMultiplier: 1,
      weatherPool: ['urban_fog', 'light_rain', 'clear_night'],
      specialRule: 'living_obstacles',
      specialRuleVariants: [],
      transitionLayers: ['tunnel', 'spores', 'planet'],
      palette: { sky0: '#040c08', sky1: '#0a2010', sky2: '#103018', glow: 'rgba(80,255,140,0.4)', mid: '#0c2014', accent: '#4aff8a', ground: '#081810' },
      bleed: 'spores', musicTone: 170
    },
    {
      id: 'igneous', name: 'Planeta Ígneo', short: '08', unlock: false,
      description: 'Magma y ceniza. Quedarse quieto duele.',
      difficulty: 4, environment: 'volcano',
      gravity: 1.08, speedMultiplier: 1.02,
      weatherPool: ['ash', 'extreme_heat', 'meteors'],
      specialRule: 'heat_zones',
      specialRuleVariants: [],
      transitionLayers: ['tunnel', 'galaxy', 'planet', 'ash'],
      palette: { sky0: '#180404', sky1: '#3a0c04', sky2: '#5a1808', glow: 'rgba(255,80,30,0.5)', mid: '#2a0c08', accent: '#ff6030', ground: '#1a0804' },
      bleed: 'embers', musicTone: 110
    },
    {
      id: 'fractal', name: 'Dimensión Fractal', short: '09', unlock: false,
      description: 'Geometría imposible. Las reglas se rompen.',
      difficulty: 5, environment: 'fractal',
      gravity: 1, speedMultiplier: 1.1,
      weatherPool: ['distortion', 'impossible'],
      specialRule: 'fractal_shift',
      specialRuleVariants: [],
      transitionLayers: ['tunnel', 'fractures', 'galaxy', 'planet'],
      palette: { sky0: '#080810', sky1: '#101028', sky2: '#181840', glow: 'rgba(200,80,255,0.45)', mid: '#14122a', accent: '#c850ff', ground: '#0c0c18' },
      bleed: 'shards', musicTone: 90
    },
    {
      id: 'final', name: 'Distrito Final', short: '10', unlock: false, finalBoss: true,
      description: 'Desafío máximo. Reglas que rotan por tramo.',
      difficulty: 5, environment: 'final',
      gravity: 1, speedMultiplier: 1.2,
      weatherPool: ['rotating'],
      specialRule: 'meta_combo',
      specialRuleVariants: [],
      transitionLayers: ['tunnel', 'galaxy', 'fractures', 'storm', 'planet'],
      palette: { sky0: '#050018', sky1: '#180030', sky2: '#280050', glow: 'rgba(255,210,74,0.55)', mid: '#140028', accent: '#ffd24a', ground: '#0a0018' },
      bleed: 'mixed', musicTone: 240
    }
  ];

  function getWorld(id) {
    return WORLDS.find((w) => w.id === id) || WORLDS[0];
  }

  function getWeather(id) {
    return WEATHER[id] || WEATHER.clear_night;
  }

  function getRule(id) {
    return RULES[id] || RULES.extreme_speed;
  }

  /** Build runtime modifiers from world + weather + rule (+ difficulty intensity). */
  function buildRuntimeConfig(world, weatherId, ruleId, difficultyId) {
    const w = typeof world === 'string' ? getWorld(world) : world;
    const weather = getWeather(weatherId);
    const rule = getRule(ruleId || w.specialRule);
    const rt = {
      worldId: w.id,
      world: w,
      weatherId: weather.id,
      weather,
      ruleId: rule.id,
      rule,
      gravityMul: w.gravity,
      jumpMul: 1,
      speedMul: w.speedMultiplier * (weather.speedMul || 1),
      friction: weather.friction || 1,
      visibility: weather.visibility || 1,
      lateralPush: weather.lateralPush || 0,
      reactionWindow: 1,
      slideOnLand: false,
      ovations: false,
      movingObstacleSync: false,
      platformDrift: false,
      jumpTimingCrit: false,
      reactiveObstacles: false,
      heatZones: false,
      heatSlow: 1,
      geometryShift: false,
      localGravityFlip: false,
      floatControl: false,
      metaRotate: false,
      heatDps: weather.heatDps || 0,
      particle: weather.particle,
      layers: (w.transitionLayers || ['tunnel', 'galaxy', 'planet']).slice()
    };
    rule.apply(rt);
    const variant = (w.specialRuleVariants || []).find((v) => v.weather === weather.id);
    if (variant && variant.extra) Object.assign(rt, variant.extra);
    // Difficulty intensifies extreme weather / rule pressure (§43)
    const intens = { normal: 1, hard: 1.12, expert: 1.25, legendary: 1.4 }[difficultyId] || 1;
    if (intens > 1) {
      rt.speedMul *= 1 + (intens - 1) * 0.15;
      rt.visibility = Math.max(0.4, rt.visibility / (1 + (intens - 1) * 0.2));
      if (rt.lateralPush) rt.lateralPush *= intens;
      if (rt.friction < 1) rt.friction = Math.max(0.4, rt.friction / intens);
    }
    return rt;
  }

  global.RLWorlds = { WEATHER, RULES, WORLDS, getWorld, getWeather, getRule, buildRuntimeConfig };
})(typeof window !== 'undefined' ? window : globalThis);
