import { GemClip } from './GemClip'

export const meta = {
  title: 'Gem Clip',
  description: 'A paper clip that grips a block of text when you copy it, then lets go.',
  date: '2026-11-07',
}

export function Preview() {
  return <GemClip value="npm run dev" />
}

export default function Demo() {
  return (
    <div className="demo">
      <section className="demo__section">
        <p className="demo__hint">
          Click the paper clip. It opens as it slides onto the block, snaps shut on it and holds on for as long as it says "Copied".
        </p>
      </section>
      <section className="demo__section">
        <h3>Small</h3>
        <GemClip size="sm" value="npm run dev" />
      </section>
      <section className="demo__section">
        <h3>Medium</h3>
        <GemClip value="git clone https://github.com/ultrararebinary/experiments.git" />
      </section>
      <section className="demo__section">
        <h3>Large</h3>
        <GemClip size="lg" value={'npm install\nnpm run build\nnpm run preview'} label="the three build commands" />
      </section>
      <section className="demo__section">
        <h3>Disabled</h3>
        <GemClip size="sm" value="npm run deploy" disabled />
      </section>
    </div>
  )
}
