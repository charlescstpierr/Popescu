# Rival attack paintings v1

Built-in official ImageGen, 5 November 2026. References were read-only approved `dist/assets/rival_goat-walk-v3.png` and `rival_rooster-walk-v3.png` from `popescu-story-main-3681edd-0151`.

## Files

- `rival-goat-attack-source-v1.png`, `rival-rooster-attack-source-v1.png`: untouched transparent ImageGen outputs, 1983×793 and 1774×887.
- `rival_goat-attack-v1.png`, `rival_rooster-attack-v1.png`: registered 640×256 atlases, five 128×128 cells per row, two rows.
- Matching JSON: source hash, exact source crop/foot coordinates, registered rectangles, anchors, sizes, phase labels.
- `register-rival-attacks-v1.py`: deterministic registration using Pillow and NumPy, no network. Run `python3 register-rival-attacks-v1.py` from any working directory.
- Contact previews at actual 88px goat / 78px rooster render sizes, plus animated GIFs for both front and back views.

## Integration contract

Draw each whole cell exactly once, uniformly at 88×88 goat or 78×78 rooster. The ground anchor in atlas coordinates is **[60,121] goat** and **[68,121] rooster**. Set destination top-left to `x-anchorX*size/128, y-anchorY*size/128`. These small x-anchor differences are intentional: they allow both horn-leading charge and the rooster tail to fit while keeping the measured foot center at the same world point. Horizontal mirror around the world anchor is allowed. No shear, rotation, squeeze, inflation or limb assembly is needed.

Rows: 0 front three-quarter toward screen-right; 1 back three-quarter toward screen-right. Opposite views use a horizontal mirror.

Goat columns: brace, lower, chargeA, chargeB, recover. Use first two during existing 0.8s windup; alternate chargeA/chargeB during existing 0.55s charge. Whole body/head truly lower; neither pose is derived by compressing the standing image.

Rooster columns: stepA, stepB, inhale, crow, recover. Use first three during existing 0.85s windup; use crow during existing 0.7s crow. Beak is painted open in both crow views. Chest/wing/head pose changes are drawn, not global scaling.

Recovery is provided as optional transition art. GIFs show it for 160ms purely for inspection; they DO NOT authorize changing game timings, damage, attack states or text. No active game source, engine, exports or publication was changed.

## Registration and validation

Each source cell is cropped as a complete painting. A single common isotropic scale per species is applied to all ten paintings, based on the mean recovery height: goat 109 source-cell pixels high, rooster 112. Actual resulting scale is in JSON. Lowered frames therefore stay shorter, instead of being stretched back to standing height. The bottom 12% of opaque support pixels locates the shoe/hoof center. These support coordinates, original source box and resulting painted bounds are recorded. Existing alpha is preserved within the entire subject crop; no color-key background substitute is used.

At native game sizes the goat's low forward charge and distinct strides remain legible. The rooster's open beak and backward chest/head arc remain visible, including rear three-quarter crow. Compared with the old sprites, these are new painted renditions, not pixel-identical copies; palette, suit/tracksuit, horns/comb, glasses/jewelry, shoes/hooves and overall identity are preserved. Source paintings are smoother than original small atlases; final downsampling is done once, uniformly.

Independent in-game visual QA belongs to the integration owner. These previews prove the atlas appearance and registration, not renderer playback or mobile performance.

Integration adjustment: goat x anchor changed from62 to60 for a 2px right-hand safety margin in the back charge A cell. The same translation applies to all10 paintings; world foot positions stay unchanged.
