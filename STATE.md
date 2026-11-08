# State

Last updated: 2026-11-08.

## Goal

A public lab of small React UI components that anyone can copy, published at https://ultrararebinary.github.io/experiments/. Decisions are in `docs/decisions.md`; repo rules in `CLAUDE.md`.

## What exists

- Gallery app (Vite 8, React 19, TypeScript 7, plain CSS) with a home grid of live previews and one page per experiment: all variants, code tabs with a copy button, README notes.
- Hash routing (`#/glossy-button`): GitHub Pages always serves `index.html`, so a direct reload of an experiment page works with no 404 trick.
- `experiments/glossy-button`: sizes `sm`/`md`/`lg`, tones `blue`/`violet`/`green`/`neutral`, any color through `--accent` (gradient and rim mixed with `color-mix()`; neutral base, one crisp edge, no soft shadow), optional `trailing` slot, three variants (`key` keycap by default, `light` with a cursor-following light, `key-light` with both and a softer light), press driven by a small hand-written spring, focus ring, disabled state, reduced motion, optional `shine`.
- `experiments/color-drift` and `experiments/color-bloom` (2026-10-30): two color pickers, each in `sm`/`md`/`lg`, picked in OKLCH, returning a hex string. They replace the three-version `color-picker` from commit 9e15c9a; Tuner and the `/prototype` picker are gone.
- Home and site redesign (2026-10-30, published): a personal note above the live components, one 640 px column, one text size, warm neutrals, Inter Variable. `src/transition.ts` handles page and theme changes with the View Transitions API.
- `experiments/shoji-bento` (2026-10-30): a bento grid made of thin lines, in three sizes of 3, 5 and 7 compartments. Drag a line and the compartments make room, with type that follows its room. It is the `seam` version kept from three prototypes; `tray` and `dive` are gone.
- `experiments/gem-clip` (2026-11-07): a copy control for a block of text. A paper clip on the top edge opens as it slides on, snaps shut on the block and holds while it says "Copied". Three sizes. Kept from two rounds of prototypes (first Lift, Clip and Tear, then the Pince, Glisse and Clac motions); the others are gone. The clip was drawn from a Codex image kept in `docs/references/gem-clip-paperclip.png`.
- `experiments/die-cut` (2026-11-07): eight die-cut stickers (laptop, headphones, notebook, light bulb, paper clip, floppy disk, assistant bubble, coffee mug) in one `DieCut` component, `sm`/`md`/`lg` or any pixel size. `tilt` leans a sticker toward the mouse; `movable` lets you pick it up, throw it and drop it inside its parent. Each drawing came from a Codex image (`docs/references/sticker-*.png`) redrawn by hand as SVG, 1.5 to 3 KB each. Kept after three prototypes (Peel, Slap, Sheet) and a rework toward the motion of Stick It Up; the others are gone.
- `experiments/snooze-button` (2026-11-07): a button with two sleepy eyes that open when the pointer comes within 120 px, follow it, squint on press, go round while `status="loading"` and smile on `status="success"`. Sizes `sm`/`md`/`lg`, tones `ink`/`paper`, `--accent`, eyes-only form. Rebuilt from a video, which stays out of the repo. Kept Ink from three prototypes (Ink, Peek, Line); its Codex states sheet is `docs/references/snooze-button-states.png`.
- `experiments/pull-tab` (2026-11-08): an accordion where each answer is a drawer that slides out from under its question. A tab hangs under each row: pull it with a mouse or pen and let go, and the speed decides open or closed. Single or `multiple`, controlled or not, three sizes, `hidden="until-found"` for find in page, no color of its own. Kept Drawer from three prototypes (Fold, Drawer, Split); its Codex board is `docs/references/pull-tab-board.png`.
- README with previews (2026-10-30): a hero picture and one picture per experiment in `docs/readme/`, in both themes, made by `npm run readme`. The list in `README.md` between the markers is generated; edit `demo.tsx` meta, not the list.
- GitHub Actions workflow `.github/workflows/deploy.yml` (configure-pages, upload-pages-artifact, deploy-pages) on every push to `main`.

## Key choices

- Press spring: going down is critically damped (response 0.12 s, about 0.1 s to settle); coming back up has damping 0.55 and response 0.32 s, a small overshoot. Position and velocity carry over between targets, so interrupted and rapid clicks stay continuous.
- Minimum visual press of 70 ms so an instant trackpad tap still shows. The click event is never delayed.
- Keyboard activation does not animate; the focus ring is the feedback.
- Default blue is `#1a70e6`, slightly deeper than the reference so white text reaches about 4.6:1 contrast.

- Variants (2026-10-29, decision logged in `docs/decisions.md`): Yann found the first hover too faint. Three directions were prototyped behind a picker; he kept the keycap and the light. `key-light` runs the light at 45% so the two effects don't crowd the button. The prototype was deleted after integration.
- Neutral base (2026-10-30, decisions logged in `docs/decisions.md`): the accent color on the shadows and on the base read as a glow, and the soft shadows made the button float. The base is now neutral gray and the soft shadows are gone.
- Light and dark site themes (2026-10-30): a toggle stores the choice; without one, the site follows the device setting.
- Stale index.html (2026-10-30): GitHub Pages lets browsers keep index.html for 10 minutes while each deploy deletes the old build's files, which gave a blank page. A script in `index.html` now refreshes the kept copy and reloads once. Tested against a local server that simulates the cache; it can't protect visitors holding a copy from before this script shipped.

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

## Verification of Color Drift and Color Bloom (2026-10-30, local)

- `npm run build` with type check: passes. Dev and production build under `/experiments/`: home cards, card click, direct reload, copy button on both (copied text matched the code shown, clipboard write intercepted), zero console errors, no horizontal scroll at 375 px.
- Color Drift, frame by frame with scripted pointer events: the ink gradient follows the pointer and is removed once settled; a grab during a coast froze the hue (80, still 80 after 250 ms); the release wobble settles in about 0.5 s, including after running into white. Keyboard changes don't animate; reduced motion forced in the page gave no transforms and no coast.
- Color Bloom, with a real held press through scripted events: petals spiral out and wear their own color within about 180 ms; the stem and the wave follow the pointer; the dot keeps its color until release, the value changes at once, the petal arrives in about 110 ms and the flood ends around 320 ms. Pressing during the flood finishes it and reopens from where the petals are. Back to the center cancels with no change. Keyboard opens, moves, confirms and cancels without animation; reduced motion forced gave fades only.
- Both themes, focus ring by Tab, disabled state.

## Verification of the redesign (2026-10-30, local)

- `npm run build` with type check: passes. Dev and production build under `/experiments/`: home, every experiment page, direct reload, unknown route, zero console errors after the rapid navigation test, copy button (clipboard matched the code shown, button width stable).
- Signature transition: paused and stepped at 40, 130 and 210 ms, home to Color Bloom. Six hash changes 16 ms apart and a longer mixed sequence: no duplicated name, the right page at the end. Stage names cleared afterwards.
- Real mouse: dragging Color Drift in its stage changes the color and opens nothing, clicking beside it opens nothing, the title opens the page. With text selected, the row opens nothing. Scroll position and focus come back on return.
- Keyboard: Tab focus ring, a recent key press skips the transition, focus moves to `main`.
- No `startViewTransition`: the page changes directly. Reduced motion forced in the page: no stage name, no rise, root crossfade only (120 ms out, 200 ms in).
- Both themes. Muted text contrast on light: 5.09:1 on the page, 4.75:1 on a stage. 320 and 375 px: no horizontal scroll after giving the preview stage narrower side padding. Font fallback: same heights, text width within 2 px.

## Verification of Shoji Bento (2026-10-30, local)

- `npm run build` with type check: passes. Production build under `/experiments/`, with real mouse, keyboard and emulated touch through the Chrome DevTools protocol, in both themes and all three sizes: home, title click, direct reload, unknown route, copy button on both files (clipboard matched the code shown), zero console errors or warnings.
- Hover leans the lines 10 px and leaving returns them to 0. A 30 px drag moved the line 30 px, with the grabbed state on. A slow release settles on the nearest twelfth without overshoot. A throw caught mid-flight stays where it was caught, with no frame moving more than 9 px. Dragging far past the limit gives about 35 px and settles back at the limit. Six rapid presses caused no jump: the speed changes by at most 12 px per frame between frames.
- Keyboard: Tab shows the ring on the line, arrows move one step with no animation, Home and End reach the limits, Enter resets. Disabled: a drag and a press change nothing, and it can't be tabbed to.
- Found and fixed during this check: at a T junction the child line sat on top of the line running through, and at 320 px the main line of the largest size couldn't move. The minimum compartment went from 64 to 56 px and the through line now wins.
- `prefers-reduced-motion` emulated in Chrome: no lean, no animated transform on the line; a drag still follows, a release goes straight to its place and a press changes at once.
- 375 and 320 px with touch emulated: no horizontal scroll, the hit area is 32 px, a touch drag moves the line and doesn't scroll the page.

## Verification of Gem Clip (2026-11-07, local)

- `npm run build` with type check: passes. Dev and production build under `/experiments/`: home, title click, direct reload, copy button (clipboard matched the code shown), zero console errors, no horizontal scroll at 320 px.
- Motion sampled with the page clock paused: the clip opens about 14% while it slides, is on in about 150 ms, closes with a ring that settles by 400 ms, and the block dips about 1.4 px. Letting go takes about 200 ms with no overshoot. Rapid clicks restart nothing; a click while it lets go grips again from where it is, at most about 3 px per frame.
- Found and fixed during this check: `npm run readme` captured empty pictures for previews below the 2000 px view (Glossy Button, now fifth). The capture now passes `captureBeyondViewport`; the unchanged previews were left as they were.
- Keyboard: Tab shows the ring, Enter puts the clip in place at once with no running animation. Disabled: default cursor, no copy. Reduced motion forced in the page: no travel, no spread, no dip, only the note fades. Both themes.

## Verification of Die Cut (2026-11-07, local)

- `npm run build` with type check: passes; the JS bundle is 494 KB (the prototypes had pushed it past the 500 KB warning). Dev and production build under `/experiments/`: home with Die Cut first, dragging a sticker on the home card moves it and opens nothing, the title opens the page, direct reload, copy button on both files (clipboard matched the code shown), zero console errors, both themes, no horizontal scroll at 375 px.
- Motion sampled with the page clock paused: pick-up pops to 1.108 then 1.10 in about 100 ms; while dragged it follows 1:1 and leans with the speed (+4° to -3.7°); let go, it keeps sliding on its momentum, takes a new resting angle and squashes to 0.985 as it lands, settled by about 450 ms. A press without moving pops up and back. Held 58 px past the parent's edge while the pointer went much further, then slid back inside with a 4 px margin. Hover leans about 10.8° toward the corner under the mouse.
- Every standalone SVG from `stickerSvg()` parses and draws on its own; no duplicate ids on the page with every sticker shown.
- Keyboard: Tab shows the ring on a movable sticker, arrows move it 8 px with no frame queued. Reduced motion forced in the page: no hover lean, no pop, no lean, no throw; it follows the pointer and stays where dropped. Decorative stickers are `aria-hidden`; one with `label` is a named image.
- vtracer was installed with `cargo install vtracer` for the SVG comparison (`cargo uninstall vtracer` removes it).

## Verification of Snooze Button (2026-11-07, local)

- `npm run build` with type check: passes, with Vite's warning that the JS bundle is now 520 KB, over its 500 KB hint. Production build under `/experiments/`: home with Snooze Button first, title click, direct reload, unknown route, copy button (clipboard matched `SnoozeButton.tsx` byte for byte), no horizontal scroll at 320 px, zero console errors.
- Motion measured in headless Chrome with a real mouse, sampled frame by frame: the eye opens in about 130 ms and the pupils settle in about 0.2 s without overshoot. The eyes start closing about 415 ms after the pointer leaves and are shut 250 ms later; coming back within that delay keeps them open. Press reaches 0.97 in about 50 ms with a quarter squint; release is back in about 140 ms. Six rapid clicks: at most 0.018 of scale per frame.
- Keyboard: Tab opens the eyes with no transition, Enter animates nothing. Loading: `aria-busy`, `aria-disabled`, "Sending" then "Sent" in the status region, a second click ignored, pupils going round. Disabled: eyes shut, default cursor. Reduced motion emulated in Chrome: no tracking, no scale, the press darkens the fill. Touch emulated: the eyes open on the tap and close about 1 s later.
- Both site themes and both tones checked on 3x captures. Found and fixed during the prototype: a white hairline around the half-closed eye (now the white is clipped instead of covered), white eyes lost on the pale pill (now a thin edge), and a dashed line on the disabled Peek.

## Verification of Pull Tab (2026-11-08, local)

- `npm run build` with type check: passes, with Vite's 500 KB warning (the JS bundle is now 551 KB, from 520). Dev and production build under `/experiments/`: home with Pull Tab first, title click, direct reload, copy button (clipboard matched the code shown), no horizontal scroll at 320 px, zero console errors on the production build.
- Motion measured in the built-in browser, frame by frame: opening reaches 95% in about 340 ms, closing in about 230 ms. A click that reverses an opening after 90 ms, then reopens it 60 ms later, and six clicks 30 ms apart: the height never jumps more than 7 px per frame.
- Tab, with scripted pointer events and one real mouse drag: a 24 px flick opens, a 30 px flick up closes, a slow 20 px pull closes. Past the full height it resists and comes back.
- Real keyboard: arrows, Home and End move between questions, Enter and Space open at once with no motion, focus ring visible. Disabled row: no opening, no tab. Whole accordion disabled.
- Reduced motion forced in the page: no motion, 150 ms fade. The `beforematch` event (fired by hand) opens the right row. Both themes, hover zoomed: the tab peeks out 4 px.
- Found and fixed during the prototype: `setPointerCapture` threw on a pointer that was already gone; the page's `h3` style leaked into the questions; the focus ring touched the text.

## Published (2026-11-08)

- Pull Tab pushed (1840aa4) and live within about a minute. Checked on the live site: the experiment page with its 22 rows, a click that opens a row to its full height, zero console errors. The workflow run itself was not read.

## Published (2026-11-07)

- Snooze Button pushed (4b6f76b) and live within about 30 s. Checked on the live site: home with Snooze Button first, the experiment page with its 13 buttons, eyes at rest far from the pointer and open near it, zero console errors.

- Gem Clip pushed (8ddfd61) and live about 30 s later. Checked on the live site: home with Gem Clip first and Shoji Bento showing 5, the experiment page, a click that copies the right text with the same motion values as local, zero console errors. `gh` is not signed in on this machine, so the workflow run itself was not read; the live bundle was checked instead.

## Open

- Reduced motion was not tested with the real OS setting, and touch was not tested on a phone. This applies to all the experiments and to the site. Motion was measured with scripted pointer events and paused frames; how it feels by hand is for Yann to judge, ideally again the next day.
- Not tested: the iOS swipe back, Alt+Left (the built-in browser doesn't send it), the press scale at normal speed (an instant synthetic click doesn't show it), the transition in Safari and Firefox.
- The JS bundle crossed Vite's 500 KB hint with Snooze Button (520 KB) and is 551 KB with Pull Tab. It still builds; code splitting per experiment would bring it back down.
- Pull Tab: real find in page (Cmd+F) not tested, only the event it sends; the tab drag not felt by hand on a trackpad; no phone, Safari or Firefox test.
- Snooze Button: the reduced-motion fade and the feel by hand were not measured; no phone, Safari or Firefox test.
- The first deploy after this change fills in `og.png` at its public address. Check the X preview then.

## Next

Start the next experiment with `NEW-EXPERIMENT.md`. With `/prototype`, stop at the picker: see `CLAUDE.md`.
