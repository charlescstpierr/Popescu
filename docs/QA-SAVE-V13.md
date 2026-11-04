# Save format v13: prevent old-tab Lamborghini corruption

Validated 2026-11-04 for [issue #26](https://github.com/charlescstpierr/Popescu/issues/26), based on main `da6a6ea8d519977d79cd3107ad6e1c04859476da`.

## Cause and correction

The ranked Lamborghini release added delayed escorts, turns and return trips but continued writing schema v12. The pre-Lamborghini engine `0d6e0f9` accepts those records, advances the new cars with its old generic motion, and persists impossible trip state. The new engine then rejects that record. Reproduced with both real engines and RunStore implementations: an escort moves from x=-480 to x=-450.25 in 0.05 seconds while its delay stays at 0.3 seconds.

Both the record envelope and snapshot now use v13. All supported prior schemas remain readable. v12 already has all the required data, so migration changes only its in-memory version numbers. Reading never writes to storage. A successful checkpoint changes the versions and revision while preserving the state, history, trophies, dialogue, speech and credit markers. Existing straight-moving cars remain straight-moving cars; ranked trips are not restarted or converted.

The storage key and Web Lock name remain unchanged. Previously shipped v12 readers reject v13 before a transaction can write. This includes old tabs holding an earlier revision, new readers, new-run replacement, browser-adapter writes and old writes already queued behind the v13 write.

## Verification

- 874/874 Node tests passed, no skips. Nine new regression tests cover genuine v12 records in five states, exact data preservation, atomic quota failure/retry, rejected malformed state and queued capture.
- The new tests failed against unchanged v12 with the expected 12-versus-13 assertions before the production change.
- `scripts/verify-save-compatibility.mjs` executes both unchanged published implementations. It reproduces the defect and verifies rejection of v13 by fresh, stale and queued v12 writers using Node's native Web Locks. Both old checkpoint and replacement paths leave the v13 bytes unchanged.
- Four migrated vehicle scenarios continue identically to the published Lamborghini engine through 90 full simulation updates each, including the interrupted speech state.
- Existing genuine v3, v5, v7, v8 and v11 migrations remain covered by the complete suite.
- The standalone HTML was regenerated. General and Lamborghini native Canvas/DOM-adapter smokes pass, including delayed-escort save/reload and embedded source execution.

Reproduce:

```sh
npm test
node scripts/verify-save-compatibility.mjs /path/to/0d6e0f9 /path/to/da6a6ea8
python3 scripts/export-standalone.py release/Toma_Popescu_JOUER.html
node scripts/inspect-standalone.cjs /tmp/save-v13-general.png
node scripts/inspect-lamborghini-standalone.cjs /tmp/save-v13-car.png
```

## Limits

Protection starts after the first successful v13 write, not upon read-only inspection. An old tab can still alter a v12 record before migration is committed. New code cannot replace JavaScript already running in old tabs. Close old game tabs when updating; old versions report v13 as unsupported/corrupt using their existing UI and cannot resume it.

Already-altered v12 saves are not guessed at or silently repaired. Invalid bytes remain untouched, and failed writes leave the previous record intact. Storage eviction, manual storage deletion, and separate origins/devices remain outside this fix. No player data was accessed during testing. Native Canvas/DOM-adapter checks are not real-browser or physical-mobile validation.
