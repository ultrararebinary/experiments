import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react'
import './GemClip.css'

export type GemClipProps = {
  /** The text that lands on the clipboard. */
  value: string
  size?: 'sm' | 'md' | 'lg'
  /** What is shown, when it differs from `value`. */
  children?: ReactNode
  /** Names the value for screen readers. */
  label?: string
  disabled?: boolean
  onCopy?: (value: string) => void
} & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onCopy'>

type Status = 'idle' | 'copied' | 'failed'

const HOLD = 1600

/** How far the clip slides down when it grips, in clip heights. */
const GRIP = 0.34

const CLIP_INNER = 'M28 70V28a8 8 0 0 0-16 0v52a12 12 0 0 0 24 0'
const CLIP_OUTER = 'M36 80V20a16 16 0 0 0-32 0v60a16 16 0 0 0 29 9'

/* A paper clip waits on the top edge of the block, and grips it when you copy. */

export function GemClip({ value, size = 'md', children, label, disabled, onCopy, className, ...rest }: GemClipProps) {
  const [status, flash, instant] = useStatus()
  const back = useRef<HTMLSpanElement>(null)
  const front = useRef<HTMLSpanElement>(null)
  const block = useRef<HTMLPreElement>(null)

  // One spring per thing that moves. y is in clip heights, spread is a width scale, dip is in pixels.
  const s = useRef({ y: spring(0, 0.002), spread: spring(1, 0.001), dip: spring(0, 0.02) })
  const seated = useRef(true)

  const run = useFrames((dt) => {
    const { y, spread, dip } = s.current
    let moving = false
    for (const sp of [y, spread, dip]) if (advance(sp, dt)) moving = true
    if (!seated.current && y.to === GRIP && y.x >= GRIP * 0.9) {
      // The wire was held open over the paper. It closes on it hard enough to ring a little,
      // and the edge of the block gives under it.
      seated.current = true
      aim(spread, 1, 0.16, 0.42)
      dip.v = 70
    }
    const t = `translateY(${y.x}em) scaleX(${spread.x})`
    if (back.current) back.current.style.transform = t
    if (front.current) front.current.style.transform = t
    if (block.current) block.current.style.transform = dip.x ? `translateY(${dip.x}px)` : ''
    return moving || !seated.current
  })

  const gripped = status !== 'idle'
  useEffect(() => {
    const { y, spread, dip } = s.current
    if (instant || reducedMotion()) {
      jump(y, gripped ? GRIP : 0)
      jump(spread, 1)
      jump(dip, 0)
      seated.current = true
      run()
      return
    }
    if (gripped) {
      // It opens as it slides on, the way a clip spreads to take the paper.
      seated.current = false
      aim(y, GRIP, 0.2)
      aim(spread, 1.14, 0.1)
    } else {
      // Letting go answers nothing the user is waiting on, so it is quick and plain.
      seated.current = true
      aim(y, 0, 0.22)
      aim(spread, 1, 0.2)
    }
    run()
  }, [gripped, instant, run])

  async function onClick(e: MouseEvent) {
    const keyboard = e.detail === 0
    flash('copied', keyboard)
    if (await writeText(value)) onCopy?.(value)
    else flash('failed', keyboard)
  }

  return (
    <div
      {...rest}
      className={cx('gem-clip', className)}
      data-size={size}
      data-status={status}
      data-instant={instant || undefined}
      data-disabled={disabled || undefined}
    >
      {/* Two drawings of the same clip: the whole wire behind the block, the outer loop in front.
          Where they overlap the block, the inner loop is hidden, so the block sits inside the clip. */}
      <span className="gem-clip__clip gem-clip__clip--back" aria-hidden="true">
        <span className="gem-clip__clip-body" ref={back}>
          <ClipDrawing />
        </span>
      </span>
      <pre className="gem-clip__block" ref={block}>
        <code>{children ?? value}</code>
      </pre>
      <button
        type="button"
        className="gem-clip__clip gem-clip__clip--front"
        disabled={disabled}
        aria-label={`Copy ${label ?? value}`}
        onClick={onClick}
      >
        <span className="gem-clip__clip-body" ref={front}>
          <ClipDrawing outerOnly />
        </span>
      </button>
      <span className="gem-clip__note" aria-hidden="true">
        <span>{status === 'failed' ? 'Couldn’t copy' : 'Copied'}</span>
      </span>
      <span className="gem-clip__sr" role="status">
        {status === 'copied' ? 'Copied' : status === 'failed' ? 'Couldn’t copy' : ''}
      </span>
    </div>
  )
}

function ClipDrawing({ outerOnly }: { outerOnly?: boolean }) {
  return (
    <svg viewBox="0 0 40 100" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {!outerOnly && <path d={CLIP_INNER} vectorEffect="non-scaling-stroke" />}
      <path d={CLIP_OUTER} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/** The copied state, how long it lasts, and whether it came from the keyboard. */
function useStatus() {
  const [status, setStatus] = useState<Status>('idle')
  const [instant, setInstant] = useState(false)
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])
  const flash = useCallback((next: Status, keyboard: boolean) => {
    clearTimeout(timer.current)
    setInstant(keyboard)
    setStatus(next)
    // Copying again while it says "Copied" only extends the hold. Nothing replays.
    timer.current = window.setTimeout(() => setStatus('idle'), HOLD)
  }, [])
  return [status, flash, instant] as const
}

async function writeText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // The async API needs a secure page and focus. The old command still works in many other cases.
    const active = document.activeElement as HTMLElement | null
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
    document.body.append(area)
    area.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    area.remove()
    active?.focus()
    return ok
  }
}

/* Spring. Damping and response work as in Apple's two-parameter model: damping 1 doesn't overshoot,
   and response is roughly how many seconds it takes to get there. */

type Spring = { x: number; v: number; to: number; damping: number; response: number; rest: number }

const spring = (x: number, rest: number): Spring => ({ x, v: 0, to: x, damping: 1, response: 0.4, rest })

function aim(s: Spring, to: number, response: number, damping = 1) {
  s.to = to
  s.response = response
  s.damping = damping
}

function jump(s: Spring, to: number) {
  s.x = s.to = to
  s.v = 0
}

/** Returns true while the spring is still moving. */
function advance(s: Spring, dt: number) {
  const w = (2 * Math.PI) / s.response
  // Small fixed steps stay stable with a stiff spring, whatever the frame rate.
  for (let left = dt; left > 0; left -= 1 / 240) {
    const h = Math.min(left, 1 / 240)
    s.v += (-w * w * (s.x - s.to) - 2 * s.damping * w * s.v) * h
    s.x += s.v * h
  }
  if (Math.abs(s.x - s.to) < s.rest && Math.abs(s.v) < s.rest * 10) {
    jump(s, s.to)
    return false
  }
  return true
}

function useFrames(tick: (dt: number) => boolean) {
  const latest = useRef(tick)
  latest.current = tick
  const frame = useRef(0)
  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current)
      frame.current = 0
    },
    [],
  )
  return useCallback(() => {
    if (frame.current) return
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now
      frame.current = latest.current(dt) ? requestAnimationFrame(loop) : 0
    }
    frame.current = requestAnimationFrame(loop)
  }, [])
}

const cx = (...names: (string | undefined)[]) => names.filter(Boolean).join(' ')

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches
