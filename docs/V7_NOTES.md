# Notas V7.0 Estelar

## Arquitectura
Overlay `js/v7-estelar.js` (IIFE `RLEstelar`) + HUD DOM. No reescribe Player/World/Economy/Audio/Transition.

## Eventos (CustomEvent `rl:*`)
`laser:telegraph|fire|hit|dodged` · `celebration:start|end` · `power:starPistol:fire` · `quality` vía localStorage.

## Config
`shared/physics-config.json` añade `enemyLasers`, `celebration`, `starPistol`, `mount`, `quality`.  
**`mount.allowFlightPistolCombo`: false** — un poder a la vez; no ensambla pistola durante vuelo.

## QA `?qa` → `window.__rl`
`spawnLaser(type)`, `forceGoal()`, `usePower(id)`, `setQuality(tier)`, `setMount(bool)`, `stats()`.

## Rollback
Tag `pre-v7-backup`. Preferir `git revert`. No `reset --hard` si hay commits ajenos.

## Poderes
`star_pistol` / Pistola Estelar en la rueda. Montura Alada = skin de `flight`.
