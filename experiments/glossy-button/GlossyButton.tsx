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
  /**
   * `key`: the button has thickness, like a keycap. Hover lifts it off its base.
   * `light`: a flat glossy button. Hover lights the face where the cursor is.
   * `key-light`: the keycap, with a softer version of that light.
   */
  variant?: 'key' | 'light' | 'key-light'
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
// The cursor light trails the pointer slightly and never wobbles.
const LIGHT: Spring = { damping: 1, response: 0.16 }

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

/**
 * Moves the light layers to follow the mouse over the face. X and Y are separate
 * springs, and positions are written to `transform` directly, frame by frame.
 */
function useCursorLight() {
  const face = useRef<HTMLSpanElement | null>(null)
  const spots = useRef<HTMLSpanElement[]>([])
  const track = useRef({ x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, frame: 0, time: 0 })

  const place = useCallback((x: number, y: number) => {
    for (const el of spots.current) el.style.transform = `translate3d(${x}px, ${y}px, 0)`
  }, [])

  const step = useCallback(
    (now: number) => {
      const t = track.current
      const dt = Math.min((now - t.time) / 1000, 1 / 30)
      t.time = now
      const omega = (2 * Math.PI) / LIGHT.response
      const friction = 2 * LIGHT.damping * omega
      t.vx += (-omega * omega * (t.x - t.tx) - friction * t.vx) * dt
      t.vy += (-omega * omega * (t.y - t.ty) - friction * t.vy) * dt
      t.x += t.vx * dt
      t.y += t.vy * dt
      place(t.x, t.y)
      const settled =
        Math.abs(t.x - t.tx) < 0.1 && Math.abs(t.y - t.ty) < 0.1 && Math.abs(t.vx) + Math.abs(t.vy) < 1
      t.frame = settled ? 0 : requestAnimationFrame(step)
    },
    [place],
  )

  useEffect(() => () => cancelAnimationFrame(track.current.frame), [])

  function pointer(e: PointerEvent) {
    const r = face.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height }
  }

  return {
    face,
    spot: (i: number) => (el: HTMLSpanElement | null) => {
      if (el) spots.current[i] = el
    },
    enter(e: PointerEvent) {
      if (e.pointerType !== 'mouse' || !face.current) return
      const p = pointer(e)
      // With reduced motion the light sits in the middle and stays there.
      const still = prefersReducedMotion()
      const x = still ? p.w / 2 : p.x
      const y = still ? p.h / 2 : p.y
      // Start where the pointer comes in, so the light never slides in from a corner.
      cancelAnimationFrame(track.current.frame)
      Object.assign(track.current, { x, y, tx: x, ty: y, vx: 0, vy: 0, frame: 0 })
      place(x, y)
    },
    move(e: PointerEvent) {
      if (e.pointerType !== 'mouse' || !face.current || prefersReducedMotion()) return
      const p = pointer(e)
      const t = track.current
      t.tx = p.x
      t.ty = p.y
      if (!t.frame) {
        t.time = performance.now()
        t.frame = requestAnimationFrame(step)
      }
    },
  }
}

export function GlossyButton({
  variant = 'key',
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
  onPointerMove,
  ...rest
}: GlossyButtonProps) {
  const { node, press, release } = usePressSpring()
  const light = useCursorLight()
  const hasBase = variant !== 'light'
  const hasLight = variant !== 'key'

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
      data-variant={variant}
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
        if (hasLight) light.enter(e)
        // Dragging off cancels the press; coming back while still holding resumes it.
        if (e.pointerType === 'mouse' && e.buttons & 1 && !e.currentTarget.disabled) press()
      }}
      onPointerMove={(e: PointerEvent<HTMLButtonElement>) => {
        onPointerMove?.(e)
        if (hasLight) light.move(e)
      }}
    >
      {hasBase && <span className="gb__base" aria-hidden="true" />}
      <span className="gb__face" ref={light.face}>
        <span className="gb__glow" aria-hidden="true" />
        {hasLight && (
          <>
            <span className="gb__light" aria-hidden="true">
              <span className="gb__spot" ref={light.spot(0)} />
            </span>
            <span className="gb__rim" aria-hidden="true">
              <span className="gb__rim-spot" ref={light.spot(1)} />
            </span>
          </>
        )}
        {shine && <span className="gb__shine" aria-hidden="true" />}
        <span className="gb__label">{children}</span>
        {trailing != null && <span className="gb__trailing">{trailing}</span>}
      </span>
    </button>
  )
}
