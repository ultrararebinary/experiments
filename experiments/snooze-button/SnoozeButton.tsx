import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import './SnoozeButton.css'

export type SnoozeButtonProps = {
  size?: 'sm' | 'md' | 'lg'
  tone?: 'ink' | 'paper'
  /** Set by the parent. The button never changes it on its own, so a click is never held back. */
  status?: 'idle' | 'loading' | 'success'
  loadingLabel?: string
  successLabel?: string
  /** Without children the button shows its eyes only, and needs an `aria-label`. */
  children?: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

/** How close the pointer has to come, in pixels from the button's edge, to wake the eyes. */
const NEAR = 120
/** Leaving the zone closes the eyes only after this, so skimming its edge doesn't make them flicker. */
const DOZE = 400
/** After a touch, the eyes stay open this long. */
const TOUCH_HOLD = 1000
/** An instant tap still shows the press for this long. */
const MIN_PRESS = 70
/** One turn of the pupils while loading, in seconds. */
const LAP = 0.9

type Lid = 'open' | 'rest' | 'squint' | 'closed'

/* Two eyes sleep at the end of the button, wake when the pointer comes near and watch it. */

export function SnoozeButton({
  size = 'md',
  tone = 'ink',
  status = 'idle',
  loadingLabel = 'Loading',
  successLabel = 'Done',
  children,
  className,
  disabled,
  onClick,
  onPointerDown,
  onFocus,
  onBlur,
  ...rest
}: SnoozeButtonProps) {
  const button = useRef<HTMLButtonElement>(null)
  const eyes = useRef<HTMLSpanElement>(null)
  const pupils = useRef<(HTMLSpanElement | null)[]>([])

  // Why the eyes are open. Any one reason is enough.
  const [near, setNear] = useState(false)
  const [focused, setFocused] = useState(false)
  const [touched, setTouched] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [instant, setInstant] = useState(false)

  const awake = !disabled && status === 'idle' && (near || focused || touched)
  const lid: Lid = disabled ? 'closed' : status !== 'idle' ? 'open' : pressed ? 'squint' : awake ? 'open' : 'rest'

  // One spring per axis per eye, in pupil travel units: 1 is the edge of the eye.
  const springs = useRef([0, 1].map(() => ({ x: spring(0), y: spring(REST_Y) })))
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const clock = useRef(0)
  const instantRef = useRef(instant)
  instantRef.current = instant
  const live = useRef({ awake, status, disabled })
  live.current = { awake, status, disabled }

  const run = useFrames((dt) => {
    const { awake, status } = live.current
    const reduce = reducedMotion()
    clock.current += dt
    let moving = false
    springs.current.forEach((s, i) => {
      const el = pupils.current[i]
      let tx = 0
      let ty = REST_Y
      if (status === 'loading') {
        const a = (clock.current / LAP) * Math.PI * 2 - Math.PI / 2
        ;[tx, ty] = reduce ? [0, -1] : [Math.cos(a), Math.sin(a)]
      } else if (awake) {
        ;[tx, ty] = reduce || !pointer.current || !el ? [0, 0] : lookAt(el, pointer.current)
      }
      aim(s.x, tx)
      aim(s.y, ty)
      if (reduce || instantRef.current) {
        jump(s.x, tx)
        jump(s.y, ty)
      } else {
        if (advance(s.x, dt)) moving = true
        if (advance(s.y, dt)) moving = true
      }
      if (el) el.style.transform = `translate(${s.x.x * TRAVEL}%, ${s.y.x * TRAVEL}%)`
    })
    return moving || (status === 'loading' && !reduce)
  })

  // Follow the pointer while the button is on screen. One listener per button, off when it scrolls away.
  useEffect(() => {
    const el = button.current
    if (!el) return
    let doze = 0
    const wake = (on: boolean) => {
      clearTimeout(doze)
      if (on) setNear(true)
      else doze = window.setTimeout(() => setNear(false), DOZE)
    }
    const onMove = (e: globalThis.PointerEvent) => {
      if (e.pointerType === 'touch') return
      pointer.current = { x: e.clientX, y: e.clientY }
      const r = el.getBoundingClientRect()
      const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right)
      const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom)
      const inside = Math.hypot(dx, dy) < NEAR
      if (inside) setInstant(false)
      wake(inside)
      run()
    }
    const onLeave = () => wake(false)
    const listen = () => {
      window.addEventListener('pointermove', onMove, { passive: true })
      document.documentElement.addEventListener('pointerleave', onLeave)
      window.addEventListener('blur', onLeave)
    }
    const stop = () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
    }
    const seen = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) listen()
      else {
        stop()
        wake(false)
      }
    })
    seen.observe(el)
    return () => {
      seen.disconnect()
      stop()
      clearTimeout(doze)
    }
  }, [run])

  // Any change of state moves the pupils somewhere new.
  useEffect(() => {
    run()
  }, [awake, status, disabled, instant, run])

  // With reduced motion the lids don't slide: the new state fades in instead.
  const firstLid = useRef(true)
  useLayoutEffect(() => {
    if (firstLid.current) {
      firstLid.current = false
      return
    }
    if (!reducedMotion() || instant || !eyes.current) return
    eyes.current.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 150, easing: 'ease' })
  }, [lid, status, instant])

  // Press, driven by the pointer so that Space and Enter don't animate.
  const pressStart = useRef(0)
  const pressTimer = useRef(0)
  const touchTimer = useRef(0)
  useEffect(
    () => () => {
      clearTimeout(pressTimer.current)
      clearTimeout(touchTimer.current)
    },
    [],
  )

  const release = useCallback(() => {
    clearTimeout(pressTimer.current)
    pressTimer.current = window.setTimeout(() => setPressed(false), Math.max(0, MIN_PRESS - (performance.now() - pressStart.current)))
  }, [])

  function handlePointerDown(e: PointerEvent<HTMLButtonElement>) {
    onPointerDown?.(e)
    if (e.button !== 0 || disabled || status === 'loading') return
    setInstant(false)
    clearTimeout(pressTimer.current)
    pressStart.current = performance.now()
    setPressed(true)
    if (e.pointerType === 'touch') {
      // No hover on a phone: the touch itself wakes the eyes, and they look at the finger.
      clearTimeout(touchTimer.current)
      pointer.current = { x: e.clientX, y: e.clientY }
      setTouched(true)
    }
    const up = () => {
      release()
      if (e.pointerType === 'touch') touchTimer.current = window.setTimeout(() => setTouched(false), TOUCH_HOLD)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  function handleFocus(e: FocusEvent<HTMLButtonElement>) {
    onFocus?.(e)
    // From the keyboard the eyes just open, looking straight ahead. The focus ring is the feedback.
    if (e.currentTarget.matches(':focus-visible')) {
      setInstant(true)
      setFocused(true)
    }
  }

  function handleBlur(e: FocusEvent<HTMLButtonElement>) {
    onBlur?.(e)
    setFocused(false)
  }

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    if (status === 'loading') {
      // Busy: a second click would send twice. Focus stays where it is.
      e.preventDefault()
      return
    }
    if (e.detail === 0) setInstant(true)
    onClick?.(e)
  }

  return (
    <>
      <button
        type="button"
        {...rest}
        ref={button}
        className={cx('snooze-button', className)}
        data-size={size}
        data-tone={tone}
        data-status={status}
        data-lid={lid}
        data-pressed={pressed || undefined}
        data-instant={instant || undefined}
        data-icon={children == null || undefined}
        disabled={disabled}
        aria-busy={status === 'loading' || undefined}
        aria-disabled={status === 'loading' || undefined}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {children != null && <span className="snooze-button__label">{children}</span>}
        <span className="snooze-button__eyes" ref={eyes} aria-hidden="true">
          {[0, 1].map((i) => (
            <span className="snooze-button__eye" key={i}>
              <span className="snooze-button__ball">
                {/* No lid is drawn: the white is cut from the top, so the pill itself shows through. */}
                <span className="snooze-button__white">
                  <span
                    className="snooze-button__pupil"
                    ref={(el) => {
                      pupils.current[i] = el
                    }}
                  />
                </span>
              </span>
              <svg className="snooze-button__smile" viewBox="0 0 20 20">
                <path d="M4 13 Q10 4 16 13" />
              </svg>
            </span>
          ))}
        </span>
      </button>
      <span className="snooze-button__sr" role="status">
        {status === 'loading' ? loadingLabel : status === 'success' ? successLabel : ''}
      </span>
    </>
  )
}

/** How far a pupil can travel, in its own widths times 100: it stops just short of the edge of the eye. */
const TRAVEL = 64

/** Asleep, the pupils sink a little, so they show under the lid. */
const REST_Y = 0.45

/** Where a pupil should sit to look at the pointer: further from the center the further away it is. */
function lookAt(pupil: HTMLElement, p: { x: number; y: number }): [number, number] {
  const ball = pupil.parentElement!.getBoundingClientRect()
  const cx = ball.left + ball.width / 2
  const cy = ball.top + ball.height / 2
  const dx = p.x - cx
  const dy = p.y - cy
  const d = Math.hypot(dx, dy)
  if (d < 0.5) return [0, 0]
  // Full travel once the pointer is three eye-widths away.
  const reach = Math.min(1, d / (ball.width * 3))
  return [(dx / d) * reach, (dy / d) * reach]
}

/* Spring. Damping and response work as in Apple's two-parameter model: damping 1 doesn't overshoot,
   and response is roughly how many seconds it takes to get there. */

type Spring = { x: number; v: number; to: number }

const RESPONSE = 0.2

const spring = (x: number): Spring => ({ x, v: 0, to: x })

function aim(s: Spring, to: number) {
  s.to = to
}

function jump(s: Spring, to: number) {
  s.x = s.to = to
  s.v = 0
}

/** Returns true while the spring is still moving. */
function advance(s: Spring, dt: number) {
  const w = (2 * Math.PI) / RESPONSE
  for (let left = dt; left > 0; left -= 1 / 240) {
    const h = Math.min(left, 1 / 240)
    s.v += (-w * w * (s.x - s.to) - 2 * w * s.v) * h
    s.x += s.v * h
  }
  if (Math.abs(s.x - s.to) < 0.002 && Math.abs(s.v) < 0.02) {
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
