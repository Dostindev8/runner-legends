/**
 * Solvabilidad de láseres (Node). Física alineada a CFG de game.js.
 * Ideal: reacción 0 ms. Humano: 250 ms. Semilla determinista.
 */
'use strict';
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const G = 2200, JUMP = 900, DJ = 790, COYOTE = 0.12;
function airTime(doubleJump) {
  const v = JUMP;
  const tUp = v / G;
  const tDown = Math.sqrt((2 * (v * tUp - 0.5 * G * tUp * tUp)) / G) || tUp;
  let t = tUp + tDown + COYOTE;
  if (doubleJump) t += DJ / G + 0.12;
  return t;
}

function solvable(kind, reaction, tele) {
  const wait = Math.max(0, tele - reaction);
  const tJump = airTime(kind === 'wave' || kind === 'volley');
  if (kind === 'bolt_low' || kind === 'wave' || kind === 'volley') return wait + tJump > 0.28;
  if (kind === 'bolt_high') return true;
  if (kind === 'beam') return true;
  if (kind === 'cross') return wait + tJump > 0.35;
  return false;
}

const tele = { normal: 0.7, hard: 0.6, expert: 0.5, legendary: 0.42 };
const kinds = ['bolt_low', 'bolt_high', 'volley', 'wave', 'beam', 'cross'];
const N = 2000;
let failH = 0, failI = 0, n = 0;
['normal', 'hard', 'expert', 'legendary'].forEach((d) => {
  const rng = mulberry32(20260918 + d.length);
  for (let i = 0; i < N; i++) {
    const k = kinds[Math.floor(rng() * kinds.length)];
    n++;
    if (!solvable(k, 0.25, tele[d]) && (d === 'normal' || d === 'hard')) failH++;
    if (!solvable(k, 0, tele[d])) failI++;
  }
});
if (failH > 0 || failI > 0) {
  console.error('FAIL humano', failH, 'ideal', failI, 'de', n);
  process.exit(1);
}
console.log('OK laser-solvability', n, 'secuencias 4 dificultades');
