# Charles whole-body artwork

This source adapts the user's approved Charles portrait and transformation storyboard to the existing painted pixel-art game. It was generated with the built-in image generator on 3 November 2026, then laid out again with clear transparent gutters.

The approved identity is preserved: swept short brown hair, trimmed brown beard, emerald eyes, deep purple suit, ivory chest armor with a golden eye/sun emblem, gold bracers and shoulders, ivory/gold boots, white cape with gold interior, and gold halo. No named superhero or licensed costume was used.

## Files

- `poses-transparent-source.png`: the final generated 1254 × 1254 alpha source, five complete figures in a 3 × 2 layout.
- `register-atlas.mjs`: reproducible crop, uniform scaling and registration only. All figures use 0.26 scale. There is no detached anatomy or affine body distortion.
- `atlas-metadata.json`: source SHA-256, cell bounds, measured foot anchors, and iris-highlight positions.
- `native-pose-review.png`: actual `CharlesArt.draw` output at native gameplay size and 2× inspection scale. This is an inspection contact, not a screenshot of gameplay.
- `imagegen-prompt.txt`: generation prompt and layout-refinement prompt.
- `../../../dist/assets/charles-whole-v1.png`: runtime 880 × 176 atlas, five 176 × 176 cells, anchor `[88,160]`. Upright body height is approximately 120 px, excluding the halo.

## Runtime

`CharlesArt` loads the atlas through an injectable loader and exposes `ready: Promise<boolean>`. `draw(ctx, charles, time, reduced)` paints one intact frame and returns `true`; it returns `false` if the atlas is unavailable or the actor is invalid. No vector character is substituted for missing artwork.

`charlesPose(charles,time,reduced)` is pure. The simulation's `x,y` is the ground anchor. Hovering raises feet 26 px, with a subtle 2 px bob unless reduced motion is enabled. `phaseTime` counts down: descending lowers the entire planted painting smoothly to the ground, bend and scream keep the feet grounded, and burst raises the empowered painting. No character scale, rotation or body deformation is used. The renderer adds one-pixel emerald highlights at measured source iris positions so the approved green eyes survive the small gameplay resolution.

Attack footprints, rotating cape blades, shockwaves, debris and beams belong to the separate effects layer. Art drawing never mutates the simulation.

Rebuild with `node art/source/charles/register-atlas.mjs` from the repository root, using the existing optional `@napi-rs/canvas` dependency. Tests are in `tests/charles-art.test.js`.
