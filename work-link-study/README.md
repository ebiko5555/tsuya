# TSUYA — work / nail relationship study

Isolated exploratory page based on commit `0e1c3f9d17c877e7d857d719fe6ccb5b558f6634`.
No production page or artwork asset has been changed. This folder belongs beside
`experience-prototype/`, whose existing film, image and navigation assets it references.

## Implemented
- Numbered palette / nail buttons highlight each other, including touch and keyboard.
- Colours and looks come from the selected artwork's existing five-nail preset.
- These are conceptual palette/texture correspondences, **not sampled film coordinates**.
- SHORT/LONG switches the artwork area to a labelled illustrative hand preview.
  The original media remains unchanged; an explicit button returns to it.
- The preview reuses the existing nail renderer and preset variables without modifying
  the live camera tracking state. Length is schematic, not a physical measurement.
- One subtle palette motion per visit; skipped with reduced-motion preference.
- Explicit separate artwork try-on / photo-create entries.

## Verification

Run `node --test work-link-study/test*.cjs` (18 checks).
The selection regression exercises focus, blur, mouse hover and click: only activation changes aria-pressed.
Desktop Chrome and 390×844 viewport checks cover keyboard selection, SHORT/LONG previews and return to artwork. Routing checks cover COLOR/SURFACE, both lengths and large-access routes.
Reduced-motion animation suppression is covered by automated checks. Real iPhone Safari, camera permissions/tracking and browser reduced-motion emulation remain unverified.

This directory is an independent study and does not replace the production page.
