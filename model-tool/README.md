# Browser OBJ Model Converter

Open the GitHub Pages path `/model-tool/` and choose a Wavefront OBJ file. Parsing and C-header generation happen locally in the browser; the model is not uploaded.

## Supported input

- OBJ vertex records (`v`) and polygon faces (`f`)
- Positive and negative OBJ vertex indices
- Polygon faces are triangulated as a fan
- Up to 500 output triangles

## Output

The generated `model_mesh.h` contains a `draw_imported_model()` function using libnds `GL_TRIANGLES` and `glVertex3f()`. Copy it into `dsi-player-movement/source/`, include it from `main.c`, and call it inside the player's transform instead of the placeholder box rig.

## Current limitations

- No UV coordinates, textures, materials, normals, or vertex colors
- No skeletal weights or animation binding
- No automatic polygon simplification
- 500-triangle cap is a conservative prototype limit, not a measured performance guarantee
- Imported mesh is static; connecting it to the existing procedural skeleton requires a later skinning/deformation step

The Nintendo DS geometry engine has a 6,144-vertex-per-frame limit shared by all geometry, and libnds supports fixed-point vertex commands and triangle primitives. See the [BlocksDS 3D graphics tutorial](https://blocksds.skylyrac.net/tutorial/intermediate/3d_graphics/).
