# ROM Asset Extractor

A browser-only N64 DMA filesystem reader for the project's supported Ocarina of Time NTSC 1.2 ROM.

## Use

1. Open the GitHub Pages ROM tool.
2. Select your local `.z64`, `.v64`, or `.n64` ROM.
3. The page verifies the NTSC 1.2 checksum, locates the DMA filesystem, and lists present files.
4. Select **Extract** beside a file. Raw files are copied as-is; Yaz0-compressed files are decompressed before download.

The ROM and extracted bytes stay in the browser. No network requests or uploads are made by the page.

## Current limitations

- Retail ROM file entries are shown by index and VROM address; the retail image does not provide a convenient filename table.
- This stage extracts individual DMA files. It does not yet identify the player object, parse its skeleton/display-list graph, decode N64 textures, or export a complete animated model.
- The parser intentionally validates the DMA table rather than assuming a hard-coded ROM offset.
- Only the recognized NTSC 1.2 checksums are currently accepted.

Do not commit ROM images or extracted copyrighted game assets to this public repository.
