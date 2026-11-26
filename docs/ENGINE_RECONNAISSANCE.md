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

## First source-level findings

Source checked: ZeldaRET/oot `main` branch, 2026-11-25. These are initial observations from reading the files listed below, not a complete dependency audit.

### Source layout

The `src/` directory is divided into several platform/runtime areas:
- `src/code/`: shared game and engine code, including main loop, game state, graphics, camera, actors, scenes, and memory management.
- `src/overlays/`: actor, effect, game-state, and miscellaneous overlays.
- `src/audio/`: audio implementation areas.
- `src/libultra/`, `src/libu64/`, and `src/libc64/`: N64-era support/library code.

The public `include/` directory contains engine headers such as `gfx.h`, `game.h`, `play_state.h`, `controller.h`, and `ultra64.h`.

### Files inspected

| File | What the source establishes | DSi relevance |
|---|---|---|
| `src/code/main.c` | Includes N64 system/context headers and sets up core application-side systems. | Startup and platform services need mapping to DSi equivalents. Full initialization flow still needs tracing. |
| `src/code/game.c` | Includes graphics, scheduler, controller, memory, audio, and game-state interfaces. | A useful place to trace frame coordination and platform boundaries. |
| `src/code/graph.c` | Includes graphics, VI mode, microcode, game-state, and audio interfaces. | Strong candidate for the N64 graphics task/frame submission boundary. |
| `src/code/z_play.c` | Pulls together gameplay systems including actors, camera, collision, scenes, objects, audio, and graphics. | Gameplay logic may be reusable conceptually, but dependencies need to be separated from rendering and platform services. |
| `src/code/z_rcp.c` | Defines N64 graphics setup display lists using RDP/RSP-style graphics macros. | This is not a direct DSi graphics implementation; rendering commands will need a new backend or translation layer. |
| `src/code/z_view.c` | Implements view/viewport and projection-related routines. | Math concepts can inform a new renderer, but the current graphics structures and conventions are N64-oriented. |
| `include/gfx.h` | Defines a 320×240 screen size, a 4 KiB texture memory constant, and N64 graphics task/pool structures. | These are concrete N64 assumptions; DSi screen dimensions, memory, and graphics submission must be designed separately. |
| `include/ultra64.h` | Aggregates Nintendo 64 SDK-style interfaces including RCP, VI, PI, controller, thread, and audio-related headers. | Broad platform coupling: compiling the existing source for DSi unchanged is not a realistic first step. |

### Current architectural conclusion

The most promising strategy to investigate is **not** "compile the decompilation for ARM." Instead, identify portable gameplay/data logic, then replace the N64-specific services—especially graphics, audio, input, timing, DMA/resource loading, and scheduling—with DSi implementations.

This is an architectural hypothesis based on the files above. It does not yet prove which gameplay modules can be reused without changes.

### Next source-reading targets

1. Trace the actual frame loop through `main.c`, `game.c`, and `graph.c`.
2. Inspect the N64 graphics task path and identify where RSP/RDP display lists are built and submitted.
3. Trace controller input from the N64 controller API into gameplay state.
4. Map audio task submission and resource loading.
5. Inspect memory allocation and scene/object loading to estimate the runtime memory footprint.

No ROM or extracted game assets were downloaded or added.

### Frame and thread flow traced from source

The following symbols were located by reading the current upstream source:

- `Main()` in `src/code/main.c` creates and starts the graphics thread with `Graph_ThreadEntry`, initializes the pad manager, and then waits on an interrupt-manager message queue.
- `Graph_ThreadEntry()` in `src/code/graph.c` initializes the graphics context and runs the game-state / graphics loop.
- `Graph_Update()` builds a graphics frame/task and sends the task to the scheduler command queue.
- `GameState_Update()` in `src/code/game.c` is the game-state update entry point.
- `GameState_ReqPadData()` requests controller data through `PadMgr_RequestPadData()`.
- `GameState_Draw()` and `GameState_SetFrameBuffer()` participate in drawing and framebuffer handling.
- `Graph_TaskSet00()` waits for graphics-task messages and handles task completion; `Graph_FaultClient()` uses `osViSwapBuffer()` for video buffer swapping.

**What this tells us:** the original program is not a single simple loop that updates and draws everything on one thread. It coordinates game-state work, input, graphics, and scheduling through N64 operating-system-style threads and message queues. A DSi implementation will need its own frame coordination model, even if some game-state logic can be retained.

**Still unverified:** exact timing behavior, task priority requirements, which parts of the scheduler are essential to gameplay, and the cleanest seam for replacing the graphics task system. Those require following the called functions and data structures further.
