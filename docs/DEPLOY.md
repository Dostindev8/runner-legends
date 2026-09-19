# Deploy — Runner Legends V7.0

Sitio **estático** desde la raíz. `vercel.json`: cleanUrls, CSP, cache `index.html`/`js` must-revalidate.

## Variables de entorno (nombres, nunca valores)

**Vercel (web):** ninguna obligatoria.

**server/ (si se despliega aparte):** `PORT`, `TRUST_PROXY_HOPS`, `CORS_ORIGINS`, JWT/Mongo según `server/.env.example`.

**tournament-service/:** Redis/HMAC según `tournament-service/.env.example`.

El autor las configura en el dashboard. Este agente no escribe secretos.

## Rollback
- Preferido: `git revert <sha>` + push `main` (Vercel redeploy).
- Tag previo: `pre-v7-backup`.
- Vercel Instant Rollback al deployment anterior.
- **Nunca** `git push --force` a main.

## Service worker
`CACHE_VERSION` en `sw.js` (`rl-v7-cierre-1`). `activate` borra cachés viejas.

## `.vercelignore`
Excluye `server`, `tournament-service`, `unity`, `.github`. No excluye `js/` ni `index.html`.
