# UI/UX Pro Max — Suite Bridge (GOD-STACK-ING)

Fuente: `uipro init --ai cursor` (UI/UX Pro Max).  
**EXTEND-NEVER-OVERWRITE:** en FactDS / FactP usar el design system Dark/Green existente (`frontend/src/styles/tokens.css`). La suite informa y valida; no reemplaza tokens fiscales ni marca activa.

## Sibling skills (en `.cursor/skills/`)

| Skill | Rol | Activar cuando |
|-------|-----|----------------|
| `ui-ux-pro-max` | Motor de búsqueda: 67 styles, 161 palettes, 57 fonts, 99 UX rules, 25 charts, 22 stacks | Landing, dashboard, estilo, color, tipografía, UX audit, charts |
| `design` | Hub unificado: logo, CIP, slides, banners, icons, social photos | Identidad visual, mockups CIP, assets de marca |
| `design-system` | Tokens 3 capas (primitive→semantic→component), slides Chart.js | Tokens CSS, specs de componentes, Tailwind theme |
| `brand` | Voice, messaging, assets, sync guidelines→tokens | Tone of voice, brand audit, `docs/brand-guidelines.md` |
| `ui-styling` | shadcn/ui + Tailwind + canvas | Componentes accesibles, theming, dark mode en código |
| `slides` | Presentaciones HTML estratégicas | Pitch decks, slides con datos |
| `banner-design` | Banners multi-formato (social/ads/web/print) | Covers, heroes, display ads |

`god-stack-ing` orquesta estos skills. Leer el `SKILL.md` del sibling antes de ejecutar sus scripts.

## Runtime (Windows)

```bash
# Python (stdlib para search; pytest solo para tests del skill)
python --version   # preferir: C:\Users\UserGPC\AppData\Local\Python\bin\python.exe

# CLI
uipro --version
uipro init --ai cursor --force   # regenerar suite (no toca frontend/backend)
```

## Design system search (obligatorio en UI nueva)

Desde la raíz del repo:

```bash
python .cursor/skills/ui-ux-pro-max/scripts/search.py "<product> <industry> <keywords>" --design-system -p "ProjectName"
```

Dominios: `product` · `style` · `color` · `typography` · `landing` · `chart` · `ux` · `gsap` · `react` · `web` · `prompt`  
Stacks: `react` · `nextjs` · `shadcn` · `html-tailwind` · `vue` · `flutter` · … (ver `data/stacks/`)

Dial opcional: `--variance` `--motion` `--density` (1–10). Persistencia: `--persist` → `design-system/MASTER.md` (solo si el usuario lo pide; no crear en FactDS sin autorización).

## FactDS / FactP canon (prioridad sobre recomendaciones genéricas)

```
Brand:     FactP · Logic Code Spot
Look:      Dark/Green — accent #22C55E
Tokens:    frontend/src/styles/tokens.css
Shell:     frontend/src/styles/layout.css
UI kit:    frontend/src/components/ui/*
Stack UI:  React 19 + Vite (NO Next/shadcn obligatorio; ui-styling adapta, no fuerza migración)
Fiscal:    NCF/ITBIS/e-CF — EXTEND-NEVER-OVERWRITE (cero cambios de lógica al “mejorar UI”)
Mobile:    375px first · tablas con scroll horizontal · confirmación antes de emitir
```

Si `search.py` sugiere tipografías cyber (Orbitron, etc.) que choquen con la marca FactP, **mantener tipografía/tokens del proyecto** y solo adoptar patrones UX/estructura/estados.

## Routing rápido

| Pedido del usuario | Acción |
|--------------------|--------|
| “Mejora esta pantalla / landing / dashboard” | `ui-ux-pro-max` → `--design-system` + `--domain ux` → aplicar en React existente |
| “Tokens / design system” | `design-system` (+ tokens FactP) |
| “Brand / tono / assets” | `brand` |
| “Logo / CIP / banner / slides” | `design` / `banner-design` / `slides` |
| “Componente shadcn/Tailwind genérico” | `ui-styling` (adaptar a CSS tokens FactP si el repo no usa shadcn) |
| Cualquier UI + API/fiscal/seguridad | GOD-STACK-ING completo (leyes + suite UI) |

## Checklist pre-entrega UI

- [ ] Mobile 375px OK
- [ ] Estados: loading / empty / error / success
- [ ] Contraste WCAG AA (dark + green)
- [ ] Sin overlay clutter en heroes
- [ ] Logos `object-contain` (nunca crop)
- [ ] Cero cambios en NCF/ITBIS/montos/fechas/API contracts
- [ ] `--domain ux` pass si hay animaciones/modales/forms
