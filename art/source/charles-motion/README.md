# Charles: 12 whole-body motion paintings

Built-in imagegen generated and refined these poses from the approved Charles arrival sheet. The exact three prompts are in `imagegen-prompts.txt`. No API-key fallback was used. Final source is `poses-transparent-source.png`, RGBA 1448×1086; intermediate generated sheets are deliberately not runtime assets.

Runtime: `dist/assets/charles-motion-v1.png`, 704×528, four columns × three rows of 176×176. `dist/charles-motion-frames.js` exports `CHARLES_MOTION_FRAMES` with measured eye and hand points, cell rectangles and common foot anchor [88,160]. Metadata contains source coordinates, scale, translations and SHA-256 checksums.

Sequence:
- flight0 → flight1 → flight2 → flight1: cape flutter while flying right.
- brake0 → brake1 → settle: whole-body transition from diagonal flight to upright levitation.
- settle → hover0 → hover1 → hover0: restrained upright cape breathing.
- raise → prepare → snap → recoil: hand rises, fingers pinch, release and relax.

Run `python art/source/charles-motion/register-atlas.py` from any working directory to regenerate. Requires Pillow. It uniformly resizes each intact full-figure source cell by 152/362, then translates it to the common foot anchor. Alpha 1/255 interpolation dust is quantized to zero. No limbs are separated, composited, rotated, recolored or warped. The five original Charles paintings and prior arrival atlas stay unchanged.

`native-pose-review.png` is a registration contact sheet on a dark background, not a gameplay capture. Every cell has transparent borders. All figures include halo, complete cape, both arms, torso, legs and boots. The face naturally moves relative to feet as Charles straightens; the consumer should smoothly register the whole painting using measured eye centers. Finger detail is small at native size, so timed anticipation and a small localized effect at the measured hand point support readability. Independent review of the integrated animation remains necessary.
