# Approved gorilla accessories implementation plan

> For agentic workers: execute the isolated change, then obtain independent code and visual review.

Goal: integrate the four accessories approved from the comparative mockup, without changing bodies, mechanics, saves or other characters.
Architecture: a small pure Canvas helper owns the approved geometry and per-pose anchors. ActorArt applies it to the existing cached whole-body cells before the existing damage flash. Other variants keep their current path.
Tech stack: native ES modules and Canvas; existing Node tests and optional native Canvas QA.
Spec: the approved November 6 comparative mockup shows the broken heart front/back, green canister, cyan sports headband and attached golden shoulder pads. Four phases and front/back anchors are preserved from the mockup.

## Constraints and review focus
- No engine, app, Toma, save schema or game balance changes.
- Keep source atlas identical and use existing size, gait, mirror and cache bounds.
- Test rear jealous identity, all four phase anchors, mirrored/reduced rendering, complete damage flash and absent-image behavior.
- Test cached cells are reused and rendering does not mutate actors or state.
- Inspect static and moving combat at 320 and 390 px. Native render is not a physical-phone test.

## Task 1: integrate approved cached accessories
- Write failing output tests through ActorArt for dorsal heart, green canister, cyan band and relocated pads.
- Observe failure against main's current render.
- Add dist/gorilla-accessories.js and replace only the four variant branches in dist/actor-art.js.
- Run focused tests; compare all 32 frames with the approved mockup geometry and preserve other variants.

## Task 2: validate and publish the isolated change
- Add scripts/inspect-gorilla-accessories.mjs for actual renderer contact, movement and crowd scenes; document results in docs/QA-GORILLA-ACCESSORIES.md.
- Obtain independent visual and code review, address defects and rerun affected checks.
- Recheck remote main for concurrent restart/Toma work, rebase application changes without overwriting them, regenerate offline outputs, run npm test and export checks.
- Publish draft PR, verify exact commit/checks, mark ready and merge under approval. Verify main and coordinate deployment of the merged combined source.
