# Ocarina of Time — Nintendo DSi Port Research

An independent research and homebrew engineering project investigating whether a **native Nintendo DSi port** of *The Legend of Zelda: Ocarina of Time* is technically feasible.

This repository is separate from [ZeldaRET/oot](https://github.com/zeldaret/oot). ZeldaRET's repository is the reference for understanding the original game's reconstructed source; this repository is where DSi-specific research, experiments, and original port code will live.

> **Status: Research / feasibility stage.** No playable port exists yet. The first milestone is to understand the reference codebase and validate a small DSi graphics/input/audio test.

## Project principles

- Keep the ZeldaRET reference repository unchanged.
- Do not commit copyrighted game ROMs, extracted game assets, or proprietary content.
- Use a legally obtained, matching game copy only where the reference project's own build process requires it.
- Record which claims are verified, which are hypotheses, and which still need hardware testing.
- Prefer small experiments with measurable results over attempting a complete port immediately.

## Start here

1. [Project scope and constraints](docs/PROJECT_SCOPE.md)
2. [Porting roadmap](docs/PORTING_ROADMAP.md)
3. [Initial engine reconnaissance](docs/ENGINE_RECONNAISSANCE.md)
4. [Chromebook and Codespaces workflow](docs/CHROMEBOOK_WORKFLOW.md)

## Browser ROM tool

A first-stage, browser-only ROM verifier is in [`rom-tool/`](rom-tool/). It calculates the file's MD5 locally and checks for the known NTSC 1.2 hashes. The ROM is not uploaded or transmitted. This verifier does **not** extract Link's model yet; the DMA/file parser and DSi model conversion are subsequent milestones. To publish it, enable GitHub Pages for this repository and serve the repository root; the tool will be at `/rom-tool/` under the Pages site.

## Browser model converter

The [`model-tool/`](model-tool/) page converts a user-supplied Wavefront OBJ mesh into a libnds C header. It runs entirely in the browser and does not upload the model. The initial converter supports geometry only (no UVs, textures, materials, or skeletal weights) and caps output at 500 triangles. The generated header exposes `draw_imported_model()`; it can be included in the player prototype after the file is placed in `dsi-player-movement/source/`.

This is a general-purpose custom-model import milestone, not an extractor for Nintendo's Link assets. The current player skeleton is still a hierarchical placeholder rig; imported meshes are not yet skinned to its bones.

## Reference project

- [ZeldaRET/oot](https://github.com/zeldaret/oot) — decompilation of Ocarina of Time.
- The reference project explains that it reconstructs the game's source code and is not itself a PC port.
- Its build process requires a prior game copy to extract assets. Do not upload ROMs or extracted assets to this repository.

## Current first milestone

Set up a Codespace, clone the reference repository beside this repository, and generate a source inventory. Then map the original engine's major systems before choosing a porting architecture.
