import type { CSSProperties } from 'react'
import { GlossyButton } from './GlossyButton'

export const meta = {
  title: 'Glossy button',
  description: 'A raised button lit from above. One accent color drives the whole relief.',
  date: '2026-10-29',
}

const tones = ['blue', 'violet', 'green', 'neutral'] as const
const sizes = ['sm', 'md', 'lg'] as const

export function Preview() {
  return (
    <GlossyButton size="lg" trailing={<><s>$40</s> $24</>}>
      Get the starter pack
    </GlossyButton>
  )
}

export default function Demo() {
  return (
    <div className="demo">
      <section className="demo__section">
        <h3>Sizes and tones</h3>
        {sizes.map((size) => (
          <div className="demo__row" key={size}>
            {tones.map((tone) => (
              <GlossyButton key={tone} size={size} tone={tone}>
                Continue
              </GlossyButton>
            ))}
          </div>
        ))}
      </section>

      <section className="demo__section">
        <h3>Secondary detail</h3>
        <div className="demo__row">
          <GlossyButton size="lg" trailing={<><s>$40</s> $24</>}>
            Get the starter pack
          </GlossyButton>
          <GlossyButton tone="neutral" trailing="⌘S">
            Save draft
          </GlossyButton>
        </div>
      </section>

      <section className="demo__section">
        <h3>Your own color</h3>
        <p className="demo__hint">
          Set <code>--accent</code> and the gradient, rim and shadows follow.
        </p>
        <div className="demo__row">
          {['#e8590c', '#d6336c', '#0c8599'].map((accent) => (
            <GlossyButton key={accent} style={{ '--accent': accent } as CSSProperties}>
              Send invite
            </GlossyButton>
          ))}
        </div>
      </section>

      <section className="demo__section">
        <h3>Shine</h3>
        <p className="demo__hint">Off by default. Hover to see a band of light cross the face.</p>
        <div className="demo__row">
          <GlossyButton size="lg" shine>
            Start the tour
          </GlossyButton>
          <GlossyButton size="lg" tone="violet" shine>
            Start the tour
          </GlossyButton>
        </div>
      </section>

      <section className="demo__section">
        <h3>Disabled</h3>
        <div className="demo__row">
          {tones.map((tone) => (
            <GlossyButton key={tone} tone={tone} disabled>
              Unavailable
            </GlossyButton>
          ))}
        </div>
      </section>
    </div>
  )
}
