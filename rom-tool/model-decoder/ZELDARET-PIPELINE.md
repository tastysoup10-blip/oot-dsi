# ZeldaRET-based Link model extraction

## Why the experimental browser decoder is being retired

The browser decoder in this folder reads N64 display-list commands directly. Its current OBJ output is not reliable: the Child Link near-part catalog in ZeldaRET's XML describes, for example, 183 vertices for the head and 74 for the torso, while the experimental export contained only a few faces for those parts. A file downloading successfully does not mean the geometry is correct.

Do not use the current experimental OBJ as a model source for the DSi port.

## Authoritative asset description

Use the ZeldaRET Ocarina of Time repository:

- XML: [assets/xml/objects/object_link_child.xml](https://github.com/zeldaret/oot/blob/main/assets/xml/objects/object_link_child.xml)
- Asset extraction notes: [docs/assets/extraction.md](https://github.com/zeldaret/oot/blob/main/docs/assets/extraction.md)
- XML descriptor specification: [tools/assets/descriptor/spec.md](https://github.com/zeldaret/oot/blob/main/tools/assets/descriptor/spec.md)

The Child Link XML describes the vertex arrays, display lists, skeleton, limb table, and individual limbs. In particular, the skeleton is `gLinkChildSkel`, the limb table is `gLinkChildLimbs`, and the table contains 21 LOD limbs.

## Recommended extraction workflow

ZeldaRET extracts assets from a locally supplied baserom. The repository documentation says the normal setup is:

```sh
make setup VERSION=ntsc-1.2
```

This extracts assets under `extracted/ntsc-1.2/assets`, using the XML descriptions in `assets/xml`.

For a targeted extraction, the repository documents:

```sh
./tools/extract_assets.sh ntsc-1.2 -s object_link_child
```

The exact command-line options should be checked against the current checkout's script before running it. Keep the baserom local; do not commit or upload it.

## What comes after extraction

ZAPD/ZeldaRET output is structured source/assets, not a ready-made DSi model. The next conversion stage must:

1. Preserve the vertex positions, UV coordinates, vertex colors/normals, and texture data.
2. Resolve display-list commands and material/render state into explicit triangles and materials.
3. Preserve the 21-limb hierarchy and the LOD limb structure.
4. Convert the resulting data to a format the DSi port can load, with a separate animation conversion stage.

The DSi renderer should consume the converted assets. It should not need to interpret the original N64 display-list stream at runtime unless we deliberately choose to build an N64-style renderer.

## Current status

- The ROM extractor still extracts the original Link object binaries locally.
- The current browser OBJ decoder is experimental and known to produce incomplete geometry.
- ZeldaRET's XML is the source of truth for asset layout.
- No complete ZAPD-to-DSi conversion has been implemented or hardware-tested yet.
