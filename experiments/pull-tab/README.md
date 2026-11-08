# Pull Tab

An accordion where each question is the front of a shallow drawer. Click a question and its answer slides out from under it, pushing the questions below. A small tab hangs under each row. Pull it with the mouse and the drawer follows; let go and it opens or closes depending on how far and how fast you pulled. A quick flick of a few pixels is enough.

The idea started as one of three directions for an accordion, each sketched first as an image generated with Codex (`docs/references/pull-tab-board.png`), then built as a prototype. The other two were a sheet of paper that unfolded panel by panel, and a dividing line that split open from the point you clicked. This is the one I kept.

## Usage

Copy `PullTab.tsx` and `PullTab.css` into the same folder. React 19 is the only dependency.

```tsx
import { PullTab, PullTabItem } from './PullTab'

<PullTab defaultValue="what">
  <PullTabItem value="what" title="What is this?">
    <p>A small lab of interface experiments.</p>
  </PullTabItem>
  <PullTabItem value="use" title="Can I use these?">
    <p>Yes, everything is MIT licensed.</p>
  </PullTabItem>
</PullTab>

// Several rows open at once, controlled by the page
<PullTab multiple value={open} onValueChange={setOpen}>…</PullTab>
```

| `PullTab` prop | Values | Default |
| --- | --- | --- |
| `size` | `sm`, `md`, `lg` | `md` |
| `multiple` | lets several rows stay open | `false` |
| `value`, `onValueChange` | the open row (a list with `multiple`), controlled by the page | |
| `defaultValue` | the row open at first, when the component keeps its own state | none |
| `disabled` | turns off every row | `false` |
| `headingLevel` | `2` to `6`, the heading around each question | `3` |

`PullTabItem` takes a `value`, a `title` and the answer as children, plus `disabled`. Both pass every other native prop to their `<div>`. There is no color to set: lines, tab and drawer are mixed from the text color, so the component fits a light or a dark page as it is.

## How it works

Each question is a real `<button>` inside a heading, with `aria-expanded` and an answer region it controls. The up and down arrows, Home and End move between questions. A closed answer is hidden with `hidden="until-found"`, so the browser's find in page can still reach its text and open the row. Safari doesn't support that yet and keeps the answer hidden.

The drawer's height runs on a small hand-written spring with no overshoot. Opening looks done after about 340 ms, closing after about 230 ms. That is a little over the usual budget for opening, because you watch the drawer come out, but any click or pull catches it where it is and carries on from its current speed. The drawer slides with `transform` while the panel around it grows, so it really comes from under the row.

The tab only drags with a mouse or a pen. It follows the pointer exactly, resists once the drawer is fully out, and on release the speed of the last few moves is projected forward, the way a scrolled page slows down, to choose open or closed. On a phone a vertical drag has to scroll the page, so there the tab is a tap target like the row.

From the keyboard, a row opens or closes at once, with no motion; the focus ring is the feedback. With `prefers-reduced-motion`, rows change at once and the answer fades in over 150 ms. A pull still follows the pointer, then the drawer goes straight to its place.
