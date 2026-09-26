# Runner Legends 3D (Three.js r186)

Showcase WebGL **paralelo** al juego 2D (EXTEND-NEVER-OVERWRITE). No reemplaza `index.html` / `js/game.js`.

## Stack
- `three@0.186.1` · Vite · TypeScript strict · `three-mesh-bvh`
- Overlay DOM híbrido · presets low/mid/high · PCFShadowMap · ACESFilmic

## Dev
```bash
cd web3d
npm install
npm run dev
```

## Build → `/3d/`
```bash
npm run build
```
Sale a `../3d/` (servido en producción como `https://runner-legends.vercel.app/3d/`).

## Paridad gameplay
Ver `docs/THREEJS_MIGRATION_AUDIT.md` — coyote por dificultad (120→90 ms), DIFF table, portal, 10 mundos, KO 8/250 m.
