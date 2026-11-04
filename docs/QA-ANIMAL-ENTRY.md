# Animal entry placement and XP regression coverage

## Runtime scope

The first four scheduled animal encounters now select a clear visible peripheral position. Later arrivals keep the random outside-screen direction and use a checked incoming corridor. Counts, cadence, HP, damage, sprite cells, existing arrival fade and complete attack warnings are unchanged. Enemies remain immediately damageable.

Placement searches at most 32 directions on four rings. Initial entries require a 24px canvas inset around the existing sprite cell, at least 120px separation from the hero, foreground and crowd clearance, and a traversable approach. An impossible layout defers the due species without consuming its index. Ordinary arrival fallback remains unchanged. Before starting an attack, an animal's full cell must fit the viewport; an already-started attack is not cancelled when the camera moves.

The actual app measures visible HUD element rectangles only before a due initial attempt. This includes the joystick's current dragged position, banners, tutorial, header, powers and bottom controls. It supplies canvas-relative `{x,y,width,height}` rectangles through `setViewportOcclusions`. The engine stays DOM-free, clips/clones at most 24 rectangles, and excludes them with a 6px gap. Optional `viewport.occlusions` is saved and validated in v13. Legacy absence remains valid, exact restoration is deterministic, and resize clears stale bounds. The published v13 reader also accepts the extra viewport key.

This is initial placement, not a promise that every species stays visible to a fleeing player. Subsequent movement, attacks, obstacles and newly appearing HUD can change visibility. Full sprite-cell containment is conservative: transparent atlas padding must not be confused with the painted body. A proposed fade-window projection was rejected after 60Hz native frames showed that its motivating one-pixel edge crossing was only transparent padding. No projection or fade modification is retained.

DOM controller tests use explicit measured-rectangle fixtures. Native Canvas frames are not browser screenshots or physical-phone performance evidence. Actual browser layout and touch behavior remain separate checks.

## XP test redesign, with the natural death retained

The historical XP bug placed a large trailing physical bank in front of forward travel when automatic aim or a trailing companion pointed backwards. Its invariant is relocation without remote reward, preservation of all earned XP, and complete collection when the player physically returns. See `QA-XP-DIRECTION.md` for the original failure.

The natural seed-42 replay was previously part of the unit suite and required survival through 190 seconds. With visible encounters its upgrade choices and combat trajectory change: it dies at 180.633333 seconds from ordinary jealous contact (actor 687, 11 HP lost), before the old exploit window. The published baseline survives through 190.033333 seconds with 100 HP. This early death is retained as a real balance result, not called a passing 190-second XP replay. No health, damage, immunity or placement constant was tuned to make this one seed survive.

The original controller and assertions now live in `scripts/measure-natural-xp-run.mjs`. It runs the unmodified natural engine from `(0,0)`, moves right at 1/30s, selects the first offered upgrade and finishes dialogue. It records upgrades, damage, the bank, death and coverage. It exits with status 2 if the player dies before 190 seconds or any original assertion fails. Optional argument: another source root for a matched baseline measurement.

The replacement deterministic regression uses `tests/fixtures/xp-real-bank-139s.json`, captured from the candidate's natural run at 139.3 seconds. Its real terrain, HP, actual travel and 203-XP compact bank are preserved. Ordinary collision-aware movement crosses the 1800px relocation threshold; opposing aim establishes the historical trigger. The test requires a real relocation, preservation of all 219 XP in the field, trailing placement outside player/companion pickup reach, and no XP credit during subsequent forward movement. Collection is isolated from unrelated combat and pickups; this fixture is not a survival claim.

A negative control restores only the historical facing/companion direction and full 32-direction search in a test-local module. It places the same bank 120px ahead and reproduces remote credit, so the regression cannot pass merely by failing to exercise relocation. A positive control physically returns to the bank and receives its complete 203 XP. Existing tests also retain the complete 216-XP return and six queued upgrade choices.

## Commands and observed results

- `npm test`: 1062/1062 pass on the final HUD source and reviewed XP redesign.
- `node --test tests/animal-{entry,introduction,hud-entry}.test.js`: 87/87 pass.
- `node --test tests/xp-direction.test.js tests/xp-real-bank.test.js`: 15/15 pass, including historical-bug negative control and real-bank return.
- `node scripts/measure-natural-xp-run.mjs`: status 2, genuine death at 180.633333 seconds, incomplete 190-second coverage.
- `node scripts/measure-natural-xp-run.mjs /path/to/published/source`: status 0, alive at 190.033333 seconds for the matched published baseline.

The earlier aggregate failure and before/after natural results were preserved during review. Unit-suite success does not erase the mortality change; encounter fairness and actual painted-body visibility require their separate independent review.
