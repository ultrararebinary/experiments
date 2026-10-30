import { useState } from 'react'
import { ColorDrift } from './ColorDrift'

export const meta = {
  title: 'Color Drift',
  description: 'A color picker with nothing on it. Drag the color itself, and the new shade spreads out from your finger like ink.',
  date: '2026-10-30',
}

const sizes = ['sm', 'md', 'lg'] as const

export function Preview() {
  return <ColorDrift aria-label="Color" />
}

export default function Demo() {
  const [color, setColor] = useState('#6f5bd6')
  return (
    <div className="demo">
      <section className="demo__section">
        <h3>Sizes</h3>
        <p className="demo__hint">
          Drag sideways for the hue, up and down for the tone. Flick it and it keeps going. Grab it again to stop it.
        </p>
        <div className="demo__row" style={{ gap: 24 }}>
          {sizes.map((size) => (
            <ColorDrift key={size} size={size} value={color} onChange={setColor} aria-label={`Color, ${size}`} />
          ))}
        </div>
      </section>
      <section className="demo__section">
        <h3>Disabled</h3>
        <div className="demo__row">
          <ColorDrift size="sm" defaultValue="#6f5bd6" disabled aria-label="Color, disabled" />
        </div>
      </section>
    </div>
  )
}
