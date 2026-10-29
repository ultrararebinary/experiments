# State

Last updated: 2026-10-29.

## Goal

A public lab of small React UI components that anyone can copy, published at https://ultrararebinary.github.io/experiments/. Decisions are in `docs/decisions.md`; repo rules in `CLAUDE.md`.

## What exists

- Gallery app (Vite 8, React 19, TypeScript 7, plain CSS) with a home grid of live previews and one page per experiment: all variants, code tabs with a copy button, README notes.
- Hash routing (`#/glossy-button`): GitHub Pages always serves `index.html`, so a direct reload of an experiment page works with no 404 trick.
- `experiments/glossy-button`: sizes `sm`/`md`/`lg`, tones `blue`/`violet`/`green`/`neutral`, any color through `--accent` (relief mixed with `color-mix()`), optional `trailing` slot, hover lift, press driven by a small hand-written spring, focus ring, disabled state, reduced motion, optional `shine`.
- GitHub Actions workflow `.github/workflows/deploy.yml` (configure-pages, upload-pages-artifact, deploy-pages) on every push to `main`.

## Key choices

- Press spring: going down is critically damped (response 0.12 s, about 0.1 s to settle); coming back up has damping 0.55 and response 0.32 s, a small overshoot. Position and velocity carry over between targets, so interrupted and rapid clicks stay continuous.
- Minimum visual press of 70 ms so an instant trackpad tap still shows. The click event is never delayed.
- Keyboard activation does not animate; the focus ring is the feedback.
- Default blue is `#1a70e6`, slightly deeper than the reference so white text reaches about 4.6:1 contrast.

## Verification (2026-10-29, local)

- `npm run build` with type check: passes.
- Browser (built-in pane, dev server): home, experiment page, copy button (clipboard matched the file byte for byte), code tabs, console with zero errors.
- Hover on all 12 size and tone pairs (translate -1.5 px, hover shadow and highlight at full opacity); real mouse clicks on all 12 (press peaks 0.85 to 0.95, overshoot about -0.1); spring sampled frame by frame for a long press, a 40 ms press, an instant press and six rapid events; focus ring by Tab; Enter fires the click without animation; disabled ignores clicks; shine sweep measured.
- Reduced motion checked by forcing the media rule and `matchMedia` in the page (the built-in browser cannot emulate the setting): no transform, the press shading fades in over 150 ms, shine hidden.
- Production build served by `vite preview` under `/experiments/`: home, card click, direct reload of `#/glossy-button`, unknown route, zero console errors, no horizontal scroll at 375 px.

## Published (2026-10-29)

- Repo https://github.com/ultrararebinary/experiments created and pushed, Pages set to the workflow source.
- First run of the deploy workflow passed (build and deploy).
- Live site checked in the built-in browser: home, live button press (peak 0.88, overshoot about -0.10), hover lift, card click, direct reload of `#/glossy-button`, copy button (clipboard matched the file), zero console errors.
- Workflow annotation to watch: GitHub runs the v4/v5 actions on Node 24 because Node 20 is deprecated. It works today; bump the action versions when new majors are out.

## Open

- Reduced motion was not tested with the real OS setting, and touch was not tested on a phone.

## Next

Start the next experiment with `NEW-EXPERIMENT.md`.
