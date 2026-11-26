# Native DSi 3D test

This is the first hardware experiment for the OOT DSi port research. It is a small native DS/DSi homebrew program, **not an emulator** and not yet part of the Ocarina of Time engine.

## What it tests

- Initializes the DS-family fixed-function 3D engine.
- Draws a colored cube on the main (top) screen.
- Uses the D-pad to rotate the cube; it also spins slowly on its own.
- Displays controls on the sub (bottom) screen.
- START exits to the homebrew launcher.

## Build

This project uses [BlocksDS](https://blocksds.skylyrac.net/). The project Makefile uses the official ARM9-only ROM template.

On a computer with BlocksDS installed and configured:

```sh
make
```

The build should produce `oot_dsi_3d_test.nds` in this directory.

## Test on the DSi

1. Copy `oot_dsi_3d_test.nds` to the SD card used by your DSi homebrew menu.
2. Safely eject the SD card and put it back in the DSi.
3. Launch the ROM from the homebrew menu.
4. Check that the cube appears on the top screen and the controls appear on the bottom screen.
5. Try the D-pad and START.

Do not rename or replace other files on the SD card. Keep a backup of the card before making changes.

## Current limitation

The source has been prepared from the BlocksDS SDK's public `basic_cube` example, but it has **not yet been compiled or tested on hardware**. A successful build and real-DSi test are still required.

## References

- [BlocksDS 3D graphics examples](https://github.com/blocksds/sdk/tree/master/examples/graphics_3d)
- [BlocksDS basic_cube source](https://github.com/blocksds/sdk/tree/master/examples/graphics_3d/basic_cube)
- [BlocksDS setup and build documentation](https://blocksds.skylyrac.net/docs/setup/)
