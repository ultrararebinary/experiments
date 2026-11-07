import { useEffect, useRef, useState } from 'react'
import { DieCut, stickerJsx, stickerSvg, stickerTitle, type StickerName } from './DieCut'

export const meta = {
  title: 'Die Cut',
  description: 'Eight die-cut stickers to use in place of flat icons. You can pick one up and throw it.',
  date: '2026-11-07',
  order: 1,
}

export function Preview() {
  return (
    <div style={{ position: 'relative', width: 280, height: 180 }}>
      <DieCut name="laptop" size={84} angle={-8} movable style={{ position: 'absolute', left: 8, top: 40 }} />
      <DieCut name="coffee" size={84} angle={6} movable style={{ position: 'absolute', left: 98, top: 70 }} />
      <DieCut name="assistant" size={84} angle={-4} movable style={{ position: 'absolute', left: 186, top: 30 }} />
    </div>
  )
}

const scattered: { name: StickerName; left: string; top: string; angle: number }[] = [
  { name: 'headphones', left: '4%', top: '8%', angle: -8 },
  { name: 'lightbulb', left: '40%', top: '2%', angle: 6 },
  { name: 'laptop', left: '76%', top: '6%', angle: 7 },
  { name: 'notebook', left: '2%', top: '64%', angle: 5 },
  { name: 'paperclip', left: '30%', top: '70%', angle: -10 },
  { name: 'coffee', left: '55%', top: '66%', angle: 4 },
  { name: 'floppy', left: '80%', top: '62%', angle: -6 },
  { name: 'assistant', left: '86%', top: '36%', angle: -4 },
]

export default function Demo() {
  const [picked, setPicked] = useState<StickerName>('coffee')
  const [size, setSize] = useState(80)
  const scene = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Four to a row on a phone, full size from about 420px up.
    const fit = () => setSize(Math.round(Math.min(80, (scene.current?.clientWidth ?? 400) / 5.2)))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <div className="demo">
      <style>{DEMO_CSS}</style>
      <section className="demo__section">
        <p className="demo__hint">
          Pick a sticker up and throw it. It keeps the speed of your hand, leans the way it goes, and pops when it lands. With a mouse, it leans toward the pointer before you grab it.
        </p>
        <div className="dc-scene" ref={scene}>
          <p className="dc-scene__title">
            Stickers instead of icons.
            <span>Drag them anywhere.</span>
          </p>
          {scattered.map((s) => (
            <DieCut
              key={s.name}
              name={s.name}
              size={size}
              angle={s.angle}
              movable
              style={{ position: 'absolute', left: s.left, top: s.top }}
              onPointerDown={() => setPicked(s.name)}
              onFocus={() => setPicked(s.name)}
            />
          ))}
        </div>
        <CopyBar name={picked} />
      </section>

      <section className="demo__section">
        <h3>In an interface</h3>
        <div className="dc-ui">
          <div className="dc-empty">
            <DieCut name="notebook" tilt angle={-4} />
            <div>
              <p className="dc-empty__title">No notes yet</p>
              <p className="dc-empty__text">Notes you take in class will show up here.</p>
            </div>
          </div>
          <div className="dc-row">
            <DieCut name="assistant" size="sm" tilt label="Suggestion" />
            <p>Three flashcards are ready from today's lecture.</p>
          </div>
          <div className="dc-row">
            <DieCut name="coffee" size="sm" tilt />
            <p>Break in 10 minutes.</p>
          </div>
        </div>
      </section>

      <section className="demo__section">
        <h3>Sizes</h3>
        <div className="demo__row" style={{ alignItems: 'flex-end', gap: 20 }}>
          <DieCut name="lightbulb" size="sm" tilt />
          <DieCut name="lightbulb" size="md" tilt />
          <DieCut name="lightbulb" size="lg" tilt />
        </div>
      </section>
    </div>
  )
}

/* Copies the sticker you touched last, as JSX or as a standalone SVG file. */
function CopyBar({ name }: { name: StickerName }) {
  const [done, setDone] = useState<string | null>(null)
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])

  function flash(what: string) {
    setDone(what)
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setDone(null), 1400)
  }

  async function copy(what: 'jsx' | 'svg') {
    try {
      await navigator.clipboard.writeText(what === 'jsx' ? stickerJsx(name) : stickerSvg(name))
      flash(what)
    } catch {
      flash('failed')
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([stickerSvg(name)], { type: 'image/svg+xml' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}.svg`
    a.click()
    URL.revokeObjectURL(url)
    flash('file')
  }

  return (
    <div className="dc-bar">
      <span>
        <DieCut name={name} size={28} /> {stickerTitle(name)}
      </span>
      <div className="dc-bar__actions">
        <button type="button" className="text-control" onClick={() => copy('jsx')}>
          {done === 'jsx' ? 'Copied' : 'Copy JSX'}
        </button>
        <button type="button" className="text-control" onClick={() => copy('svg')}>
          {done === 'svg' ? 'Copied' : 'Copy SVG'}
        </button>
        <button type="button" className="text-control" onClick={download}>
          {done === 'file' ? 'Saved' : 'Download'}
        </button>
      </div>
      <span className="dc-sr" role="status">
        {done === 'failed' ? 'Couldn’t copy' : done === 'file' ? `${name}.svg saved` : done ? 'Copied' : ''}
      </span>
    </div>
  )
}

const DEMO_CSS = `
.dc-scene {
  position: relative;
  display: grid;
  place-items: center;
  height: 360px;
  border-radius: 18px;
  background: light-dark(#fdfdfc, #111110);
  box-shadow: inset 0 0 0 1px var(--ring);
  overflow: hidden;
}
.dc-scene__title {
  margin: 0;
  display: grid;
  gap: 4px;
  text-align: center;
  font-size: 1.375rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--text);
}
.dc-scene__title span { font-size: 0.9375rem; font-weight: 400; letter-spacing: 0; color: var(--muted); }
.dc-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  margin-top: 14px;
  font-size: 0.8125rem;
}
.dc-bar > span { display: inline-flex; align-items: center; gap: 8px; }
.dc-bar__actions { display: flex; gap: 18px; }
.dc-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.dc-ui { display: grid; gap: 10px; max-width: 420px; }
.dc-empty {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 18px;
  border-radius: 14px;
  background: light-dark(#fdfdfc, #111110);
  box-shadow: inset 0 0 0 1px var(--ring);
}
.dc-empty p, .dc-row p { margin: 0; }
.dc-empty__title { font-weight: 600; color: var(--text); }
.dc-empty__text { font-size: 0.875rem; color: var(--muted); }
.dc-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 14px 6px 8px;
  border-radius: 12px;
  box-shadow: inset 0 0 0 1px var(--ring);
  font-size: 0.875rem;
}
`
