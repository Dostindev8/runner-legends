# Runner Legends — Unity 6 project

Producción del GDD v2.0 (secciones 3–5, 8) con **Clean Architecture**. Abrir la carpeta
`unity/RunnerLegends` con **Unity 6 (6000.0 LTS)**. Paquetes (URP 2D, Input System, Test
Framework, TextMeshPro) se resuelven desde `Packages/manifest.json`.

## Arquitectura y dirección de dependencia (forzada por asmdefs)

```
Core            ← Gameplay ← Presentation
  ▲                            │
  └────────── Infrastructure ──┘
```

- **Core** (`Assets/_Project/Core`) — sin dependencias de paquetes: `EventBus`, `GameClock`
  (timeScale + stop-frames), `ObjectPool<T>`, `IInputReader`. Motor-ligero y testeable.
- **Gameplay** (`_Project/Gameplay`) — reglas puras: `PlayerMovementStateMachine`
  (coyote/buffer/variable jump), `CombatSystem` (daño GDD 8.2), `EconomyService`
  (monedas/combo/carga súper, upgrades GDD 8.3), `WorldDirector`. ScriptableObjects
  (`CharacterStatsSO`, `SuperAttackSO`) con *balance caps* validados en `OnValidate`.
- **Presentation** (`_Project/Presentation`) — Unity/URP: `UnityInputReader`,
  `CameraShakeService` (trauma), `GameInstaller` (**composition root / DI**) y `RunnerController`.
- **Infrastructure** (`_Project/Infrastructure`) — `JsonSaveSystem` (AES local),
  `ProgressionApiClient` (REST con try/catch + fallback), `IStoreAdapter` (IAP/Ads).

`nullable` está activado globalmente (`Assets/csc.rsp`). Nada de `FindObjectOfType` ni
singletons mutables: el grafo se arma una sola vez en `GameInstaller`.

## Montar la escena mínima jugable

1. Escena nueva. Cámara principal → añadir `CameraShakeService`.
2. GameObject vacío `Game` → añadir `GameInstaller`.
3. GameObject `Player` (sprite) → añadir `RunnerController`, asignar `_playerRoot`.
4. En `GameInstaller`: asignar `CharacterStatsSO` (crear vía *Create → Runner Legends →
   Character Stats*, y un *Super Attack* enlazado), la cámara y el `RunnerController`.
5. Play. Salto: `Espacio`/tap/clic (mantener = salto alto). Súper: `E`/`Shift`.

## Tests

`Window → General → Test Runner → EditMode → Run All`. Cubren daño con combo (8.2),
i-frames ≤ 3s, totales de upgrades (8.3), carga de súper ≥ 45s, y coyote/buffer/variable jump.
En CI corren vía `.github/workflows/unity.yml` (requiere secret `UNITY_LICENSE`).

## v3.0 Mario 3D Edition

Additive modules (EXTEND-NEVER-OVERWRITE) for the Mario 3D Edition scaffold. Existing Core /
Gameplay / Presentation / Infrastructure types are **not** rewritten; new folders only.

| Area | Path | Notes |
|---|---|---|
| Camera 3D | `_Project/Gameplay/Camera3D/` | `CameraRigState`, `ICameraRig`, pure `CameraRigMath` + `CameraRigController` (look-ahead, set-piece 0.6–1.0s ease-in-out, trauma event hook) |
| Portals | `_Project/Gameplay/Portals/` | `PortalKind`, `PortalDefinition`, `PortalController` (enter/exit, anti-reentry cooldown, persist run state — no `ResetRun`) |
| Streaming | `_Project/Infrastructure/Streaming/` | `IWorldStreamingService` + Addressables-style stub (prefetch ≤3s to portal; unload source past budget — GDD §11) |
| Difficulty | `_Project/Gameplay/Difficulty/` | Table 7.1 `DifficultyProfileSO` (coyote/buffer ≥ 40ms), `DifficultyManager` (Legendary = Expert 3-star) |
| Responsive UI | `_Project/Presentation/ResponsiveUI/` | `SafeAreaInsets`, `ResponsiveCanvasController` breakpoints 360/391/431/601/901 |
| Docs | `Docs/CameraSystem.md`, `Docs/ResponsiveQA.md`, `Docs/TechDebt.md` | World→camera map, QA matrix, URP 3D Editor debt |
| Tests | `Assets/Tests/EditMode/DifficultyProfileTests.cs`, `CameraRigMathTests.cs` | Feel floor + Legendary gate; camera math |

**Note:** URP 3D migration and real Addressables wiring require Unity Editor; the web slice remains the interim playable demo (`Docs/TechDebt.md`).
