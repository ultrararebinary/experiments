# Glossy button

A raised, glossy button. It lifts a little on hover, sinks when you press it and springs back when you let go.

Inspired by a button on [Emil Kowalski's website](https://emilkowal.ski). I rebuilt the effect from a screenshot; no code was taken from the original.

## Usage

Copy `GlossyButton.tsx` and `GlossyButton.css` into the same folder. React 19 is the only dependency.

```tsx
import { GlossyButton } from './GlossyButton'

<GlossyButton onClick={save}>Save changes</GlossyButton>

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
| `size` | `sm`, `md`, `lg` | `md` |
| `tone` | `blue`, `violet`, `green`, `neutral` | blue, or the inherited `--accent` |
| `shine` | `boolean` | `false` |
| `trailing` | any React node | none |

`--accent` can also be set on a parent element, as long as you leave `tone` out. Set `--gb-focus` to change the focus ring color.

## How it works

The CSS mixes every shade from `--accent` with `color-mix()`: the light top of the gradient, the darker rim, the shadow color and the colored glow under the button. Change one value and the whole relief follows.

The press is a small spring written in about forty lines, so there is no animation library. It writes `--gb-press`, a number between 0 and 1, and the CSS turns that into movement: the button moves down 1 to 2 px, shrinks to 97%, its shadow tightens and the face darkens. Going down uses a critically damped spring that gets there in about 0.1 s. Coming back up uses a softer one (damping 0.55, response 0.32 s), which overshoots slightly before settling.

The spring keeps its position and speed between targets. If you let go halfway through a press, the button starts back up from where it is, with the speed it had, and fast repeated clicks never make it jump. A trackpad tap can press and release within a single frame, so the button stays down for at least 70 ms. Only the animation waits; the click fires right away.

The hover lift and the longer hover shadow are plain CSS transitions on `translate` and `opacity`. They only apply on devices with a real pointer, so a tap on a phone does not leave the button stuck in its hover state.

With `prefers-reduced-motion` turned on, nothing moves. Hover brightens the highlight, a press darkens the face with a short fade, and the shine is switched off.

Keyboard presses don't animate. Enter and Space activate the button right away, and the focus ring shows where you are.
