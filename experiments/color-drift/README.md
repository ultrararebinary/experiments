# Color Drift

A color picker with nothing on it: no gradient square, no hue bar, no swatches. The surface is the color, and you drag it. Sideways changes the hue, up and down changes the tone, and a flick keeps it coasting.

There is no outside reference. The idea came out of a round of prototypes in this lab.

## Usage

Copy `ColorDrift.tsx` and `ColorDrift.css` into the same folder. React 19 is the only dependency.

```tsx
import { ColorDrift } from './ColorDrift'

<ColorDrift defaultValue="#6f5bd6" onChange={setColor} />

<ColorDrift size="lg" value={color} onChange={setColor} name="accent" />
```

| Prop | Values | Default |
| --- | --- | --- |
| `size` | `sm`, `md`, `lg` | `md` |
| `value` | hex string, for a controlled picker | none |
| `defaultValue` | hex string | `#6f5bd6` |
| `onChange` | `(hex: string) => void` | none |
| `disabled` | `boolean` | `false` |
| `name` | adds a hidden input, for forms | none |

Other native props go to the root element. Set `--cd-focus` to change the focus ring color.

## How it works

Colors are picked in OKLCH, a color space where the same lightness looks equally light whatever the hue. Each hue gets the most vivid chroma the screen can show at that lightness, up to a cap, and the value that comes out is a plain hex string. Three widths of dragging cover the whole hue circle, and two heights cover black to white.

The motion comes from a small hand-written spring and a frame loop, with no animation library. Three things happen while you drag.

The color spreads from your finger. The exact value sits under the pointer, while the rest of the surface trails it through a spring (response 0.7 s), drawn as a radial gradient mixed in OKLab. Move fast and you can see the new color travel across the surface. After a flick, the center of the gradient runs ahead in the direction of travel, so the color keeps sweeping. Once everything has caught up, the gradient is removed and the surface is a flat color again.

The surface gives way around the point you grabbed, because that point is its `transform-origin`. The far side shears and lags behind, up to 5 degrees, and stretches along the direction of travel by up to 8%. Under your finger the springs have no bounce. On release they switch to a damping of 0.5, so a thrown surface wobbles and a surface you set down gently hardly moves. Running into black or white during a coast squashes it in proportion to the speed, and dragging past them gives way with progressive resistance.

The label sits deeper than the surface. It moves against the lean, and blurs slightly at speed.

On release, the surface takes over the speed your finger had, then slows down exponentially. Grabbing it mid-flight stops the coast right there, and the color that was still catching up carries on from where it was. The edges tint on hover and press, each showing the color that lies in its direction.

Keyboard changes never animate. The arrow keys change the hue and the tone, and Shift makes the steps three times larger. Screen readers get a spoken value such as "light blue, #8fb8ff".

With `prefers-reduced-motion` turned on, nothing coasts, stretches or spreads. The color follows the pointer directly and the layers only fade.

Touch input on the surface doesn't scroll the page, since the drag needs both axes.
