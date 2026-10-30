# Working in this repository

This is Yann's public lab of copy-paste UI components (GitHub: `ultrararebinary/experiments`, MIT). Read `docs/decisions.md` before changing anything: it records every decision made with Yann, and it wins over your own preferences. A decision changes only when Yann asks, with the date and the reason added to that file.

Talk to Yann in French. Code, comments and everything published in the repo stay in English.

## Structure

- `src/` is the gallery app (Vite, React, TypeScript, plain CSS). It discovers experiments with `import.meta.glob`; never add a hand-maintained list.
- `experiments/<name>/` holds exactly four files: `<Name>.tsx`, `<Name>.css`, `demo.tsx`, `README.md`. No fifth file, no shared helpers imported from elsewhere. A component must work after copying its `.tsx` and `.css` into another project.
- `demo.tsx` exports `meta` (`title`, `description`, `date` as `YYYY-MM-DD`), `Preview` (shown live on the home card) and a default `Demo` (every variant). Layout helpers for demos (`.demo`, `.demo__row`, `.demo__section`, `.demo__hint`) live in `src/styles.css`.
- Components render real, accessible elements, accept native props, and use no Tailwind. Motion or GSAP only if an experiment really needs it.
- `STATE.md` tracks where the project stands. Update it at each milestone.

## References

Rebuild effects yourself from an image or an observation. Never download or copy code or text from the source site. The experiment's README credits the inspiration with a link.

## Skills

For design and motion, use only `emil-design-eng` and `apple-design` (in `/Users/yann/AIOS/.agents/skills/`). Load both with the Skill tool at the start of each experiment. When they disagree, `docs/decisions.md` decides if it covers the case; otherwise choose and explain the choice to Yann. For public prose (READMEs, demo text), use `humanizer`. Do not load other design, interface, animation or writing skills (web-craft, gpt-taste, frontend-design, impeccable, ui-ux-pro-max, stop-slop).

## Before saying it's done

1. `npm run build` passes (it runs the type check first).
2. Open the gallery in the browser: home page, the experiment page, a direct reload of that page, the copy button.
3. Check every state in every variant, on both the dark and light themes: hover, press, keyboard focus (Tab), disabled, any options, and `prefers-reduced-motion`. Look at zoomed captures of the hover state, because reading computed styles can miss a visual problem. A screenshot does not prove an animation: measure transforms at several moments, and test interrupted and rapid interactions.
4. The console shows zero errors.
5. `npm run build && npm run preview` serves the build under `/experiments/`, as GitHub Pages does. Check it there too.
6. After adding or changing an experiment, run `npm run readme`: it rebuilds the previews in `docs/readme/` and the list in `README.md` from each `demo.tsx` `meta`. Look at the new pictures, and commit them with the change. The script only knows how to show a preview at rest; one that must be pressed to make sense needs an entry in `HOLD` in `scripts/readme.mjs`.
7. Nothing goes online without a push to `main`, and nothing is pushed without Yann's go-ahead.
