# Independent content update QA

Read/test-only review of final gameplay, city art, orangutan v3 atlas and standalone export. No production source edits or browser/Sites access.

No blocking regression found.

| Check | Result |
| --- | --- |
| Full regression suite | `npm test`: 31/31 pass. |
| Orangutan anatomy | Viewed actual `orangutan-walk-v3.png` and final 390×844 scene. Long slender drooping arms, short legs, sloped narrow shoulders, round belly and a small dark face with pursed mouth make it clearly distinct from the broad, toothy gorilla. |
| Attack geometry | Warning and damage share reach 73 and half-angle `acos(.55)`. Independent boundary cases: radius 72 hits, 74 misses; 56 degrees hits, 57 misses; side/back miss. Direction stays committed during the 0.6-second warning. |
| Increased visible pressure | Real auto-fire with automatic upgrade choices and a stationary high-HP observer produced 9 visible enemies at 8 seconds, 17 at 12, 24 at 20 and 20 at 30. Orangutans were visibly present by 12 seconds. High HP was used only to observe the whole opening. |
| Offscreen packs | Independent 800 seed/viewport cases found zero spawned bodies intersecting the viewport. Viewports included 390×844, 320×568, 460×320 and 800×400. |
| Added city elements | 750 chunks across 30 seeds contain 11–14 added props each, average 12.44. All twelve new types appear; no new solid objects or footprint overlaps with existing props were found. Actual expanded district art remains readable with open crossroads. |
| Real graphics integration | Final `inspect-graphics.mjs`: four atlases decoded, 32 nonempty cells, animation changes and simulation unchanged; terrain cache 48, actor cache 31, approximately 7.17 ms per warm frame in native Canvas. |
| Anchors and fallback | All 32 cells end at local y=120, matching the registered ground baseline. Removing only the orangutan image draws its orange vector fallback while other species retain raster art. |
| Art bounds and caches | All 60 new prop/type variants fit their cached image bounds without opaque edge pixels. 200 distinct building requests retain at most 96 prop images; terrain and actor caches retain their explicit caps. |
| Standalone export | Final temporary export is 1,579,584 bytes. Its JavaScript parses with `node --check`; four embedded 512×256 PNGs decode with correct MIME; no relative assets or old orangutan-v2 reference remain. |
| Narrative/UI | Four new prop events are connected to actual prop IDs. Live HUD, pause and result counters use the broader “singes” label. |

Minor cosmetic observation: the full-resolution orangutan sheet has a few bright red edge speckles in its fur outline. It remains anatomically clear and readable at the final game scale.

Native Canvas timing does not establish mobile browser frame rate. Authenticated/private browser access remains unavailable; no bypass was attempted.
