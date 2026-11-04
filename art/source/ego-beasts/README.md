# Approved animal identities, whole-body poses

Source appearance: approved `Quatre_betes_d_ego.png`. Approved toad effect: `crapaud-saut-marteau-piqueur-v2.png`. Approved camouflage: `Cameleon_camouflage_a_valider.png`.

Generated with the built-in image generation tool. Initial drafts with red edge contamination and too-tight framing were rejected during visual inspection and are not shipped as source assets.

Initial prompt: preserve the four approved identities as a transparent 4-column, 4-row sprite atlas, whole bodies including every feather, foot, tail and whisker. Peacock walking/idle with camera; toad normal/crouched/airborne/tired; rat walking with receipt backpack; chameleon walking/ready with purple vest and curled golden tail. No scenery, text, cast shadows or attack effects. Ground poses use a common baseline and generous cell padding.

Correction prompt: preserve identities, anatomy and costumes. Correct transparency, remove all red fringe contamination and detached speckles, shrink complete figures uniformly to leave at least 12% clear cell padding, use a regular 4×4 equal-square grid with grounded bottoms at 86% height. Mirror complete chameleon figures to face right. No redesign.

Runtime uses only complete painted frames with uniform scaling and optional horizontal mirror. Toad leap is vertical translation only. Camouflage uses a bounded three-surface tint cache; every warning and damaging attack is fully visible. Attack geometry is read from simulation without changing state.

Final source generation used the built-in tool to clean the sheet on pure white, followed by this tool-only extraction prompt:

> Use case background-extraction. Remove ONLY the flat white background of this sprite atlas and make it genuinely fully transparent. Preserve all sixteen animal drawings and the complete square canvas, positions, poses, sizes, dark outlines, costume colors and anatomy. Do not repaint or redesign. The animal interiors must be 100% opaque, including their dark outlines and white receipt papers. No red matte, no color contamination, no semitransparency inside animals, no checkerboard, no fringe, no detached speckles. Clean alpha silhouette, entire body intact in every cell.

`poses-opaque.png` and `poses-transparent.png` preserve these source results. The packing script crops whole figures, uses one uniform scale per species, and registers every frame at source baseline 240/256. It never edits alpha, paints/reconstructs anatomy or stretches a figure. `registration.json` records each crop and destination. Near-opaque pixels (alpha≥250) exceed 70% of visible paint in every frame; fully opaque-only counts are not meaningful because generated interiors often have alpha254.

Packed runtime asset: `dist/assets/ego-beasts.png`, 1024×1024, sixteen 256×256 cells. Whole-cell display sizes remain 112/96/84/104px. Native proof: `POPESCU_CANVAS_MODULE=/path/to/@napi-rs/canvas node scripts/inspect-ego.mjs /tmp/ego-art-qa`, or install the standard optional native Canvas dependency and omit the environment variable.
