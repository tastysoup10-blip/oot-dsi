# Native DSi textured-object and camera test

This is the second native DS/DSi graphics experiment for the OOT DSi port research. It is a small homebrew test, not an Ocarina of Time port.

## What it tests

- Loads a 64x64 RGBA texture into DS 3D texture VRAM.
- Generates the texture in code, so no external or copyrighted game assets are needed.
- Maps the texture onto all six faces of a rotating cube.
- Moves the camera around the object using the D-pad and L/R.
- Resets the camera with A.
- START exits to the homebrew launcher.

## Controls

| Button | Action |
| --- | --- |
| D-pad left/right | Move camera left/right |
| D-pad up/down | Move camera closer/farther |
| L/R | Move camera height |
| A | Reset camera |
| START | Exit |

## Build

The project uses BlocksDS and the same GitHub Actions workflow as the first cube test. Pushes affecting this directory trigger a build. The resulting `.nds` file is uploaded as a workflow artifact.

## Hardware test checklist

- [ ] Textured cube appears on the top screen.
- [ ] Texture is visible on all faces.
- [ ] D-pad moves the camera around the cube.
- [ ] L/R changes camera height.
- [ ] A resets the camera.
- [ ] START returns to the homebrew launcher.

A successful CI build confirms compilation only. A physical DSi test is still needed to confirm the texture and camera behavior on hardware.
