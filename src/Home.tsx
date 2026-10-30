import type { MouseEvent } from 'react'
import { experiments, formatDate } from './experiments'
import { ThemeToggle } from './ThemeToggle'

const REPO = 'https://github.com/ultrararebinary/experiments'
const X = 'https://x.com/yannworks'

export function Home() {
  // The stage above each row is for playing with the component, so only the row opens the page.
  // The row isn't a link itself, because dragging on a link can't select its text.
  const openEntry = (slug: string) => (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('a')) return
    if (!window.getSelection()?.isCollapsed) return
    window.location.hash = `/${slug}`
  }

  return (
    <main className="page" tabIndex={-1}>
      <h1 className="page__title">experiments</h1>

      <div className="note">
        <p>
          I'm Yann, a student learning design engineering. When an interface feels right, I want
          to know why, so I rebuild the detail myself until I understand it. Some experiments
          start from something I saw, others from an idea I wanted to try.
        </p>
        <p>
          Each one is a small React component you can copy into your project: a{' '}
          <code>.tsx</code>, a <code>.css</code>, nothing to install. I'm still learning, so
          expect rough edges, and tell me when you find one.
        </p>
      </div>

      <nav className="links" aria-label="Links">
        <a className="text-control" href={X}>X</a>
        <span className="links__dot" aria-hidden="true">·</span>
        <a className="text-control" href={REPO}>GitHub</a>
        <span className="links__dot" aria-hidden="true">·</span>
        <ThemeToggle />
      </nav>

      <ul className="list">
        {experiments.map(({ slug, title, description, date, Preview }) => (
          <li key={slug}>
            <div className="stage stage--preview" data-stage={slug}>
              <Preview />
            </div>
            <div className="entry__row" onClick={openEntry(slug)}>
              <div className="entry__head">
                <span>
                  <a className="entry__title" href={`#/${slug}`}>
                    {title}
                  </a>
                  <span className="entry__arrow" aria-hidden="true">→</span>
                </span>
                <time className="entry__date" dateTime={date}>
                  {formatDate(date)}
                </time>
              </div>
              <p className="entry__text">{description}</p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
