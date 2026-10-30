import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { experiments } from './experiments'
import { Home } from './Home'
import { ExperimentPage } from './ExperimentPage'
import { ThemeToggle } from './ThemeToggle'
import { transition } from './transition'

const slugOf = (path: string) => experiments.find((e) => `/${e.slug}` === path)?.slug

// Routes live after the # (…/experiments/#/glossy-button), so GitHub Pages always
// serves index.html and a direct reload of any page works.
function useHashPath() {
  const read = () => window.location.hash.replace(/^#/, '') || '/'
  const [path, setPath] = useState(read)

  useEffect(() => {
    history.scrollRestoration = 'manual'
    let shown = read()
    let homeScroll = 0

    const onChange = () => {
      const from = shown
      const to = read()
      if (from === to) return
      shown = to
      delete document.documentElement.dataset.enter
      if (from === '/') homeScroll = window.scrollY

      transition(
        () => {
          flushSync(() => setPath(to))
          window.scrollTo(0, to === '/' ? homeScroll : 0)
          // Keyboard and screen reader users continue from the new page, or from the
          // experiment they just left, and not from the top of the document.
          const target =
            to === '/'
              ? document.querySelector<HTMLElement>(`a[href="#${from}"]`)
              : document.querySelector<HTMLElement>('main')
          target?.focus({ preventScroll: true })
        },
        from === '/' ? slugOf(to) : to === '/' ? slugOf(from) : undefined,
      )
    }

    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return path
}

export function App() {
  const path = useHashPath()
  const experiment = experiments.find((e) => `/${e.slug}` === path)

  useEffect(() => {
    document.title = experiment ? `${experiment.title} · experiments` : 'experiments'
  }, [experiment])

  // The arrival plays once. Past this delay, the attribute must not replay it on a new page.
  useEffect(() => {
    const timer = window.setTimeout(() => delete document.documentElement.dataset.enter, 500)
    return () => window.clearTimeout(timer)
  }, [])

  if (path === '/') return <Home />
  if (experiment) return <ExperimentPage key={experiment.slug} experiment={experiment} />
  return (
    <main className="page" tabIndex={-1}>
      <div className="topbar">
        <a className="text-control" href="#/">← All experiments</a>
        <ThemeToggle />
      </div>
      <h1 className="page__title">Nothing here</h1>
      <p className="page__lead">There is no experiment at this address.</p>
    </main>
  )
}
