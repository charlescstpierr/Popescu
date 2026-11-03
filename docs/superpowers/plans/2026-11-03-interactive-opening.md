# Interactive Opening Implementation Plan

> For agentic workers: execute this focused plan natively, followed by independent review.

**Goal:** Implement the approved short opening without replacing approved game art.

**Architecture:** A pure opening helper defines dialogue stages and tutorial progression. The existing dialogue controller, real renderer and atomic run store remain authoritative. The approved image is displayed with CSS framing, never regenerated.

**Tech Stack:** Native ES modules, CSS, Node test runner.

**Spec:** Approved revised four-panel storyboard, 2026-11-03; source image exec-463cf2dc-bc56-4e44-883e-1272e3809673.png.

## Global Constraints
- Isolated copy only. No publish or mutation of source candidate.
- Keep actual hero sprites, animations and game balance.
- No unapproved generated art. Crop only via CSS display.
- Existing saves must resume. New introduction progress must survive reload.

## Review Focus
- Repeated taps and keyboard activation must not launch duplicate games.
- Replay must not replace the saved run.
- Reload midway through introduction must restore the exact card.
- Tutorial waiting must not advance timer or inflict damage.
- Skipping and preferences must preserve keyboard/mobile access and reduced motion.

## Tasks
1. Add failing tests for three-card opening identity, single tutorial opponent, wait-for-movement, tutorial completion and persisted tutorial state.
2. Implement opening.js with OPENING, openingStage(lines,index), beginTutorial(game), updateTutorial(game,input), tutorialText(game).
3. Integrate opening cards with existing dialogue controller, using approved board panels via CSS. Use live renderer for street. Reuse current portrait and buttons, retain Passer/Revoir.
4. Persist optional tutorial state with strict validation; retain legacy save compatibility and test malformed states.
5. Extend app controller integration tests for intro reload, replay isolation, skip, and atomic first checkpoint.
6. Run npm test, native visual smoke, regenerate standalone artifact, verify unchanged hero asset hashes, and request independent review.
