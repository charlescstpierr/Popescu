# Real v14 compatibility fixtures

Captured from the unmodified pending paused-boss-dialogue candidate copied to `popescu-four-beasts-2052`, before the new animal implementation, on 2026-11-04.

- `run-save-v14-source.txt` preserves the exact v14 reader bytes, SHA-256 `078078456c301930e323b65596e080340b850bb4cfec3bd271ce2685e13590e6`.
- Producer `dist/engine.js` SHA-256: `41f263490abcbec53583397d186f3cc3d8cb83a940a396ff3ac71e6fbba12a69`.
- `paused-v14-travestia.json` SHA-256: `a2d2e827a8de9541161e2b672afc08c001a96b050d13192d7a72bfa4c5a16a52`. Created with the real v14 Game and captureRun: seed 152, paused encounters enabled, elapsed 112, kills 14, coins 31; spawn Travestia at (100,0), set cooldown 0, updateEnemies(.01), openEncounterDialogue(), advanceEncounterDialogue('boss:travestia',0). It preserves the active reply at cursor 1.

Older fixtures are unchanged. Migration assertions remove only newly introduced schema fields before comparing all old state; no progress or dialogue fields are regenerated.
