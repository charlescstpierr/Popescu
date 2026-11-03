# Independent v1.3 QA

Final read/test-only review. No production or test edits. No blocking regression found.

## Verified results

- **64/64 tests pass** with the final source files, including hero-pose contacts, shared muzzle origins, stable strafe aim, split lifecycle, rival timing, swept shockwave evasion, audio lifecycle and existing gameplay/world checks.
- Ran both `scripts/inspect-graphics.mjs` and `scripts/inspect-hero.mjs` against actual native Canvas. Six atlases / 48 cells decode, modular Toma draws, animation changes and simulation state remains unchanged. Terrain cache stays at 48, actor cache at 27. This independent graphics run averaged **7.8 ms per warm frame** in native Canvas; this is not mobile browser FPS.
- Viewed the resulting eight-direction strafe and split contact sheet. Both hands remain attached to the rifle; the barrel follows the aimed direction while the legs move independently; full splits extend both legs and lower the held weapon with the torso.
- Viewed the actual rival attack sheet. Goat windup lane and lowered-horn charge are distinct from the rooster's stationary warning, COCORICO cue and hollow expanding ring. Source/test review confirms no rooster dash, bounded ring lifetime, one hit per actor, relative swept-annulus evasion, pause freeze and charm/Mode avion cancellation.
- Reviewed male-only taunt selection and the portrait route for COQ RIVAL / BOUC RIVAL. The new canvas portrait route displays the rival instead of Toma and returns to the ordinary image route for Toma.

## Standalone execution and UI/audio integration

Exported a temporary **2,136,921-byte** standalone HTML. Its extracted script passes `node --check`; module order places hero-pose before engine and hero-art before renderer; the import-meta asset URL is rewritten; all assets are embedded. All six 512×256 atlas PNGs and the 256×256 torso PNG have valid PNG signatures and MIME.

Executed the actual exported application, engine, renderer and AudioManager in a Node VM with a minimal DOM, WebAudio adapter and real native Canvas/Image implementations. Embedded hero and rival images decoded, and the standalone rendered a real Canvas frame. The execution verified:

- Upgrade and in-game dialogue keep the battle music cursor while ducking it; returning to play removes ducking.
- Pause suspends the audio context without resetting the battle cursor; resume restores battle playback.
- Hiding an upgrade screen pauses audio; returning restores the ducked battle state.
- Returning to the menu selects menu music and clears ducking.
- Rival portrait canvases and ordinary Toma portraits switch correctly.

The audio suite additionally checks the 150-BPM, 32-bar battle arrangement, distinct slower menu arrangement, four-syllable rooster cue, voice limits, SFX priority/throttling and finite unclipped audition PCM.

Actual browser touch input, browser image decoding, speaker output and device performance remain unverified because native browser testing is blocked by the existing authentication/policy limit. No bypass was attempted.
