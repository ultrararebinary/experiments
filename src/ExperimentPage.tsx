import { useEffect, useMemo, useRef, useState } from 'react'
import { marked } from 'marked'
import { experiments, formatDate, type Experiment } from './experiments'
import { ThemeToggle } from './ThemeToggle'

export function ExperimentPage({ experiment }: { experiment: Experiment }) {
  const { title, description, date, Demo, files, readme, slug } = experiment
  // The page already shows the title, so the README's first heading is dropped.
  const notes = useMemo(
    () => marked.parse(readme.replace(/^#\s.*\n/, ''), { async: false }),
    [readme],
  )
  const index = experiments.indexOf(experiment)
  const newer = experiments[index - 1]
  const older = experiments[index + 1]

  return (
    <main className="page" tabIndex={-1}>
      <div className="topbar">
        <a className="text-control" href="#/">← All experiments</a>
        <ThemeToggle />
      </div>

      <h1 className="page__title">{title}</h1>
      <p className="page__lead">{description}</p>
      <p className="page__date">
        <time dateTime={date}>{formatDate(date)}</time>
      </p>

      <section className="stage stage--demo" data-stage={slug}>
        <Demo />
      </section>

      <section className="section">
        <h2>Code</h2>
        <p className="section__hint">
          Copy both files into the same folder of your project, as{' '}
          <code>experiments/{slug}/</code> does here.
        </p>
        <CodeTabs files={files} />
      </section>

      <section className="section notes" dangerouslySetInnerHTML={{ __html: notes }} />

      <nav className="pager" aria-label="More experiments">
        {newer ? <a className="text-control" href={`#/${newer.slug}`}>← {newer.title}</a> : <span />}
        {older ? <a className="text-control" href={`#/${older.slug}`}>{older.title} →</a> : <span />}
      </nav>
    </main>
  )
}

function CodeTabs({ files }: { files: Experiment['files'] }) {
  const [active, setActive] = useState(0)
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)
  const file = files[active]

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function copy() {
    await navigator.clipboard.writeText(file.code)
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="code">
      <div className="code__bar">
        <div role="tablist" className="code__tabs">
          {files.map((f, i) => (
            <button
              key={f.name}
              role="tab"
              aria-selected={i === active}
              className="code__tab"
              onClick={() => {
                setActive(i)
                setCopied(false)
              }}
            >
              {f.name}
            </button>
          ))}
        </div>
        <button className="code__copy" onClick={copy} aria-live="polite" aria-label={copied ? 'Copied' : 'Copy'}>
          <span data-on={!copied} aria-hidden="true">Copy</span>
          <span data-on={copied} aria-hidden="true">Copied</span>
        </button>
      </div>
      <pre className="code__body">
        <code>{file.code}</code>
      </pre>
    </div>
  )
}
