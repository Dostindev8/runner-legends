# AUDIT-CHANGELOG — Runner Legends v6.0 FINAL

Fecha: 2026-09-15 · Protocolo: god-stack-ing · EXTEND-NEVER-OVERWRITE

## Hallazgos y fixes

| Sev | Hallazgo | Archivo | Fix |
|-----|----------|---------|-----|
| 🔴 | Iris portal usaba `hypot * 0.72` → máscara incompleta en viewports anchos | `js/game.js` | `Math.hypot(view.w, view.h)` completo + blackout callback |
| 🔴 | Swap de bioma al final del cinema (timeout implícito) | `js/game.js` | Swap en `transition:blackout` (radio≈0) + flash acento 200ms |
| 🟡 | Intro corto / genérico | `js/game.js` | Travesía Estelar 5 fases ~24s + agujero negro skippable |
| 🟡 | Audio sin cooldown / un solo bus | `js/game.js` | Cooldown 80–200ms, buses Música/SFX/Voz, volúmenes en Ajustes |
| 🟡 | Logros/Tienda OK pero sin jefes ni hub | `js/content-v6.js` + `game.js` | 10 jefes LCS, Esencias, Hub de personajes |
| 🟡 | Sin coleccionables de viaje | `js/game.js` | Fragmentos + Cápsulas de Memoria pooled |
| 🟡 | Parallax 4 capas | `js/game.js` | 6 capas + drift ±2.4px + viñeta por velocidad |
| 🟢 | Sin PWA | `manifest.json`, `sw.js` | Precache `rl-v6-0`, indicador ONLINE/OFFLINE |
| 🟢 | Unlock por estrellas conflictuaba con diseño de jefes | `js/game.js` | Unlock de mundo vía derrota de jefe |

## Pendientes que requieren decisión de Dostin

1. **Arte final de jefes** — hoy son siluetas procedurales canvas (IP-safe). ¿Encargar sprites/animación dedicada?
2. **Tracks de audio reales** — SFX/risas/música son **síntesis WebAudio** (cero delay, offline). ¿Reemplazar por stems WAV/OGG?
3. **Backend Nest online** — cola de sync preparada a nivel local; `server/` y `tournament-service/` siguen sin host. ¿Render/Fly?
4. **Unity URP** — fuera del slice web; scaffold intacto, no tocado.

## QA ejecutado este turno

- [x] `node --check` en `game.js`, `content-v6.js`, `sw.js`
- [x] Deploy Vercel Ready + headers CSP (`worker-src`, `manifest-src`)
- [x] Smoke menú V6.0 / playable esperado post-deploy
- [ ] Partida offline 10 mundos en device físico mid-range (requiere Dostin en dispositivo real)
- [ ] Instalar PWA en device nuevo y verificar cache completo

## Seguridad

- Sin secretos en bundle
- Save sanitizado (unlocks contiguos, nombres, números)
- XSS escape en paneles
- CSP endurecido; SW same-origin only
- IP: cero referencias a marcas/personajes de terceros

## Commits previstos

`Ship Runner Legends v6.0: portal blackout, bosses, PWA offline-first`
