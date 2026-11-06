# Numeric crowd neighborhoods

## Scope and evidence

Base: GitHub main `3d82215dd4908fc1485065c6e1a3ce46ea5af0f9` (PR #69).
The existing collision, crowd and autosave optimizations were already present.
The open issues and PRs were checked before starting; no active duplicate covered
the repeated coordinate-key allocation in enemy separation.

A local Node CPU profile of `scripts/benchmark-crowd.mjs` identified
`separateEnemies` as the largest sampled simulation function. A deterministic
300-enemy non-contact fixture made 3,000 Map reads with string coordinate keys in
one separation step. Every enemy rebuilt a `"x,y"` string for each neighboring
cell, even though both coordinates were already integers.

`dist/engine.js` now stores columns and cells under numeric Map keys. The maps
remain local to each separation call. No cache persists between frames or enters
a save. The column traversal, row traversal, enemy insertion order, contact math,
eight-push limit and snapshot of initial cell membership are unchanged. Numeric
keys are not packed into a fixed-width integer, so negative and large world
coordinates do not alias.

No renderer, image, audio, controller, save format, spawn rate or enemy cap was
changed. The offline folder and optional standalone export were regenerated.

## Reproduce

```sh
node --test tests/crowd-performance.test.js tests/crowd-numeric-equivalence.test.js
node scripts/verify-crowd-equivalence.mjs BASELINE_ROOT CANDIDATE_ROOT
node scripts/benchmark-crowd.mjs BASELINE_ROOT
node scripts/benchmark-crowd.mjs CANDIDATE_ROOT
npm test
python3 scripts/export-offline.py
python3 scripts/export-standalone.py
```

Run timing comparisons sequentially without other CPU-heavy work. Each benchmark
includes one warmup and five measured runs of 720 frames with 300 mixed enemies.
It measures `Game.update` only, not drawing, audio, browser work or input.

## Measurements

Two sequential pairs with reversed ordering (baseline/candidate, then
candidate/baseline), Node v24.22.1 on the cloud computer:

- Average update time across ten measured runs: 1.034 → 0.916 ms, 11.4% lower.
- Average per-run p95: 1.569 → 1.369 ms, 12.7% lower.
- Pair 1 mean: 1.013 → 0.895 ms; pair 2 mean: 1.055 → 0.937 ms.
- Every run kept 300 enemies and produced state SHA-256
  `27a752da0c328e6dcfb5a2721a464b8e8605cb74bdfb6c9e589a5c4dc10de2d4`.

These are local simulation measurements with ordinary scheduling variation, not
phone FPS, total frame-time savings or a statistical confidence interval. No
physical iPhone or Android test was performed.

## Correctness

The performance regression test was observed failing on the baseline (3,000
string-key reads), then passing on the candidate (zero). The pre-existing
non-contact early-rejection test also passes. The integration equivalence script
compares state, RNG, timers and emitted events at every tick across three seeds
and 30/150/300 enemies, including long steps and mixed enemy types: all 4,320
comparisons are identical.

Independent review found no blocking issue and added four reference-comparison
tests. They compare every movement call and resulting position across negative
cell boundaries, coordinates up to ±2^40, signed zero, unsorted enemy IDs,
coincident crowds, locked actors, empty columns and actual cell crossings during
separation. The reference keeps the original string-grid implementation.

Final verification: 1,639 tests passed, zero failures or skips. Six native-Canvas
crowded frames match the baseline pixel for pixel, with read-only rendering.
The regenerated offline folder passes the native boot, packaged-image,
start/pause/resume, discovery, boss-phase and save/resume smoke checks.
The optional standalone file was also regenerated. These checks use the existing
Canvas/DOM adapter, not a real browser or physical phone.

Raw ordered timing runs are in `proof/crowd-numeric/timings.json`.
