# Five-rank companion paintings

Created with the built-in image generation tool from the approved five-transformation mockup. Every atlas cell contains one complete adult woman, with the same warm tan skin, green eyes, facial identity and body proportions. New source paintings do not modify Toma or the old girl atlas.

Sources:
- `levels-whole-source.png`: five rows × four poses, front idle, front run A, front run B, rear idle.
- `levels-rear-run-source.png`: five rows × two rear running poses, background extracted with the same built-in image tool. Alpha must be preserved, including transparent pixels whose RGB channels retain background colors.

Prompt specification: detailed arcade pixel-art game sprite sheet, same recognizable adult woman across five ranks; rank 1 long chestnut hair, red varsity jacket, white tank, dark pants, white sneakers; rank 2 short blue bob, cropped teal jacket, dark cargos, teal sneakers; rank 3 purple-pink twin braids, purple-magenta utility outfit, gold belt; rank 4 silver high ponytail, white-gold heroine suit with black panels; rank 5 pink-cyan twin ponytails, holographic long coat, black-cyan suit. Complete coherent bodies with hands and shoes in every frame, no separated limbs, no labels or effects, transparent background. The supplemental sheet requests two complementary running-away rear poses per rank. Background-extraction prompt requests removal of all gradient/glow background while preserving the full figures and original cell layout.

`python3 scripts/prepare-companion-art.py` registers and uniformly scales whole paintings into six 128×128 cells per rank, with a bottom foot baseline at 121. It also extracts five 80×80 portraits from the exact same original faces. No limb assembly, pose warping, recoloring or generated identity substitutions occur at runtime.

`node scripts/inspect-companion-art.mjs` renders the actual Canvas module and its support cues at gameplay scale. `proof/companion/contact-sheet.png` shows all thirty complete atlas figures. Independent review should also inspect the companion in the integrated scene.
