/**
 * Runner Legends v6.0 — Original LCS content (bosses, characters, collectibles).
 * IP: Logic Code Spot · cero referencias a IPs de terceros.
 */
(function (global) {
  'use strict';

  /** One boss per world id — telegraphed attack patterns only. */
  const BOSSES = {
    neon: {
      id: 'overclock', name: 'Overclock', worldId: 'neon',
      hp: 8, w: 70, h: 90, color: '#22e6ff', accent: '#ff2bd6',
      essence: 'esencia_overclock',
      patterns: [
        { id: 'pulse', telegraph: 0.55, active: 0.45, recovery: 0.5, dmg: 1 },
        { id: 'sweep', telegraph: 0.7, active: 0.35, recovery: 0.55, dmg: 1 }
      ]
    },
    golden: {
      id: 'don_ferrocode', name: 'Don Ferrocode', worldId: 'golden',
      hp: 9, w: 78, h: 86, color: '#ffd24a', accent: '#c88810',
      essence: 'esencia_ferrocode',
      patterns: [
        { id: 'slam', telegraph: 0.65, active: 0.4, recovery: 0.6, dmg: 1 },
        { id: 'sandwave', telegraph: 0.8, active: 0.5, recovery: 0.5, dmg: 1 }
      ]
    },
    ice: {
      id: 'glacia', name: 'Glacia', worldId: 'ice',
      hp: 9, w: 72, h: 88, color: '#9ff0ff', accent: '#7ab8ff',
      essence: 'esencia_glacia',
      patterns: [
        { id: 'shard', telegraph: 0.6, active: 0.35, recovery: 0.55, dmg: 1 },
        { id: 'freeze', telegraph: 0.9, active: 0.45, recovery: 0.6, dmg: 1 }
      ]
    },
    coliseum: {
      id: 'rivalis', name: 'Rivalis', worldId: 'coliseum',
      hp: 10, w: 68, h: 84, color: '#ffb060', accent: '#ff6040',
      essence: 'esencia_rivalis',
      patterns: [
        { id: 'dash', telegraph: 0.5, active: 0.3, recovery: 0.45, dmg: 1 },
        { id: 'ovation', telegraph: 0.75, active: 0.4, recovery: 0.5, dmg: 1 }
      ]
    },
    abyssal: {
      id: 'kraxo', name: 'Kraxo', worldId: 'abyssal',
      hp: 10, w: 80, h: 70, color: '#40e0c0', accent: '#2060a0',
      essence: 'esencia_kraxo',
      patterns: [
        { id: 'tentacle', telegraph: 0.7, active: 0.45, recovery: 0.55, dmg: 1 },
        { id: 'pressure', telegraph: 0.85, active: 0.5, recovery: 0.5, dmg: 1 }
      ]
    },
    celestial: {
      id: 'auros', name: 'Auros', worldId: 'celestial',
      hp: 11, w: 74, h: 92, color: '#ffe08a', accent: '#a070ff',
      essence: 'esencia_auros',
      patterns: [
        { id: 'beam', telegraph: 0.8, active: 0.4, recovery: 0.6, dmg: 1 },
        { id: 'orbit', telegraph: 0.65, active: 0.5, recovery: 0.45, dmg: 1 }
      ]
    },
    quantum: {
      id: 'fractal', name: 'Fractal', worldId: 'quantum',
      hp: 11, w: 76, h: 76, color: '#c080ff', accent: '#40ffe0',
      essence: 'esencia_fractal',
      patterns: [
        { id: 'split', telegraph: 0.7, active: 0.4, recovery: 0.55, dmg: 1 },
        { id: 'warp', telegraph: 0.9, active: 0.35, recovery: 0.65, dmg: 1 }
      ]
    },
    igneous: {
      id: 'magma_rex', name: 'Magma Rex', worldId: 'igneous',
      hp: 12, w: 88, h: 96, color: '#ff6030', accent: '#ffd24a',
      essence: 'esencia_magma',
      patterns: [
        { id: 'erupt', telegraph: 0.75, active: 0.5, recovery: 0.55, dmg: 1 },
        { id: 'lava', telegraph: 0.85, active: 0.45, recovery: 0.6, dmg: 1 }
      ]
    },
    fractal: {
      id: 'null', name: 'Null', worldId: 'fractal',
      hp: 12, w: 70, h: 100, color: '#a0a8c0', accent: '#ff2bd6',
      essence: 'esencia_null',
      patterns: [
        { id: 'void', telegraph: 0.8, active: 0.4, recovery: 0.6, dmg: 1 },
        { id: 'erase', telegraph: 1.0, active: 0.35, recovery: 0.7, dmg: 1 }
      ]
    },
    final: {
      id: 'escuadron_cero', name: 'Escuadrón Cero', worldId: 'final',
      hp: 16, w: 64, h: 64, color: '#eaf6ff', accent: '#ff2bd6',
      essence: 'esencia_cero',
      squad: 4,
      patterns: [
        { id: 'volley', telegraph: 0.6, active: 0.4, recovery: 0.45, dmg: 1 },
        { id: 'encircle', telegraph: 0.9, active: 0.5, recovery: 0.55, dmg: 1 }
      ]
    }
  };

  /** Playable roster unlocked via essences (original LCS). */
  const CHARACTERS = [
    {
      id: 'kori', name: 'Kori Voltz', price: 0, essence: null,
      skill: 'Explosión Estelar', blurb: 'Guerrero de energía del Distrito Neón.',
      stats: { vel: 0.6, jump: 0.6, combo: 0.8 }
    },
    {
      id: 'volta', name: 'Volta Nix', price: 1, essence: 'esencia_overclock',
      skill: 'Pulso Overclock', blurb: 'Acelera el scroll breve tras esquivar.',
      stats: { vel: 0.85, jump: 0.5, combo: 0.65 }
    },
    {
      id: 'arena', name: 'Arena Kode', price: 1, essence: 'esencia_ferrocode',
      skill: 'Ancla de Arena', blurb: 'Reduce empuje lateral en tormentas.',
      stats: { vel: 0.55, jump: 0.55, combo: 0.7 }
    },
    {
      id: 'frost', name: 'Frost Lumen', price: 1, essence: 'esencia_glacia',
      skill: 'Pista Fría', blurb: 'Menos desliz al aterrizar sobre hielo.',
      stats: { vel: 0.5, jump: 0.75, combo: 0.6 }
    },
    {
      id: 'helix', name: 'Helix Riva', price: 1, essence: 'esencia_rivalis',
      skill: 'Contraovación', blurb: 'Shake reducido; combo más estable.',
      stats: { vel: 0.7, jump: 0.65, combo: 0.75 }
    },
    {
      id: 'tide', name: 'Tide Krax', price: 1, essence: 'esencia_kraxo',
      skill: 'Burbuja', blurb: 'Un iframe extra corto bajo presión.',
      stats: { vel: 0.45, jump: 0.8, combo: 0.55 }
    },
    {
      id: 'solara', name: 'Solara Aure', price: 1, essence: 'esencia_auros',
      skill: 'Orbita Solar', blurb: 'Super carga +15% más rápido.',
      stats: { vel: 0.65, jump: 0.7, combo: 0.7 }
    },
    {
      id: 'prism', name: 'Prism Quanta', price: 1, essence: 'esencia_fractal',
      skill: 'Eco Fractal', blurb: 'Doble salto más accesible.',
      stats: { vel: 0.6, jump: 0.85, combo: 0.6 }
    },
    {
      id: 'ember', name: 'Ember Rex', price: 1, essence: 'esencia_magma',
      skill: 'Núcleo Ígneo', blurb: 'Resistencia al calor (menos DPS).',
      stats: { vel: 0.7, jump: 0.55, combo: 0.65 }
    },
    {
      id: 'voida', name: 'Voida Null', price: 1, essence: 'esencia_null',
      skill: 'Silencio', blurb: 'Near-miss genera súper extra.',
      stats: { vel: 0.75, jump: 0.6, combo: 0.8 }
    },
    {
      id: 'zero', name: 'Agente Cero', price: 2, essence: 'esencia_cero',
      skill: 'Protocolo Final', blurb: 'Boost menor en Distrito Final.',
      stats: { vel: 0.8, jump: 0.7, combo: 0.85 }
    }
  ];

  const FRAGMENT_SETS = {
    neon: { id: 'frag_neon', need: 4, reward: 'trail_boost_neon' },
    golden: { id: 'frag_golden', need: 4, reward: 'trail_boost_gold' },
    ice: { id: 'frag_ice', need: 3, reward: 'friction_assist' },
    coliseum: { id: 'frag_coliseum', need: 4, reward: 'shake_dampen' },
    abyssal: { id: 'frag_abyssal', need: 3, reward: 'bubble_iframe' },
    celestial: { id: 'frag_celestial', need: 4, reward: 'super_charge' },
    quantum: { id: 'frag_quantum', need: 5, reward: 'air_jump' },
    igneous: { id: 'frag_igneous', need: 4, reward: 'heat_resist' },
    fractal: { id: 'frag_fractal', need: 5, reward: 'near_miss_super' },
    final: { id: 'frag_final', need: 4, reward: 'final_boost' }
  };

  const MEMORY_LORE = [
    'El Distrito no tiene mapa: solo portales.',
    'Kori canaliza ki en cada salto.',
    'Las constelaciones son código legible.',
    'Ningún portal lleva al mismo lugar dos veces.',
    'Logic Code Spot custodia esta IP original.',
    'Las Esencias recuerdan a quien las derrotó.',
    'El Escuadrón Cero no tiene nombres públicos.',
    'La Explosión Estelar es un pacto, no un truco.'
  ];

  global.RLContentV6 = {
    BOSSES,
    CHARACTERS,
    FRAGMENT_SETS,
    MEMORY_LORE,
    getBoss(worldId) { return BOSSES[worldId] || null; },
    getCharacter(id) { return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0]; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
