# Runner Legends — Auditoría 2D→Three.js r186 (Fase 1)

**Fecha:** 2026-09-26 · **Ley ⑩:** el slice 2D (`index.html` + `js/*`) NO se borra. El showcase 3D vive en `web3d/`.

## Inventario crítico preservado

| Sistema | Fuente | Valores canónicos |
|---------|--------|-------------------|
| Física salto | `js/game.js` CFG | g=2200, jumpVel=-900, dJump=-790, jumpCut=0.45, buffer=0.15 |
| Coyote | DIFF table | normal **0.12s**, hard 0.11, expert **0.10**, legendary 0.09 (NO 100ms fijo) |
| Dificultad | DIFF | scroll/density/reward: N 1/1/1 · H 1.15/1.15/1.25 · E 1.3/1.28/1.5 · L 1.45/1.38/2 |
| KO / tramo | CFG | 8 KO · 250 m · bossAt 130 |
| Portal | `portal.js` | mundo+clima+regla; evita repeat; pesos por difficulty |
| Mundos | `worlds.js` | **10** (neon→final), no 7 del brief |
| SÚPER | power-system | menú GTA; pause via `#stage.frozen` |
| IP | branding | Kori Voltz · LCS · Dostin Santana |

## Mapa 2D→3D

- Movimiento → CharacterController cinemático (mismos tiempos)
- Portal → PortalSystem (port de PortalOutcomeResolver)
- Reglas → WorldRulesSystem (RULES.apply)
- HUD → overlay DOM híbrido (`ui/domBridge`)
- Colisiones → three-mesh-bvh (sin Rapier en MVP; Rapier solo si obstáculos dinámicos lo exigen)

## Riesgos

1. Reescritura total vs AGENTS.md (“no migrar a TS”) — **anulado por instrucción explícita del turno (Ley ⑯)**.
2. Assets 3D: placeholders procedurales hasta GLB propios (cero assets de terceros).
3. Paridad feel: medir coyote/airtime vs 2D en QA.
4. CSP Vercel: ampliar `worker-src`/`wasm` solo si entra Rapier.

## Decisión física MVP

**three-mesh-bvh** para terreno/obstáculos. Rapier diferido (Fase 5+).
