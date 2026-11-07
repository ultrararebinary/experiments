# Die Cut

Eight stickers to put in an interface where you would use a flat icon: an empty state, a card, a row in a list. Each one has the white cut-out border of a real vinyl sticker. Pick one up and throw it, and it keeps the speed of your hand, leans the way it goes and lands with a small pop.

The set is a laptop, headphones, a notebook, a light bulb, a paper clip, a floppy disk, a coffee mug and an assistant bubble. There are no real logos: the laptop lid only has a lightning badge, and the assistant is a chat bubble with a white twinkle. Each sticker started as an image generated with Codex, which I redrew by hand as SVG. The drawings sit in `DieCut.tsx` itself, between 1.5 and 3 KB each.

The way the stickers move came from [Stick It Up](https://x.com/samirande_/status/2119023597406568742) by Sam, a sticker library whose stickers you can drag, tilt and pop. The drawings and the code here are my own.

## Usage

Copy `DieCut.tsx` and `DieCut.css` into the same folder. React 19 is the only dependency.

```tsx
import { DieCut } from './DieCut'

<DieCut name="coffee" />

<DieCut name="notebook" size="lg" tilt />

<div style={{ position: 'relative', height: 320 }}>
  <DieCut name="laptop" movable angle={-6} style={{ position: 'absolute', left: 24, top: 40 }} />
</div>
```

| Prop | Values | Default |
| --- | --- | --- |
| `name` | `laptop`, `headphones`, `notebook`, `lightbulb`, `paperclip`, `floppy`, `assistant`, `coffee` | required |
| `size` | `sm` (48px), `md` (80px), `lg` (128px) or a number of pixels | `md` |
| `label` | names the sticker for screen readers | none |
| `angle` | resting angle in degrees | `0` |
| `tilt` | leans toward the mouse in 3D on hover | `false` |
| `movable` | can be picked up and thrown inside its parent; includes `tilt` | `false` |

Other SVG props go to the `<svg>` element. Without a `label`, a sticker is decoration and screen readers skip it. Give it one when the sticker is the only thing saying what something is.

`stickerSvg(name)` returns a standalone SVG file for a sticker, to paste into Figma or save to disk. `stickerJsx(name)` returns the JSX line. Below 48px the white border turns to mush, so there is no smaller size.

## How it moves

A movable sticker stays inside its parent element. It grows to 110% when you pick it up, with a slight overshoot, and stops leaning toward the pointer. While you drag it, it follows the pointer exactly and leans up to 14° the way it is moving. Past the edge of the parent it follows less and less, then slides back when you let go.

When you let go, it keeps the pointer's speed and slides to where that speed would carry it, using the decay Apple uses for scrolling. It settles at a slightly different angle each time, and shrinks back to its size as it arrives, with a short squash. Pressing without moving pops it up and back down in place. All of this runs on small hand-written springs, with no animation library, so a sticker you catch mid-flight continues from where it is.

`tilt` leans the sticker up to 12° toward the mouse. It only reacts to a real mouse, since touch fires false hovers on tap.

When a movable sticker has keyboard focus, the arrow keys move it 8px at a time (32px with Shift), with no animation. With `prefers-reduced-motion` turned on, there is no tilt, pop, lean or throw: the sticker follows the pointer and stays where you drop it.

Every sticker on a page gets its own gradient ids from `useId`, so two coffee mugs never share or break each other's gradients.
