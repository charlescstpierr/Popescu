# Genuine published v12 save records

Generated on 2026-11-04 using the unchanged `Game`, speech helpers and `RunStore` from these published commits:

- `runstore-v12-legacy.json`: `0d6e0f99214a5024bbe926707fad209a1d520d33`, before ranked Lamborghini trips.
- `runstore-v12-delay.json`, `runstore-v12-turn.json`, `runstore-v12-return.json`, `runstore-v12-dialogue.json`: `da6a6ea8d519977d79cd3107ad6e1c04859476da`, the original Lamborghini release, also schema v12.

All 65 and 67 distribution files respectively were verified against their GitHub blob hashes before generation. These are complete records written by the historical implementations, not current snapshots with a changed version field. The trailing newline is fixture formatting only.

Each record includes prior victory history, totals and already-credited counters, two additional uncredited kills and one coin, a trophy, the companion, Billionaire, and an interrupted two-line speech scene. Cars preserve the old straight trajectory, escort delay, turn, or return. The dialogue fixture also retains the modal's second-line cursor. No user save data is included.

Reproduce from two unchanged checkouts, in chronological order:

```sh
node scripts/generate-v12-save-fixtures.mjs /path/to/0d6e0f9 /path/to/da6a6ea8
node --test tests/runstore-v12.test.js
node scripts/verify-save-compatibility.mjs /path/to/0d6e0f9 /path/to/da6a6ea8
```

The verifier first reproduces the old corruption, then tests the new format against both historical readers and writers, including writers already waiting for the native Web Lock. Use Node 24 with Web Locks for this cross-build script. The normal test suite has no external dependencies.
