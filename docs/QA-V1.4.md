# Independent v1.4 QA

Final read/test-only review of the approved Toma model, shared firing geometry, portraits, crow reaction and exported application. No production or test edits. **No unresolved blocker found.**

## Approved character and animation

- Viewed the approved source, new directional paintings, final native eight-direction/strafe/split sheet and actual 390×844 game scene. Toma retains the approved visible balding, sunglasses, beard, dark leather/purple-gold palette and held rifle. Both hands and the weapon remain one painted upper-body unit; no separate floating fists or second rifle appear.
- Compared the rendered upper layer across normal, split entry, full split and recovery. After aligning the translated hip, its pixel output is identical in all **eight directions**: the lower-body transition does not resize or distort the head, arms or rifle.
- Full split uses the approved painted lower body. The final contact sheet shows connected hips, extended legs and consistent character scale. Native fallback sheet remains visually coherent.
- Rejected all hero image loads and rendered eight directions through the fallback path. Each produced visible complete approved upper-body pixels and left input state unchanged.

## Geometry and regression verification

- **76/76 tests pass**, including the analytical aim solver, actual projectile seams, point-blank handling, single painted upper-body path, fallback, split timing and previous gameplay/audio/world checks.
- Ran an independent **14,400-case end-to-end grid** through actual `Game.weapons()` and `computeHeroPose()`: every half-degree, target radii 80/95/180/350/600, normal plus split entry/full/recovery. Maximum projectile-origin error from the painted muzzle was **0 pixels**. Minimum normalized barrel/projectile dot product was **0.9999999999999996**.
- The earlier four-pass solver's view-seam mismatch is resolved by the final analytical solver with a locked illustrated view. The 80-pixel floating-point boundary is included in the independent grid.
- Ran both actual native Canvas inspection scripts. All six actor atlases / 48 cells and approved hero assets decode; animation changes; rendering leaves simulation state unchanged. Terrain cache remains 48, actor cache 27. This run averaged **8.06 ms per warm native Canvas frame**, which is not a mobile browser FPS claim.

## Final standalone and UI

Tested the actual final `Toma_Popescu_JOUER.html`, **2,924,231 bytes**, rather than only a source-only preview:

- Extracted JavaScript parses with `node --check`. Module order includes hero-model → hero-pose → engine, with hero-art before renderer. Import-meta URLs are rewritten, assets are embedded, and PNG/SVG signatures and MIME are correct.
- Executed the complete exported application in a Node VM using real native Canvas/Image implementations plus DOM/WebAudio adapters. Embedded SVG portrait decodes; a real application frame renders without changing simulation state.
- Upgrade/dialogue music cursor preservation and ducking, pause/resume, hidden upgrade restoration, rival portrait canvases and the approved Toma SVG portrait route all pass.
- Triggered an actual rooster crow through the exported game's engine. The UI receives the exact Toma line **“Men, farmes ta criss de gueule !”**. Tests also verify post-warning timing, simultaneous-crow coalescing, delayed competing replies and no reaction to a cancelled crow. This is in-game text; no spoken TTS is claimed.

Actual browser touch, browser decoding, speaker output and device performance remain unverified because the existing native-browser authentication/policy limit remains in place. No bypass was attempted.
