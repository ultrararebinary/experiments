import { useMemo, useState } from 'react'
import { marked } from 'marked'
import type { Experiment } from './experiments'

export function ExperimentPage({ experiment }: { experiment: Experiment }) {
  const { title, description, Demo, files, readme, slug } = experiment
  // The page already shows the title, so the README's first heading is dropped.
  const notes = useMemo(
    () => marked.parse(readme.replace(/^#\s.*\n/, ''), { async: false }),
    [readme],
  )

  return (
    <main className="page">
      <a className="back" href="#/">All experiments</a>
      <h1 className="page__title">{title}</h1>
      <p className="page__lead">{description}</p>

      <section className="stage">
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
    </main>
  )
}

function CodeTabs({ files }: { files: Experiment['files'] }) {
  const [active, setActive] = useState(0)
  const [copied, setCopied] = useState(false)
  const file = files[active]

  async function copy() {
    await navigator.clipboard.writeText(file.code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
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
        <button className="code__copy" onClick={copy} aria-live="polite">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="code__body">
        <code>{file.code}</code>
      </pre>
    </div>
  )
}
