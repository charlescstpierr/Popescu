# Independent integration QA

Reviewed 2026-11-03. Read/test-only review of application modules; no source edits or browser use.

## Verification

- `npm test`: **23/23 passing**, including locked gas aim, all upgrade effects, companion return, explosive clouds, death before victory, endless choices and deterministic city eviction.
- Instrumented the real `Game` + `Renderer` with a Canvas 2D API recorder. All seven enemy types, five engine phase strings and eight animation frames produced **zero nonfinite numeric drawing arguments**. A 100-position travel probe retained 48 ground tiles, 52 world chunks and 126 sprite entries. This verifies API/schema behavior, not pixel appearance or browser FPS.
- Repeated the renderer probe after the latest changes with Mode avion, 65-pixel gas and 200 particles. Reduced effects changed drawing output (18,311 to 17,397 recorded API calls), with zero invalid coordinates.
- Exercised the real `AudioManager` against a WebAudio API mock: lazy creation; all twelve effect names; maximum 28 simultaneous voices after 1,000 scheduling iterations; mute clears voices; pause suspends; destruction closes and releases state. Actual audio output still needs listening.
- Executed actual `app.js` and `Game` in a Node VM with a minimal DOM/event adapter: pause clears both keyboard and pointer vectors; hidden AUTO dialogue clears its timer and resumes on return; Enter prevents native double advancement; Space retains native menu-button activation.

## Findings resolved during review

| Priority | Concrete failure | Resolution observed |
| --- | --- | --- |
| P1 | Renderer multiplied the string enemy `phase` by three, producing `NaN` gait frames and invalid sprite coordinates for normal gameplay. | Numeric gait offset fixed; actual engine state passes the drawing probe. |
| P1 | Enter on focused SUITE could advance globally and again through the native click; global Space prevention blocked ordinary menu-button activation. | Dialogue prevents its native action; movement prevention applies only in HUD. |
| P1 | AUTO dialogue timers could finish in a hidden tab and restart battle audio/gameplay. | Visibility handler clears/resumes AUTO; hidden screen transitions select paused audio. |
| P2 | HUD and compact-screen controls explicitly fell below 44 pixels; short menus used hidden overflow. | Final CSS enforces 44-pixel controls and scrollable compact menus. Browser geometry still needs checking. |
| P2 | Mode avion, Chopper and companion labels promised old mechanics or named unavailable choices. | Content now names suppression/gas immunity, a passing motorcycle and Blonde IA. |
| P2 | Reduced FX never affected canvas effects. | Renderer now reduces particles, haze, rings and scanlines. |

## Remaining review points

- The inaccurate heart synergy claim was replaced with a description of Toma’s faster fire alongside his companion’s charm.
- Final browser QA should verify 320×568, 390×844 and safe-area layouts, long upgrade descriptions, portrait art, real pointer capture/cancellation, audible jingles, and frame rate during dense play. Canvas instrumentation and mocked DOM do not establish these outcomes.

No unresolved source-level crash or simulation blocker was found after the fixes above.

## Browser attempt by owner
The private Site deployed successfully. Control-browser navigation reached its ChatGPT sign-in gate; no logged-in session was available. A local standalone HTML attempt was blocked by organization policy. No access protections were changed. Native mobile geometry, touch and audible output remain unverified.
