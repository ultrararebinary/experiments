# experiments

Small UI experiments, free to copy. Each experiment is a React component with its own CSS file. There is no package to install: open the one you like, copy its files into your project and change whatever you want.

I'm Yann, a student learning design engineering. I rebuild interface details here to understand why they feel right. You can find me on [X](https://x.com/yannworks).

Live site: https://ultrararebinary.github.io/experiments/

## Copy a component

Every experiment lives in `experiments/<name>/` and has four files:

- the component, `<Name>.tsx`
- its stylesheet, `<Name>.css`
- `demo.tsx`, the page you see on the site
- `README.md`, with usage notes and credits

To use one, copy the component and its stylesheet into the same folder of your project. Both files are also on the experiment's page, each with a copy button. They need React 19 and nothing else: no Tailwind, no animation library, no build setup beyond importing a CSS file.

## Run it locally

You need Node.js 22 or newer.

```sh
npm install
npm run dev
```

Then open http://localhost:4318/experiments/.

`npm run build` type-checks the project and builds the site into `dist/`. `npm run preview` serves that build under `/experiments/`, the same path GitHub Pages uses.

## How the site works

The gallery is a small Vite app in `src/`. It finds experiments with `import.meta.glob`, so adding a folder with a `demo.tsx` adds it to the site. Pages use hash URLs (`#/glossy-button`), which lets GitHub Pages serve every page from a single `index.html`. Each push to `main` builds and deploys the site through GitHub Actions.

## License

MIT. Credits for outside inspiration are in each experiment's README.
