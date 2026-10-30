# New experiment

Open a new Claude Code chat in this folder, paste the prompt below, fill in the brackets and attach the image if you have one. French is fine.

```text
New experiment for this repo. Read CLAUDE.md and docs/decisions.md first.
Load the emil-design-eng and apple-design skills with the Skill tool before designing anything, and use humanizer for the README and demo text.

Name: [folder name, e.g. magnetic-tabs]
Reference: [attached image, or a link to where you saw it]
What I like about it: [the precise detail: the motion, the light, the feel of the click...]
Variants I want: [sizes, colors, options]
States to handle: [hover, press, focus, disabled, loading, reduced motion...]
Anything to avoid: [optional]

Rebuild the effect yourself, without copying code or text from the source. Follow the four-file structure, run every check listed in CLAUDE.md (including `npm run readme`), make one commit, and stop before pushing: show me screenshots and wait for my go-ahead.
```

If the prompt asks for `/prototype`, the commit waits: see "Prototypes" in `CLAUDE.md`.
