# Testing — Runner Legends Ω.3

Técnica: keyword-driven (ISO 29119-5) sobre el slice estático. Sin suite Vitest; evidencia = navegador + `node --check`.

## Smoke de módulos

```cmd
node --check js/power-system.js
node --check js/spectator-messages.js
node --check js/content-v6.js
node --check js/game.js
```

## Flujo de juego

1. Abrir el juego, saltar intro si aparece.
2. Menú: botón Personaje muestra el nombre activo (default **Kori Voltz**). Panel Roster selecciona `save.activeChar`.
3. JUGAR → overlay 2.5–3.5s con frase que termina en **— Dostin Santana**.
4. Cargar SÚPER (monedas / tiempo) → SÚPER o tecla E.
5. El HUD de distancia **no avanza** con el selector abierto (`RLPowers.isPaused() === true`).
6. Elegir **Vuelo** (único desbloqueado al inicio). Chip HUD `VUELO x.xs`. Cancelar no gasta la barra.
7. Con un poder activo, SÚPER no reabre el selector.

## Poderes (desbloqueo)

| Poder | Cómo desbloquear |
|---|---|
| Vuelo | Base |
| Esfera Voltz | 1 jefe derrotado |
| Doble Láser | 3 mundos en `save.unlocked` |
| Modo Ascendido | 2 personajes |
| Baile | Logro `dist_400` (400 m en una carrera) |
| Invencibilidad / Sombra / Bullet-Time | 4 / 5 / 6 mundos |

Poder bloqueado: `RLPowers.choose('bullet_time')` no activa si el predicado es falso.

## Responsive

Selector: 2 columnas ≤639px, 3 ≥640px, 4 ≥1024px. Cero overflow horizontal (scrollWidth === innerWidth) en 320 / 375 / 768 / 1280.

## Gap dinámico

En Legendario + Velocidad extrema, el espacio entre obstáculos no debe caer por debajo de `speed * (0.77 + 0.35)` px.

## Offline

Con SW `rl-v6-1-omega3`, recargar sin red debe servir `power-system.js` y `spectator-messages.js` desde cache.
