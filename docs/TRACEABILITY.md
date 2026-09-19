# Trazabilidad V7.0 Estelar

Fecha: 2026-09-18. Evidencia de código en `main` + cierre (visibility, clamp 4K, test 10k, PISTOLA_ESTELAR en torneo).

Leyenda: ✅ evidencia · 🟡 parcial · ❌ falta · ⛔ humano

| ID | Estado | Evidencia | Acción |
|---|---|---|---|
| G01 | 🟡 | `js/v7-estelar.js:applyTier` + `js/game.js:detectQuality` + Ajustes `v7Quality`. No hay archivo `QualityManager.js` aparte. Histéresis de frame p95 no baja el tier sola. | Diferido: autoscale por p95 |
| G02 | 🟡 | `js/game.js:View.resize` clamp 3840×2160. Sin histéresis 0.6–1.0 continua. | Diferido |
| G03 | 🟡 | `assets/manifest.json` layers []. Procedural. SW precache JS. Peso assets ~555 KB. Sin raster 4K. | ⛔ arte humano ART_BRIEF |
| G04 | ✅ | `docs/ART_BRIEF.md` | — |
| G05 | 🟡 | `Backdrop` 6 capas `js/game.js:616`. Sin bake offscreen dedicado. | Deuda |
| G06 | 🟡 | `WeatherFX` lluvia 1 capa + reflejo V7 en suelo. No 3 profundidades. | Deuda |
| G07 | 🟡 | `drawKori` + overlay rim/sombra/reflejo. No atlas 4×. | ⛔ sprites |
| G08 | 🟡 | Drones + fragmentos `bits[]` en v7. Estados idle/carga/disparo incompletos vs spec. | Deuda |
| G09 | 🟡 | Viñeta PLAY `js/game.js:render`. Sin bloom 1/4 ni grano ni CA 120 ms. | Deuda |
| G10 | 🟡 | `prefers-reduced-motion` + checkbox. Sin contador 3 flashes/s. | Deuda |
| G11 | 🟡 | Pools v7 (24 láser, 32 casquillos, 40 bits) + Particles. Topes ULTRA 2500 no implementados. | Deuda |
| H01 | ✅ | `index.html` hud-v7 + ids dist/hearts/coins/objChip/comboChip | Captura play local |
| H02 | ✅ | `#netPill` relativo bajo metros. Captura 184 m + SINCRONIZADO debajo | — |
| H03 | ✅ | `.combo-rail` `left:max(16px,var(--safe-l))` | — |
| H04 | ✅ | `#superBtn` ≥56px, safe-area | — |
| L01 | 🟡 | 6 kinds en `v7-estelar.js`. Cruzado no exclusivo Difícil+. | Ajuste spawn |
| L02 | 🟡 | `teleMs` + physics-config telegraphMs. Fases tele/live/cool. | — |
| L03 | 🟡 | Texto SALTA/SUELO + color. Hitbox 0.85. Jugador no tocado. | — |
| L04 | 🟡 | `player.hurt` + iframe 1.2. Freeze 0.06 existente. | — |
| L05 | ✅ | `tests/laser-solvability.test.js` N=10000×4, semilla 20260918 | `node tests/laser-solvability.test.js` |
| L06 | 🟡 | RNG mulberry32 en test; runtime usa Math.random (no semilla torneo). | Deuda anti-cheat |
| L07 | ✅ | `v7-estelar.js` dodge + toast ¡ESQUIVE! + super 0.04 | — |
| L08 | 🟡 | Pistola cancela bolts live. Láser de ojos no cableado a intercept. Beam no se cancela. | Deuda |
| L09 | 🟡 | SFX pistola `audio.powerId`. Háptica toggle. Audio láser incompleto. | Deuda |
| C01 | 🟡 | Overlay cele al 8 KO / 250 m / jefe. No máquina META→portal completa. | Deuda |
| C02 | ✅ | `persist()` antes de `startCele` | `js/game.js` PLAY clear |
| C03 | 🟡 | JSON 3 danzas×6. No se anima canvas data-driven ni valida al load en runtime. | Test Node esquema |
| C04 | ✅ | Skip 1.2 s; reduced 1.4 s | v7-estelar |
| C05 | 🟡 | Cartel NEXT LEVEL. Iris portal existente. Bug “mitad de pantalla” no re-probado en prod. | QA humano |
| C06 | ❌ | Distrito Final sin celebración extra | Diferido |
| P01 | ✅ | `content-v6.js` star_pistol cost 55 duration 8 | Rueda |
| P02 | 🟡 | Ensamble 0.9 s dibujado, no 220 partículas silueta. | Deuda wow |
| P03 | 🟡 | Cadencia 2/3.3, 12 tiros, dmg 1. Boss 0.5 no separado. Pool 32 casquillos. | — |
| P04 | 🟡 | Tubos + casquillos. Giro/retroceso simplificado. | Deuda |
| P05 | 🟡 | Reset al desactivar. 50 activaciones no medidas. | Deuda |
| M01 | ✅ | Skin vuelo en `drawOver` si flight activo | Física intacta |
| M02 | ✅ | physics-config `allowFlightPistolCombo: false` | — |
| A01 | 🟡 | Un IIFE `js/v7-estelar.js` (convención real). No carpetas gameplay/. | Documentado |
| A02 | 🟡 | CustomEvent `rl:laser:*` `celebration:*` `power:starPistol:fire`. Faltan varios nombres exactos. | Deuda |
| A03 | 🟡 | JSON añadido. Torneo: envelope PISTOLA_ESTELAR. Server no parsea JSON compartido. | — |
| A04 | ✅ | `window.__rl` spawnLaser forceGoal usePower setQuality setMount stats | `?qa` |
| A05 | ✅ | Ajustes calidad / reducir / háptica | openPanel settings |
| A06 | ✅ | Menú `DISTRITO NEÓN · V7.0 ESTELAR · LOGIC CODE SPOT · IP 100% ORIGINAL` | index.html |
| R01 | 🟡 | `raw` clamp 0.05. No interpolación fija 60/120/144. | Deuda |
| R02 | ✅ | `visibilitychange` pausa+persist; `pagehide` persist | game.js boot |
| R03 | 🟡 | `audio.init` en gesto play. Un AudioContext. | — |
| R04 | 🟡 | touchmove preventDefault, 100dvh CSS existente | — |
| R05 | ✅ | error + unhandledrejection loguean sin tumbar rAF | boot |
| R06 | 🟡 | resetRun limpia pools. Listeners globales de View sin remove. | Deuda |
| R07 | 🟡 | SW cache-first. Offline no re-probado este cierre. | QA humano |
| Q01 | 🟡 | Código de V6 no eliminado. Sin replay-hash golden. | Deuda D.1 |

Pendientes priorizados: (1) arte raster ⛔ (2) semilla láser torneo (3) Quality p95 (4) bloom/PostFX (5) E2E Playwright.
