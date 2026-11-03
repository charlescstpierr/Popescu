# In-game visual upgrade

The approved reference calls for expressive, detailed pixel characters and a purple ruined city. The first build used very small procedural sprites. This update replaces the visible actor art with matching transparent raster sheets while retaining the simulation, controls and collision sizes.

## Actor art
- Toma: shaved head, strong brows, dark beard, sunglasses on forehead, black jacket and gold chain.
- Companion: flowing brunette hair, green eyes, red varsity jacket, white shirt and sneakers.
- Gorilla: anthracite fur, huge arms, pink bow, hoop earrings and glowing red eyes.
- Four running poses in each of two facing views, mirrored left/right at runtime. Gorilla rear frames support the gas animation.
- Normal, sprinter, gas, tank, jealous, explosive and matriarch retain distinct scales and accessories.
- Registered foot baseline in three512×256PNG sheets. A vector fallback is used until decoding or if the image is unavailable.

Source prompt set: generate original detailed16-bit pixel walk-cycle sheets in a transparent4-column2-row grid, maintaining the approved portrait identities, consistent proportions, warm edge lighting, full bodies, transparent gutters and no UI/scenery/text. Toma and companion use front/rear running poses; gorillas use front knuckle walking/rear gas preparation. Final assets are in dist/assets/*-walk-v2.png. Runtime frames are normalized by scripts/pack-actors.py with explicit source arguments.

## Environment and effects
CityArt renders deterministic textured asphalt, curb slabs and crossing markings, puddles, discarded paper, weathered brick, awnings, neon shopfronts, windows, rooftop machinery, varied cars and clearer props. Terrain and prop caches are capped48 and96. CombatArt derives damage numbers, impact sparks, short death fragments, spawn fading and footstep dust from read-only simulation changes. Reduced effects remain supported.

## Validation
Actual image decode,24nonempty atlas cells, changing animation, immutable simulation state and bounded caches were checked by scripts/inspect-graphics.mjs. The final390×844raster output was visually inspected. Game logic is now covered by31tests. Browser authentication and local-file policy prevent a live browser pass here; physical-phone geometry andFPS remain unverified.

## Population and street expansion
The next update adds female orangutans as a separate orange-furred species with a dedicated four-by-two atlas, pink bow/scarf and long-arm attacks. A forward sector announces the committed swipe; it matches the 73-pixel reach including the player radius. Regular population is doubled, mixed hordes begin at20 seconds and recur every45 seconds, orangutan packs arrive from10 seconds, and enemy counts remain capped at300. A local separation pass keeps crowded enemies legible. Camera culling avoids drawing enemies outside the view.

Twelve new deterministic non-solid street prop types enrich seeded market, garden, delivery and ego-themed districts. Clear crossing streets and solid footprints are preserved. New short stories cover food carts, vending machines, trophies and planters.

The orangutan atlas was redrawn again after anatomy review. It now uses a small bare oval face with pursed lips, rounded belly, sloped narrow shoulders, short legs and exceedingly long hanging arms. Runtime uses orangutan-walk-v3.png, distinct from the broad-shouldered, toothy gorillas. All4atlases and32cells were decoded in finalCanvas QA.
