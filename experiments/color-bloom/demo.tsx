import { useState } from 'react'
import { ColorBloom } from './ColorBloom'

export const meta = {
  title: 'Color Bloom',
  description: 'A color picker that is only a dot until you press it. Petals unfurl, you slide to one, and its color runs back into the dot.',
  date: '2026-10-30',
}

const sizes = ['sm', 'md', 'lg'] as const

export function Preview() {
  return <ColorBloom aria-label="Color" />
}

export default function Demo() {
  const [color, setColor] = useState('#d6473f')
  return (
    <div className="demo">
      <section className="demo__section">
        <h3>Sizes</h3>
        <p className="demo__hint">
          Press a dot, slide to a petal and let go. Pull the petal inward to lighten it, outward to darken it. Slide back to the center to cancel, or tap the dot to keep the ring open.
        </p>
        <div className="demo__row" style={{ justifyContent: 'center', gap: '48px 180px', padding: '140px 0' }}>
          {sizes.map((size) => (
            <ColorBloom key={size} size={size} value={color} onChange={setColor} aria-label={`Color, ${size}`} />
          ))}
        </div>
        <p className="demo__hint" style={{ margin: 0, textAlign: 'center' }}>
          <code>{color}</code>
        </p>
      </section>
      <section className="demo__section">
        <h3>Disabled</h3>
        <div className="demo__row">
          <ColorBloom size="sm" defaultValue="#d6473f" disabled aria-label="Color, disabled" />
        </div>
      </section>
    </div>
  )
}
