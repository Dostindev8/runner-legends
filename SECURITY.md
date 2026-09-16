# Security — Runner Legends Ω.3

Producto 100% client-side. Cero secretos, API keys o PII de servidor en el bundle.

## Decisiones Ω.3

| Control | Aplicación |
|---|---|
| XSS | `#powerGrid` y `#spectatorMsg` usan `textContent` / `createElement`. Datos de poderes son constantes propias, no input del jugador. |
| Persistencia | `localStorage` (`rl_save_v2`) parseado en try/catch; whitelist de mundos, trails, `powersSeen` (máx. 32 ids). |
| eval | No se usa. |
| Clickjacking | Overlays locales z-index 38–44; `X-Frame-Options: SAMEORIGIN` + `frame-ancestors 'self'`. |
| CSP | `vercel.json`: `default-src 'self'`; scripts/estilos inline necesarios por el slice estático; `worker-src`/`manifest-src` para PWA. |
| Logs | Sin `console.log` del save en esta versión. |

## Headers Vercel (producción)

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## Superficie de ataque

El progreso local es modificable por el jugador (juego single-player). El anti-cheat de torneo vive en `tournament-service`, no en este slice web.

## IP

El código declara IP original LCS. No se incluyen personajes ni marcas de terceros.
