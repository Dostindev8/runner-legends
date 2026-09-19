# Log de refactor V7 cierre

| Ola | Qué | Por qué | Riesgo | Evidencia |
|---|---|---|---|---|
| 1 | Ráfaga láser sin `setTimeout` | Timers no respetan pausa/freeze | Bajo | `js/v7-estelar.js` delay en pool |
| 2 | Clamp canvas 3840×2160 | G02 tope 4K | Bajo (solo pantallas enormes) | `View.resize` |
| 3 | visibilitychange / pagehide | R02 pausa+guardar | Bajo | `js/game.js` boot |
| 4 | error / unhandledrejection | R05 no tumbar rAF | Bajo | log `console.warn` |
| 5 | Envelope PISTOLA_ESTELAR | A03 torneo | Bajo, backward compatible | `tournament-service/src/shared/physics-config.ts` |
| 6 | Test láser 10 000×4 | L05 | Nulo | `tests/laser-solvability.test.js` |
| 7 | Caracterización Node | D.1 red de seguridad | Nulo | `tests/characterization-v7.test.js` |

Sin replay-hash golden (deuda). Sin extraer `game.js` (archivo >500 líneas, riesgo de regresión alto).
