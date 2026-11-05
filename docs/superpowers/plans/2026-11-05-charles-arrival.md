# Charles flight and snap implementation plan

**Goal:** Charles visibly flies into the optional final encounter, steadies himself, snaps his fingers and makes the remaining enemies disappear before dialogue and combat.

**Architecture:** Reuse the existing eight-second intro phase and its saved countdown. A shared pure arrival timeline drives the whole-body pose, short combat lock and enemy dissolve. No new persistent arrays, save version, character deformation or full-screen surface. Keep the existing transformation and attacks.

**Tech stack:** Existing ES modules, Canvas, native regression harness and generated whole-body atlas registered at 176×176.

## Constraints
- User requested autonomous completion, with no intermediate aesthetic approval.
- Separate from the held combat-legibility/building patch.
- Preserve schema v15 and exact pause/restore, survival rewards, pending trophies, ordinary combat and the approved five Charles paintings.
- Keep enemy count ≤300, effect work bounded, no new per-frame bitmap or pixel readback.
- No publishing before main-head coordination.

## Steps
1. Add red-first tests for visible enemies before the snap, no enemy harm/rewards during arrival, deferred dialogue, one snap event, exact pause/save continuation, early exit and old v15 compatibility.
2. Add one shared timeline within the existing intro. Preserve enemy records until their brief dissolve ends; clear hazards immediately and gate weapons/companions/trophy attacks during the cinematic while temporary bonuses expire normally.
3. Integrate a separate whole-body arrival atlas: flight, snap anticipation, snap release. Keep translation-only movement and the old atlas unchanged. Load safely and use the old intact body as an arrival-art failure fallback.
4. Render intro Charles above occluding scenery, with a bounded local snap glint and deterministic enemy fade; show the whole gesture below the HUD at 320×568 and 390×844. Add a short bounded snap sound.
5. Produce actual-state captures and video, repeat/save/pause tests, bounded native timing, exports and full tests. Independently review art, sequencing and interrupted flows. Explicitly separate native evidence from browser/physical-phone claims.

## Review focus
- No dialogue can preempt a fresh flight; old already-active saved dialogue remains recoverable.
- No loot, kills or trophies come from the snap, including active tarot/panache/companion powers.
- Save immediately before/after the snap neither duplicates the sound nor resurrects actors.
- Walking, pause, hidden page and early exit cannot leave a cinematic lock behind.
- Missing arrival atlas never produces detached anatomy or an invisible otherwise-loaded Charles.
