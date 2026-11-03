# XP bank relocation: movement and aim

The bank previously used the player's facing direction, which automatic fire
can replace with an enemy behind the player. The relocation would put a large
old bank ahead of a player running continuously forward. A companion behind
the player could produce the same inversion through its relative position.

The engine now retains the unit vector of the last real player displacement,
after terrain collision. Firing, idle input, blocked input, upgrade cards,
dialogues, and pause do not overwrite it. Relocation searches the trailing
half-circle and retains the old bank if no reachable candidate exists. The
corridor check, player/companion collection exclusions, drop cap, and total XP
are unchanged. A player can turn back and collect the complete bank normally.

Save version 8 persists this travel vector. Versions 1–7 migrate with an
unknown vector (0, 0), because their input and facing fields cannot establish
actual movement. Until the player moves, relocation starts on the original
bank's side. Version 7 spending, rerolls, and evolutions are preserved. The
new vector must be zero or a finite unit vector; malformed saves fail closed.

## Verification

- `npm test`: 480/480 passing.
- XP conservation and direction files: 27/27 passing.
- The new direction tests were run before implementation: 10 failures and one
  pre-existing pause behavior pass. The seed-42 replay regression also fails
  against the untouched base (level 9 instead of 3 at 190 seconds).
- Eight travel directions, backwards shooting, collision sliding, blocked
  movement, idle, companion exclusion, blocked routes, no-history fallback,
  pause/dialogue/upgrade freeze, deterministic reload, genuine version-7
  migration, malformed vectors, and terminal cap compaction are covered.
- Returning to a 216-XP bank at level 3 with 23/24 XP still grants six choices,
  reaches level 9 with 5 XP retained, and advances no simulation time while
  choosing cards.

## Unmodified-engine replay

Controller: hold right, select the first upgrade, finish dialogues. No health,
terrain, enemy, damage, or invulnerability modifications. This is an automated
replay, not a human or physical mobile playtest.

Seed 42, normal difficulty:
- Before: six upgrades at 187.3667 seconds, then victory at level 36.
- After: no upgrade at that time. At 190 seconds, level 3 with 23 XP and a
  physical 222-XP bank behind the player. The next ordinary level arrives at
  195.9 seconds; the run ends at 259.7667 seconds, level 4, 203 kills.

Seed 71 after the fix ends at 305.5333 seconds, level 5, 197 kills.

These replay outcomes isolate the directional exploit; they are not a broad
claim about difficulty balance. No rendering, art, damage, spawn, health,
reward, XP threshold, or collection-radius changes are included.
