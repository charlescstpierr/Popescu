# Travestia: back-first tail dash

The atlas contains eight complete paintings, row-major E, SE, S, SW, W, NW, N, NE. These labels describe tail/travel direction, opposite the body facing direction.

- Runtime asset: `dist/assets/travestia-dash.png`, 800 × 400 RGBA.
- Cells: 200 × 200 pixels; floor anchor `[100,174]`.
- Registered body height: 110 pixels, excluding the tail.
- Full source, approved attack and identity references, original generation prompt and exact measurements are preserved here.
- Rebuild with `node art/source/travestia-dash/register-atlas.mjs` from the project root. Uses the installed `@napi-rs/canvas` dependency.
- Registration only crops the original eight cells, uniformly scales each complete pose and translates its floor anchor. It does not repaint, rotate, shear, or assemble body parts.
- `registered-preview.png` shows the final atlas on a dark background, baseline and anchor crosshairs. `source-measurement.png` is a coordinate-overlay inspection of the original generated sheet.
- Every frame was checked for intact head, both boots, hands, skirt and straight tufted animal tail. Every alpha component remains away from the cell edges.

Tail root/tip measurements are screen-space coordinates relative to the floor anchor. The north tail is partly hidden behind the body and emerges above the head, so its apparent tip offset is larger than the other views. On NW/N/NE, the root is an inferred hidden anatomical point; it is not a separate rendered body part. Gameplay collision remains the engine's responsibility.
