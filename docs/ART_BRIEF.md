# Brief de arte — Runner Legends V7.0 Estelar

Distrito Neón es la referencia. Pipeline **híbrido**: el juego usa procedural si el archivo no está en `assets/manifest.json`. **No generar 404**: el loader solo pide rutas listadas.

Estilo: cine cyberpunk sobrio (azul, violeta, magenta, cian). Personajes **originales LCS** (Kori Voltz, Shino Kage, MC Rumor, Leo Dorado, Don Cash, Neon Groove). Prohibido imitar diseños de franquicias de terceros.

## Assets a producir (IA de imagen / ilustración)

| Archivo | Tamaño | Alpha | Tileable H | Prompt sugerido |
|---|---|---|---|---|
| `assets/worlds/neon/sky-3840.webp` | 3840×1080 | no | no | Cielo nocturno cyberpunk, luna violeta enorme a la derecha, naves cian lejanas, sin texto, sin personas |
| `assets/worlds/neon/skyline-far-3840.webp` | 3840×900 | sí | sí | Silueta de rascacielos lejana, ventanas cian/magenta, niebla, sin logos de marcas reales |
| `assets/worlds/neon/skyline-mid-3840.webp` | 3840×800 | sí | sí | Skyline medio con carteles genéricos; dejar hueco para overlay de texto del juego |
| `assets/worlds/neon/near-3840.webp` | 3840×700 | sí | sí | Edificios cercanos oscuros, acentos neón, sin recortar personajes |
| `assets/worlds/neon/ground-tile-3840.webp` | 3840×256 | sí | sí | Plataforma metálica mojada, tiras cian, franjas amarillo/negro, reflejo |
| `assets/worlds/neon/crate.webp` | 512×512 | sí | no | Caja metálica cian con marco neón rectangular, desgaste |
| `assets/chars/kori-run.webp` | 2048×256 | sí | no | Spritesheet 8 frames Kori Voltz: casco esférico negro, visor rosa/cian, núcleo pecho dorado, botas amarillas, rim light, estilo original |
| `assets/chars/{shino,rumor,leo,cash,groove}-run.webp` | 2048×256 | sí | no | Mismo layout, identidad de color de cada piloto LCS |
| `assets/enemies/cube-bot.webp` | 1024×256 | sí | no | Robot cúbico articulado, visor magenta, núcleo rojo, estados idle/carga/disparo/golpe/roto |
| `assets/mount/pegasus-energy.webp` | 1024×512 | sí | no | Unicornio alado de energía original, alas cristal cian/rosa, silla dorada, sin marcas ajenas |
| `assets/weapons/star-cannon-parts.webp` | 1024×512 | sí | no | Piezas: empuñadura, cuerpo, cámara, 6 tubos, boca acampanada |
| `assets/worlds/neon/sign-next.webp` | 512×256 | sí | no | Cartel vacío cian (el juego pinta NEXT LEVEL) |
| `assets/worlds/neon/sign-dream.webp` | 512×256 | sí | no | Cartel vacío magenta (el juego pinta DREAM CODE PLAY) |

Presupuesto: ≤ 3 MB crítico / mundo, ≤ 6 MB total / mundo. Máx 4096 px.

Hasta que existan, el overlay `js/v7-estelar.js` dibuja luna, carteles, suelo y montura en Canvas 2D.
