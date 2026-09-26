# Runner Legends

**Logic Code Spot · República Dominicana · Dostin Santana**

Endless runner 3D con Three.js r186. Protagonista: **Kori Voltz**.

## Jugar
- Producción: https://runner-legends.vercel.app/
- Local: `npm run dev` (desde la raíz o `web3d/`)

## Stack
- `web3d/` — Vite + TypeScript strict + `three@0.186.1` + three-mesh-bvh
- Overlay DOM (HUD, SÚPER, menú, resultados)
- Presets de calidad low/mid/high · safe-area · touch ≥48px

## Build
```bash
cd web3d && npm ci && npm run build
```
Salida: `dist/` (Vercel `outputDirectory`).

## Legacy
El juego Canvas 2D está archivado en `legacy-2d/` (retirado de producción).
