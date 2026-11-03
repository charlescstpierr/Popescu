# Boss Trophies Implementation Plan

**Goal:** Implement the approved six boss trophies and exact portrait/mobile visual direction without weakening the hardened bosses or changing victory timing.

**Architecture:** `boss-trophies.js` owns fixed definitions and choice lifecycle; `trophy-effects.js` owns bounded deterministic combat effects; `trophy-art.js` renders icons and effects without mutation. `engine.js` coordinates modal priority and damage provenance. `run-save.js` migrates v8 to validated v9; DOM UI presents choices and cooldown HUD.

**Tech Stack:** Existing native ES modules, Canvas and Node tests. No dependency additions.

**Spec:** `docs/BOSS-TROPHIES-DESIGN.md` and approved PNGs in sibling `boss-reward-preview`.

## Global Constraints
- Keep existing boss health, AI, loot, RNG and 20:00 victory/infinite behavior.
- One choice per boss species, maximum three per run. Ordinary chests never offer trophies.
- Pending reward survives level menus, victory and reload without double loot or duplicate choice.
- Existing approved character art remains unchanged; reduced effects retain collision readability.
- All simulation remains DOM-independent and all rendering remains non-mutating.

## Shared Interfaces
`s.trophies = { chosen: {}, pending: [], cooldowns: {tarot:0,ascendant:0,panache:0,star:0,fanclub:0}, tarot:null, panache:null, starLife:0, feedback:null }`.
`chosen` maps boss species (`pelican`, `travestia`, `matriarch`) to trophy (`tarot`/`ascendant`, `panache`/`star`, `fanclub`/`badge`). `pending` stores unique `{bossType,chestId,bossId}`. Boss chests add `{bossType,bossId}`; legacy/ordinary chests lack both. `tarot` is `{x,y,originX,originY,dx,dy,age,hitOut:[],hitBack:[]}`. `panache` is `{x,y,dx,dy,life,hitIds:[]}`. `feedback` is null or `{id,life,amount}`. `trophyCharmLife` is optional on enemy, 0–2.5. All combat data is serialized.

`boss-trophies.js` exports TROPHIES (keyed definitions), BOSS_TROPHIES (keyed groups), createTrophyState(), hasTrophy(state,id), trophyChoices(type), chestTrophyEligible(state,chest), queueBossTrophy(game,chest), openPendingTrophy(game), chooseBossTrophy(game,id).
`Game.chooseTrophy(id)` delegates and opens the next pending choice/level safely. Mode `trophy` uses `s.trophies.pending[0]` as the current group. Event `trophy` carries bossType, event `trophy-acquired` carries definition.
`trophy-effects.js` exports updateTrophyEffects(game,dt), reduceTrophyDamage(game,value,source,context), notifyTrophyDamage(game), trophySpeedMultiplier(state). `Game.damage(value,source,context)` receives `{kind:'ordinary-contact',actorType,actorId}` only from the ordinary melee branch. Existing special calls have no ordinary context.

## Tasks
1. Write failing lifecycle tests, implement definitions/lifecycle and engine integration. Test duplicate clicks, same species, ordinary loot, simultaneous upgrade/victory/gameover.
2. Write failing deterministic combat tests, implement six bounded effects with swept tarot collision and fixed sector. Cover all excluded actor types, reductions, cooldown pause, speed recomputation and no new invulnerability.
3. Write failing save tests, implement v9 migration/validation and replay. Preserve older fixtures, reject malformed and inconsistent state, and check mid-effect equivalence.
4. Implement approved UI/icons/effects with DOM regression tests and real renders at 390×844 and 320×568, reduced effects, keyboard and repeated click flows.
5. Run full tests, four-difficulty balance comparisons, save/performance benchmarks, regenerate standalone and manifest. Request independent code and actual-image review. Do not push or publish.

## Review Focus
- Terminal event wins when chest XP and 20:00 collide; queued choice remains for endless.
- Multiple chests/species in one step cannot replace an existing level/choice or double credit after reload.
- Malformed persistence cannot invent chosen trophy pairs, unbounded hit IDs, or impossible cooldowns.
- Special attacks using source `touch` never receive Badge reduction.
- Narrow mobile content and keyboard focus stay accessible with no simulation advance while choice is open.
