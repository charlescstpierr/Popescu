# Companion combat cues — 5 November 2026

## Scope and baseline

This patch addresses only two reproducible false ambient cues documented in `QA-DIALOGUE-CONSISTENCY-2026-11-04.md`. Initial isolated regression work used the verified GitHub main source `f8d698ea4c038191ca4f24c2f855f2c71c009d22`. The final combined delivery is prepared on main `0b21a187eedf01cd44189ff9b2dc70546f93cdb9`, which includes the varied upgrade draft fix.

No authored dialogue is rewritten. All 84 ambient lines retain their exact speaker, text and order. Other orangutan banter keeps its previous eligibility. No artwork, controls, layout, balance, combat timings, save format, save keys or deployment is changed.

## Corrected conditions

- `Toma, tasse-toi. L'orang-outan prépare sa claque.` now requires a living, hostile orangutan actually in windup, targeting the player, within the existing 84 px windup approach range and the committed forward arc. A charmed, suppressed, dead, distant, already striking or retreating threat cannot supply the cue.
- `Tes PV baissent. Fais ton beau plus loin.` requires an actual health reduction after shield absorption during the preceding three simulation seconds. Health must remain above zero, below maximum and no higher than immediately after that hit. Stable low health, shield-only hits, invulnerability and subsequent healing do not qualify.
- Both still require the unlocked, available companion.

The health observation is a single transient game field, deliberately absent from serialization. Restoring a save conservatively suppresses the health cue until new health damage occurs. There is no save migration or guessed reconstruction from `lastHit`, because that existing timer also records shield-only hits. The cue clock includes the optional Charles epilogue, so leaving it cannot revive an old health observation.

## Interrupted and restored speech

Filtering the ambient pool alone is insufficient: an urgent line can interrupt a warning, leave it queued, and resume it after its context has disappeared.

The same predicate now validates these two authored lines at enqueue, while active, and before a queued line resumes. Speaker and text identify them in existing saved speech, without adding persisted fields. Invalid active cues are removed from the speech lane; the existing UI already hides speech whose active ID disappears. Other speech and authored scenes retain their existing behavior.

A still-valid slap warning survives save/restore and presentation. A resumed health warning cannot claim knowledge of health loss that was not persisted.

## Regression evidence

`tests/companion-context-barks.test.js` contains 42 tests using the real Game, damage, enemy windup, story, speech, capture and restore paths.

- The initial 27-test selection produced 17 expected failures against untouched source before implementation, including the exact distant/charmed/chase and full-health cases.
- Eleven additional tests failed against the first selection-only patch, proving obsolete active/queued warnings could reappear after interruption, mute/re-enable and save/restore.
- All 42 pass with the final implementation. Positive cases preserve valid cues and valid interrupted/resumed speech.
- The existing offline module-order test caught the new `speech → content` dependency. The export now initializes content before speech. A traversal found 45 modules, 110 imports and no cycles; content has no imports.

## Initial isolated verification

- `npm test`: **1,312 passed, zero failed, zero skipped**.
- Focused offline export, smoke, module-order and output-safety tests: **10 passed, zero failed, zero skipped**, including native Canvas execution.
- `python3 scripts/export-offline.py`: regenerated the canonical folder, launch HTML 645,666 bytes and all 32 unchanged assets.
- `python3 scripts/export-standalone.py`: regenerated the optional standalone HTML, 27,426,420 bytes.
- Regenerated offline manifest sizes and SHA-256 values verified.
- `git diff --check`: clean.
- Comparison with the untouched baseline over 3,000 update steps, three seeds and 50 simulation seconds per seed, with optional banter muted: all captured state, combat results and RNG identical after every step. This included 102 explicit damage calls alternating shielded and unshielded hits. The transient cue record does not enter snapshots.
- The save module, application UI, CSS, source HTML and source/release artwork remain byte-identical to baseline.

This is simulation and native offline execution QA, not a browser layout, touchscreen or physical-phone performance measurement. No publication or issue creation was performed. The source inventory is refreshed for the final combined delivery, retaining all entries for remote files that are not materialized locally.

## Combined delivery on main 0b21a187

- `npm test`: **1,322 passed, zero failed, zero skipped**.
- Canonical offline launch HTML: 647,559 bytes; optional standalone HTML: 27,428,313 bytes.
- The upgrade draft module remains byte-identical to main. Both export dependency constraints are preserved: content before speech, and upgrade-draft before engine.
- Publication must use the existing main tree as its base and update only the listed changed paths; absent local reference/proof files are retained, not deleted.
