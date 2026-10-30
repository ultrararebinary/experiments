# Shoji Bento

A bento grid with no cards: one rectangle, some thin lines, and one filled compartment. Like the panels of a shoji, the Japanese sliding screen, the lines are what moves. Drag one and the compartments on both sides make room, while their type grows and shrinks to fit.

There is no outside reference. It is the version kept from a round of three prototypes in this lab.

## Usage

Copy `ShojiBento.tsx` and `ShojiBento.css` into the same folder. React 19 is the only dependency.

```tsx
import { ShojiBento } from './ShojiBento'

const items = [
  { id: 'files', label: 'Files to copy', value: '2', detail: 'One .tsx and one .css.' },
  { id: 'license', label: 'License', value: 'MIT', solid: true },
  { id: 'packages', label: 'Packages to install', value: '0' },
]

<ShojiBento size="sm" items={items} />
```

| Prop | Values | Default |
| --- | --- | --- |
| `size` | `sm` (3 compartments), `md` (5), `lg` (7) | `md` |
| `items` | `{ id, label, value, detail?, solid? }[]` | required |
| `disabled` | `boolean` | `false` |

Other native props go to the root element. The arrangements are in the `LAYOUTS` constant at the top of the `.tsx`, in grid units, and they must be divisible by straight cuts. Set `--shoji-fg` and `--shoji-bg` to change the colors. They default to `light-dark()`, so they follow the page's `color-scheme`.

## How it works

The motion comes from a small hand-written spring, with no animation library. A spring keeps its speed when its target changes, so a line can be caught and redirected at any moment.

Straight cuts turn the layout into a tree, so each line only divides the part of the rectangle its parent gave it. Dragging a line follows the pointer exactly, from the point you grabbed. Past the minimum size it gives way with growing resistance. On release it takes over the speed of your hand, projects where that speed would end up, and settles on the nearest twelfth of its length. Only a throw overshoots.

Each compartment is a size container, and the value is sized in container units, which is what makes the type follow its room. The detail text appears once there is space for it. Layout runs on each frame of a drag, which is fine at this scale but wouldn't be for a hundred compartments.

On hover, the lines lean about 10 px to give that compartment some room. Pressing a compartment gives it 70% of the room it could take, and pressing again gives it back.

The lines are separators for keyboards and screen readers. The arrow keys move a line by one step without animating, Home and End go to its limits, and Enter resets it.

With `prefers-reduced-motion` turned on, nothing leans or bounces. Dragging still follows the pointer, since that is your own movement. A released line goes straight to its place, and a pressed compartment takes its room at once with a short fade.

The springs run longer than the 300 ms usually asked of interface animation, because they can always be interrupted and they block nothing while they run.
