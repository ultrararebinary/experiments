import { useState } from 'react'
import { PullTab, PullTabItem, type PullTabProps } from './PullTab'

export const meta = {
  title: 'Pull Tab',
  description: 'An accordion where each answer is a drawer. Click the question, or pull the tab underneath.',
  date: '2026-11-08',
}

const faq = [
  {
    value: 'what',
    question: 'What is this?',
    answer: 'A small lab of interface experiments. Each one is a React component you can copy into your own project.',
  },
  {
    value: 'use',
    question: 'Can I use these?',
    answer: 'Yes. Everything is MIT licensed. Copy the .tsx and .css files and the component works on its own.',
  },
  {
    value: 'made',
    question: 'How is each one made?',
    answer: 'Usually three versions get built and tried side by side. One is kept and the other two are deleted.',
  },
  {
    value: 'npm',
    question: 'Why no npm package?',
    answer: 'So the code is yours. Change anything you like, and there is nothing to update.',
  },
]

function Faq(props: PullTabProps) {
  return (
    <PullTab {...props}>
      {faq.map((item) => (
        <PullTabItem key={item.value} value={item.value} title={item.question}>
          <p>{item.answer}</p>
        </PullTabItem>
      ))}
    </PullTab>
  )
}

function Controlled() {
  const [open, setOpen] = useState<string[]>([])
  return (
    <>
      <div className="demo__row" style={{ marginBottom: 14 }}>
        <button type="button" className="text-control" onClick={() => setOpen(faq.map((f) => f.value))}>
          Open all
        </button>
        <button type="button" className="text-control" onClick={() => setOpen([])}>
          Close all
        </button>
      </div>
      <Faq multiple value={open} onValueChange={setOpen} />
    </>
  )
}

export function Preview() {
  return (
    <div style={{ width: 'min(100%, 420px)' }}>
      <PullTab defaultValue="what">
        {faq.slice(0, 3).map((item) => (
          <PullTabItem key={item.value} value={item.value} title={item.question}>
            <p>{item.answer}</p>
          </PullTabItem>
        ))}
      </PullTab>
    </div>
  )
}

export default function Demo() {
  return (
    <div className="demo">
      <section className="demo__section">
        <p className="demo__hint">
          Click a question, or pull the tab under it and let go. A quick flick is enough. On a phone, tap.
        </p>
        <Faq defaultValue="what" />
      </section>
      <section className="demo__section">
        <h3>Small and large</h3>
        <div style={{ display: 'grid', gap: 32 }}>
          <Faq size="sm" />
          <Faq size="lg" />
        </div>
      </section>
      <section className="demo__section">
        <h3>Several open at once, set by the page</h3>
        <Controlled />
      </section>
      <section className="demo__section">
        <h3>Disabled</h3>
        <PullTab>
          <PullTabItem value="open" title="Open to everyone">
            <p>This one works as usual.</p>
          </PullTabItem>
          <PullTabItem value="members" title="Members only" disabled>
            <p>This one stays shut.</p>
          </PullTabItem>
        </PullTab>
        <div style={{ marginTop: 24 }}>
          <Faq size="sm" disabled />
        </div>
      </section>
    </div>
  )
}
