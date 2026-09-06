# Responsive QA — Breakpoint Matrix (v3.0)

**Date:** 2026-08-10  
**Code:** `Assets/_Project/Presentation/ResponsiveUI/`  
**Breakpoints (px):** `360 / 391 / 431 / 601 / 901` (`ResponsiveCanvasController.BreakpointsPx`)

## Checklist

Capture Game view (or device) at each width with **Scale With Screen Size** enabled and safe-area applied. Paste links or file paths under **Capture**.

| Breakpoint | Device proxy (example) | HUD readable | Safe-area OK | No UI clip | Capture |
|---|---|---|---|---|---|
| 360 | Small phone portrait | ☐ | ☐ | ☐ | _placeholder_ |
| 391 | Compact phone | ☐ | ☐ | ☐ | _placeholder_ |
| 431 | Large phone | ☐ | ☐ | ☐ | _placeholder_ |
| 601 | Phablet / small tablet | ☐ | ☐ | ☐ | _placeholder_ |
| 901 | Tablet / fold unfolded | ☐ | ☐ | ☐ | _placeholder_ |

## Pass criteria

- Brand / score / super meter remain legible at 360.
- Notch / home-indicator insets come from `SafeAreaInsets.ReadPixels` / `ApplyToRectTransform`.
- No overlapping buttons between jump and SÚPER at any band.
- Canvas scaler mode = **Scale With Screen Size** (`ResponsiveCanvasController.ConfigureScaleWithScreenSize`).

## Notes

Fill capture placeholders during device lab or Unity Game view width simulation. Web slice remains the interim visual demo until URP 3D Editor migration (see `TechDebt.md`).
