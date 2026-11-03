# Combined candidate, 3 November 2026

Base: GitHub `charlescstpierr/Popescu` main `b89ebc0495f4f77730445757ffbe66f841f8caa5`, verified via connector. All 49 runtime files in the local music checkout match that commit's fetched manifest. No push or deployment performed.

Integrated source changes: remaining approved power animations, XP travel direction with version-8 save migration, persistent boss pursuit, and critical encounter alerts. Reviewed and approved stronger boss tuning is included (higher boss durability and bounded charm interruption). Fourteen original art source files absent from the local runtime checkout are preserved from the verified GitHub base tree; their manifest entries are retained.

The first patch conflict was the movement step: retained both actual-displacement travel history and the new detox/shield feedback hooks. A second contextual conflict in enemy cleanup retained both pursuit and the new resistance decay. Generated standalone and manifest were rebuilt rather than accepting older patch copies. Music, original sprites and other asset files remain byte-identical to the verified baseline.

Validation:
- Final complete suite: 615 tests pass, zero failures (`proof/combined/hardened-tests.log`).
- Fresh post-interruption complete suite: 615 tests pass, zero failures. Regenerated standalone has SHA-256 `c5f199720f0a427f94aaf857c69009e60ad7770d058b99cef2495e2d862ec172` and passes the native smoke checks again.
- Final director soak passes twenty minutes followed by five minutes of optional endless mode in all four difficulties, with 38 exact save/restore checkpoints each. Each run reports exactly one victory. Peak enemy counts are 208 / 277 / 214 / 299, all below the 300 cap; no overlapping major bosses or repeated adjacent boss types. Survival and boss defeats are controlled in this test, so this is compatibility and boundedness evidence, not a human difficulty measurement.
- Independent review: initial 553-test suite and visual review passed. Final hardening review passes 152 focused tests plus 36 reentry/save/pause combinations across three bosses and four difficulties, preserving wounded HP, maximum HP, identity and resistance. No blocking integration issue found.
- Fixed the review's exactly-vertical motorcycle trail defect by treating zero horizontal velocity as real, not as a missing value. Added a regression test.
- Added a four-difficulty integration test combining movement, power feedback, boss return, physical XP bank and repeated deterministic save/restore.
- Native standalone smoke passes syntax, embedded assets, boot, discovery/HUD, nonmutating rendering, pause/save/resume, Travestia and pelican phases, and boss director restoration.
- Independent actual Canvas rendering covers 15 power effects, reduced effects, 320px layout and 300 enemies. The whole approved hero remains intact. Mean native stress rendering was approximately 17ms; this is not phone performance evidence.
- Final hardening integration preserves wounded boss HP and charm-resistance time across reentry and repeated saves in all four difficulties.

One isolated XP replay expected exactly level 3 at 190 seconds. Pursuit legitimately changes the trajectory: the combined seed-42 straight-right run reaches level 4 at 178.3 seconds, retains a 222-XP bank behind the player at 190 seconds, and ends at 221.2 seconds with 157 kills. The regression now asserts the actual exploit remains absent (no 187-second upgrade chain, full bank preserved behind travel), rather than requiring unchanged ordinary rewards. Independent review approved this test adjustment. The final hardened replay gives the same trajectory; the returning Travestia retains 1,456.87 of 1,906.87 HP at defeat. The replay is not a human balance test.

Proof is under `proof/combined/` and independent visual output under `proof/review/`. No real-browser, physical-touch or human balance validation is claimed.
