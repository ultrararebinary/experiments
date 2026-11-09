import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { experiments, formatDate, loadDetails, type Details, type Experiment } from './experiments'
import { ThemeToggle } from './ThemeToggle'

export function ExperimentPage({ experiment }: { experiment: Experiment }) {
  const { title, description, date, Demo, slug } = experiment
  const details = useDetails(slug)
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

      {/* The demo renders at once: the page transition takes its picture right away. */}
      <section className="stage stage--demo" data-stage={slug}>
        <Demo />
      </section>

      <section className="section">
        <h2>Code</h2>
        <p className="section__hint">
          Copy both files into the same folder of your project, as{' '}
          <code>experiments/{slug}/</code> does here.
        </p>
        {details === 'error' ? (
          <p className="code code--message">Couldn't load the code. Reload the page to try again.</p>
        ) : details ? (
          <CodeTabs files={details.files} />
        ) : (
          // Holds the place of the code block, so nothing below jumps when it arrives.
          <div className="code code--loading" aria-busy="true" />
        )}
      </section>

      {details && details !== 'error' && (
        <section className="section notes" dangerouslySetInnerHTML={{ __html: details.notes }} />
      )}

      <nav className="pager" aria-label="More experiments">
        {newer ? <a className="text-control" href={`#/${newer.slug}`}>← {newer.title}</a> : <span />}
        {older ? <a className="text-control" href={`#/${older.slug}`}>{older.title} →</a> : <span />}
      </nav>
    </main>
  )
}

function useDetails(slug: string) {
  const [details, setDetails] = useState<Details | 'error' | null>(null)
  useEffect(() => {
    let live = true
    loadDetails(slug).then(
      (d) => live && setDetails(d),
      () => live && setDetails('error'),
    )
    return () => {
      live = false
    }
  }, [slug])
  return details
}

type CopyState = 'idle' | 'copied' | 'failed'
const COPY_LABELS: Record<CopyState, string> = { idle: 'Copy', copied: 'Copied', failed: "Couldn't copy" }

// Tabs as the WAI-ARIA pattern describes them: one Tab stop for the whole list, arrows to move
// between files, then Tab goes into the code itself.
function CodeTabs({ files }: { files: Details['files'] }) {
  const [active, setActive] = useState(0)
  const [copy, setCopy] = useState<CopyState>('idle')
  const timer = useRef(0)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const id = useId()
  const file = files[active]

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function select(i: number) {
    setActive(i)
    setCopy('idle')
  }

  function onKeyDown(e: KeyboardEvent) {
    const last = files.length - 1
    const next = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: last }[e.key]
    if (next === undefined) return
    e.preventDefault()
    const i = next > last ? 0 : next < 0 ? last : next
    select(i)
    tabs.current[i]?.focus()
  }

  async function onCopy() {
    let result: CopyState = 'copied'
    try {
      await navigator.clipboard.writeText(file.code)
    } catch {
      // No focus, a blocked permission or an insecure page: say so instead of pretending.
      result = 'failed'
    }
    setCopy(result)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopy('idle'), 1500)
  }

  return (
    <div className="code">
      <div className="code__bar">
        <div role="tablist" aria-label="Files" className="code__tabs" onKeyDown={onKeyDown}>
          {files.map((f, i) => (
            <button
              key={f.name}
              ref={(el) => {
                tabs.current[i] = el
              }}
              role="tab"
              id={`${id}-tab-${i}`}
              aria-selected={i === active}
              aria-controls={`${id}-panel`}
              tabIndex={i === active ? 0 : -1}
              className="code__tab"
              onClick={() => select(i)}
            >
              {f.name}
            </button>
          ))}
        </div>
        {/* All labels share one grid cell, so the button keeps its width while they fade.
            The status region says the result, because a button's own name changing is often not read. */}
        <button className="code__copy" onClick={onCopy} aria-label={`Copy ${file.name}`}>
          {(Object.keys(COPY_LABELS) as CopyState[]).map((state) => (
            <span key={state} data-on={copy === state} aria-hidden="true">
              {COPY_LABELS[state]}
            </span>
          ))}
        </button>
        <span className="visually-hidden" role="status">
          {copy === 'idle' ? '' : COPY_LABELS[copy]}
        </span>
      </div>
      {/* Focusable, so the code can be scrolled with the keyboard in every browser. */}
      <pre
        className="code__body"
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${active}`}
        tabIndex={0}
      >
        <code>{file.code}</code>
      </pre>
    </div>
  )
}
