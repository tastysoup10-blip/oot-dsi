# Initial engine reconnaissance

## What is verified from the upstream project

Source checked: [ZeldaRET/oot README and repository root](https://github.com/zeldaret/oot), reviewed 2026-11-25.

The upstream README states:
- The project is a work-in-progress decompilation intended to recreate a source-code base from analysis of the game.
- It is not producing a PC port.
- It supports multiple original game versions, including N64 retail versions and later GameCube/iQue variants.
- The repository does not include the assets required to build a ROM; a prior copy of the game is needed to extract them.
- Its documented Linux build prerequisites include Git, build tools, curl, Python 3.10+, libxml2 development files, and a MIPS binutils toolchain (plus a matching compiler when using GCC).

The upstream repository root currently contains these broad areas:
- `assets/`, `baseroms/`, `data/`, `docs/`, `include/`, `linker_scripts/`, `rsp/`, `spec/`, `src/`, and `tools/`.
- Build and analysis files include `Makefile`, `Dockerfile`, Python scripts, and tool configuration.

## Important interpretation

This is a repository-level inventory, not yet a detailed code audit. The directory names suggest areas to investigate, but they do not by themselves prove where every runtime subsystem is implemented.

Do not assume that the whole project can be compiled unchanged for ARM/DSi. The original build targets N64-era MIPS code and hardware. A DSi port would need a separate platform implementation and likely substantial replacements.

## Questions to answer by reading the source

| Area | Questions |
|---|---|
| Entry point / main loop | Where does initialization happen? What drives each frame? |
| Scheduling | How are CPU tasks and graphics/audio work coordinated? |
| Graphics | Where are display lists generated and submitted? Which RSP/RDP assumptions are exposed? |
| Audio | Which audio engine and data formats are used? How is audio scheduled? |
| Input | Where are N64 controller states read and translated? |
| Actors | How are actors updated, drawn, spawned, and destroyed? |
| Resources | How are scenes, objects, textures, and animations loaded? |
| Memory | Which heaps and fixed memory regions are assumed? |
| Platform coupling | Which files include N64-specific headers, registers, or assembly? |

## Evidence log

Add findings here with:
- source path and symbol/function name;
- a concise explanation in your own words;
- any dependency on N64 hardware;
- whether the finding was verified by reading code or is still a hypothesis;
- upstream commit hash so results can be reproduced.

No ROM or extracted asset files should be added to this repository.
