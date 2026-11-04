# Lamborghini levels implementation plan

Goal: implement the approved five-stage golden car progression without changing other powers, protagonist art, world layout or existing saves.
Architecture: a bounded per-vehicle state machine in lamborghini.js owns trips, contacts and rank definitions. lamborghini-art.js draws one rank-specific car per live vehicle. Existing vehicles without new metadata retain their legacy path. Small integrations expose rank-specific choices and preserve billionaire salvos.
Tech stack: existing ES modules, Node tests, native Canvas visual QA; no dependencies added.
Spec: approved Lamborghini planche; user response « Oui j’aime go » after five ranks, different passes and effects, visible danger zones.

- [x] Write integration tests for ranks, bump, corridor width, return, convoy cap, billionaire salvos, pause and deterministic save/resume. Run red.
- [x] Implement car rank data and bounded trips, then wire engine, rendering and rank descriptions. Run green.
- [x] Validate optional saved car data while allowing legacy cars unchanged. Test malformed state.
- [x] Capture real rank sprites and 390×844 scenes, normal and reduced. Verify renderer does not mutate state.
- [x] Run full suite, regenerate standalone and inspect it. Request independent code and visual review. Deliver patch only; no push/publication.

Review focus: an upgrade while an older car is in flight; saving on the turn or before escort launch; dt crossing both endpoints; repeated contacts in dense hordes; old saves and non-car vehicles.

Implementation balance choices: one hit per enemy per direction. Rank 4 gains two passes with 82 damage each; rank 5 two cars with two passes at 64 damage each. This avoids stacking four full-strength old rank-5 hits. Billionaire keeps exactly two three-bill salvos per activation on the lead car, with no reset at the turn. At most two cars exist, including the delayed escort. All clocks pause with the simulation.
