# DSi 3D graphics feasibility research

Research date: 2026-11-25

This document compares the Nintendo DS-family 3D engine with the rendering requirements visible in the Zelda Ocarina of Time decompilation. It is a feasibility investigation, not a claim that the full game has been ported or benchmarked.

## 1. DSi graphics hardware: important correction

The DSi is faster than the original DS in its CPU and has more main RAM, but its native 3D graphics engine is substantially the same DS-family fixed-function geometry/rendering hardware. We should not plan around a DSi-specific modern GPU or programmable vertex/pixel shaders.

The DS 3D engine provides hardware transformation and lighting, texture-coordinate processing, texture mapping, depth handling, fog, edge antialiasing, and toon shading. It is controlled through a command interface and a fixed-function pipeline rather than a programmable shader pipeline.

### Practical documented limits

The DS graphics references and BlocksDS documentation describe these important constraints:

- Up to 6,144 vertices and 2,048 triangles per frame are commonly documented hardware limits. The actual usable amount can be affected by primitive layout and other per-scanline/polygon constraints.
- 3D is rendered to one screen at a time by the standard DS graphics arrangement.
- The 3D engine works with fixed-point values and hardware matrices; it is not a desktop OpenGL implementation.
- Texture data must be placed in VRAM banks configured for texture use. VRAM is limited and shared with other video uses.
- Texturing, lighting, fog, depth, alpha-related features, and edge antialiasing exist, but they do not reproduce every N64 RDP behavior one-to-one.

The DSi's larger RAM does not remove these GPU-side limits. The DSi XL has the same relevant 3D hardware.

## 2. Development API candidate

The BlocksDS SDK provides a libnds-style 3D API that resembles a subset of OpenGL 1 in usage. It is an API wrapper for the DS fixed-function hardware, not full OpenGL.

The BlocksDS 3D tutorial and examples demonstrate:
- initializing the 3D engine;
- configuring the viewport, projection, and camera;
- submitting vertices and polygons;
- setting polygon format and culling;
- mapping texture VRAM;
- loading and binding a texture;
- combining 2D and 3D rendering.

A basic cube example uses fixed-point vertex helpers such as `floattov16` and `glVertex3v16`, then submits geometry with `glBegin` / `glEnd` and `glFlush`. The texture example configures a VRAM bank as texture memory, loads a texture, binds it, and supplies texture coordinates.

This makes BlocksDS/libnds a strong candidate for our first DSi-native renderer experiment. It is not yet a final choice for the complete game.

## 3. Compare with OOT's graphics assumptions

The upstream OOT source inspection already established:

- `include/gfx.h` defines a 320×240 render target and a 4 KiB N64 texture-memory constant (`TMEM_SIZE`).
- `src/code/z_rcp.c` builds N64 RSP/RDP setup display lists. These configure texture filtering, color-combiner modes, fog, depth behavior, lighting, geometry state, and other N64 pipeline features.
- `src/code/z_skelanime.c` walks skeleton limbs, applies transforms, then submits N64 matrices and model display lists through commands such as `gSPMatrix` and `gSPDisplayList`.
- `src/code/graph.c` packages the generated display-list buffer into an N64 graphics task that requests RSP and RDP processing.

The DSi cannot execute those N64 commands. We need a conversion/adaptation layer that consumes OOT's model/texture information and emits DS geometry and texture operations.

## 4. Model and texture conversion implications

The OOT asset tree separates assets into categories including `assets/objects`, `assets/textures`, and `assets/xml`. The runtime drawing code refers to segmented model data and display lists, rather than loading generic OBJ files directly.

A converter will likely need to understand at least:
- vertex positions and normals;
- triangle/quad topology and display-list ordering;
- texture image formats, dimensions, palettes, and texture coordinates;
- material state such as shading, culling, fog, and transparency;
- skeleton hierarchy and animation references.

This is a preliminary conversion checklist, not a verified full specification of every OOT asset format. We should inspect representative object/scene asset declarations and the relevant display-list macros before implementing a converter.

No copyrighted ROM, extracted model, texture, or audio files have been copied into this project. The eventual asset workflow must use only assets the developer is legally entitled to use, and should not commit copyrighted extracted assets to this repository.

## 5. Likely difficult visual differences

| OOT/N64 feature | DSi port concern |
|---|---|
| N64 RSP/RDP display lists | Must be translated; not directly executable |
| N64 color combiner modes | No direct one-to-one mapping; some materials may need simplified rendering |
| Texture filtering and texture memory behavior | Different hardware and memory layout; texture conversion/repacking required |
| Fog and lighting | DS has hardware fog and lighting, but exact visual matching is not guaranteed |
| Transparency and translucent surfaces | Different ordering/priority behavior; needs explicit testing |
| Large 3D scenes | 2,048-triangle / 6,144-vertex frame budget is a major constraint |
| Skeletal models | Animation hierarchy may be reusable, but model submission and matrix handling must be adapted |
| 320×240 N64 logical output | DS screen is 256×192; camera framing, UI, and render layout need redesign |

## 6. Recommended first technical demo

Do not begin by importing OOT's copyrighted model assets. First prove the DSi renderer and toolchain using original test geometry and a self-created texture.

### Demo A: hardware proof

1. Build a minimal BlocksDS/libnds application.
2. Draw a rotating, lit cube on the top screen.
3. Add a self-created texture.
4. Add depth testing, culling, and fog.
5. Display frame timing and geometry counts on the lower screen.
6. Test on an emulator, then on a real DSi if available.

### Demo B: OOT-shaped workload

After Demo A works, create original placeholder geometry that resembles the *complexity* of a game scene without copying OOT assets:
- a small environment mesh;
- several animated placeholder objects;
- opaque and translucent surfaces;
- a camera that moves through the scene.

Measure frame time, vertex count, polygon count, and texture memory use. Use the results to set a realistic scene budget.

## 7. Current assessment

**Promising:** the DS-family GPU supports hardware-accelerated 3D, texturing, depth, lighting, and fog. Existing SDK examples show that a DSi-native 3D application is a practical starting point.

**Major risk:** OOT's rendering model is built around the N64 RSP/RDP and its scenes may exceed or stress DS polygon, texture-memory, and feature limits. The DSi CPU/RAM upgrades do not erase those constraints.

**Conclusion:** a native DSi port is technically conceivable, but likely requires a custom renderer, converted assets, significant visual simplification, and careful scene budgeting. We do not yet have evidence that a complete OOT port can achieve acceptable performance.

## 8. Sources

### Primary development references
- BlocksDS libnds documentation: https://blocksds.skylyrac.net/libnds/index.html
- BlocksDS 3D graphics tutorial: https://blocksds.skylyrac.net/tutorial/intermediate/3d_graphics/
- BlocksDS 3D examples: https://github.com/blocksds/sdk/tree/master/examples/graphics_3d
- Example cube source: https://github.com/blocksds/sdk/blob/master/examples/graphics_3d/basic_cube/source/main.c
- Example texture source: https://github.com/blocksds/sdk/blob/master/examples/graphics_3d/basic_texture/source/main.c

### Hardware references
- Nintendo DS 3D geometry engine notes: https://ndsdoc.gbadev.net/3d_geometry_engine.html
- DS homebrew guide, 3D rendering section: https://osdl.sourceforge.net/main/documentation/misc/nintendo-DS/homebrew-guide/HomebrewForDS.html

### OOT source files inspected
- https://github.com/zeldaret/oot/blob/main/include/gfx.h
- https://github.com/zeldaret/oot/blob/main/src/code/z_rcp.c
- https://github.com/zeldaret/oot/blob/main/src/code/graph.c
- https://github.com/zeldaret/oot/blob/main/src/code/z_skelanime.c

The DS hardware documentation describes the DS-family 3D engine. Applying those constraints to DSi is based on the established fact that DSi retains the DS graphics architecture; no DSi-specific GPU benchmark was performed for this research.
