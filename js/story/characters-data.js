/**
 * Fichas de personajes guía del Modo Historia.
 * IP original Logic Code Spot. Tono positivo, apto 3–4 años.
 */
(function (global) {
  'use strict';
  global.RLStory = global.RLStory || {};

  RLStory.characters = {
    'char-kori-voltz': {
      id: 'char-kori-voltz',
      name: 'Kori Voltz',
      worldName: 'Distrito Neón',
      role: 'Guerrera de energía del Distrito Neón',
      portrait: 'assets/story/characters/kori-voltz.svg',
      stats: { vel: 'alta', salto: 'media', combo: 'alto' },
      statBars: { vel: 88, salto: 62, combo: 90 },
      bio: 'Kori brilla para que nadie se pierda en las calles de neón. Corre rápido, salta con alegría y enseña que un combo se comparte con amigos. Cada luz que enciende es una invitación a seguir intentándolo juntos.'
    },
    'char-yara-sahn': {
      id: 'char-yara-sahn',
      name: 'Yara Sahn',
      worldName: 'Valle Dorado',
      role: 'Guardiana de las Dunas',
      portrait: 'assets/story/characters/yara-sahn.svg',
      stats: { vel: 'media', salto: 'alto', combo: 'medio' },
      statBars: { vel: 58, salto: 88, combo: 60 },
      bio: 'Yara escucha el viento del valle y lo convierte en juego. Cuando la arena baila, ella salta más alto para mostrar el camino. Cree que cada duna es un abrazo: si caes, te levantas y corres otra vez con una sonrisa.'
    },
    'char-bjorn-kael': {
      id: 'char-bjorn-kael',
      name: 'Bjorn Kael',
      worldName: 'Cumbres de Hielo',
      role: 'Corredor Glacial',
      portrait: 'assets/story/characters/bjorn-kael.svg',
      stats: { vel: 'alta', salto: 'media', combo: 'bajo' },
      statBars: { vel: 86, salto: 55, combo: 38 },
      bio: 'Bjorn desliza sobre el hielo como si el suelo cantara. No compite contra nadie: invita a patinar despacio, reír y llegar juntos a la cumbre. Dice que el frío se calienta cuando alguien te espera al otro lado del puente.'
    },
    'char-rekka-dorn': {
      id: 'char-rekka-dorn',
      name: 'Rekka Dorn',
      worldName: 'Coliseo',
      role: 'Campeona del Coliseo Eterno',
      portrait: 'assets/story/characters/rekka-dorn.svg',
      stats: { vel: 'media', salto: 'alto', combo: 'alto' },
      statBars: { vel: 60, salto: 86, combo: 88 },
      bio: 'Rekka convierte cada ovación en un ritmo para saltar y reír. En el Coliseo el reto es compartir el escenario: las oleadas son un baile, no un susto. Celebra el esfuerzo de todos, no solo el primer lugar.'
    },
    'char-nyx-thal': {
      id: 'char-nyx-thal',
      name: 'Nyx Thal',
      worldName: 'Planeta Abisal',
      role: 'Explorador de Gravedad',
      portrait: 'assets/story/characters/nyx-thal.svg',
      stats: { vel: 'baja', salto: 'extremo', combo: 'medio' },
      statBars: { vel: 36, salto: 98, combo: 58 },
      bio: 'Nyx flota donde otros corren y enseña a saltar muy alto sin prisa. En el Planeta Abisal la gravedad es un columpio gigante. Invita a explorar con calma: cada burbuja de luz es un amigo que señala el camino a casa.'
    },
    'char-alto-mira': {
      id: 'char-alto-mira',
      name: 'Alto Mira',
      worldName: 'Ciudad Celestial',
      role: 'Centinela Celestial',
      portrait: 'assets/story/characters/alto-mira.svg',
      stats: { vel: 'alta', salto: 'alto', combo: 'extremo' },
      statBars: { vel: 90, salto: 88, combo: 98 },
      bio: 'Alto Mira cuida las nubes para que nadie se quede atrás. Cuando el escenario cambia, guía con una estrella amable. Su combo extremo es en realidad muchas manos juntas: perseverar, reír y llegar a la ciudad de estrellas en equipo.'
    }
  };

  RLStory.getCharacter = function (id) {
    return RLStory.characters[id] || null;
  };
})(window);
