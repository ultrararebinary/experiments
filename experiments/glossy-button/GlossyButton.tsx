import {
  useCallback,
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from 'react'
import './GlossyButton.css'

export type GlossyButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: 'sm' | 'md' | 'lg'
  /** Preset color. Leave it out and set `--accent` yourself for any other color. */
  tone?: 'blue' | 'violet' | 'green' | 'neutral'
  /** A light band sweeps across the button on hover. */
  shine?: boolean
  /** Secondary detail shown after the label, like a price. */
  trailing?: ReactNode
  ref?: Ref<HTMLButtonElement>
}

type Spring = { damping: number; response: number }

// Springs use Apple's two parameters: damping ratio (1 = no bounce, lower = more
// bounce) and response (roughly how long it takes to get there, in seconds).
// Going down is quick and settles without bounce, so the press feels immediate.
const PRESS: Spring = { damping: 1, response: 0.12 }
// Coming back up overshoots a little, then settles.
const RELEASE: Spring = { damping: 0.55, response: 0.32 }

const MAX_STEP = 1 / 240
// A trackpad tap can press and release within the same frame. Keep the button down
// at least this long so every click is visible. The click event itself is not delayed.
const MIN_PRESS_MS = 70

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Drives `--gb-press` (0 = resting, 1 = pressed in) with a small spring.
 * The spring keeps its position and velocity between targets, so a release in the
 * middle of a press starts from where the button is and how fast it is moving.
 */
function usePressSpring() {
  const node = useRef<HTMLButtonElement | null>(null)
  const motion = useRef({ value: 0, velocity: 0, target: 0, spring: PRESS, frame: 0, time: 0 })
  const hold = useRef({ since: 0, timer: 0 })

  const write = useCallback((value: number) => {
    node.current?.style.setProperty('--gb-press', value.toFixed(4))
  }, [])

  const tick = useCallback(
    (now: number) => {
      const m = motion.current
      let elapsed = Math.min((now - m.time) / 1000, 1 / 20)
      m.time = now

      const omega = (2 * Math.PI) / m.spring.response
      const stiffness = omega * omega
      const friction = 2 * m.spring.damping * omega

      while (elapsed > 0) {
        const dt = Math.min(elapsed, MAX_STEP)
        const acceleration = -stiffness * (m.value - m.target) - friction * m.velocity
        m.velocity += acceleration * dt
        m.value += m.velocity * dt
        elapsed -= dt
      }

      if (Math.abs(m.value - m.target) < 0.0005 && Math.abs(m.velocity) < 0.01) {
        m.value = m.target
        m.velocity = 0
        m.frame = 0
      } else {
        m.frame = requestAnimationFrame(tick)
      }
      write(m.value)
    },
    [write],
  )

  const animateTo = useCallback(
    (target: number, spring: Spring) => {
      const m = motion.current
      const el = node.current
      if (!el || m.target === target) return
      m.target = target
      m.spring = spring
      el.toggleAttribute('data-pressed', target === 1)

      if (prefersReducedMotion()) {
        // No movement: jump to the end state, CSS fades the shading instead.
        cancelAnimationFrame(m.frame)
        m.frame = 0
        m.value = target
        m.velocity = 0
        write(target)
        return
      }
      if (!m.frame) {
        m.time = performance.now()
        m.frame = requestAnimationFrame(tick)
      }
    },
    [tick, write],
  )

  useEffect(
    () => () => {
      cancelAnimationFrame(motion.current.frame)
      window.clearTimeout(hold.current.timer)
    },
    [],
  )

  function press() {
    window.clearTimeout(hold.current.timer)
    hold.current.timer = 0
    if (motion.current.target !== 1) hold.current.since = performance.now()
    animateTo(1, PRESS)
  }

  function release() {
    if (motion.current.target !== 1 || hold.current.timer) return
    const remaining = MIN_PRESS_MS - (performance.now() - hold.current.since)
    if (remaining <= 0) return animateTo(0, RELEASE)
    hold.current.timer = window.setTimeout(() => {
      hold.current.timer = 0
      animateTo(0, RELEASE)
    }, remaining)
  }

  return { node, press, release }
}

export function GlossyButton({
  size = 'md',
  tone,
  shine = false,
  trailing,
  className,
  children,
  type = 'button',
  ref,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerEnter,
  onPointerCancel,
  ...rest
}: GlossyButtonProps) {
  const { node, press, release } = usePressSpring()

  const setRef = useCallback(
    (el: HTMLButtonElement | null) => {
      node.current = el
      if (typeof ref === 'function') ref(el)
      else if (ref) ref.current = el
    },
    [node, ref],
  )

  return (
    <button
      {...rest}
      ref={setRef}
      type={type}
      className={className ? `gb ${className}` : 'gb'}
      data-size={size}
      data-tone={tone}
      data-shine={shine || undefined}
      onPointerDown={(e: PointerEvent<HTMLButtonElement>) => {
        onPointerDown?.(e)
        if (e.button === 0 && !e.currentTarget.disabled) press()
      }}
      onPointerUp={(e: PointerEvent<HTMLButtonElement>) => {
        onPointerUp?.(e)
        release()
      }}
      onPointerCancel={(e: PointerEvent<HTMLButtonElement>) => {
        onPointerCancel?.(e)
        release()
      }}
      onPointerLeave={(e: PointerEvent<HTMLButtonElement>) => {
        onPointerLeave?.(e)
        release()
      }}
      onPointerEnter={(e: PointerEvent<HTMLButtonElement>) => {
        onPointerEnter?.(e)
        // Dragging off cancels the press; coming back while still holding resumes it.
        if (e.pointerType === 'mouse' && e.buttons & 1 && !e.currentTarget.disabled) press()
      }}
    >
      <span className="gb__glow" aria-hidden="true" />
      {shine && <span className="gb__shine" aria-hidden="true" />}
      <span className="gb__label">{children}</span>
      {trailing != null && <span className="gb__trailing">{trailing}</span>}
    </button>
  )
}
