# Auditoría final — Runner Legends V7.0 Estelar

Fecha: 2026-09-18. ISO 25010: mantenibilidad, seguridad, rendimiento, usabilidad. ISO 12207: verificación. CMMI ~2.

## Línea base (Fase A)

| Métrica | Valor |
|---|---|
| Remote | `https://github.com/Dostindev8/runner-legends.git` |
| Rama | main (cierre en `release/v7-cierre`) |
| Tag backup | `pre-v7-backup` |
| `package.json` raíz web | **No existe.** `npm ci` / `lint` / `build` del slice web = N/A |
| JS `js/` | 13 archivos, **5358** líneas; `game.js` **2477** |
| `index.html` | ~37.5 KB |
| `assets/` | 6 archivos, ~555 KB (iconos + mood refs; 0 WebP de mundo) |
| Scripts reales web | `node --check js/*.js` · `node tests/*.test.js` · CI `web-slice.yml` (IP + JSON) |
| server/ | NestJS `0.1.0` — lint/test/build requieren `npm ci` en esa carpeta (no corrido este cierre: entorno + tiempo) |
| tournament-service/ | NestJS + Redis store; `PHYSICS_CONFIG_VERSION` 2.0.0 |
| Secretos rastreados | Solo `.env.example` (server + tournament). Ningún `.env` / pem / key en `git ls-files` |
| git config / gh | No se modificó git config (regla usuario). Push origin ya autenticado en sesiones previas |

`npm ci` raíz: **no aplica**. Registrado en `docs/audit-raw/npm-ci.txt`.

## Hallazgos por capa (Fase C)

### 🔴 Crítico
Ninguno abierto en el slice web (sin secretos, CSP ya en `vercel.json`, `esc()` en innerHTML de menú).

### 🟡 Alto
| Hallazgo | Archivo | Riesgo | Fix / deuda |
|---|---|---|---|
| `game.js` > 500 líneas | js/game.js:2477 | Mantenibilidad | No extraer ahora (rompería orden IIFE). Dueño: LCS. Fecha: backlog Q4 |
| Láseres con `Math.random` | v7-estelar.js | Torneo no repetible | Semilla compartida |
| Quality sin histéresis p95 | v7-estelar.js | FPS en 4K | Autoscale |
| Tournament POWER_ENVELOPES incompleto vs JSON | physics-config.ts | Pistola no en envelope | **Corregido:** PISTOLA_ESTELAR |
| setTimeout en ráfaga láser | v7-estelar.js | Fugas al pausar | **Corregido:** delay en pool |
| Sin visibility pause | game.js | Audio/salto al volver | **Corregido** |

### 🟢 Medio
Código muerto knip/madge no ejecutados (sin package raíz). Duplicación jscpd no medida. Unity no toca web (`.vercelignore` ya excluye `unity/`).

### ⚪ Bajo
`index.html` boot inline (~50 líneas). `*.md` excluido de Vercel salvo README.

## Seguridad
- innerHTML menú: `esc()` `js/game.js:94`
- CSP enforcing con `'unsafe-inline'` (necesario por boot inline)
- Headers: nosniff, referrer, frame, permissions
- Anti-cheat: server-side; cliente no es autoridad
- `npm audit` raíz: N/A. server/tournament: no corrido este turno (⛔ instalar deps)

## Rendimiento
No hay medición de 10 min ni Lighthouse en este cierre. Clamp canvas 3840×2160 añadido. Objetivo 60 FPS: no declarado como hecho.

## Accesibilidad
HUD safe-area, SÚPER ≥44px, reducir movimiento. Contraste AA no medido con herramienta.

## Plan (deuda con dueño Dostin / LCS)
1. Producir WebP ART_BRIEF  
2. Semilla láser + replay hash  
3. PostFX bloom  
4. Extraer QualityManager a archivo si se adopta `js/presentation/`  
5. `npm ci` + test en server y tournament en CI
