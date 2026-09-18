# Changelog

## [v8.4] — 2026-09-17

Auditoría móvil + poderes + Historia bloqueada. Calidad adaptativa (DPR/partículas) sin tocar reglas de juego.

### Fixed
- Onda Dembow ahora da iframe real (antes solo bloqueaba salto).
- Coloso/Guardián restauran escala al agotar; Vector Cero no mata en huecos.
- Fase Espectral alineada a 6s (`physics-config`).
- HUD corazones sin `innerHTML` dinámico; título de resultados con `textContent`.

### Added
- Menú **Historia** 🔒 → toast offline exacto del Sr. Dostin.
- `quality` adaptativo (low/med/high) para partículas/clima/DPR.
- Frases hype extra firmadas Dostin Santana; hitboxes táctiles ≥44px + anti-scroll.

## [v8.3] — 2026-09-17

Auditoría de hitbox vs sprite, pasivas de piloto/fragmentos y HUD más limpio en móvil. El agente del repo queda destilado en `DIGEST.md` (menos tokens).

### Fixed
- El enemigo ya no se dibuja 6px fuera de su caja de colisión (el pisotón coincidía con lo que ves).
- El SÚPER no propaga el tap al salto.

### Changed
- Stats reales del piloto activo en el menú; sets de fragmentos aplican boosts en carrera.
- `Cache-Control` en `/js/*` + SW `rl-v8-3-audit`.

## [v8.2] — 2026-09-17

El tramo tiene cierre: 8 KO, 250 m o jefe. El pisotón ahora registra daño (vy>50, ventana de pies amplia) y la barra de HP se ve siempre. Tres SÚPER derriban al jefe; el resto se elimina a pisotones.

### Added
- Chip de objetivo KO x/8, pantalla de resultados DISTRITO SUPERADO, logros Barrido / Tramo cerrado / Cazador de jefes.
- Números de daño (`-N`) aunque no haya haz ocular.

### Changed
- HP de tropa 2–4; jefes 6–9 (Escuadrón Cero ×2). SÚPER golpea al jefe aunque no haya drones en pantalla.
- Desbloqueo del siguiente mundo al cerrar el tramo (no solo al matar jefe).

## [v8.1] — 2026-09-16

Bestiario 2–3 enemigos por mundo, daño/stun/slow según poder, telegraph, `?qa` selftest. ISO 25010: jugabilidad, fiabilidad del freeze, mantenibilidad por módulos.

### Added
- `js/enemies-v8.js` catálogo LCS (10 mundos) + perfiles de golpe por poder.
- Enemigos con HP, stun, slow, telegraph ≥400ms (élite Final más agresivo).
- `window.__rl.selftest()` con `?qa`.

### Changed
- Cada poder debilita o daña (Haz 90, Dembow stun 1.2s, Tormenta cadena, Guardián 200).
- Rueda muestra costo % y toques ≥44px.

## [v8.0] — 2026-09-16

Arsenal desbloqueado: 10 poderes desde la primera partida, pisotón con cadena, haz ocular, Modo Guardián original LCS, PowerLog + physics-config v2.

### Added
- `js/combat-v8.js` pisotón (vy>120, rebote 720, cadena ≤8) y haces oculares.
- `js/power-log.js` registro de carga para el anti-cheat.
- `shared/physics-config.json` v2.0.0 bloque `powers` + `combat`.
- Tests de envolvente de poderes en tournament-service (los originales se mantienen).

### Changed
- Kori deja de ser un rectángulo: silueta robótica con visor monocular y morfador de antebrazo.
- Arsenal por defecto (campaignMode opcional).
- Valle Dorado: cielo más oscuro y ventanas para que el parallax no se lave en ámbar.
- ctx.filter / composite se resetean al inicio de cada frame.

## [v7.0] — 2026-09-16

Zoom de cámara en móvil, intro/HUD más grandes, 90 frases por voz y gaps más justos. Vanilla JS extendido (no React/TS).

### Added
- Banco `js/messages-v7.js` (90 frases, 6 voces × 15, firma Dostin Santana).
- Tarjeta pre-partida con categoría, skip ≥1.2s, `aria-live`.
- Poderes 9–10: Tormenta de Voltios, Coloso Tectónico (ids nuevos; los 8 anteriores conservan id).
- Doble salto base, hang-time en el ápice, gracia de 3s al iniciar y 1.2s al cerrar SÚPER.

### Changed
- Cámara lógica ~390px en portrait ≤520px (el corredor ocupa más pantalla).
- Tipografía de menú, intro, HUD y SÚPER más grande; créditos visibles en móvil.
- Gap mínimo = `speed × 1.55` s. Coyote/buffer más generosos.
- Lore: se quitó la palabra «ki».

## [Ω.3] — 2026-09-15

Sistema de poderes con pausa real, mensajes al espectador y gap dinámico. IP 100% original (sin IPs de terceros).

### Added
- Overlay cinematográfico de frases al pulsar JUGAR (15 líneas firmadas «— Dostin Santana», anti-repetición de sesión).
- Selector de poderes estilo GTA: SÚPER pausa el loop, grid 2/3/4 columnas, un poder a la vez, countdown en HUD.
- 8 poderes: Vuelo, Modo Ascendido, Esfera Voltz, Doble Láser, Baile, Invencibilidad, Modo Sombra, Bullet-Time.
- Desbloqueo sobre save existente (mundos, jefes, personajes, logro `dist_400`).
- Botón Personaje en menú ligado a `save.activeChar` y roster de 11.
- Módulos aislados: `js/power-system.js`, `js/spectator-messages.js`.

### Changed
- Espaciado de obstáculos +40% con piso `minSafeGap(speed)` según tiempo de salto (~0.77s + 0.35s reacción).
- PWA cache bump `rl-v6-1-omega3` (incluye módulos nuevos).

### Security
- Catálogo de poderes y frases embebidos; DOM de poderes con `createElement`/`textContent`.
- Sin secretos en frontend. Headers CSP/XFO ya en `vercel.json`.
