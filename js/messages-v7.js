/**
 * Runner Legends v7 — Character voice bank (90 lines, 6 voices × 15).
 * Maps to existing roster ids. Every line ends with "— Dostin Santana".
 */
(function (global) {
  'use strict';
  const SIGN = '— Dostin Santana';
  const CATS = ['MOTIVACION', 'ESTUDIO', 'SEGURIDAD', 'HUMOR_RD', 'LORE', 'TIP'];
  const COL = {
    MOTIVACION: '#22d3ee', ESTUDIO: '#a78bfa', SEGURIDAD: '#fbbf24',
    HUMOR_RD: '#f472b6', LORE: '#60a5fa', TIP: '#4ade80'
  };

  function L(id, characterId, category, text) {
    return { id: id, characterId: characterId, category: category, text: text, author: 'Dostin Santana' };
  }

  const BANK = [
    L('kori-01', 'kori', 'MOTIVACION', 'El Distrito no premia al que corre rápido. Premia al que no se detiene. ' + SIGN),
    L('kori-02', 'kori', 'ESTUDIO', 'Cada salto que dominas aquí, domínalo también en tus libros. Ahí está el verdadero combo. ' + SIGN),
    L('kori-03', 'kori', 'ESTUDIO', 'Yo cargo energía. Tú carga conocimiento. Los dos ganamos por lo mismo: práctica diaria. ' + SIGN),
    L('kori-04', 'kori', 'SEGURIDAD', 'Volar es mi trabajo, no el tuyo. Esto no se intenta en casa. ' + SIGN),
    L('kori-05', 'kori', 'HUMOR_RD', 'Vine más rápido que cuando dicen “ya voy saliendo”. ' + SIGN),
    L('kori-06', 'kori', 'LORE', 'El Distrito Neón fue una ciudad. Ahora es una prueba. Yo la cruzo cada noche. ' + SIGN),
    L('kori-07', 'kori', 'TIP', 'Doble salto en el aire, no antes. La paciencia es un poder también. ' + SIGN),
    L('kori-08', 'kori', 'MOTIVACION', 'Perder no es el final del intento. Es el principio del que sigue. ' + SIGN),
    L('kori-09', 'kori', 'ESTUDIO', 'Nadie desbloquea nada en la vida real sin estudiar el nivel primero. ' + SIGN),
    L('kori-10', 'kori', 'HUMOR_RD', 'Aquí el tapón es de enemigos, no de carros. Gracias a Dios. ' + SIGN),
    L('kori-11', 'kori', 'SEGURIDAD', 'Si te mareas, para. El Distrito espera; tu cuerpo no. ' + SIGN),
    L('kori-12', 'kori', 'LORE', 'La Explosión Estelar es un pacto con el neón, no un truco de feria. ' + SIGN),
    L('kori-13', 'kori', 'TIP', 'No gastes el SÚPER en el primer dron. Espera el grupo. ' + SIGN),
    L('kori-14', 'kori', 'MOTIVACION', 'Sincroniza el pulso. El resto es consecuencia. ' + SIGN),
    L('kori-15', 'kori', 'HUMOR_RD', 'Me pidieron un selfie en el portal. Les dije que primero el combo. ' + SIGN),

    L('volta-01', 'volta', 'MOTIVACION', 'La sombra no compite con la luz. La usa. Usa lo que tengas. ' + SIGN),
    L('volta-02', 'volta', 'ESTUDIO', 'Aprender es entrenar en silencio para brillar en público. ' + SIGN),
    L('volta-03', 'volta', 'SEGURIDAD', 'Nada de lo que hago aquí funciona fuera de la pantalla. Cuida tu cuerpo. ' + SIGN),
    L('volta-04', 'volta', 'HUMOR_RD', 'Soy tan rápido que llegué antes que el plátano al mangú. ' + SIGN),
    L('volta-05', 'volta', 'TIP', 'Si el obstáculo está lejos, no saltes por miedo. Salta por cálculo. ' + SIGN),
    L('volta-06', 'volta', 'LORE', 'Cada mundo tiene una regla. El que la entiende, no la sufre. ' + SIGN),
    L('volta-07', 'volta', 'MOTIVACION', 'Caíste. Bien. Ahora sabes exactamente dónde estaba el error. ' + SIGN),
    L('volta-08', 'volta', 'ESTUDIO', 'Estudia como corres: sin mirar atrás, pero midiendo cada paso. ' + SIGN),
    L('volta-09', 'volta', 'HUMOR_RD', 'Me dijeron “ahorita salimos”. Corrí 10 mundos y todavía nada. ' + SIGN),
    L('volta-10', 'volta', 'TIP', 'El botón SÚPER se carga con combo, no con suerte. Encadena. ' + SIGN),
    L('volta-11', 'volta', 'SEGURIDAD', 'Velocidad extrema es un modo de juego. En la calle es un accidente. ' + SIGN),
    L('volta-12', 'volta', 'LORE', 'Overclock no perdona a quien improvisa el pulso. ' + SIGN),
    L('volta-13', 'volta', 'MOTIVACION', 'El que duda en el borde, ya cedió el metro. ' + SIGN),
    L('volta-14', 'volta', 'ESTUDIO', 'Repite el patrón hasta que el miedo se aburra. ' + SIGN),
    L('volta-15', 'volta', 'HUMOR_RD', 'Corrí tanto que el WiFi del Distrito me pidió un break. ' + SIGN),

    L('helix-01', 'helix', 'HUMOR_RD', 'Yo no corro, yo tiro flow. Lo demás es consecuencia. ' + SIGN),
    L('helix-02', 'helix', 'MOTIVACION', 'Tú tiene má’ corazón que barra de vida. Dale. ' + SIGN),
    L('helix-03', 'helix', 'ESTUDIO', 'Grábate esto: el que estudia hoy, pone la música mañana. ' + SIGN),
    L('helix-04', 'helix', 'HUMOR_RD', 'El colmado del Distrito cierra a las 3. Corre, que quiero mi malta. ' + SIGN),
    L('helix-05', 'helix', 'SEGURIDAD', 'Ese baile mío rompe enemigos. En casa solo rompe muebles. Tranquilo. ' + SIGN),
    L('helix-06', 'helix', 'TIP', 'Cuando la barra esté llena, no la gastes de vaina. Espera el grupo. ' + SIGN),
    L('helix-07', 'helix', 'MOTIVACION', 'Nadie empezó siendo leyenda. Yo empecé cayéndome en el primer bloque. ' + SIGN),
    L('helix-08', 'helix', 'HUMOR_RD', 'Aquí llueve má’ que en abril con la luz apagá’. ' + SIGN),
    L('helix-09', 'helix', 'ESTUDIO', 'Repetir el nivel es como repasar: aburre, pero aprueba. ' + SIGN),
    L('helix-10', 'helix', 'LORE', 'El Coliseo suena a dembow si lo escuchas bien. Yo lo escucho. ' + SIGN),
    L('helix-11', 'helix', 'TIP', 'Un poder a la vez. El show es mejor cuando no se mezcla. ' + SIGN),
    L('helix-12', 'helix', 'SEGURIDAD', 'Si te duele la mano de tanto tap, descansa. El ranking espera. ' + SIGN),
    L('helix-13', 'helix', 'MOTIVACION', 'La ovación no te salva. El timing sí. ' + SIGN),
    L('helix-14', 'helix', 'ESTUDIO', 'Memoriza el patrón como la letra: sin mirar el teleprompter. ' + SIGN),
    L('helix-15', 'helix', 'LORE', 'Rivalis cobra en aplausos. Tú cobras en metros. ' + SIGN),

    L('arena-01', 'arena', 'MOTIVACION', 'El oro no se encuentra. Se saca de la piedra a golpes. ' + SIGN),
    L('arena-02', 'arena', 'ESTUDIO', 'Un examen es un jefe final. Se estudia el patrón y se pasa. ' + SIGN),
    L('arena-03', 'arena', 'SEGURIDAD', 'Los golpes que doy son digitales. Los de la vida real duelen. Evítalos. ' + SIGN),
    L('arena-04', 'arena', 'HUMOR_RD', 'Tengo el aura dorá’ y todavía me dicen “mi loco, préstame mil”. ' + SIGN),
    L('arena-05', 'arena', 'TIP', 'No uses todos los poderes de una. Uno a la vez, bien puesto, vale por tres. ' + SIGN),
    L('arena-06', 'arena', 'LORE', 'El Valle Dorado no da riqueza. Da pruebas. La riqueza viene después. ' + SIGN),
    L('arena-07', 'arena', 'MOTIVACION', 'El que se levanta rápido no perdió. Solo se agachó. ' + SIGN),
    L('arena-08', 'arena', 'ESTUDIO', 'Aprende una cosa bien antes de aprender diez a medias. ' + SIGN),
    L('arena-09', 'arena', 'HUMOR_RD', 'Yo brillo tanto que me apagan pa’ ahorrar luz. ' + SIGN),
    L('arena-10', 'arena', 'TIP', 'Los enemigos cambian por mundo. Lee antes de pegar. ' + SIGN),
    L('arena-11', 'arena', 'SEGURIDAD', 'Tormenta de arena aquí. Allá afuera, tapa la boca y espera. ' + SIGN),
    L('arena-12', 'arena', 'LORE', 'Don Ferrocode cobra en peso. Tú cobras en intentos. ' + SIGN),
    L('arena-13', 'arena', 'MOTIVACION', 'La duna se mueve. Tú también. Adelante. ' + SIGN),
    L('arena-14', 'arena', 'ESTUDIO', 'Si no entendiste el patrón, no es el juego: es la lectura. ' + SIGN),
    L('arena-15', 'arena', 'HUMOR_RD', 'Pedí un chin de agua y me dieron un oasis con jefe. ' + SIGN),

    L('ember-01', 'ember', 'MOTIVACION', 'Invierte en ti. Es el único activo que nadie te quita. ' + SIGN),
    L('ember-02', 'ember', 'ESTUDIO', 'El interés compuesto también aplica al cerebro. Estudia diario. ' + SIGN),
    L('ember-03', 'ember', 'HUMOR_RD', 'Gasté 147 monedas en una estela. Cero arrepentimiento. ' + SIGN),
    L('ember-04', 'ember', 'SEGURIDAD', 'Ningún poder de aquí paga cuentas allá afuera. Descansa y come. ' + SIGN),
    L('ember-05', 'ember', 'TIP', 'Guarda el SÚPER para el jefe. El jefe no perdona improvisación. ' + SIGN),
    L('ember-06', 'ember', 'LORE', 'Todo en el Distrito tiene precio. Menos el intento número dos. Ese es gratis. ' + SIGN),
    L('ember-07', 'ember', 'HUMOR_RD', 'Pedí factura con NCF y el enemigo se fue corriendo. ' + SIGN),
    L('ember-08', 'ember', 'MOTIVACION', 'La diferencia entre el que llega y el que no, es el intento que nadie vio. ' + SIGN),
    L('ember-09', 'ember', 'ESTUDIO', 'Lo que aprendes hoy lo cobras cinco años. Mínimo. ' + SIGN),
    L('ember-10', 'ember', 'TIP', 'Combo alto = barra rápida. La eficiencia es rentable. ' + SIGN),
    L('ember-11', 'ember', 'SEGURIDAD', 'El magma es un filtro. Si te quema la vista, baja el brillo. ' + SIGN),
    L('ember-12', 'ember', 'LORE', 'Ígneo no perdona a quien se queda quieto. Ni el mercado tampoco. ' + SIGN),
    L('ember-13', 'ember', 'MOTIVACION', 'Quema lo que no sirve. Conserva el núcleo. ' + SIGN),
    L('ember-14', 'ember', 'ESTUDIO', 'Contar monedas está bien. Contar horas de estudio está mejor. ' + SIGN),
    L('ember-15', 'ember', 'HUMOR_RD', 'El calor extremo me dejó el café a temperatura de oficina. ' + SIGN),

    L('solara-01', 'solara', 'MOTIVACION', 'Todo el mundo tiene un ritmo. El tuyo apenas está empezando. ' + SIGN),
    L('solara-02', 'solara', 'ESTUDIO', 'Estudiar con música es válido. Estudiar sin estudiar, no. ' + SIGN),
    L('solara-03', 'solara', 'HUMOR_RD', 'Puse una pista y hasta los drones se pusieron a orbitar. ' + SIGN),
    L('solara-04', 'solara', 'SEGURIDAD', 'La invencibilidad dura segundos aquí. Cero segundos allá. Cuídate. ' + SIGN),
    L('solara-05', 'solara', 'TIP', 'Cuando el mundo se congela, respira. Elige con cabeza, no con dedo. ' + SIGN),
    L('solara-06', 'solara', 'LORE', 'El Distrito late. Si lo sientes, ya vas ganando. ' + SIGN),
    L('solara-07', 'solara', 'MOTIVACION', 'No compitas con el de al lado. Compite con el tú de ayer. ' + SIGN),
    L('solara-08', 'solara', 'HUMOR_RD', 'Se fue la luz en el Distrito y seguí brillando yo sola. ' + SIGN),
    L('solara-09', 'solara', 'ESTUDIO', 'Repite hasta que te salga sin pensar. Eso se llama dominio. ' + SIGN),
    L('solara-10', 'solara', 'SEGURIDAD', 'Toma agua. En serio. Esto no es parte del juego. ' + SIGN),
    L('solara-11', 'solara', 'TIP', 'Órbita Solar carga el súper más rápido. Encadena monedas. ' + SIGN),
    L('solara-12', 'solara', 'LORE', 'Auros guarda el ritmo de las constelaciones. Síguelo. ' + SIGN),
    L('solara-13', 'solara', 'MOTIVACION', 'Un eclipse no apaga a quien ya decidió brillar. ' + SIGN),
    L('solara-14', 'solara', 'ESTUDIO', 'La teoría sin práctica es un portal cerrado. ' + SIGN),
    L('solara-15', 'solara', 'HUMOR_RD', 'Me dijeron “un momentito”. Orbité tres lunas. ' + SIGN)
  ];

  const ALIAS = {
    frost: 'volta', tide: 'solara', prism: 'kori', voida: 'volta', zero: 'ember'
  };

  const KEY = 'rl:messages:v1';
  function loadRecent() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || '{}');
      return Array.isArray(d.recentIds) ? d.recentIds.slice(-24) : [];
    } catch (e) { return []; }
  }
  function saveRecent(ids) {
    try { localStorage.setItem(KEY, JSON.stringify({ schemaVersion: 1, recentIds: ids.slice(-24) })); } catch (e) {}
  }

  function pick(characterId, ctx) {
    const cid = ALIAS[characterId] || characterId || 'kori';
    let pool = BANK.filter((m) => m.characterId === cid);
    if (!pool.length) pool = BANK.filter((m) => m.characterId === 'kori');
    let recent = loadRecent();
    const n = Math.min(12, Math.max(1, pool.length - 1));
    let fresh = pool.filter((m) => recent.indexOf(m.id) === -1);
    if (!fresh.length) { recent = []; fresh = pool.slice(); }
    const hour = (ctx && ctx.hour != null) ? ctx.hour : new Date().getHours();
    const sessionTry = (ctx && ctx.sessionTry) || 1;
    const losses = (ctx && ctx.losses) || 0;
    const wFor = function (m) {
      let w = 1;
      if (sessionTry === 1) {
        if (m.category === 'MOTIVACION') w *= 3;
        if (m.category === 'LORE') w *= 2;
      }
      if (losses >= 3) {
        if (m.category === 'MOTIVACION') w *= 4;
        if (m.category === 'HUMOR_RD') w *= 3;
        if (m.category === 'TIP') w *= 2;
      }
      if (hour >= 22 || hour < 5) {
        if (m.category === 'ESTUDIO') w *= 3;
        if (m.category === 'HUMOR_RD') w *= 2;
      }
      if (sessionTry % 5 === 0 && m.category === 'SEGURIDAD') w *= 8;
      return w;
    };
    let total = 0;
    const weights = fresh.map(wFor);
    for (let i = 0; i < weights.length; i++) total += weights[i];
    let r = Math.random() * total;
    let chosen = fresh[0];
    for (let i = 0; i < fresh.length; i++) {
      r -= weights[i];
      if (r <= 0) { chosen = fresh[i]; break; }
    }
    recent.push(chosen.id);
    if (recent.length > n) recent = recent.slice(-n);
    saveRecent(recent);
    return chosen;
  }

  global.RLMessages = { BANK: BANK, CATS: CATS, COL: COL, pick: pick, count: BANK.length };
})(typeof window !== 'undefined' ? window : globalThis);
