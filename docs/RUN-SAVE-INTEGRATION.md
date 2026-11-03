# Save/resume and combined candidate

Integrated after Charles approved the Resume menu. This isolated candidate combines the finalized forest/discovery work, progression/restart corrections, and save/resume. It has not been published.

## User behavior

- The menu shows a saved-run card with time, level, difficulty and Resume. The original artwork/palette remain. Saved-run difficulty is preserved; the existing difficulty selector stays visible for New Game and never changes the saved run’s difficulty.
- Resume loads the exact engine state into the existing pause screen. The player must choose Resume before the simulation or a pending dialogue/upgrade continues. Dialogue index, upgrade choices and victory-to-endless state survive reload.
- A new game/restart asks a native confirmation before replacing a living saved run. Cancel leaves the run intact. Starting again credits the old run and replaces it in one atomic storage write, including when starting from a fresh page load with no live Game object.
- Autosave runs every five seconds of active play and after safe state transitions. Upgrade/dialogue events set a pending flag; snapshots are taken after the full engine update, so consumed XP cannot reappear. Visibility-hidden and pagehide attempt a final flush. Browser shutdown can prevent an asynchronous final write, so the periodic checkpoint remains essential.
- Unavailable storage, quota failures or cross-tab conflicts use the existing toast. New-game save failure offers explicit unsaved play; the prior checkpoint is not erased. Without Web Locks, persistence fails closed rather than pretending to be safe across tabs. Unsaved play cannot guarantee persisted run or records.

## Data integrity

- Versioned, bounded JSON preserves RNG streams, timers, active entities, hit-ID Sets, pending speech, event history, companion and modal metadata. World chunks regenerate from seed and position; audio/render/input are not serialized.
- Discovery cooldown Maps, contact latch, active effect/duration and nearby site survive save/restore. A reloaded player cannot reactivate a spent site simply by remaining in place. Discovery schema rejects unknown effects and impossible durations.
- Derived stats are recomputed. Required entity fields, gas direction during attacks, bounded physical magnitudes, integer speech counters and IDs are validated before simulation. Corrupt/future-version records are never silently erased.
- Snapshot capture applies the engine's usual array-cap policy to the detached state, covering terminal events that return before the live engine's cap pass.
- A single localStorage record holds the run, lifetime totals and credited run counters. Repeated result screens, reload, restart and endless continuation credit only the delta. Replacement is atomic with the old run's credit; a failed write preserves both its snapshot and old credit markers.
- Web Locks serialize writes; optimistic revisions detect stale tabs and remain latched until explicit reload. Checkpoints freeze request-time state before awaiting locks. Late writes from replaced in-memory games cannot update the new game's UI/save status.
- Existing preferences remain under their original key; once a run record exists its totals are authoritative. Browser eviction/clearing and different origins/devices do not share saves.

## Verification and limitations

The combined suite currently passes 160/160 Node tests. It includes real-controller tests for replacement/cancellation, record deduplication, modal recovery, safe-boundary autosave and pagehide, plus discovery-effect/cooldown/contact recovery and deterministic continuation. A 500-second real-engine save stress test passes.

The regenerated standalone HTML executes with embedded art decoded through a native Canvas + DOM adapter: boot, start, discovery activation/HUD, read-only rendering, pause/resume and save/restore of discovery state pass. This is not an actual browser or physical-mobile test.

Local Chromium launch is blocked by socket creation restrictions, including after an approved escalation. Actual CSS layout, browser-storage lifecycle, touch controls and iPhone/Android behavior still need browser/device QA. The approved PNG is a static mockup, not a screenshot.


## Separate Travestia merge

The stable no-boss candidate is retained unchanged in its own copy. This candidate adds the independently reviewed whole-body Travestia art and boss behavior. The three-way merge preserved world discoveries, progression fixes, saved-run UI, lifecycle boundaries and atomic record accounting.

Snapshot version 2 includes explicit validation of boss phases, remaining times, locked direction, hit-once flags, pending reply, taunt counter, warning duration and walk state. Version-1 snapshots migrate the missing spawn timer to 240 seconds and add only the new common non-boss fields; they never fabricate partial boss attack state. Cooldowns and discovery contact survive migration.

Ten added regressions cover warning/reply restoration, spin without repeat damage, harmless recovery, charm/Mode avion cancellation including changes made late in a simulation step, pause/walk/spawn state, invalid boss state, older-save migration and a missing announced-reply flag. Native standalone smoke now also decodes the embedded boss atlas, renders the boss and restores an actual warning.
