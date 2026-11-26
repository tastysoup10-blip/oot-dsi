# DSi Player Movement Test

First player-controller prototype for the native DSi Ocarina of Time port research.

## Controls

- D-pad Up/Down: walk forward/backward
- D-pad Left/Right: rotate the player
- B + Up: run
- A: jump
- START: exit

No C-stick or shoulder buttons are used.

## What this prototype tests

- A player state with position, facing angle, vertical velocity, and grounded state
- Acceleration-independent walking and running speeds
- Turning and movement in the direction the player faces
- A basic jump arc and landing
- A camera that follows behind the player
- Bounds against the edge of the test terrain

The player is original placeholder geometry. This is an OOT-inspired controller experiment, not yet a direct port of Zelda's complete player actor or physics.

## Relationship to the OOT source

The reference source's player actor is in `src/overlays/actors/ovl_player_actor/z_player.c`. The current research target is to separate the concepts used by OOT's player update—input interpretation, facing/movement state, vertical motion, and grounded state—from its N64-specific actor, collision, animation, and graphics dependencies.

This prototype reimplements a small, independent test of those concepts. It does not copy OOT source code or include game assets.

## Build and test

The GitHub Actions workflow builds this alongside the earlier graphics prototypes. Download the `oot-dsi-3d-test` artifact and look inside `dsi-player-movement/` for `oot_dsi_player_movement.nds`.

A successful CI build confirms compilation only. Test on actual DSi hardware to verify controls, camera tracking, and jump behavior.
