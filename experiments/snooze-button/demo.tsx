import { useEffect, useRef, useState } from 'react'
import { SnoozeButton, type SnoozeButtonProps } from './SnoozeButton'

export const meta = {
  title: 'Snooze Button',
  description: 'A button with two sleepy eyes that open when your pointer comes near, and follow it.',
  date: '2026-11-07',
  order: 2,
}

/** Pretends to send something: busy for a moment, then done, then back to normal. */
function SendButton(props: SnoozeButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  return (
    <SnoozeButton
      {...props}
      status={status}
      loadingLabel="Sending"
      successLabel="Sent"
      onClick={() => {
        timers.current.forEach(clearTimeout)
        setStatus('loading')
        timers.current = [
          window.setTimeout(() => setStatus('success'), 1400),
          window.setTimeout(() => setStatus('idle'), 2800),
        ]
      }}
    />
  )
}

export function Preview() {
  return <SnoozeButton>Get in touch</SnoozeButton>
}

export default function Demo() {
  return (
    <div className="demo">
      <section className="demo__section">
        <p className="demo__hint">
          Bring your pointer close to a button and its eyes open and follow it. Press it and they squint. Tab to it and they
          just open.
        </p>
        <div className="demo__row">
          <SnoozeButton size="sm">Get in touch</SnoozeButton>
          <SnoozeButton>Get in touch</SnoozeButton>
          <SnoozeButton size="lg">Get in touch</SnoozeButton>
        </div>
        <div className="demo__row">
          <SnoozeButton tone="paper" size="sm">
            Get in touch
          </SnoozeButton>
          <SnoozeButton tone="paper">Get in touch</SnoozeButton>
          <SnoozeButton tone="paper" size="lg">
            Get in touch
          </SnoozeButton>
        </div>
      </section>
      <section className="demo__section">
        <h3>Sending</h3>
        <p className="demo__hint">The page sets the status. While it waits the pupils go round, then the eyes smile.</p>
        <div className="demo__row">
          <SendButton>Send message</SendButton>
          <SendButton tone="paper">Send message</SendButton>
        </div>
      </section>
      <section className="demo__section">
        <h3>Eyes only, and your own color</h3>
        <div className="demo__row">
          <SnoozeButton aria-label="Contact" />
          <SnoozeButton tone="paper" aria-label="Contact" />
          <SnoozeButton style={{ '--accent': '#1a70e6' } as React.CSSProperties}>Book a call</SnoozeButton>
        </div>
      </section>
      <section className="demo__section">
        <h3>Disabled</h3>
        <div className="demo__row">
          <SnoozeButton disabled>Get in touch</SnoozeButton>
          <SnoozeButton tone="paper" disabled>
            Get in touch
          </SnoozeButton>
        </div>
      </section>
    </div>
  )
}
