# Glossy button

A raised, glossy button in three variants:

- `key`, the default: the button has real thickness, like a keycap. Hover lifts the face off its base; a press sinks it flush into the base.
- `light`: a flat glossy face. On hover, a soft light follows the cursor and the edge closest to it lights up.
- `key-light`: the keycap with a quieter version of that light, so the two effects don't compete.

In every variant the button springs back up when you let go.

Inspired by a button on [Emil Kowalski's website](https://emilkowal.ski). I rebuilt the effect from a screenshot; no code was taken from the original.

## Usage

Copy `GlossyButton.tsx` and `GlossyButton.css` into the same folder. React 19 is the only dependency.

```tsx
import { GlossyButton } from './GlossyButton'

<GlossyButton onClick={save}>Save changes</GlossyButton>

<GlossyButton variant="light">Continue</GlossyButton>

<GlossyButton size="lg" tone="violet" shine>
  Start the tour
</GlossyButton>

<GlossyButton trailing={<><s>$40</s> $24</>}>Get the starter pack</GlossyButton>

<GlossyButton style={{ '--accent': '#e8590c' } as React.CSSProperties}>
  Send invite
</GlossyButton>
```

It renders a real `<button>` and passes every native prop through (`disabled`, `type`, `aria-*`, `onClick`, `ref`). `type` defaults to `"button"` so it never submits a form by accident.

| Prop | Values | Default |
| --- | --- | --- |
| `variant` | `key`, `light`, `key-light` | `key` |
| `size` | `sm`, `md`, `lg` | `md` |
| `tone` | `blue`, `violet`, `green`, `neutral` | blue, or the inherited `--accent` |
| `shine` | `boolean` | `false` |
| `trailing` | any React node | none |

`--accent` can also be set on a parent element, as long as you leave `tone` out. Set `--gb-focus` to change the focus ring color.

## How it works

The CSS mixes the colors of the face from `--accent` with `color-mix()`: the light top of the gradient and the darker rim. Change one value and they follow. The base and the edge under the button stay neutral, with no soft shadow, so the color stays on the button and it sits on the page without floating.

Inside the `<button>`, `.gb__face` is the part you see. The key variants put a neutral gray `.gb__base` under it, shifted down by 2 to 4 px depending on the size. That strip of base below the face is the button's thickness. On hover the face rises 1.5 to 2.5 px, so you see more of the side.

The press is a small spring written in about forty lines, so there is no animation library. It writes `--gb-press`, a number between 0 and 1, and the CSS turns that into movement. On the key variants the face slides down until it sits flush with its base. On `light` there is no base: the face moves down 1 to 2 px and shrinks to 97%. In both cases the face darkens. Going down uses a critically damped spring that gets there in about 0.1 s. Coming back up uses a softer one (damping 0.55, response 0.32 s), which overshoots slightly before settling.

The spring keeps its position and speed between targets. If you let go halfway through a press, the button starts back up from where it is, with the speed it had, and fast repeated clicks never make it jump. A trackpad tap can press and release within a single frame, so the button stays down for at least 70 ms. Only the animation waits; the click fires right away.

The cursor light is two soft white radial gradients: one on the face, and one seen only through a 1 px ring mask, which is what lights the border. They follow the mouse through two more springs, one for each axis, so the light trails the cursor a little instead of being glued to it. The light starts where the pointer enters, never sliding in from a corner, and it dims while the button is pressed. On `key-light` both are at 45% strength.

Hover effects are CSS transitions on `translate` and `opacity`, about 200 ms in and 160 ms out. They only apply on devices with a real pointer, so a tap on a phone does not leave the button stuck in its hover state. The light only follows a mouse.

With `prefers-reduced-motion` turned on, nothing moves. The face stays in place, the light appears in the middle of the face without following the cursor, a press darkens the face with a short fade, and the shine is switched off.

Keyboard presses don't animate. Enter and Space activate the button right away, and the focus ring shows where you are.
