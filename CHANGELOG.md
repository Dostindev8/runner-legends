# Changelog

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
