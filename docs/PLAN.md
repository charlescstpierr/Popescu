# Toma Popescu Implementation Plan
Goal: a playable portrait mobile survival comedy faithful to approved art.
Architecture: DOM interface, deterministic canvas world, independent simulation, bounded effects, synthesized original audio. No network at runtime.
User has supplied detailed spec and authorized autonomous implementation with an independent QA role.
Tasks:
- [x] Gameplay: write simulation tests (world determinism, collisions, pauses, each upgrade, seven enemies, victory/endless); implement engine/world.
- [x] Art: coordinated animated pixel sprites, readable gas telegraphs, varied city objects, original UI icons.
- [x] Content/audio: 40+ lines, eight narrative events, twelve upgrade definitions, original menu/combat music and jingles.
- [x] Interface: menu, story, difficulty, gameplay HUD, joystick, pause/settings, upgrade cards, death/victory, persistent records.
- [x] Verify: real browser mobile portrait, keyboard and pointer paths, simulation stress, independent code QA; repair then publish private site.
Review focus: stuck input on modal/focus; narrow/short safe areas; finite memory in endless; death-victory precedence; sound unlock on mobile.

Verification limitation: the private deployed Site requires ChatGPT authentication in the control browser; local file navigation is blocked by environment policy. Renderer output visually inspected, actual Game/Renderer/Audio/UI integration tested. Native mobile geometry/touch and audible output remain unverified.

V1.3 completed: shared held-rifle pose and projectile origin, eight-direction aiming while strafing, spontaneous split and athlete jokes, original32-bar catchy battle score, male goat/rooster rivals with separate art and taunts. Goat uses a locked headbutt charge; rooster is stationary and crows an expanding annular shockwave. Core tests, actual canvas scenes, atlas decoding, standalone export and independent QA are required before publication.
