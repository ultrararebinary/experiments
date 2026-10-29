import type { MouseEvent } from 'react'
import { experiments } from './experiments'

const REPO = 'https://github.com/ultrararebinary/experiments'

export function Home() {
  // The preview stays interactive, so the whole card can't be a link.
  // Clicking the empty parts of a card opens it; the title is the real link.
  const openCard = (slug: string) => (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('a, button')) return
    window.location.hash = `/${slug}`
  }

  return (
    <main className="page">
      <header className="intro">
        <h1 className="page__title">experiments</h1>
        <p className="page__lead">
          Small interface experiments. Each one is a folder you can copy into your own React
          project. <a href={REPO}>Source on GitHub</a>.
        </p>
      </header>

      <ul className="grid">
        {experiments.map(({ slug, title, description, Preview }) => (
          <li key={slug} className="card" onClick={openCard(slug)}>
            <div className="card__stage">
              <Preview />
            </div>
            <div className="card__body">
              <a className="card__title" href={`#/${slug}`}>
                {title}
              </a>
              <p className="card__text">{description}</p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
