# Five power animations implementation plan

**Goal:** Implement the five approved mockup rows in the real game, without changing gameplay or approved artwork.

**Architecture:** The engine emits capped transient visual records when a choice succeeds, a power activates, or the companion collects. A read-only PowerArt module draws short pixel effects from simulation elapsed time. Existing renderer geometry supplies the real defense perimeter, cars and strengthened bullets.

**Tech stack:** Existing JavaScript ES modules, Canvas 2D, Node tests, optional native Canvas visual QA.

**Spec:** Approved visual mockup dated 2026-11-03 for Lamborghini, Blonde IA, Mode avion, Muscles Photoshop and Vérité brute. Existing AGENTS.md art and gameplay constraints remain in force.

## Constraints

- Preserve complete character sprites, brunette companion, damage, cooldowns, collision ranges, RNG and saves.
- Truth damage is immediate; airplane is defensive. Never suggest a false travelling hit or smaller defensive radius.
- Freeze new effects on simulation pause; reduce to static compact indicators in reduced-effects mode.
- At most 16 transient records, coalesced collection feedback, no allocated particle systems or blur.
- Verify with 300 enemies and independent inspection of actual rendered scenes. Do not push or deploy this candidate.

## Work completed

- [x] Read approved mockup pixels and verify runtime baseline against exact main manifest.
- [x] Add failing tests for valid acquisitions, immediate truth, defensive airplane, real car launch, coalesced collection, caps and save/modal behavior.
- [x] Add transient engine records and verify those tests pass.
- [x] Add failing renderer tests and read-only PowerArt primitives, then integrate ground/foreground traversal, real car trails and strengthened bullets.
- [x] Capture actual gameplay render; independently review all five powers plus reduced effects and narrow viewport.
- [x] Fix duplicated airplane icons and weak truth burst with failing regression tests first; recapture and obtain independent passing review.
- [x] Compare eight seeded 300-enemy games against baseline, run full suite, regenerate standalone and run native smoke checks.
- [x] Prepare final source patch, actual render contact sheet and real-time video for review.
