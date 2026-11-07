# Gem Clip

A copy control for a command or a block of text. A paper clip sits on the top edge of the block. Click it and it opens as it slides on, snaps shut on the block and holds on for as long as it says "Copied", then lets go. The inner loop of the wire goes behind the block and the outer loop stays in front, so the block looks held.

Gem is the name of the classic paper clip shape, with two loops inside each other. There is no outside reference. The drawing started as an image generated with Codex, which I redrew as two SVG paths. It is the version kept from two rounds of prototypes in this lab: first three ways to copy, then three ways for the clip to go on.

## Usage

Copy `GemClip.tsx` and `GemClip.css` into the same folder. React 19 is the only dependency.

```tsx
import { GemClip } from './GemClip'

<GemClip value="npm run dev" />

<GemClip size="lg" value={'npm install\nnpm run dev'} label="the install commands" />
```

| Prop | Values | Default |
| --- | --- | --- |
| `value` | the text to copy | required |
| `size` | `sm`, `md`, `lg` | `md` |
| `label` | names the value for screen readers | the value |
| `children` | what to show, when it differs from `value` | `value` |
| `disabled` | `boolean` | `false` |
| `onCopy` | called with the value once it is on the clipboard | |

Other native props go to the root element. The colors come from `--gem-clip-fg` and `--gem-clip-bg`, which default to `light-dark()` and follow the page's `color-scheme`.

## How it works

"Copied" counts from the click, because the clipboard can take a moment to answer. If the write fails, the note changes to "Couldn't copy". The component tries the Clipboard API first and falls back to the older copy command. A hidden status region announces the result to screen readers.

The clip moves with three small hand-written springs, with no animation library. One slides it down. One spreads it about 14% wider on the way, the way a clip opens to take the paper, then closes it with a little ring when it reaches the block. The last one pushes the edge of the block down by about a pixel at that moment and lets it come back. The clip is on in about 150 ms.

The note appears beside the clip only once the clip is on the block, so the eye stays on the clip. Letting go takes about 200 ms with no bounce, since nobody is waiting on it. A spring keeps its speed when its target changes, so clicking the clip while it lets go sends it straight back down from where it is. Copying again while it says "Copied" only keeps it there longer.

On hover, the clip leans a little toward the block, and pressing pushes it further, so it already moves the way it is about to go. Hover only exists with a real pointer, since touch fires false hovers on tap.

A copy from the keyboard puts the clip in place at once, with no animation. With `prefers-reduced-motion` turned on, the clip doesn't travel or open and the block doesn't move. Only the note fades in.
