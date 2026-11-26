# Project scope

## Goal

Investigate and, if feasible, develop an original Nintendo DSi homebrew port of *The Legend of Zelda: Ocarina of Time*, using the public ZeldaRET decompilation as a technical reference.

A native port means game logic and rendering are adapted to the DSi platform. It does **not** mean running an N64 emulator on the DSi.

## In scope

- Study the ZeldaRET source organization and build assumptions.
- Identify platform-dependent systems: graphics, audio, input, timing, memory, file/resource loading, and platform services.
- Measure DSi hardware capabilities using small, original test programs.
- Design replacement platform layers and a staged porting plan.
- Write original DSi-specific code and documentation.
- Test on an emulator for early iteration where useful, then on actual DSi hardware.

## Out of scope for the initial phase

- Reproducing or distributing Nintendo ROMs or extracted game assets.
- Claiming that a full port is possible before performance and memory tests.
- Rewriting the whole game before understanding its dependencies.
- Treating a successful desktop build as proof that it will run on DSi hardware.

## Reference-code and asset handling

ZeldaRET/oot is a separate upstream project. Its README describes the repository as a decompilation that reconstructs source code, and says a prior copy of the game is needed to extract assets for a complete build. This project should link to upstream rather than copy large portions of its source or any game assets.

Do not commit ROM images, extracted textures, audio, maps, models, or other proprietary game content. Keep any locally supplied game files outside this Git repository.

## Feasibility questions

1. What portions of the original code are platform-independent?
2. How tightly is game logic coupled to N64 graphics/audio APIs?
3. What DSi graphics features and memory budgets can homebrew safely use?
4. Can the DSi sustain the required scene complexity and frame rate?
5. How should large assets be streamed from storage?
6. Which original systems can be simplified without changing core gameplay?
7. What is the smallest representative scene that can validate the rendering approach?

## Definition of a meaningful early success

A small, original DSi homebrew test that:
- starts reliably;
- draws a textured 3D scene;
- responds to D-pad and buttons;
- plays a short original test sound;
- reports frame timing and memory use.

This test is a technology demonstration, not an Ocarina of Time build.
