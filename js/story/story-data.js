/**
 * Runner Legends — Modo Historia: catálogo Galaxia → Mundo → Nivel.
 * Capa aislada RLStory.data. No toca game.js / portal.js / worlds.js.
 */
(function (global) {
  'use strict';
  global.RLStory = global.RLStory || {};

  function nivel(id, index, name, objectives, coins, unlockType) {
    return {
      id: id,
      index: index,
      name: name,
      objectives: objectives,
      reward: { coins: coins },
      starThresholds: { '1': 'finish', '2': 'under_2min', '3': 'no_hits' },
      unlockRule: { type: unlockType }
    };
  }

  function mundo(cfg) {
    return {
      id: cfg.id,
      name: cfg.name,
      thumbnail: cfg.thumbnail,
      guideCharacterId: cfg.guideCharacterId,
      specialRule: cfg.specialRule,
      engineWorldId: cfg.engineWorldId,
      cosmos: cfg.cosmos || 'neon',
      rival: cfg.rival || '',
      obstacle: cfg.obstacle || '',
      levels: cfg.levels
    };
  }

  var ALWAYS = 'always';
  var PREV = 'previous_level_completed';

  RLStory.data = {
    galaxies: [
      {
        id: 'galaxy-01',
        name: 'Galaxia 01 · Distrito Neón',
        shortLabel: 'GALAXIA 01 · DISTRITO NEÓN',
        unlockRule: { type: ALWAYS },
        worlds: [
          mundo({
            id: 'world-distrito-neon',
            name: 'Distrito Neón',
            thumbnail: 'assets/story/thumbs/distrito-neon.svg',
            guideCharacterId: 'char-kori-voltz',
            specialRule: 'velocidad_extrema',
            engineWorldId: 'neon',
            cosmos: 'neon',
            rival: 'Eco Neón',
            obstacle: 'Luces rápidas y plataformas que parpadean',
            levels: [
              nivel('lvl-neon-01', 1, 'Prueba de Velocidad',
                ['Llega a la meta', 'Evita los obstáculos', 'Completa en menos de 2:00'], 150, ALWAYS),
              nivel('lvl-neon-02', 2, 'Luces de la Avenida',
                ['Sigue las luces cian', 'Recolecta 8 fragmentos', 'Ayuda a un amigo en el camino'], 180, PREV),
              nivel('lvl-neon-03', 3, 'Salto entre Neones',
                ['Encadena 3 saltos suaves', 'Mantén el combo alegre', 'Llega sin detenerte mucho'], 210, PREV),
              nivel('lvl-neon-04', 4, 'Carrera de Amigos',
                ['Corre con ritmo constante', 'Comparte el brillo de Kori', 'Completa con una sonrisa'], 250, PREV),
              nivel('lvl-neon-05', 5, 'Meta del Distrito',
                ['Alcanza la meta del barrio', 'Evita golpes', 'Celebra con el equipo'], 300, PREV)
            ]
          })
        ]
      },
      {
        id: 'galaxy-02',
        name: 'Galaxia 02 · Valle Dorado',
        shortLabel: 'GALAXIA 02 · VALLE DORADO',
        unlockRule: { type: 'previous_galaxy_completed', galaxyId: 'galaxy-01' },
        worlds: [
          mundo({
            id: 'world-valle-dorado',
            name: 'Valle Dorado',
            thumbnail: 'assets/story/thumbs/valle-dorado.svg',
            guideCharacterId: 'char-yara-sahn',
            specialRule: 'tormentas_de_arena',
            engineWorldId: 'golden',
            cosmos: 'golden',
            rival: 'Remolino Dorado',
            obstacle: 'Viento de arena que empuja con suavidad',
            levels: [
              nivel('lvl-golden-01', 1, 'Dunas Doradas',
                ['Atraviesa las dunas', 'Escucha el viento amigo', 'Llega a la meta'], 160, ALWAYS),
              nivel('lvl-golden-02', 2, 'Viento de Arena',
                ['Mantén el equilibrio', 'Recolecta 8 fragmentos', 'Completa en menos de 2:00'], 190, PREV),
              nivel('lvl-golden-03', 3, 'Oasis de Estrellas',
                ['Encuentra el oasis', 'Salta con calma', 'Ayuda a Yara a guiar'], 220, PREV),
              nivel('lvl-golden-04', 4, 'Carrera en el Valle',
                ['Corre entre dunas', 'Evita obstáculos suaves', 'Mantén el combo'], 260, PREV),
              nivel('lvl-golden-05', 5, 'Abrazo del Valle',
                ['Completa el valle', 'Celebra con Yara', 'Llega sin prisa excesiva'], 310, PREV)
            ]
          })
        ]
      },
      {
        id: 'galaxy-03',
        name: 'Galaxia 03 · Cumbres de Hielo',
        shortLabel: 'GALAXIA 03 · CUMBRES DE HIELO',
        unlockRule: { type: 'previous_galaxy_completed', galaxyId: 'galaxy-02' },
        worlds: [
          mundo({
            id: 'world-cumbres-hielo',
            name: 'Cumbres de Hielo',
            thumbnail: 'assets/story/thumbs/cumbres-hielo.svg',
            guideCharacterId: 'char-bjorn-kael',
            specialRule: 'superficies_resbaladizas',
            engineWorldId: 'ice',
            cosmos: 'ice',
            rival: 'Copo Travesura',
            obstacle: 'Hielo resbaladizo y puentes de aurora',
            levels: [
              nivel('lvl-ice-01', 1, 'Primer Copo',
                ['Desliza con cuidado', 'Llega a la meta', 'Disfruta la nieve'], 170, ALWAYS),
              nivel('lvl-ice-02', 2, 'Puente Helado',
                ['Cruza el puente', 'Recolecta 8 fragmentos', 'Completa en menos de 2:00'], 200, PREV),
              nivel('lvl-ice-03', 3, 'Aurora Suave',
                ['Sigue la aurora', 'Salta suave', 'Mantén el ritmo'], 230, PREV),
              nivel('lvl-ice-04', 4, 'Desliz Feliz',
                ['Desliza sin frenar de golpe', 'Evita obstáculos', 'Ayuda a Bjorn'], 270, PREV),
              nivel('lvl-ice-05', 5, 'Cumbre Brillante',
                ['Alcanza la cumbre', 'Celebra con el equipo', 'Llega a la meta'], 320, PREV)
            ]
          })
        ]
      },
      {
        id: 'galaxy-04',
        name: 'Galaxia 04 · Coliseo',
        shortLabel: 'GALAXIA 04 · COLISEO',
        unlockRule: { type: 'previous_galaxy_completed', galaxyId: 'galaxy-03' },
        worlds: [
          mundo({
            id: 'world-coliseo',
            name: 'Coliseo',
            thumbnail: 'assets/story/thumbs/coliseo.svg',
            guideCharacterId: 'char-rekka-dorn',
            specialRule: 'oleadas_de_obstaculos',
            engineWorldId: 'coliseum',
            cosmos: 'coliseum',
            rival: 'Eco de Ovación',
            obstacle: 'Oleadas de aros y columnas que hay que saltar',
            levels: [
              nivel('lvl-coliseo-01', 1, 'Entrada al Coliseo',
                ['Saluda al público', 'Llega a la meta', 'Sigue el ritmo'], 180, ALWAYS),
              nivel('lvl-coliseo-02', 2, 'Ritmo de Ovación',
                ['Corre al ritmo de aplausos', 'Recolecta 8 fragmentos', 'Completa en menos de 2:00'], 210, PREV),
              nivel('lvl-coliseo-03', 3, 'Circuito de Estrellas',
                ['Da una vuelta completa', 'Salta las oleadas', 'Mantén el combo'], 240, PREV),
              nivel('lvl-coliseo-04', 4, 'Desafío Amistoso',
                ['Supera las oleadas con calma', 'Ayuda a Rekka', 'Evita tropiezos'], 280, PREV),
              nivel('lvl-coliseo-05', 5, 'Trofeo de Amigos',
                ['Completa el circuito', 'Celebra el esfuerzo', 'Llega a la meta'], 330, PREV)
            ]
          })
        ]
      },
      {
        id: 'galaxy-05',
        name: 'Galaxia 05 · Planeta Abisal',
        shortLabel: 'GALAXIA 05 · PLANETA ABISAL',
        unlockRule: { type: 'previous_galaxy_completed', galaxyId: 'galaxy-04' },
        worlds: [
          mundo({
            id: 'world-planeta-abisal',
            name: 'Planeta Abisal',
            thumbnail: 'assets/story/thumbs/planeta-abisal.svg',
            guideCharacterId: 'char-nyx-thal',
            specialRule: 'gravedad_alterada',
            engineWorldId: 'abyssal',
            cosmos: 'abyssal',
            rival: 'Burbuja Viajera',
            obstacle: 'Gravedad suave y corrientes de luz',
            levels: [
              nivel('lvl-abyss-01', 1, 'Primer Flote',
                ['Flota con suavidad', 'Llega a la meta', 'Prueba saltos largos'], 190, ALWAYS),
              nivel('lvl-abyss-02', 2, 'Burbujas de Luz',
                ['Sigue las burbujas', 'Recolecta 8 fragmentos', 'Completa en menos de 2:00'], 220, PREV),
              nivel('lvl-abyss-03', 3, 'Corriente Amable',
                ['Nada con la corriente', 'Salta alto', 'Mantén la calma'], 250, PREV),
              nivel('lvl-abyss-04', 4, 'Salto Largo',
                ['Aprovecha la gravedad suave', 'Evita obstáculos', 'Ayuda a Nyx'], 290, PREV),
              nivel('lvl-abyss-05', 5, 'Fondo Estelar',
                ['Alcanza el fondo brillante', 'Celebra con el equipo', 'Llega a la meta'], 340, PREV)
            ]
          })
        ]
      },
      {
        id: 'galaxy-06',
        name: 'Galaxia 06 · Ciudad Celestial',
        shortLabel: 'GALAXIA 06 · CIUDAD CELESTIAL',
        unlockRule: { type: 'previous_galaxy_completed', galaxyId: 'galaxy-05' },
        worlds: [
          mundo({
            id: 'world-ciudad-celestial',
            name: 'Ciudad Celestial',
            thumbnail: 'assets/story/thumbs/ciudad-celestial.svg',
            guideCharacterId: 'char-alto-mira',
            specialRule: 'escenario_cambiante',
            engineWorldId: 'celestial',
            cosmos: 'celestial',
            rival: 'Nube Cambiante',
            obstacle: 'Puentes de cielo que se mueven despacio',
            levels: [
              nivel('lvl-celestial-01', 1, 'Nubes de Plata',
                ['Camina sobre nubes', 'Llega a la meta', 'Mira el cielo'], 200, ALWAYS),
              nivel('lvl-celestial-02', 2, 'Puentes de Cielo',
                ['Cruza los puentes', 'Recolecta 8 fragmentos', 'Completa en menos de 2:00'], 230, PREV),
              nivel('lvl-celestial-03', 3, 'Viento de Fiesta',
                ['Sigue el viento alegre', 'Salta con timing', 'Mantén el combo'], 260, PREV),
              nivel('lvl-celestial-04', 4, 'Torres Flotantes',
                ['Salta de torre en torre', 'Evita huecos', 'Ayuda a Alto Mira'], 300, PREV),
              nivel('lvl-celestial-05', 5, 'Ciudad de Estrellas',
                ['Recorre la ciudad', 'Celebra el camino', 'Llega a la meta'], 360, PREV),
              nivel('lvl-celestial-06', 6, 'Encuentro Celestial',
                ['Saluda al centinela amigo', 'Completa el recorrido final', 'Comparte la victoria con todos'], 450, PREV)
            ]
          })
        ]
      }
    ]
  };

  /** Busca un nivel por id en todo el catálogo. */
  RLStory.data.findLevel = function (levelId) {
    var galaxies = RLStory.data.galaxies;
    var g, w, l, gi, wi, li;
    for (gi = 0; gi < galaxies.length; gi++) {
      g = galaxies[gi];
      for (wi = 0; wi < g.worlds.length; wi++) {
        w = g.worlds[wi];
        for (li = 0; li < w.levels.length; li++) {
          l = w.levels[li];
          if (l.id === levelId) {
            return { galaxy: g, world: w, level: l };
          }
        }
      }
    }
    return null;
  };

  /** Lista plana de niveles de una galaxia (nodos del camino). */
  RLStory.data.levelsOfGalaxy = function (galaxy) {
    var out = [];
    if (!galaxy || !galaxy.worlds) return out;
    galaxy.worlds.forEach(function (world) {
      world.levels.forEach(function (lvl) {
        out.push({ world: world, level: lvl });
      });
    });
    return out;
  };
})(window);
