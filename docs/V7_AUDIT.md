# Runner Legends — Auditoría V7.0 Estelar (Fase 1)

Fecha: 2026-09-18. Slice web: `index.html` + `js/*.js` IIFE + Canvas 2D. **Sin código de Fases 2–5 en este documento.** ISO 25010: mantenibilidad / usabilidad / rendimiento. ISO 12207: análisis. CMMI observado: ~Nivel 2.

## 1. Stack real (no el del mega-prompt genérico)

| Esperado (prompt) | Real |
|---|---|
| `package.json` + `npm run lint/build/test` en raíz web | **No existe** en la raíz del slice. `npm install` / `npm run lint` no aplican. |
| Tests Playwright | No hay. Evidencia: `node --check js/*.js` + `.github/workflows/web-slice.yml` (IP + JSON). |
| Módulos `js/gameplay/` | Convención real: IIFE globales `js/game.js`, `js/power-system.js`, `js/enemies-v8.js`, `js/nova-protocol.js`, `js/power-fx.js`. V7 se **añade** como `js/v7-estelar.js` (no mover archivos). |
| EventBus / Clock / InputReader / ObjectPool | En `js/game.js`: `EventBus`, `Clock.step`/`freeze`, `Input`, `Pool`. |
| Unity / server / tournament | Carpetas aparte; `shared/physics-config.json` es la fuente de constantes de física. El cliente **no** carga el JSON en runtime (constantes duplicadas en `CFG` de `game.js`). |

Scripts reales:

- `node --check js/game.js` (y resto de `js/*.js`)
- CI: `.github/workflows/web-slice.yml`
- Deploy: estático Vercel (`vercel.json` CSP + cache)

## 2. Tecnología de render

**Canvas 2D** (`#game`) + **DOM/CSS** para menú, HUD, rueda SÚPER, resultados. Sin WebGL. Motivo: motor existente, pooling, 60 FPS objetivo, EXTEND-NEVER-OVERWRITE. HUD pixelado se evita con DOM (`clamp()`, no canvas para texto UI).

## 3. Bucle principal (`js/game.js` · `requestAnimationFrame`)

Orden aproximado en PLAY: Input → `clock.step(dt)` (freeze → 0; si no, `dt * scale`) → Player / World / Economy / Combat / Powers / Nova / FX → draw Backdrop → World → Player (`drawKori`) → FX → HUD DOM (`syncHUD`). `dt` ya se usa; clamp de pausas largas existe de forma parcial. `timeScale` = `clock.scale` + `clock.freeze`.

## 4. Plantilla de un PODER (replicar para Pistola Estelar)

Archivos: `js/content-v6.js` (`POWERS[]`) + `js/power-system.js` (`RLPowers.activate` / `choose` / `tick`) + `js/power-fx.js` (`drawUnder`/`drawOver`/`hitFromPower`) + `js/enemies-v8.js` (`POWER_HIT`) + hook `game.js` `onPower`.

Campos: `id`, `name`, `cost` (porcentaje de barra; umbral de rueda 40%), `duration`, `unlock`. Un poder a la vez (`active`). Rueda pausa con `isPaused()`.

**Vuelo (`flight`)**: `activate` pone `player.freeFlight` y `flightT`; física en `Player.update` **no se toca**. Skin Montura Alada = solo `power-fx` / overlay V7 cuando `id === 'flight'`.

## 5. Enemigo

`js/enemies-v8.js` (`RLEnemies.draw` / `stomp` / `hitFromPower`). Estados visuales: idle / hit / KO. Spawn en `World` de `game.js` (`drones` pool). Hitbox = sprite (`o.y`). Pisotón `vy > 50`. Cierre de tramo: 8 KO / 250 m / jefe (`CFG`).

Láseres actuales: haz de ojos del jugador + cazador Nova. **No** hay láser enemigo telegrafiado hacia el jugador (hueco V7).

## 6. Meta / portal

`js/portal.js` + `Backdrop.portalFlash` + `audio.portal`. Transición de mundo vía `Transition` / iris. Cierre de tramo se evalúa en `showResults()` (`js/game.js:showResults`), no hay evento `level:goal` aún. Bug reportado: flash/portal a mitad de pantalla — `portalFlash` + capa portal.

## 7. Guardado

`localStorage` clave `rl_save_v2` (`persist` / `loadSave` en `game.js`). Torneo: server es autoridad; cliente no es fuente de ranking. V7: calidad / reducir movimiento / háptica en la misma save o claves nuevas con try/catch.

## 8. Arte: raster vs procedural

**Decisión (bloqueante Fase 2):** modo **híbrido**. Hoy **todo es procedural** (Canvas). No hay spritesheets 4K en `assets/` para personaje/fondo. `assets/manifest.json` listará capas opcionales; el juego **solo pide** rutas del manifest (cero 404). Fallback procedural de alta calidad es el path de producción hasta que el autor genere WebP (ver `docs/ART_BRIEF.md`).

## 9. Offline

`js/sw.js` cache-first (`CACHE_VERSION`). Jugable sin red tras primera visita. Bump de versión en cada ship de JS.

## 10. QA `?qa`

`window.__rl` en `game.js`. Extender (no reemplazar): `spawnLaser`, `forceGoal`, `usePower`, `setQuality`, `setMount`, `stats`.

## 11. Defectos verificados (código)

| ID | Repro | Causa | Fix V7 (sin borrar IDs) |
|---|---|---|---|
| HUD-1 | Jugar; ver “Xm” y pastilla red | `#netPill` `position:absolute; left:50%; top: safe` **encima** de `.dist-center` | Mover `#netPill` al bloque central del HUD, apilado bajo metros |
| HUD-2 | Combo activo, borde izquierdo | `#comboChip` en fila de chips, no rail vertical; recorte por overflow del stage | Rail `#comboRail` con `left: max(16px, safe-area)` |
| HUD-3 | Comparar con refs A/B | `drawKori` / drones / Backdrop son formas vectoriales planas | Rim, sombra, reflejo, luna, carteles, robot cúbico **extendidos** en overlay + FX |
| HUD-4 | Portal / flash de mundo | `portalFlash` a altura media | Destello más bajo + cartel NEXT LEVEL cerca del suelo visual |
| HUD-5 | SÚPER vs suelo | `#superBtn` bottom-right; en móvil puede tapar | `bottom: max(14px, safe)`; tamaño clamp; no subir al 50% de alto |

Tinte teal/oscuro: **intencional** en menú/rueda (`#powerSelect`); en PLAY el canvas no debe velarse. Si hay velo residual, es overlay de selector.

## 12. Sistemas que NO se rompen (1.3)

Coyote 100 ms, jump buffer 100 ms, salto variable, doble salto, screenshake, freeze/`timeScale`, squash, pooling, `?qa`, rueda SÚPER, Explosión Estelar, combo, láser de ojos, pisotón, vuelo, transformación, esfera, doble láser, baile-poder, invencibilidad, portales/clima/WorldConfig, frases Dostin Santana, ranking/tienda/perfil, SFX. **Prohibido** reescribir `Player.update`, `World._director`, Economy, Audio internals, Transition.

## 13. Archivos a TOCAR (extender) vs CREAR

**Tocar:** `index.html` (HUD DOM/CSS, script `v7-estelar.js`, versión V7.0), `js/game.js` (hooks 1 línea: overlay update/draw, cele al clear, `#netPill` sync, `__rl` extra), `js/content-v6.js` (añadir `pistola_estelar`), `js/power-system.js` (rama `star_pistol` / alias), `js/power-fx.js` (montura + pistola), `js/enemies-v8.js` (`POWER_HIT.star_pistol`), `js/sw.js` (`CACHE_VERSION`), `shared/physics-config.json` (**solo añadir** claves `enemyLasers`, `celebration`, `starPistol`, `mount`, `quality`), `CHANGELOG.md`, `README.md` si existe en slice.

**Crear:** `js/v7-estelar.js`, `assets/manifest.json`, `data/choreographies.json`, `docs/ART_BRIEF.md`, `docs/V7_NOTES.md`, `tests/laser-solvability.test.js`.

**No tocar:** física de salto, hitbox jugador, anti-cheat server, Unity.

## 14. Riesgo de regresión

- HUD: IDs `dist`, `hearts`, `coins`, `superBtn`, `comboChip`, `objChip` deben seguir existiendo.
- Poderes: `choose()` umbral 0.38 no revertir.
- `allowFlightPistolCombo` default **false**.
- CI IP: no escribir nombres de franquicias de terceros en el repo.

## 15. Plan por fase (post-checkpoint)

2 HUD + Quality overlay + Backdrop extra + ART_BRIEF · 3 EnemyLaserSystem en `v7-estelar` · 4 CelebrationSystem overlay al clear · 5 Pistola + Montura · 6 physics-config + eventos · 7 robustez mínima (dt clamp, reduced-motion) · 8 `node --check` + test láser + browser · 9 docs · 10 reporte. Commit/push solo si el turno lo pide (este turno: el mega-prompt Fase 9 pide push; se hará al cerrar gates).

## 16. Verificación en vivo (Fase 1)

Capturas de referencia A/B/C adjuntas (composición HUD/escena). Runtime 1280×720 / 390×844: a ejecutar en Fase 8 con evidencia. Hueco: sin `npm run dev`; servir `npx --yes serve .` o abrir `index.html` / Vercel.

**Checkpoint 1: CERRADO.** Siguiente: implementar Fases 2–8 por extensión.
