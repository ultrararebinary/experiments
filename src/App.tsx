import { useEffect, useState } from 'react'
import { experiments } from './experiments'
import { Home } from './Home'
import { ExperimentPage } from './ExperimentPage'

// Routes live after the # (…/experiments/#/glossy-button), so GitHub Pages always
// serves index.html and a direct reload of any page works.
function useHashPath() {
  const read = () => window.location.hash.replace(/^#/, '') || '/'
  const [path, setPath] = useState(read)
  useEffect(() => {
    const onChange = () => {
      setPath(read())
      window.scrollTo(0, 0)
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

  if (path === '/') return <Home />
  if (experiment) return <ExperimentPage experiment={experiment} />
  return (
    <main className="page">
      <a className="back" href="#/">All experiments</a>
      <h1 className="page__title">Nothing here</h1>
      <p className="page__lead">There is no experiment at this address.</p>
    </main>
  )
}
