# Tech Debt — Runner Legends Unity

**Date:** 2026-08-10

## URP 3D migration requires Unity Editor

The v3.0 Mario 3D Edition modules (`Camera3D`, `Portals`, `Streaming`, `Difficulty`, `ResponsiveUI`) are **additive C# scaffolds** that compile against the existing Clean Architecture asmdefs. Full URP 3D scene setup (pipeline asset switch, Addressables groups, lighting, 3D character rigs, portal VFX) **requires the Unity Editor** and cannot be completed from this text-only environment.

## Web slice is interim demo

The repo-root `index.html` vertical slice remains the **playable interim demo** for game feel (coyote / buffer / shake / pooling). It is not replaced by these Unity modules. Treat it as the FASE 1 feel reference until the Unity 6 + URP 3D player build is opened and validated in Editor.

## Streaming stub

`WorldStreamingService` is an in-memory Addressables-style stub (predictive load within 3s of portal; unload source when past budget — GDD §11). Swap the stub body for real Addressables handles when the package is enabled; keep `IWorldStreamingService` callers unchanged (EXTEND-NEVER-OVERWRITE).
