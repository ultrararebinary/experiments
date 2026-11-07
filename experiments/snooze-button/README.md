# Snooze Button

A button with two eyes at its end. They doze while nothing happens, open when your pointer comes within 120 px and follow it. Press the button and they squint. While the page waits on something, the pupils go round; when it's done, the eyes close into two smiles.

It is a simpler take on a button I saw in a short screen recording, rebuilt from watching the video frame by frame. The original changed its label from "Let's talk!" to "Get in touch", grew on hover and sat on a soft shadow. Here the label never changes, the button doesn't grow, and there is no shadow: the eyes carry the whole effect. The states were first sketched as an image generated with Codex (`docs/references/snooze-button-states.png`), then built as three prototypes. This is the one I kept.

## Usage

Copy `SnoozeButton.tsx` and `SnoozeButton.css` into the same folder. React 19 is the only dependency.

```tsx
import { SnoozeButton } from './SnoozeButton'

<SnoozeButton onClick={openContact}>Get in touch</SnoozeButton>

<SnoozeButton status={status} loadingLabel="Sending" successLabel="Sent" onClick={send}>
  Send message
</SnoozeButton>

<SnoozeButton tone="paper" aria-label="Contact" />
```

| Prop | Values | Default |
| --- | --- | --- |
| `size` | `sm`, `md`, `lg` (32, 40 and 48 px tall) | `md` |
| `tone` | `ink`, `paper` | `ink` |
| `status` | `idle`, `loading`, `success` | `idle` |
| `loadingLabel` | announced while loading | `Loading` |
| `successLabel` | announced on success | `Done` |
| `children` | the label; leave it out for eyes only, with an `aria-label` | |

It renders a real `<button type="button">` and passes every other native prop to it. Set `--accent` on it to change the fill.

## How it works

The button never changes `status` by itself, so `onClick` runs right away and your code decides when it is busy or done. While loading, it is `aria-busy` and `aria-disabled` and ignores clicks, so a form isn't sent twice, but it keeps focus. A hidden status region next to it announces the two labels.

The eyes only wake when the pointer is near, so a page with ten of these doesn't stare at you. There is one `pointermove` listener per button, and it is off while the button is scrolled out of view. Each pupil follows the pointer with two small hand-written springs, one per axis, with no overshoot. The further the pointer, the further the pupil moves, up to the edge of the eye. The springs write `transform` directly, so React doesn't render on every frame.

No lid is drawn. The white of the eye is clipped from the top with `clip-path`, and the pill shows through. The eyes open in 150 ms and close more lazily, in 240 ms. They only start to close 400 ms after the pointer leaves, so moving along the edge of the zone doesn't make them blink. A press scales the button to 0.97 in 100 ms and squints the eyes by a quarter; letting go takes 160 ms with no bounce. The press follows the pointer rather than `:active`, so Space and Enter don't animate.

From the keyboard, focus opens the eyes at once, with no transition. With `prefers-reduced-motion`, the pupils stay still, the button doesn't scale, a press darkens the fill and the eyes change with a short fade. On a phone there is no hover, so a tap opens the eyes, they look at your finger and doze off about a second later.
