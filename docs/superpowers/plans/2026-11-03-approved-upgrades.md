# Approved evolutions and rerolls implementation plan

**Goal:** Reconstruct the approved actual mobile panel and two bounded attacks from the verified GitHub baseline, without publishing.
**Architecture:** Keep the buildless engine and existing art. Put evolution definitions and coin-accounting helpers in evolutions.js; store run coins spent separately so lifetime earned coins equal remaining coins plus spent coins. Purchase rerolls on a detached paused state and publish it only after one atomic checkpoint succeeds.
**Spec:** User-approved actual screenshots, 2026-11-03. Car + money ranks 3 each unlock two salvos of three bills. Girlfriend + charisma ranks 3 each unlock hearts hitting at most three distinct targets. Rerolls cost 5 then 10 per level-up, max two.

- [ ] Tests: rank gates, single-choice evolutions, bounded attacks, pause, 5/10 costs, insufficient funds, reset per offer, exact cards across reload.
- [ ] Implement engine choices and bounded combat using existing sprites.
- [ ] Tests: v1-v6 migrations, v6 boss director untouched, malformed new state rejected, earned totals after spending and repeated credits.
- [ ] Implement v7 and guard boss migration at <6.
- [ ] Tests: real controller purchases, repeated click, storage failure, reload, no stale checkpoint overwrite.
- [ ] Implement responsive approved panel and atomic reroll transaction.
- [ ] Run full suite, standalone export and permitted browser/mobile QA. Obtain independent review.

Review focus: saved pending offers, cross-tab conflicts, storage quota failure, chained level-ups, live bounded attacks crossing reload.
