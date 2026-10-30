import { ShojiBento, type ShojiItem } from './ShojiBento'

export const meta = {
  title: 'Shoji Bento',
  description: 'A bento grid made of nothing but thin lines, like a paper screen. Slide a line and the compartments make room, with type that grows to fill them.',
  date: '2026-10-30',
  order: 1,
}

const items: ShojiItem[] = [
  {
    id: 'experiments',
    label: 'Experiments',
    value: '4',
    detail: 'Glossy Button, Color Drift, Color Bloom and this grid.',
    solid: true,
  },
  {
    id: 'files',
    label: 'Files to copy',
    value: '2',
    detail: 'One .tsx and one .css, side by side in your project.',
  },
  {
    id: 'packages',
    label: 'Packages to install',
    value: '0',
    detail: 'A component here needs React and nothing else.',
  },
  {
    id: 'license',
    label: 'License',
    value: 'MIT',
    detail: 'Copy it, change it, ship it.',
  },
  {
    id: 'color',
    label: 'Color space',
    value: 'OKLCH',
    detail: 'The same lightness looks equally light at every hue.',
  },
  {
    id: 'spring',
    label: 'Press spring',
    value: '0.12 s',
    detail: 'The response of the Glossy Button on its way down.',
  },
  {
    id: 'page',
    label: 'Page change',
    value: '300 ms',
    detail: 'The one transition the site itself uses.',
  },
]

const sizes = [
  { size: 'sm', title: 'Three compartments' },
  { size: 'md', title: 'Five compartments' },
  { size: 'lg', title: 'Seven compartments' },
] as const

export function Preview() {
  return <ShojiBento items={items} aria-label="Shoji Bento" />
}

export default function Demo() {
  return (
    <div className="demo">
      <section className="demo__section">
        <p className="demo__hint">
          Drag a line and the compartments on both sides make room. Throw it and it carries on. Press a compartment to give it most of the room, and press again to give it back. Double-click a line to reset it.
        </p>
      </section>
      {sizes.map(({ size, title }) => (
        <section className="demo__section" key={size}>
          <h3>{title}</h3>
          <ShojiBento size={size} items={items} aria-label={`Shoji Bento, ${title.toLowerCase()}`} />
        </section>
      ))}
      <section className="demo__section">
        <h3>Disabled</h3>
        <ShojiBento size="sm" items={items} disabled aria-label="Shoji Bento, disabled" />
      </section>
    </div>
  )
}
