# Camera System — Runner Legends v3.0 (Mario 3D Edition)

**Date:** 2026-08-10  
**Code:** `Assets/_Project/Gameplay/Camera3D/`

## Purpose

Maps each world / presentation mode to a `CameraRigState` and documents how Presentation should wire the pure `CameraRigController` without rewriting the existing 2D `CameraShakeService`.

## States

| State | When | Behavior |
|---|---|---|
| `Follow` | Idle / low speed | Exponential follow of the player with fixed Y/Z offsets |
| `LookAhead` | Run speed &gt; ~0 | +X look-ahead proportional to speed (`CameraRigMath.LookAheadOffsetX`) |
| `SetPiece` | Boss intro, star reveal, cutscene frame | Ease-in-out blend **0.6–1.0 s** to a fixed framing |
| `PortalTransition` | Entering / exiting a portal | Same blend window toward portal exit framing |

## World → camera mapping (v3.0)

| World / surface | Default state | Notes |
|---|---|---|
| Distrito Neón (2D interim / web slice) | Follow + LookAhead | Existing side-scroller feel; Presentation camera remains orthographic until URP 3D |
| Hub (portal lobby) | Follow | Wider Z offset; no aggressive look-ahead |
| Level worlds (3D lanes) | LookAhead | Speed-scaled lead; set-pieces for mid-boss frames |
| Portal corridor | PortalTransition | Triggered by `PortalController.Entered` / streaming ready |
| Results / star fanfare | SetPiece | 0.6–1.0 s ease-in-out into podium frame |

## Trauma shake (EXTEND, do not overwrite)

`CameraRigController.TraumaRequested` is an `Action<float>`. Presentation wires it to the **existing** `CameraShakeService.AddTrauma` (or EventBus) — do not fork shake math into the 3D rig.

## Tests

`Assets/Tests/EditMode/CameraRigMathTests.cs` covers blend duration clamp, ease-in-out, look-ahead scaling, and a set-piece tick.
