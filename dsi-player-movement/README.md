# DSi Player Movement Test

Player-controller and animation prototype for the native DSi Ocarina of Time port research.

## Controls

- D-pad: move in four directions
- B: run
- A: jump
- START: exit

No C-stick or shoulder buttons are used.

## What this prototype tests

- A player state with position, facing angle, vertical velocity, and grounded state
- Four-direction movement with normalized diagonal speed
- Walking and running speeds
- A basic jump arc and landing
- A third-person camera that follows the player
- Simple procedural leg and arm movement while walking or running
- Bounds against the edge of the test terrain

The player is original placeholder geometry. The animation is a deliberately simple procedural test, not a port of Ocarina of Time's skeletal animation system.

## Relationship to the OOT source

The reference source's player actor is in `src/overlays/actors/ovl_player_actor/z_player.c`. The current research target is to separate the concepts used by OOT's player update—input interpretation, facing/movement state, vertical motion, grounded state, and animation state—from its N64-specific actor, collision, animation, and graphics dependencies.

This prototype reimplements a small, independent test of those concepts. It does not copy OOT source code or include game assets.

## Build and test

The GitHub Actions workflow builds this alongside the earlier graphics prototypes. Download the `oot-dsi-3d-test` artifact and look inside `dsi-player-movement/` for `oot_dsi_player_movement.nds`.

A successful CI build confirms compilation only. Test on actual DSi hardware to verify controls, camera tracking, jump behavior, and the procedural walk/run animation.
