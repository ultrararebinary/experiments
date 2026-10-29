import type { CSSProperties } from 'react'
import { GlossyButton, type GlossyButtonProps } from './GlossyButton'

export const meta = {
  title: 'Glossy button',
  description: 'A raised button lit from above, in three variants. One accent color drives the whole relief.',
  date: '2026-10-29',
}

const tones = ['blue', 'violet', 'green', 'neutral'] as const
const sizes = ['sm', 'md', 'lg'] as const

const variants: { variant: NonNullable<GlossyButtonProps['variant']>; title: string; hint: string }[] = [
  {
    variant: 'key',
    title: 'Key',
    hint: 'The default. The button has thickness, rises off its base on hover and sinks flush into it when pressed.',
  },
  {
    variant: 'light',
    title: 'Light',
    hint: 'A flat glossy face. On hover the light follows the cursor and catches the edge closest to it.',
  },
  {
    variant: 'key-light',
    title: 'Key + light',
    hint: 'The keycap with a softer version of the cursor light.',
  },
]

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
      {variants.map(({ variant, title, hint }) => (
        <section className="demo__section" key={variant}>
          <h3>{title}</h3>
          <p className="demo__hint">{hint}</p>
          <div className="demo__row">
            <GlossyButton variant={variant} size="lg" trailing={<><s>$40</s> $24</>}>
              Get the starter pack
            </GlossyButton>
          </div>
          <div className="demo__row">
            {tones.map((tone) => (
              <GlossyButton key={tone} variant={variant} tone={tone}>
                Continue
              </GlossyButton>
            ))}
          </div>
        </section>
      ))}

      <section className="demo__section">
        <h3>Sizes</h3>
        {variants.map(({ variant }) => (
          <div className="demo__row" key={variant}>
            {sizes.map((size) => (
              <GlossyButton key={size} variant={variant} size={size}>
                Continue
              </GlossyButton>
            ))}
          </div>
        ))}
      </section>

      <section className="demo__section">
        <h3>Your own color</h3>
        <p className="demo__hint">
          Set <code>--accent</code> and the gradient, rim, base and shadows follow.
        </p>
        <div className="demo__row">
          {['#e8590c', '#d6336c', '#0c8599'].map((accent) => (
            <GlossyButton key={accent} style={{ '--accent': accent } as CSSProperties}>
              Send invite
            </GlossyButton>
          ))}
          <GlossyButton tone="neutral" trailing="⌘S">
            Save draft
          </GlossyButton>
        </div>
      </section>

      <section className="demo__section">
        <h3>Shine</h3>
        <p className="demo__hint">Off by default. Hover to see a band of light cross the face.</p>
        <div className="demo__row">
          <GlossyButton size="lg" shine>
            Start the tour
          </GlossyButton>
          <GlossyButton size="lg" tone="violet" variant="light" shine>
            Start the tour
          </GlossyButton>
        </div>
      </section>

      <section className="demo__section">
        <h3>Disabled</h3>
        <div className="demo__row">
          {variants.map(({ variant }) => (
            <GlossyButton key={variant} variant={variant} disabled>
              Unavailable
            </GlossyButton>
          ))}
        </div>
      </section>
    </div>
  )
}
