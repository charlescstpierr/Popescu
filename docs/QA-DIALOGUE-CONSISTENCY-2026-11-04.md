# Dialogue consistency audit — 4 November 2026

Rapport historique du 4 novembre. La base, les nombres de tests et les tailles d’export ci-dessous décrivent ce candidat antérieur, pas la livraison courante. Voir [la validation combinée du 5 novembre](QA-PLAYTEST-INTEGRATION-2026-11-05.md) sur main `dc2519e8e5b67552ddea4a1d5e3b520de531dfc9`, après les PR #44, #45 et #46.

## Confirmed and fixed: rejected boss setup schedules an orphan answer

Affected original locations: `dist/pelican.js:65` and `dist/travestia.js:34`.

Both boss attack handlers ignored the boolean returned by the shared speech lane. When action banter was disabled, or its queue was full, the setup was not accepted but the boss still advanced its pair index and scheduled Toma's reply.

Reproduction uses real Game and captureRun/restoreRun:

1. Enable paused encounters and disable action banter.
2. Spawn either Péli or Travestia 100 px from Toma and let its first attack begin.
3. No setup is emitted, but the original game stores a pending reply.
4. Save and restore; enable action banter before the response deadline.
5. Original Péli emits only `FUCKK ! Rentre tes cartes, j'ai pas pris rendez-vous !`; original Travestia emits only `FUCKK !`.
6. A later first paused scene starts with pair 1 rather than the unseen initial pair 0.

The patch consumes a pair and schedules its answer only when either the paused scene or compact setup was accepted. The authored texts, attack phases, damage, windups, dialogue lock times and save schema remain unchanged. Previously saved pending replies are preserved as before; the fix prevents new orphan state rather than guessing whether old speech was heard.

Six regressions failed against the untouched source and pass with the fix: both bosses, save/re-enable, eventual first visible pair, and speech-queue rejection. Full `npm test`: **1,276 passed, zero failed, zero skipped**. An additional baseline comparison covered 1,000 enemy-update steps (50 simulation seconds) per boss with muted speech and compared all saved fields after excluding only the deliberately corrected pair/reply bookkeeping. Attack timings, positions, HP, RNG and speech locks were identical. The offline folder export was regenerated successfully.

## Other findings recorded during the original audit

The first two findings below were subsequently fixed by PR #45, already included in the current baseline. They are historical observations, not open defects in this integrated candidate. The third finding about explicitly dismissing a compact boss exchange is separate and is not addressed by this patch.

- `dist/content.js:1049`: `contextualBarks` includes the companion warning that the orangutan is preparing a slap when the only orangutan is charmed, in `chase`, and 1,000 px away. It checks only a live orangutan's existence. This is an inaccurate combat cue; use actual hostile windup/context before selecting that line.
- The same ambient pool includes `Tes PV baissent. Fais ton beau plus loin.` at full HP with no damage. The pool has no health condition for this line. An appropriate future fix needs a real low/recently damaged health condition, rather than rewriting the approved voice.
- After the first paused encounter has completed, subsequent Péli/Travestia exchanges remain compact. Dismissing the setup with the close control leaves the boss's delayed Toma reply scheduled. This differs from the shared stunt/rival scene behavior, which cancels the remaining exchange. A separate fix should coordinate explicit dismissal with the pending boss reply, preserving legacy save wording and combat clocks.

## Positive coverage and limits

The existing dialogue/story targeted selection passed 124 tests before any change. Paused scenes retain their actor identity on Toma replies, freeze simulation/RNG and timers, prioritize death/victory/rewards, preserve Charles's ordered pairs and companion ranks/cursors, and protect against held/double inputs and stale AUTO callbacks. The exact coq and requested Travestia/mononcle lines are unchanged.

No artwork, CSS, layout, wording, deployment or published repository was changed. This audit did not validate browser-computed layout or a physical mobile device. The existing portrait contact sheets are native Canvas diagnostics and explicitly do not constitute browser/CSS or touchscreen QA. Visual acceptance remains separate.
