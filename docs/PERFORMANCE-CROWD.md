# Crowd simulation optimization

This change starts from GitHub main `812d6ddb012dc4ec3bc26a076955fd5e518bfd6c`. The candidate's baseline files were checked against every blob in that commit's recursive tree.

## Runtime changes

Only `dist/engine.js` and `dist/world.js` change. Art, rendering, spawn rates, enemy caps, attack timing, projectile math, damage, controls and saved-state formats are unchanged.

- Enemy separation first rejects neighbor pairs whose horizontal or vertical distance already exceeds their contact range. Actual contacts still use the original Euclidean distance, contact order, eight-push limit and movement response.
- World collisions retain one ordered list of solid footprints for the last queried chunk neighborhood. Repeated movement and crowd-push checks in that neighborhood avoid repeated chunk-key strings, Map lookups and WeakMap lookups. The exact circle/rectangle test is unchanged.
- `World.update()` clears that one neighborhood before chunk eviction. It does not retain an unbounded history of visited regions. The existing static-footprint WeakMap remains weakly keyed by each chunk's prop array.

The world is static for a chunk's lifetime. A future feature that moves or destroys scenery must invalidate both derived footprint caches when it changes geometry. This was already required for the original per-chunk footprint cache.

## Verification

- `npm test` includes early-rejection and collision-neighborhood regression tests. The new tests were observed failing before implementation: one unnecessary Euclidean calculation and 400 redundant chunk lookups respectively.
- Existing collision equivalence coverage checks 36,000 seeded queries across city/forest chunks, boundaries, varied radii and distant eviction/regeneration.
- `node scripts/verify-crowd-equivalence.mjs BASELINE_ROOT CANDIDATE_ROOT` compares real simulation state, timers, RNG and emitted events tick by tick at 30/150/300 enemies across three seeds. It includes all enemy families, overlapping initial positions, companion attacks, upgrades and long update steps.
- `node scripts/benchmark-crowd.mjs ROOT` measures simulation only. Its 300-enemy workload and output-state SHA-256 can be compared with the previous release. Run versions sequentially without CPU-heavy concurrent work.
- Regenerate the standalone with `python3 scripts/export-standalone.py release/Toma_Popescu_JOUER.html`, then run `node scripts/inspect-standalone.cjs /tmp/toma-crowd-standalone.png`.

## Results

Independent sequential desktop simulation measurements, with three alternating-order repeats:

- 300 enemies: mean 5.85 → 3.17 ms per update (46% lower); p95 6.59 → 3.64 ms.
- 100 enemies: mean 1.23 → 0.71 ms per update (42% lower).

These values come from the independent dense-crowd fixture. The repository's older `benchmark-crowd.mjs` uses a different, less costly controlled fixture, so its absolute timing is not interchangeable with those values. Every run of that older fixture kept the complete-state digest `143510d909f62cce72a386fb3493c5d2049dd149adf51ce0b758611ef07af53b`.

Final verification passed 250/250 tests, 4,320 tick-by-tick comparisons across all fifteen enemy families, and identical native-Canvas pixels at six crowded frames. The regenerated standalone passed syntax, embedded-image decoding, start, discovery HUD, read-only rendering, pause/resume, discovery save/resume and every tail-dash save/resume phase.

## Limits

Node and native-Canvas timings are local measurements, not browser or physical-phone FPS. These changes do not lower visual quality or enemy population to improve timing. Actual mobile rendering, touch, audio and device thermal limits still require a physical-device check.
