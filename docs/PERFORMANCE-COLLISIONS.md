# Performance: static world collision footprints

## Scope

Only `dist/world.js` changes at runtime. Collision math, iteration order, enemy separation, attack warnings, sprites, save version and entity caps are unchanged. The standalone release is regenerated from these modules.

Profile evidence (`proof/CPU.*.cpuprofile`) identified `World.collides`, including chunk lookup, as the largest CPU cost in a 300-enemy mixed crowd. Each movement and separation query rescanned decorative props and reconstructed solid footprints. The world now stores each static chunk's solid footprints in a WeakMap keyed by its prop array. Eviction does not leave a strongly retained cache; a regenerated array gets a fresh footprint list. `chunk()` also performs one Map lookup instead of a `has` plus `get`.

World props are static for a generated chunk's lifetime in the current game. Any future destructible or movable scenery must invalidate/rebuild these derived footprints when changing geometry or solidity. The cache is neither saved nor part of simulation state.

## Reproduce

Run from the candidate root:

- `npm test`
- `node scripts/benchmark-crowd.mjs /path/to/baseline`
- `node scripts/benchmark-crowd.mjs .`
- `python3 scripts/export-standalone.py release/Toma_Popescu_JOUER.html`
- `node scripts/inspect-standalone.cjs /tmp/toma-performance-standalone.png`

Run timings sequentially with no other CPU-intensive checks. The benchmark imports the selected root's actual Game module, uses a fixed seed and nightmare difficulty, holds 300 mixed enemies alive with elevated HP, activates follower/money/car/chopper upgrades, and moves the player on a repeatable path. Each run advances 720 frames at 1/60 second; one warmup precedes five measured runs. Invulnerability/high player HP and disabled new spawns/story pauses keep workload comparable. This is a controlled crowded-gameplay simulation benchmark, not a naturally progressed playthrough or a maximum-projectile test.

Reported time covers simulation update only. It excludes rendering, browser overhead, input, audio and physical-device behavior. It must not be described as phone FPS or overall frame-time improvement.

## Measured result

Independent sequential Node v24.22.1 benchmark (five measured runs per version):

- Mean update: 2.022 → 1.321 ms, 34.7% lower.
- p50: 2.023 → 1.278 ms, 36.8% lower.
- p95: 3.034 → 2.071 ms, 31.7% lower.
- 300 enemies maintained; peak 8 projectiles in this fixture.
- Baseline/optimized order was not randomized; timings are local measurements with normal system variation, not a statistical confidence interval.

Raw results: `proof/review-benchmark-before.json` and `proof/review-benchmark-after.json`.

## Correctness

- 220/220 tests passed, including two new tests.
- Repeated warm collision queries no longer read static props' solidity; the test failed on the old implementation (2,500 redundant reads) before passing on the candidate.
- 36,000 seeded collision queries compare cached collision results against original math across city/forest chunks and regeneration.
- All five measured runs on each version produce the same complete simulation-state SHA-256: `143510d909f62cce72a386fb3493c5d2049dd149adf51ce0b758611ef07af53b`.
- Native standalone adapter passes boot, images, start, discovery activation, HUD, read-only render, pause/resume, discovery save/resume, boss warnings/recovery and all tail-dash save/resume phases.
- Only `world.js` differs under `dist/`; all art, renderer, engine and save files remain byte-identical.
- Independent review and uncontended timing results are recorded in `proof/perf-independent-review.md`.

## Delivery

Candidate: `/workspace/shared/popescu-perf`. Apply `proof/performance-world.patch` only to the matching integrated baseline, bring over the benchmark and regression test, and regenerate the standalone. No deployment or push was performed.
