# Independent graphics QA

2026-11-03. Read/test-only review; no production edits, browser or Sites access.

No blocking regression found.

| Check | Evidence |
| --- | --- |
| Gameplay regression suite | `npm test`: 23/23 pass. |
| Real renderer integration | `node scripts/inspect-graphics.mjs`: all three atlases decode; 24 nonempty atlas cells; animation changes; simulation state unchanged; terrain cache 48; approximately 4.94 ms per warm frame in this native Canvas runtime. |
| Visual review | Inspected actual 390×844 output and actor sheet. City, actor size, prop depth and collision silhouettes are coherent; gas and explosive warning remain readable. |
| Actor anchors | Read alpha bounds of every atlas cell. All 24 cells end at local y=120, matching the renderer's y=121 virtual foot baseline. No cell reaches an atlas edge. |
| Failed image loading | Rejected atlas loads resolve safely to unavailable art. Renderer still draws the vector fallback with no atlas images present. |
| Dense rendering | Real Canvas renderer averaged 10.72 ms across 20 warm frames with 210 enemies. This measures native Canvas in this environment, not mobile browser frame rate. |
| Bounded art caches | Terrain retained 48; 130 distinct building requests retained at most 96 prop images; actor frames have an explicit 144-entry cap. Combat history is replaced per frame and effects are capped at 48. |
| Offline export | Exported a temporary standalone HTML, parsed its JavaScript with `node --check`, decoded all three embedded 512×256 PNGs and verified zero relative asset references. PNG MIME is `image/png`; current temporary export is 1,328,876 bytes. |

The atlas contains four gait poses for each of two facing rows. It does not provide eight unique poses per facing; claims about animation should use that count.

Actual browser image loading, native touch, audible output and mobile performance were not verified because authenticated/private preview browser access is unavailable. The tests above do not establish those outcomes.
