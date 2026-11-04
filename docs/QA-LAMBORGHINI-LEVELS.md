# Lamborghini: five approved ranks

Validated 2026-11-04. No external runtime packages, image assets, networking, save-schema bump or published changes added.

## Visible and mechanical progression

1. Coupé fantôme: golden three-quarter coupe, one straight pass, 72 damage.
2. Pare-chocs VIP: silver reinforced bumper, 94 damage, 22 px knockback of ordinary enemies.
3. Version large: wider fenders and actual half-height 25 instead of 18, 116 damage, 26 px knockback.
4. Retour du voiturier: rear spoiler, a 0.32 s pause at the far end, then a reversed pass. Each direction can hit an enemy once, at 82 damage per contact.
5. Convoi présidentiel: two cars staggered by 0.3 s and 8 px vertically, both returning. Each contact deals 64 damage. A durable target can take four contacts, 256 total, rather than four full-strength legacy hits.

Trips use a 960 px corridor anchored at launch and freeze their launch rank. Intervals are 8.9 / 7.8 / 6.7 / 6.5 / 7.5 seconds. Knockback respects fixed bosses and locked warnings. Two active cars maximum, including the queued escort and legacy cars. Contact particles respect the 200-particle cap. Billionaire remains exactly two salvos of three bills on the lead car only; the return does not reset them.

## Compatibility and verification

- 19 new focused tests pass: collision, width, return, large dt, convoy cap, legacy mixed cars, rank freezing, pauses, deterministic save/reload, malformed metadata, synergy, read-only rendering and warning layer order.
- Full Lamborghini candidate: 863/863 tests passed, no skips.
- Combined candidate with issue #24 recovery fix: 865/865 passed, no skips.
- Standalone export includes both new modules, boots and draws from the embedded source. Actual app-controller checks pass for five rank choice cards, five mechanical ranks, two-car cap and delayed-escort save/reload.
- Existing companion standalone checks pass: five portraits, shield/drone support, save/reload and reboot. The general combined standalone smoke passes discovery, boss, dash, pelican and Charles save/recovery checks.
- Five rank scenes captured at 390×844 in normal and reduced modes from the real renderer, plus reverse pass. No simulation-state mutation during drawing.
- Independent code and visual review passed after correcting tire occlusion, flat side shading, reverse capture and cropped convoy contact sheet. Actual final PNGs were inspected, not just source code.

## Performance scope

Native Canvas measurements for the supplied sparse scenes were about 1.7–4.0 ms/frame and 20.9 ms/frame for 300 enemies with two cars. These are development-machine samples, not browser or phone benchmarks. Actual-browser, physical touchscreen and device-level performance remain unverified. The feature is bounded to two cars, at most two bill salvos and ten internal transition iterations per update.

## Reproduce

- `npm test`
- `node scripts/inspect-lamborghini.mjs`
- `python3 scripts/export-standalone.py release/Toma_Popescu_JOUER.html`
- `node scripts/inspect-lamborghini-standalone.cjs /tmp/lamborghini-standalone.png`
- `node scripts/inspect-companion-standalone.cjs /tmp/companion-standalone.png`
- `node scripts/inspect-standalone.cjs /tmp/game-standalone.png`

The source patch excludes generated standalone HTML and the distribution manifest: regenerate these from final integrated sources. Do not replace a newer combined export with an older isolated file. Existing browser/localStorage data was not touched.
