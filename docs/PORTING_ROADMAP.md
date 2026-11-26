# Porting roadmap

This is a research-first roadmap. Each phase should produce evidence before the next phase expands scope.

## Phase 0 — Workspace and source inventory

- [ ] Create a GitHub Codespace for this repository.
- [ ] Clone ZeldaRET/oot into a sibling directory named `oot-reference`.
- [ ] Record the upstream commit hash and date checked.
- [ ] Run the source inventory script.
- [ ] Identify major source directories and build-system entry points.

**Exit condition:** reproducible inventory and a short map of the upstream repository.

## Phase 1 — Engine reconnaissance

- [ ] Trace the game entry point and main update loop.
- [ ] Locate scheduler/task, timing, and frame update code.
- [ ] Map graphics command generation and display-list submission.
- [ ] Map audio initialization, sequencing, and sound playback.
- [ ] Map controller input and gamepad state.
- [ ] Map actor/object loading and resource management.
- [ ] Identify N64-specific libraries, hardware registers, and assembly.

**Exit condition:** subsystem map with source paths, dependencies, and confidence notes.

## Phase 2 — DSi hardware research

- [ ] Confirm the DSi homebrew memory layout and usable memory budget.
- [ ] Confirm ARM9/ARM7 responsibilities and toolchain support.
- [ ] Document the DS 3D engine's texture, polygon, matrix, and framebuffer constraints.
- [ ] Confirm audio capabilities and supported output formats.
- [ ] Confirm SD card access and expected asset-loading performance.
- [ ] Choose a development library/toolchain and document exact versions.

**Exit condition:** hardware capability sheet based on reliable documentation and tests.

## Phase 3 — Minimal DSi technology demo

Build original test content only:
- [ ] Bootable homebrew program.
- [ ] D-pad/button input.
- [ ] Text/debug overlay.
- [ ] Textured 3D scene.
- [ ] Basic camera movement.
- [ ] Audio playback.
- [ ] Frame-time and memory instrumentation.

**Exit condition:** test runs on real DSi hardware and its measurements are recorded.

## Phase 4 — Port architecture prototype

- [ ] Define platform interfaces for graphics, audio, input, timing, memory, and storage.
- [ ] Build one representative scene using original placeholder assets.
- [ ] Test actor update and collision with a small original sample.
- [ ] Measure CPU, graphics, memory, and storage limits.
- [ ] Decide whether the project remains viable and what quality compromises are required.

**Exit condition:** evidence-based go/no-go decision for a larger port.

## Phase 5 — Incremental integration

Only begin after the prototype proves the approach. Port and test one subsystem at a time, keeping the original reference repository untouched.

## Current priority

Do Phase 0 and Phase 1 only. Do not start a large rewrite yet.
