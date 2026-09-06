# Runner Legends — Vertical Slice (Distrito Neón / Kori Voltz)

> IP 100% original de **Logic Code Spot** (GDD v2.0, sección 13.1). Ningún personaje,
> marca o persona real es usado ni imitado.

Traducción **ejecutable y jugable hoy** de la **FASE 1 (Core Loop)** del GDD v2.0.
El GDD define el motor de producción (Unity 6 + URP 2D, NestJS, etc.); este repo entrega
un **vertical slice funcional en navegador** que prueba el *game feel* real del GDD, con la
misma arquitectura por capas, listo para abrir y jugar sin build ni servidor.

## Cómo jugar

Opción A — doble clic en `index.html`.
Opción B (recomendada, evita restricciones de `file://`):

```cmd
python -m http.server 8188
:: abrir http://localhost:8188/index.html
```

**Link demo local (si el servidor está activo):** [http://localhost:8188/index.html](http://localhost:8188/index.html)

**Controles (una sola mano):** toca/clic o `Espacio` = saltar (mantener = salto alto,
*variable jump*). Botón **SÚPER** o tecla `E` = Explosión Estelar (cuando la barra está llena).
Selector de dificultad en menú (Normal / Difícil / Experto / Legendario).

## Qué implementa (mapa GDD → código)

| GDD | Implementado |
|---|---|
| 3.1 Juice | Coyote time (100 ms), jump buffering (100 ms), *variable jump*, screenshake con **trauma decay exponencial**, **stop-frames** vía `timeScale`, **squash & stretch** |
| 3.2 Estilo 3DS | Parallax multicapa, iluminación/glow dinámico, UI con *pop*/squash, **transiciones con máscara circular** |
| 3.3 Optimización | **Object Pooling** para obstáculos, drones, monedas, partículas y pits (cero `new` en gameplay) |
| 4.1 Boot flow | Boot → **Logo Reveal** → **Intro v3** (5 escenas + portales, *skippable*) → **Menú profesional** → Juego → Resultados |
| 4.4 Menú | Card Kori, stats, **4 dificultades**, hub de mundos, CTA, safe-area, tipografía Orbitron/Rajdhani |
| v3 Dificultad | Normal/Difícil/Experto/Legendario (coyote ≥40ms); Legendario tras Experto 3★ |
| v3 Portales | Portal in-run (~280m) → flash bioma hielo sin resetear run |
| v3 Cámara | Look-ahead dinámico por velocidad + parallax 4 capas |
| 5 Roster | **Kori Voltz** con **Explosión Estelar** (limpia enemigos, combo x2, screenshake 12) |
| 7 Mundos | **Distrito Neón** con tráfico/obstáculos, drones y pits |
| 8 Balance | Stats base de Kori (vel/salto/combo) parametrizan el *feel* |

## Arquitectura (Clean, GDD 4.2) — dentro de `index.html`

Dirección de dependencia estricta: **Core → Gameplay → Presentation**. Sin *god objects*.

```
CORE          EventBus · Clock (timeScale + freeze/stop-frames) · InputReader · ObjectPool
GAMEPLAY      Player (state machine: coyote/buffer/variable jump, i-frames, squash&stretch)
              World (spawn director + pooling) · Economy (monedas, combo, carga de súper)
PRESENTATION  View (responsive/DPR) · CameraShake (trauma) · Particles · Backdrop (parallax)
              Renderer de entidades · Audio (WebAudio) · Transition (máscara circular)
SCREENS       Boot · Logo · Intro · Menu · Play · Results  (state manager, main loop dt-fijo)
```

**Full responsive:** el canvas se adapta a cualquier viewport/orientación (altura lógica fija
540, ancho por aspect ratio), `devicePixelRatio`-aware, con *safe-area insets* para notch.

## Estado del proyecto (FASE 0)

Repo **greenfield** (vacío al iniciar) → construido limpio. Ley ⑩ EXTEND-NEVER-OVERWRITE
no aplicaba. Verificado en navegador: render de logo/menú/gameplay/resultados, spawns,
recolección de monedas, súper (limpia drones + combo x2 + drena barra) y cálculo de 3 estrellas.

## Estructura del monorepo (listo para montar en los editores)

Además del slice web (`index.html`), el repo ya contiene el **scaffold de producción** del GDD,
listo para abrir en Unity y VS Code:

```
RunnerLG/
├── index.html                 Vertical slice web jugable (FASE 1, game feel)
├── unity/RunnerLegends/        Proyecto Unity 6 + URP 2D (Clean Architecture, asmdefs)
│   └── Assets/_Project/        Core → Gameplay → Presentation ← Infrastructure
│   └── Assets/Tests/EditMode/  Tests: daño (8.2), economía (8.3), coyote/buffer/variable jump
├── server/                     NestJS — progresión (MongoDB): auth+JWT, GDPR delete,
│                               players, economy (upgrades atómicos), characters
├── tournament-service/         NestJS — torneo async: sesiones HMAC, submit con
│                               ANTI-CHEAT server-side, leaderboard (Redis ZSET), matchmaking ±15%
├── shared/physics-config.json  Fuente única de constantes de física (cliente + servidor, versionada)
└── .github/workflows/          CI: Unity (EditMode + build) y backends (lint+test+build)
```

**Verificado en este entorno (Ley ⑬, honestidad):**
- `tournament-service`: `nest build` OK (TS strict) + **6/6 tests de anti-cheat en verde**.
- `server`: `nest build` OK (TS strict).
- Unity no compila aquí (sin editor), pero el C# es *nullable-enable*, con DI por constructor
  (sin `FindObjectOfType`/singletons), lógica pura testeable y asmdefs que fuerzan la dirección
  de dependencia. Ver `unity/README.md` para abrirlo y correr los tests.

### Arrancar los backends

```bash
cd server            && npm install && cp .env.example .env && npm run start:dev   # :3000
cd tournament-service && npm install && cp .env.example .env && npm run start:dev   # :3100 (Redis opcional; usa fallback en memoria en dev)
```

## QA hook

`?qa` en la URL expone `window.__rl` (step determinístico de la simulación) para pruebas
automatizadas. Ausente en juego normal.
