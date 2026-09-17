# Changelog

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
