/**
 * Runner Legends v8.1 — bestiario original LCS (2–3 enemigos / mundo).
 * Telegraph ≥400ms salvo élite del Distrito Final. Sin IP de terceros.
 */
(function (global) {
  'use strict';

  const POWER_HIT = {
    flight: { dmg: 0, stun: 0, slow: 0 },
    ascended: { dmg: 2, stun: 0.25, slow: 0, radius: 240 },
    voltz_sphere: { dmg: 3, stun: 0.2, slow: 0, radius: 170 },
    double_laser: { dmg: 2, stun: 0.35, slow: 0, pierce: 2 },
    dance: { dmg: 1, stun: 1.2, slow: 0.4, pulse: 0.7, radius: 360 },
    invincible: { dmg: 0, stun: 0, slow: 0 },
    shadow: { dmg: 0, stun: 0, slow: 0 },
    bullet_time: { dmg: 0, stun: 0, slow: 0.35 },
    volt_storm: { dmg: 1, stun: 0.15, slow: 0.5, chain: 4 },
    colossus: { dmg: 2, stun: 0.2, slow: 0, radius: 260 },
    super: { dmg: 99, stun: 0.1, slow: 0 },
    nova_pulse: { dmg: 2, stun: 0.2, slow: 0, radius: 900 },
    star_lance: { dmg: 4, stun: 0.15, slow: 0, pierce: 1 },
    quantum_shield: { dmg: 0, stun: 0, slow: 0 },
    freight_bat: { dmg: 4, stun: 0.45, slow: 0.15, radius: 430 },
    star_pistol: { dmg: 1, stun: 0.08, slow: 0, pierce: 2 }
  };

  function E(id, name, hp, stompable, telegraphMs, pattern, col, w, h) {
    return { id, name, hp, stompable, telegraphMs, pattern, col, w: w || 42, h: h || 36 };
  }

  const BY_WORLD = {
    neon: [
      E('dron_vigia', 'Dron Vigía', 2, true, 400, 'sine', '#22e6ff', 40, 32),
      E('bloque_centinela', 'Bloque Centinela', 3, true, 450, 'charge', '#a855f7', 48, 40)
    ],
    golden: [
      E('guardian_arena', 'Guardián de Arena', 3, true, 500, 'burrow', '#fbbf24', 46, 38),
      E('escarabajo_solar', 'Escarabajo Solar', 2, true, 420, 'hop', '#fb923c', 40, 28)
    ],
    ice: [
      E('golem_escarcha', 'Golem de Escarcha', 3, true, 500, 'ground', '#7dd3fc', 52, 48),
      E('cristal_errante', 'Cristal Errante', 2, true, 400, 'sine', '#e0f2fe', 34, 34)
    ],
    coliseum: [
      E('gladiador_fantasma', 'Gladiador Fantasma', 3, true, 480, 'charge', '#fdba74', 46, 50),
      E('lanza_espectral', 'Lanza Espectral', 2, true, 500, 'homing', '#f97316', 28, 28)
    ],
    abyssal: [
      E('medusa_abisal', 'Medusa Abisal', 3, true, 450, 'sine', '#2ee8c0', 44, 44),
      E('anguila_presion', 'Anguila de Presión', 2, true, 400, 'zigzag', '#67e8f9', 50, 22)
    ],
    celestial: [
      E('serafin_mecanico', 'Serafín Mecánico', 2, true, 420, 'figure8', '#a8c8ff', 42, 36),
      E('nube_estatica', 'Nube Estática', 3, true, 500, 'static', '#e2e8f0', 56, 32)
    ],
    quantum: [
      E('esporo_fractal', 'Esporo Fractal', 2, true, 400, 'sine', '#4ade80', 36, 36),
      E('raiz_cuantica', 'Raíz Cuántica', 3, true, 400, 'blink', '#86efac', 40, 40)
    ],
    igneous: [
      E('nucleo_fundido', 'Núcleo Fundido', 3, true, 450, 'hop', '#fb7185', 40, 40),
      E('lanzallamas_tect', 'Lanzallamas Tectónico', 3, true, 500, 'ground', '#f97316', 54, 46)
    ],
    fractal: [
      E('eco_espejo', 'Eco Espejo', 3, true, 400, 'mirror', '#c084fc', 40, 48),
      E('poliedro_inestable', 'Poliedro Inestable', 2, true, 420, 'zigzag', '#e879f9', 38, 38)
    ],
    final: [
      E('vigia_elite', 'Vigía Élite', 3, true, 320, 'sine', '#ffd24a', 42, 34),
      E('centinela_elite', 'Centinela Élite', 3, true, 350, 'charge', '#f43f5e', 50, 44),
      E('eco_elite', 'Eco Élite', 4, true, 300, 'mirror', '#a855f7', 44, 50)
    ]
  };

  const DIFF_HP = { normal: 0, hard: 0, expert: 1, legendary: 2 };

  function pick(worldId, difficultyId) {
    const list = BY_WORLD[worldId] || BY_WORLD.neon;
    const def = list[(Math.random() * list.length) | 0];
    const extra = DIFF_HP[difficultyId] || 0;
    const elite = worldId === 'final' ? 1 : 0;
    return {
      id: def.id,
      name: def.name,
      hp: Math.max(1, def.hp + extra + elite),
      maxHp: Math.max(1, def.hp + extra + elite),
      stompable: def.stompable,
      telegraph: Math.max(0.28, (def.telegraphMs - extra * 40) / 1000),
      pattern: def.pattern,
      col: def.col,
      w: def.w,
      h: def.h,
      immortal: false
    };
  }

  function stamp(o, spec, x, y) {
    o.x = x; o.y = y; o.w = spec.w; o.h = spec.h;
    o.ph = Math.random() * 6;
    o.kind = spec.id;
    o.name = spec.name;
    o.hp = spec.hp; o.maxHp = spec.maxHp;
    o.stompable = spec.stompable;
    o.telegraph = spec.telegraph;
    o.age = 0;
    o.stun = 0;
    o.slow = 1;
    o.flash = 0;
    o.pattern = spec.pattern;
    o.col = spec.col;
    o.immortal = !!spec.immortal;
    o.baseY = y;
  }

  function profile(powerId) {
    return POWER_HIT[powerId] || POWER_HIT.super;
  }

  global.RLEnemies = { BY_WORLD, POWER_HIT, pick, stamp, profile };
})(typeof window !== 'undefined' ? window : globalThis);
