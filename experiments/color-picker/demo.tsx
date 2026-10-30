import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ColorPicker, type ColorPickerProps } from './ColorPicker'

export const meta = {
  title: 'Color picker',
  description: 'Three ways to pick a color without a gradient square or a rainbow bar: a surface, a dial and a dot.',
  date: '2026-10-30',
}

const sizes = ['sm', 'md', 'lg'] as const

const versions: {
  variant: NonNullable<ColorPickerProps['variant']>
  title: string
  hint: string
  start: string
  rowStyle?: React.CSSProperties
}[] = [
  {
    variant: 'drift',
    title: 'Drift',
    hint: 'Drag the surface: sideways changes the hue, up and down changes the tone. Flick it and it keeps going. Its edges show where each direction leads.',
    start: '#6f5bd6',
  },
  {
    variant: 'tuner',
    title: 'Tuner',
    hint: 'Scrub the lines under the needle, or tap one to bring it to the center. Drag up or down to move the dot and change the tone.',
    start: '#0f8a9c',
  },
  {
    variant: 'bloom',
    title: 'Bloom',
    hint: 'Press the dot and slide to a petal, then let go. Pull the petal inward to lighten it, outward to darken it. Come back to the center to cancel.',
    start: '#d6473f',
    rowStyle: { justifyContent: 'center', gap: '48px 180px', padding: '140px 0' },
  },
]

function Version({ variant, hint, start, rowStyle }: (typeof versions)[number]) {
  const [color, setColor] = useState(start)
  return (
    <div className="demo">
      <section className="demo__section">
        <p className="demo__hint">{hint}</p>
        {variant === 'tuner' ? (
          sizes.map((size) => (
            <div className="demo__row" key={size} style={{ marginBottom: 20 }}>
              <ColorPicker variant={variant} size={size} value={color} onChange={setColor} aria-label={`Color, ${size}`} />
            </div>
          ))
        ) : (
          <div className="demo__row" style={{ gap: 24, ...rowStyle }}>
            {sizes.map((size) => (
              <ColorPicker key={size} variant={variant} size={size} value={color} onChange={setColor} aria-label={`Color, ${size}`} />
            ))}
          </div>
        )}
        {variant === 'bloom' && (
          <p className="demo__hint" style={{ margin: 0, textAlign: 'center' }}>
            <code>{color}</code>
          </p>
        )}
      </section>
      <section className="demo__section">
        <h3>Disabled</h3>
        <div className="demo__row">
          <ColorPicker variant={variant} size="sm" defaultValue={start} disabled aria-label="Color, disabled" />
        </div>
      </section>
    </div>
  )
}

export function Preview() {
  return <ColorPicker defaultValue="#6f5bd6" aria-label="Color" />
}

export default function Demo() {
  const [current, setCurrent] = useState(() => {
    const v = parseInt(new URLSearchParams(location.search).get('v') ?? '', 10)
    return v >= 1 && v <= versions.length ? v - 1 : 0
  })
  const picker = useRef<HTMLElement>(null)
  const highlight = useRef<HTMLSpanElement>(null)
  const items = useRef<HTMLButtonElement[]>([])

  useLayoutEffect(() => {
    function moveHighlight() {
      const el = items.current[current]
      if (!el || !highlight.current) return
      highlight.current.style.width = `${el.offsetWidth}px`
      highlight.current.style.transform = `translateX(${el.offsetLeft}px)`
    }
    moveHighlight()
    window.addEventListener('resize', moveHighlight)
    return () => window.removeEventListener('resize', moveHighlight)
  }, [current])

  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set('v', String(current + 1))
    history.replaceState(null, '', url)
  }, [current])

  useEffect(() => {
    // Enable the slide only after first paint, so load doesn't animate.
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => picker.current?.setAttribute('data-ready', '')),
    )
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      // The pickers use the arrow keys themselves when they have focus.
      if (target.closest('.cp')) return
      const n = parseInt(e.key, 10)
      if (n >= 1 && n <= versions.length) setCurrent(n - 1)
      else if (e.key === 'ArrowRight') setCurrent((c) => (c + 1) % versions.length)
      else if (e.key === 'ArrowLeft') setCurrent((c) => (c - 1 + versions.length) % versions.length)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <style>{PICKER_CSS}</style>
      <Version key={versions[current].variant} {...versions[current]} />
      <nav className="proto-picker" aria-label="Prototype variants" ref={picker}>
        <span className="proto-picker-highlight" aria-hidden="true" ref={highlight} />
        {versions.map((v, i) => (
          <button
            key={v.variant}
            className="proto-picker-item"
            data-active={i === current || undefined}
            aria-current={i === current ? 'true' : undefined}
            ref={(el) => {
              if (el) items.current[i] = el
            }}
            onClick={() => setCurrent(i)}
          >
            {v.title}
          </button>
        ))}
      </nav>
    </>
  )
}

const PICKER_CSS = `
.proto-picker {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483647;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(10, 10, 10, 0.82);
  -webkit-backdrop-filter: blur(12px) saturate(1.4);
  backdrop-filter: blur(12px) saturate(1.4);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08) inset,
    0 8px 24px rgba(0, 0, 0, 0.24),
    0 2px 6px rgba(0, 0, 0, 0.12);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 13px;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  user-select: none;
  -webkit-user-select: none;
}
.proto-picker-highlight {
  position: absolute;
  top: 4px;
  left: 0;
  height: 28px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  will-change: transform;
}
.proto-picker[data-ready] .proto-picker-highlight {
  transition:
    transform 250ms cubic-bezier(0.23, 1, 0.32, 1),
    width 250ms cubic-bezier(0.23, 1, 0.32, 1);
}
@media (prefers-reduced-motion: reduce) {
  .proto-picker[data-ready] .proto-picker-highlight { transition: none; }
}
.proto-picker-item {
  position: relative;
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  font: inherit;
  cursor: pointer;
  transition: color 150ms ease-out;
}
.proto-picker-item:hover { color: rgba(255, 255, 255, 0.85); }
.proto-picker-item:active { transform: scale(0.97); }
.proto-picker-item:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.4);
  outline-offset: 2px;
}
.proto-picker-item[data-active] { color: #fff; }
`
