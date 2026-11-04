# Charles verification

- Node aggregate: 721/721 tests passed against the final runtime, including four camera/framing regression tests with red-first obstruction checks. The final aggregate log accompanies the frozen runtime.
- Engine tests cover explicit entry, no forced boss, permanent invincibility, genuine projectile hits, transformation order, pause freeze, lethal contact/avoidance, effect expiry and continued endless.
- Independent reviewer found and verified fixes for late safe-opening dodges, visual timestamps after exit, trophy expiry and discovery expiry. Each has a reproducing regression test.
- 20,000 independent seeded swept-wave segments compared against 501 sampled times each: no false positives/negatives found.
- Genuine v9 save produced using the previous engine and RunStore migrated to v10, preserving chosen trophies, active timer, queued reward and opened-chest provenance.
- Four 180-second encounters, one per difficulty: 28 attacks avoided in each, transformation/phase two reached, 240 exact save/reload checks total. Main survival timer stayed 1200. Destroyed scenery stayed bounded (39 props in these runs).
- Actual Renderer/CharlesArt modules produced 390×844 captures in full/reduced effects and a 150-frame transformation animation. Rendering left simulation state unchanged. Average local native Canvas render is recorded in the local verification report; this is not a mobile FPS measurement.
- Standalone HTML regenerated. Embedded Charles atlas, encounter, save/resume and exit pass in the existing DOM/Canvas adapter, alongside the previous boss, discovery and director smoke checks.
- Managed Chrome now verifies natural entry and complete-body visibility at 320×568 and 390×844, with permanent warnings, readable settled banter, and separate joystick placement. Physical iPhone/Android/Safari, safe-area insets, touch latency and actual device performance remain unverified.

## Artifacts

- `proof/charles/in-game-sequence.png`: actual engine contact sheet.
- `proof/charles/transformation-electric.mp4`: revised actual state-machine transformation at 24 fps, including four trees broken on landing and eleven total after takeoff.
- `proof/charles/lightning-before-landing.png`, `lightning-landing.png`, `lightning-takeoff.png`, and `lightning-takeoff-reduced.png`: actual forest checkpoints.
- `proof/charles/hover.png`, `shock_warning.png`, `cape_spin.png`, `bend.png`, `scream.png`, `burst.png`, and reduced variants.
- `proof/charles/banter-portrait.png`: exact 62×76 Charles bust framing.
- Generated locally by `scripts/charles-preview-fixtures.mjs` (not committed): 25 valid storage fixtures for victory offer, intro, attacks, transformation, reduced effects and both endings. Import the key/value object into localStorage, reload, then Resume saved → Continue to display the saved phase.
- `SOURCE_MANIFEST.json`: published file SHA-256 list. Raw runtime snapshots and report JSON remain local verification artifacts.

Apply this feature’s diff on top of the trophy runtime. Preserve the fourteen pre-existing remote art source files absent from the local baseline. Do not use destructive directory synchronization.

## Lightning and landing revision

The revised beam uses three irregular main electrical arcs and five attached forks, white-hot cores and layered cyan/blue glow. Deterministic keyframes morph continuously without opacity blinking. All geometry remains bounded. Reduced effects use two static low-opacity paths. Pure geometry tests cover the progression, bounds and determinism. Independent sweep checked all five phases at 1,001 progress values in both settings.

Eight red-first landing tests cover real procedural pine collisions, the 145/240-pixel radii, exact reload between impacts, pause/replay, unaffected scenery and the shared 64-ID cap. Actual forest captures show 4 trees destroyed on landing and 11 total after takeoff.

The actual seed71 simple-dodge run now destroys 2 props in the first wave, 3 total on landing and 4 total on takeoff, in all four difficulties. Sparse wave clearing uses only a stable prop-ID hash and consumes no combat RNG. Final electric preview is `electric-takeoff.png`; its quiet version is `electric-takeoff-reduced.png`.

## Final mobile framing correction

The natural entry was hidden behind the fixed upper banner and dialogue on both portrait sizes. The renderer now shifts only the shared view downward, by at most 48 px (about 25 px at 390×844). Terrain, culling, whole bodies and attack geometry use the same camera. Simulation positions, collision geometry, RNG, approved art and electric effects are unchanged. Dialogue sits below the playfield; joystick and movement hint stay above it. Frozen reward/companion arrows are hidden during Charles, like the other inactive resource panels, and return after the epilogue.

The new obstruction checks first failed against the obstructed view. Four regression tests now verify natural 320×568 head/body bounds in full and reduced effects, 390×844 clearance, rendering without state mutation, shared terrain/body projection, and unchanged fresh survival/completed/endless cameras. Two independent reviewers inspected the actual 320×568 browser pixels; the 390×844 browser capture additionally shows settled, legible banter.

- `proof/charles/mobile-320-natural.png`: actual managed Chrome, natural optional entry, full body clear of the banner.
- `proof/charles/mobile-390-natural.png`: actual managed Chrome, natural optional entry with settled banter.
- `proof/charles/verify-mobile.log`: regenerated standalone execution passes, including Charles save/resume/exit.

The approved electric preview video remains unchanged; these newer browser captures establish the final HUD framing. No production publication is performed by this verification step.
