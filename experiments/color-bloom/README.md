# Color Bloom

A color picker that is only a dot until you press it. Twelve petals unfurl around it, you slide to one and let go, and its color runs back into the dot. Pull the petal inward to lighten it, outward to darken it.

There is no outside reference. The idea came out of a round of prototypes in this lab.

## Usage

Copy `ColorBloom.tsx` and `ColorBloom.css` into the same folder. React 19 is the only dependency.

```tsx
import { ColorBloom } from './ColorBloom'

<ColorBloom defaultValue="#d6473f" onChange={setColor} />

<ColorBloom size="lg" value={color} onChange={setColor} name="accent" aria-label="Accent color" />
```

| Prop | Values | Default |
| --- | --- | --- |
| `size` | `sm`, `md`, `lg` | `md` |
| `value` | hex string, for a controlled picker | none |
| `defaultValue` | hex string | `#d6473f` |
| `onChange` | `(hex: string) => void` | none |
| `disabled` | `boolean` | `false` |
| `name` | adds a hidden input, for forms | none |

Other native props go to the root element. The ring is positioned over the page, so leave room around the dot, or its petals can reach past the edge of a clipped container.

## How it works

Colors are picked in OKLCH, a color space where the same lightness looks equally light whatever the hue. There are eleven hues and one gray, and the value that comes out is a plain hex string.

The ring opens on press rather than on release, so it is there before your finger moves. Each petal spirals out of the dot, starting 46 degrees behind its final angle at 30% of its size, and it leaves wearing the dot's color before turning into its own. Petals start 12 ms apart, beginning with the one closest to the current color. Selection is based on the angle of the pointer, so you never have to wait for the opening to finish.

Each petal has its own springs for radius, twist, size and opacity, which is why opening, picking and closing can interrupt each other at any moment. The petals respond to how close the pointer is, in a wave that follows it around the circle: the nearest grows and neighbors lean away to make room. The active petal tracks your finger along its own axis, and a stem joins it to the dot, which leans toward it. Going back to the center cancels with nothing changed. A plain tap leaves the ring open for clicking.

The dot keeps its old color until you let go. On release the value changes immediately, so `onChange` fires without waiting, and only the picture takes its time. The petal runs down the stem. When it arrives, the new color floods the dot from the side it came in, through a growing `clip-path` circle, while the dot gives a small kick and a ring ripples outward. The other petals retreat along the path they came out on, faster than they opened. Pressing the dot during all of this finishes the flood at once and opens the ring again from wherever the petals are.

Keyboard changes never animate. Enter or an arrow key opens the ring. Left and right move between petals, up and down change the tone, Enter confirms and Escape cancels. Screen readers get a spoken value such as "light blue, #8fb8ff".

With `prefers-reduced-motion` turned on, nothing travels. The petals fade in at their place, with no stagger, and the dot changes color directly.
