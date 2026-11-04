# Charles Epilogue Implementation Plan

**Goal:** Add the user-approved invincible Charles and his transformation without taking away the 20-minute survival win.
**Architecture:** A separate optional, deterministic epilogue simulation branches from victory. Existing weapons can strike Charles but never damage him; eighteen registered hits trigger the four-stage transformation. Full-body illustrated art is independent from collision geometry. Save validation persists the exact timeline and bounded destroyed scenery.
**Tech Stack:** Existing native JavaScript modules and Canvas, Node tests, native Canvas verification.
**Spec:** Approved Charles illustration and transformation storyboard; user instructed “Oui ont fait ca let’s go”.

## Constraints
- No forced epilogue or replacement of the survival win; clear one-hit warning before entry.
- Existing endless, rewards, controls and Toma full-body atlas preserved.
- Warning geometry remains identical with reduced effects, no flashing/full-screen whiteouts.
- No push or deployment before actual in-game art is reviewed.

## Review Focus
- Reload in every transformation and attack phase must not restart the warning or create damage early.
- Exit/death cannot reduce survival records, duplicate rewards or accidentally enter endless.
- A warning must leave enough space and time to avoid lethal active geometry.
- Save validation rejects invented epilogues, impossible timers, extra destroyed scenery and prior-version smuggling.
- Rendering cannot mutate simulation; particle counts and destroyed props stay bounded.

## Tasks
- [x] Add tests for opt-in lifecycle, invulnerability, finite attacks, transformation order, swept collision and save migration.
- [x] Implement charles.js state machine and scoped engine hooks, preserving ordinary runs.
- [x] Implement whole-body art and pure warning/debris render modules; inspect actual pixels.
- [x] Add victory confirmation, pause exit and persistent boss HUD with UI tests.
- [x] Validate saves, regenerate standalone and run full regression suite.
- [x] Render actual mobile scenes and animated transformation; request independent source/visual review.
