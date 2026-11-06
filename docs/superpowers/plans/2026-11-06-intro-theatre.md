# Intro theatre implementation plan

Goal: Add short decorative transitions to the three opening acts without changing dialogue or controls.
Architecture: CSS-only presentation on existing opening classes. No runtime or persistence changes.
Spec: docs/INTRO-THEATRE-DESIGN.md

Constraints: preserve opening readability fix, exact speaker portraits, all dialogue text, safe-area layout, immediate input and reduced motion.
Review focus: mobile clipping, reduced motion pseudo-elements, repeat rendering, rapid skipping, scene visibility.

- [x] Add tests/opening-motion.test.js contracts for finite decorative animation, untouched text and controls, both reduced motion paths. Run red.
- [x] Add isolated opening-only CSS to dist/styles.css: golden opening, cold outage, clear street. Opacity/translation only, 520/240/320 ms maximum as specified. Run focused tests.
- [x] Verify real Chromium preview at portrait/short landscape sizes, immediate text, reduced motion and repeat flows; obtain independent review and frame timing measurement.
- [x] Run npm test, export-offline.py, and hand off additive diff without publishing.
