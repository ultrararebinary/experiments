# Color picker

Three color pickers with no gradient square, no rainbow bar and no grid of swatches:

- `drift`, the default: one surface filled with the color. Drag it anywhere. Sideways changes the hue, up and down changes the tone. A flick keeps it coasting.
- `tuner`: a row of hairlines under a fixed needle, scrubbed like a radio dial. The lines near the needle grow and take their color. A dot on the needle shows the tone.
- `bloom`: a single dot. Press it, slide to a petal, let go. Pull the petal inward to lighten it, outward to darken it.

There is no outside reference. The three directions were designed for this lab and compared behind a picker.

## Usage

Copy `ColorPicker.tsx` and `ColorPicker.css` into the same folder. React 19 is the only dependency.

```tsx
import { ColorPicker } from './ColorPicker'

<ColorPicker defaultValue="#6f5bd6" onChange={setColor} />

<ColorPicker variant="tuner" size="lg" value={color} onChange={setColor} />

<ColorPicker variant="bloom" size="sm" name="accent" aria-label="Accent color" />
```

| Prop | Values | Default |
| --- | --- | --- |
| `variant` | `drift`, `tuner`, `bloom` | `drift` |
| `size` | `sm`, `md`, `lg` | `md` |
| `value` | hex string, for a controlled picker | none |
| `defaultValue` | hex string | `#1a70e6` |
| `onChange` | `(hex: string) => void` | none |
| `disabled` | `boolean` | `false` |
| `name` | adds a hidden input, for forms | none |

Other native props go to the root element. Set `--cp-focus` to change the focus ring color. Bloom's ring is positioned over the page, so leave room around the dot or its petals can reach past the edge of a clipped container.

## How it works

All three pick in OKLCH, a color space where the same lightness looks equally light whatever the hue. Yellow and blue no longer jump in brightness as you move between them, as they do in HSL. Each hue gets the most vivid chroma the screen can show at that lightness, up to a cap, and the value that comes out is a plain hex string. The conversion is about forty lines, with no color library.

The motion comes from a small hand-written spring and a frame loop. A spring keeps its position and speed when its target changes, so grabbing something mid-flight never makes it jump.

On Drift, 3 widths of dragging cover the whole hue circle and 2 heights cover black to white. The surface follows your finger 1:1, leaning and stretching a little along the direction of travel. On release it takes over the speed your finger had, then slows down exponentially. Going past black or white gives way with progressive resistance. The edges tint on hover and press, each showing the color that lies in its direction.

On Tuner, the first 4 px of a drag lock the gesture to one axis: horizontal for the hue, vertical for the tone. On release it works out where the flick would have landed, picks the nearest of 72 ticks and springs there at the speed you let go (damping 0.85, response 0.42 s). A tap sends the tapped tick to the needle the same way.

On Bloom, the ring opens on press rather than release, staggered outward from the petal closest to the current color. Petals stay at fixed angles, so after a few uses your hand knows where they are. The active petal tracks your finger along its own axis, and moving back to the center cancels with nothing changed. A plain tap leaves the ring open for clicking.

Keyboard changes never animate. On Drift and Tuner, the arrow keys change the hue and the tone, and Shift makes the steps three times larger. On Bloom, Enter or an arrow key opens the ring. Left and right move between petals, up and down change the tone, Enter confirms and Escape cancels. Screen readers get a spoken value such as "light blue, #8fb8ff".

With `prefers-reduced-motion` turned on, nothing coasts, stretches or springs. Colors and the ring still fade.

Touch input on Drift and Tuner doesn't scroll the page, since the drag needs both axes.
