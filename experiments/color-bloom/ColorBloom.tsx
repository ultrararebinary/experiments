import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
} from 'react'
import './ColorBloom.css'

export type ColorBloomProps = Omit<HTMLAttributes<HTMLSpanElement>, 'onChange' | 'defaultValue'> & {
  size?: 'sm' | 'md' | 'lg'
  /** Hex color, for a controlled picker. */
  value?: string
  defaultValue?: string
  onChange?: (hex: string) => void
  disabled?: boolean
  /** Adds a hidden input, so the color is sent with a form. */
  name?: string
}

/* Color. Everything is picked in OKLCH, where equal steps look like equal steps. */

const MAX_CHROMA = 0.16

function oklchToLinear(l: number, c: number, h: number) {
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)
  const m1 = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m2 = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const m3 = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * m1 - 3.3077115913 * m2 + 0.2309699292 * m3,
    -1.2684380046 * m1 + 2.6097574011 * m2 - 0.3413193965 * m3,
    -0.0041960863 * m1 - 0.7034186147 * m2 + 1.707614701 * m3,
  ]
}

/** The most vivid chroma this lightness and hue can show on a normal screen. */
function maxChroma(l: number, h: number) {
  const fits = (c: number) => oklchToLinear(l, c, h).every((v) => v >= -0.0005 && v <= 1.0005)
  if (fits(MAX_CHROMA)) return MAX_CHROMA
  let low = 0
  let high = MAX_CHROMA
  for (let i = 0; i < 8; i++) {
    const mid = (low + high) / 2
    if (fits(mid)) low = mid
    else high = mid
  }
  return low
}

function toHex(h: number, l: number, s = 1) {
  const channels = oklchToLinear(l, maxChroma(l, h) * s, h).map((v) => {
    const c = Math.min(1, Math.max(0, v))
    const encoded = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055
    return Math.round(encoded * 255).toString(16).padStart(2, '0')
  })
  return `#${channels.join('')}`
}

type Color = { h: number; l: number; s: number; hex: string }

function parseHex(input: string, previousHue = 0): Color {
  const short = input.replace('#', '').toLowerCase()
  const full = short.length === 3 ? [...short].map((c) => c + c).join('') : short
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  const m1 = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m2 = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const m3 = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const l = 0.2104542553 * m1 + 0.793617785 * m2 - 0.0040720468 * m3
  const a = 1.9779984951 * m1 - 2.428592205 * m2 + 0.4505937099 * m3
  const bb = 0.0259040371 * m1 + 0.7827717662 * m2 - 0.808675766 * m3
  const c = Math.hypot(a, bb)
  // Grays, black and white have no hue. Keep the last one so nothing jumps.
  const h = c < 0.002 ? previousHue : wrap((Math.atan2(bb, a) * 180) / Math.PI)
  const max = maxChroma(l, h)
  const s = max > 0.002 ? Math.min(1, c / max) : 1
  return { h, l, s: s > 0.97 ? 1 : s, hex: `#${full}` }
}

const wrap = (h: number) => ((h % 360) + 360) % 360
const clamp = (v: number, low: number, high: number) => Math.min(high, Math.max(low, v))
/** The shortest way around the circle, from -180 to 180. */
const turn = (degrees: number) => wrap(degrees + 180) - 180

const HUE_NAMES: [number, string][] = [
  [10, 'pink'], [50, 'red'], [75, 'orange'], [115, 'yellow'], [165, 'green'],
  [215, 'teal'], [275, 'blue'], [320, 'violet'], [360, 'pink'],
]

function describe({ h, l, s, hex }: Color) {
  const tone = l > 0.97 ? 'white' : l < 0.05 ? 'black' : s < 0.1 ? 'gray' : HUE_NAMES.find(([end]) => h < end)?.[1]
  const shade = l > 0.97 || l < 0.05 ? '' : l > 0.78 ? 'light ' : l < 0.42 ? 'dark ' : ''
  return `${shade}${tone}, ${hex}`
}

/* Motion. Springs use Apple's two parameters: damping ratio and response, in seconds. */

type Axis = { x: number; v: number }

function spring(a: Axis, target: number, damping: number, response: number, dt: number) {
  const omega = (2 * Math.PI) / response
  for (let left = dt; left > 0; left -= 1 / 240) {
    const step = Math.min(left, 1 / 240)
    a.v += (-omega * omega * (a.x - target) - 2 * damping * omega * a.v) * step
    a.x += a.v * step
  }
}

function rubberband(overshoot: number, dimension: number) {
  return (overshoot * dimension * 0.55) / (dimension + 0.55 * Math.abs(overshoot))
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const axis = (x = 0): Axis => ({ x, v: 0 })
const isAtRest = (a: Axis, target: number, near = 0.01, slow = 0.1) =>
  Math.abs(a.x - target) < near && Math.abs(a.v) < slow

/* The ring. Eleven evenly spaced hues, red at the top, and one gray. */

const PETALS = 12
const GRAY = PETALS - 1
const FIRST_HUE = 25
const STEP = 360 / PETALS
const RADIUS = { sm: 58, md: 82, lg: 112 }
const DOT = { sm: 22, md: 30, lg: 44 }
const PETAL_TONE = 0.68
const GRAY_TONE = 0.6

const petalHue = (i: number) => FIRST_HUE + (i * 360) / GRAY
const baseTone = (i: number) => (i === GRAY ? GRAY_TONE : PETAL_TONE)
const toneAt = (i: number, offset: number) => clamp(baseTone(i) - offset * (i === GRAY ? 0.58 : 0.3), 0, 1)

function nearestPetal({ h, s }: Color) {
  if (s < 0.1) return GRAY
  return ((Math.round((h - FIRST_HUE) / (360 / GRAY)) % GRAY) + GRAY) % GRAY
}

function petalState(): Petal {
  return { radius: axis(), twist: axis(), scale: axis(), opacity: axis(), delay: 0 }
}

type Petal = { radius: Axis; twist: Axis; scale: Axis; opacity: Axis; delay: number }

/** Where a petal waits before it opens, and where it goes back to. */
const CLOSED_TWIST = -46
const CLOSED_SCALE = 0.3

export function ColorBloom({
  size = 'md',
  value,
  defaultValue,
  onChange,
  disabled,
  name,
  className,
  style,
  'aria-label': label = 'Color',
  ...rest
}: ColorBloomProps) {
  const [color, setColor] = useState(() => parseHex(value ?? defaultValue ?? '#d6473f'))
  const current = useRef(color)
  const emitted = useRef(color.hex)
  const callback = useRef(onChange)
  callback.current = onChange

  const set = useCallback((h: number, l: number, s: number) => {
    const next = { h: wrap(h), l, s, hex: toHex(wrap(h), l, s) }
    current.current = next
    setColor(next)
    if (next.hex !== emitted.current) {
      emitted.current = next.hex
      callback.current?.(next.hex)
    }
  }, [])

  // `shown` is what the dot wears. It only takes a picked color once it has arrived.
  const [shown, setShown] = useState(color.hex)
  const absorbing = useRef<Animation | null>(null)

  useEffect(() => {
    if (!value || value.toLowerCase() === emitted.current) return
    const next = parseHex(value, current.current.h)
    current.current = next
    emitted.current = next.hex
    setColor(next)
  }, [value])

  useEffect(() => {
    if (!absorbing.current) setShown(color.hex)
  }, [color.hex])

  const id = useId()
  const dot = useRef<HTMLButtonElement>(null)
  const fill = useRef<HTMLSpanElement>(null)
  const ripple = useRef<HTMLSpanElement>(null)
  const stem = useRef<HTMLSpanElement>(null)
  const petalEls = useRef<HTMLSpanElement[]>([])
  const seedEls = useRef<HTMLSpanElement[]>([])
  const radius = RADIUS[size]
  const dotSize = DOT[size]

  const [open, setOpen] = useState<false | 'pointer' | 'keys'>(false)
  const [active, setActive] = useState<number | null>(null)
  const [tone, setTone] = useState(0) // -1 lightest, 0 the petal's own color, 1 darkest

  const m = useRef({
    phase: 'closed' as 'closed' | 'open' | 'closing' | 'absorbing',
    instant: false,
    frame: 0,
    last: 0,
    active: null as number | null,
    tone: 0,
    pull: 0,
    angle: 0, // pointer angle
    pointing: false,
    latched: false,
    wandered: false,
    arrived: false,
    pending: null as { hex: string; angle: number } | null,
    petals: Array.from({ length: PETALS }, petalState),
    stemLength: axis(),
    stemAngle: axis(),
    stemOpacity: axis(),
    dotScale: axis(1),
    leanX: axis(),
    leanY: axis(),
  })

  // Called every frame while anything is moving. Each petal is its own set of springs,
  // so opening, picking and closing can interrupt each other at any moment.
  const tick = useCallback(
    (now: number) => {
      const d = m.current
      const dt = Math.min((now - d.last) / 1000, 1 / 20)
      d.last = now
      const still = d.instant || prefersReducedMotion()
      let busy = false

      d.petals.forEach((p, i) => {
        const angle = i * STEP
        const isActive = d.active === i && d.phase === 'open'
        let targetRadius = 0
        let targetTwist = CLOSED_TWIST
        let targetScale = CLOSED_SCALE
        let targetOpacity = 0
        let response = 0.15
        let damping = 1

        if (d.phase === 'open') {
          p.delay = Math.max(0, p.delay - dt)
          if (p.delay === 0) {
            // Closeness to the pointer, around the circle: 1 on it, near 0 two petals away.
            const off = turn(angle - d.angle)
            const near = d.pointing ? Math.exp(-((off / 26) ** 2)) : 0
            targetRadius = radius + (isActive ? d.pull : radius * 0.07 * near)
            // Neighbors lean away to make room.
            targetTwist = isActive || !d.pointing ? 0 : Math.sign(off) * 5 * Math.exp(-((off / 38) ** 2))
            targetScale = !d.pointing ? 1 : isActive ? 1.42 : 0.8 + 0.3 * near
            targetOpacity = !d.pointing ? 1 : isActive ? 1 : 0.3 + 0.6 * near
            response = isActive ? 0.08 : 0.3
            damping = isActive ? 1 : 0.74
          }
        } else if (d.phase === 'absorbing' && i === d.active) {
          // The picked petal runs down the stem into the dot.
          targetTwist = 0
          targetScale = 0.55
          targetOpacity = p.radius.x > dotSize / 2 ? 1 : 0
          response = 0.17
        }

        if (d.instant) {
          // The keyboard never animates, but the active petal still has to stand out.
          p.radius = axis(targetRadius)
          p.twist = axis(targetTwist)
          p.scale = axis(targetScale)
          p.opacity = axis(targetOpacity)
        } else if (still) {
          // Reduced motion: petals are already in place and only fade.
          p.radius = axis(radius)
          p.twist = axis()
          p.scale = axis(1)
          spring(p.opacity, targetOpacity, 1, 0.16, dt)
        } else {
          spring(p.radius, targetRadius, damping, response, dt)
          spring(p.twist, targetTwist, Math.max(damping, 0.9), response, dt)
          spring(p.scale, targetScale, damping, response * 0.85, dt)
          spring(p.opacity, targetOpacity, 1, Math.min(response, 0.12), dt)
        }

        const el = petalEls.current[i]
        if (el) {
          const theta = ((angle + p.twist.x) * Math.PI) / 180
          const x = Math.sin(theta) * p.radius.x
          const y = -Math.cos(theta) * p.radius.x
          el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${Math.max(p.scale.x, 0).toFixed(3)})`
          el.style.opacity = clamp(p.opacity.x, 0, 1).toFixed(3)
          el.style.visibility = p.opacity.x > 0.005 || targetOpacity > 0 ? 'visible' : 'hidden'
        }
        // A petal leaves the dot wearing the dot's color, and turns into its own on the way out.
        const seed = seedEls.current[i]
        if (seed) seed.style.opacity = still ? '0' : clamp(1 - p.radius.x / (radius * 0.72), 0, 1).toFixed(3)

        if (
          !isAtRest(p.radius, targetRadius, 0.05, 1) ||
          !isAtRest(p.scale, targetScale, 0.002, 0.02) ||
          !isAtRest(p.opacity, targetOpacity, 0.004, 0.05) ||
          !isAtRest(p.twist, targetTwist, 0.05, 1) ||
          p.delay > 0
        ) {
          if (!still || !isAtRest(p.opacity, targetOpacity, 0.004, 0.05)) busy = true
        }
      })

      // The stem joins the dot to the petal being picked, and shortens as the color runs down it.
      const picked = d.active !== null ? d.petals[d.active] : null
      const stemVisible = picked !== null && (d.phase === 'open' ? d.pointing : d.phase === 'absorbing' && !d.arrived)
      const stemTarget = picked && stemVisible ? Math.max(picked.radius.x, 0) : 0
      const anglePetal = d.active !== null ? d.active * STEP : d.stemAngle.x
      if (still) {
        d.stemLength = axis(stemTarget)
        d.stemAngle = axis(anglePetal)
        d.stemOpacity = axis(stemVisible ? 1 : 0)
      } else {
        spring(d.stemLength, stemTarget, 1, 0.1, dt)
        spring(d.stemAngle, d.stemAngle.x + turn(anglePetal - d.stemAngle.x), 1, 0.12, dt)
        spring(d.stemOpacity, stemVisible ? 1 : 0, 1, 0.09, dt)
      }
      if (stem.current) {
        stem.current.style.transform = `rotate(${d.stemAngle.x.toFixed(2)}deg) scaleY(${Math.max(d.stemLength.x, 0).toFixed(2)})`
        stem.current.style.opacity = clamp(d.stemOpacity.x, 0, 1).toFixed(3)
      }
      if (!isAtRest(d.stemOpacity, stemVisible ? 1 : 0, 0.004, 0.05) || !isAtRest(d.stemLength, stemTarget, 0.1, 2)) busy = true

      // The dot shrinks to let the ring through, and leans toward whatever is being picked.
      const openScale = d.phase === 'open' ? 0.82 : 1
      const leanOn = d.phase === 'open' && d.pointing && !still
      const leanTheta = (d.angle * Math.PI) / 180
      const leanTargetX = leanOn ? Math.sin(leanTheta) * radius * 0.07 : 0
      const leanTargetY = leanOn ? -Math.cos(leanTheta) * radius * 0.07 : 0
      if (still) {
        d.dotScale = axis(1)
        d.leanX = axis()
        d.leanY = axis()
      } else {
        spring(d.dotScale, openScale, d.phase === 'open' ? 0.8 : 0.48, 0.3, dt)
        spring(d.leanX, leanTargetX, 0.8, 0.22, dt)
        spring(d.leanY, leanTargetY, 0.8, 0.22, dt)
      }
      if (dot.current) {
        dot.current.style.transform = still
          ? ''
          : `translate3d(${d.leanX.x.toFixed(2)}px, ${d.leanY.x.toFixed(2)}px, 0) scale(${d.dotScale.x.toFixed(3)})`
      }
      if (!isAtRest(d.dotScale, openScale, 0.001, 0.01) || !isAtRest(d.leanX, leanTargetX, 0.02, 0.2) || !isAtRest(d.leanY, leanTargetY, 0.02, 0.2)) busy = true

      // The petal has reached the dot: the color floods in from the side it came from.
      if (d.phase === 'absorbing' && !d.arrived && picked && picked.radius.x <= dotSize * 0.55) {
        d.arrived = true
        const pending = d.pending
        if (pending && fill.current && !still) {
          d.dotScale.v += 3.2
          const fx = 50 + Math.sin((pending.angle * Math.PI) / 180) * 50
          const fy = 50 - Math.cos((pending.angle * Math.PI) / 180) * 50
          fill.current.style.background = pending.hex
          const flood = fill.current.animate(
            [
              { clipPath: `circle(0% at ${fx}% ${fy}%)` },
              { clipPath: `circle(150% at ${fx}% ${fy}%)` },
            ],
            { duration: 200, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'forwards' },
          )
          absorbing.current = flood
          const done = () => {
            if (absorbing.current !== flood) return
            absorbing.current = null
            setShown(current.current.hex)
            flood.cancel()
          }
          flood.onfinish = done
          flood.oncancel = done
          ripple.current?.animate(
            [
              { transform: 'scale(1)', opacity: 0.55, borderColor: pending.hex },
              { transform: 'scale(2.5)', opacity: 0, borderColor: pending.hex },
            ],
            { duration: 420, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
          )
        }
        d.pending = null
      }

      if (d.phase === 'absorbing' && d.arrived && !busy) d.phase = 'closed'
      if (d.phase === 'closing' && !busy) d.phase = 'closed'

      if (busy || d.phase === 'absorbing' || d.phase === 'closing') {
        d.frame = requestAnimationFrame(tick)
      } else {
        d.frame = 0
        if (d.phase === 'closed' && dot.current) dot.current.style.transform = ''
      }
    },
    [radius, dotSize],
  )

  const wake = useCallback(() => {
    const d = m.current
    if (d.frame) return
    d.last = performance.now()
    d.frame = requestAnimationFrame(tick)
  }, [tick])

  useEffect(
    () => () => {
      cancelAnimationFrame(m.current.frame)
      absorbing.current?.cancel()
    },
    [],
  )

  const reset = useCallback(() => {
    const d = m.current
    d.latched = false
    d.wandered = false
    d.tone = 0
    d.pull = 0
    d.pointing = false
    setOpen(false)
    setActive(null)
    setTone(0)
  }, [])

  const close = useCallback(() => {
    const d = m.current
    d.phase = 'closing'
    d.active = null
    d.instant = false
    reset()
    wake()
  }, [reset, wake])

  const pick = useCallback(
    (i: number, offset: number, withFlood: boolean) => {
      const d = m.current
      const l = toneAt(i, offset)
      const s = i === GRAY ? 0 : 1
      const h = i === GRAY ? current.current.h : petalHue(i)
      if (withFlood && !prefersReducedMotion()) {
        // The value changes right away. Only the picture waits for the petal to arrive.
        absorbing.current = absorbing.current ?? new Animation()
        d.pending = { hex: toHex(h, l, s), angle: i * STEP }
        d.arrived = false
        d.phase = 'absorbing'
        set(h, l, s)
        reset()
        // The petal keeps the exact shade that was picked while it runs back.
        setActive(i)
        setTone(offset)
        wake()
      } else {
        set(h, l, s)
        d.active = null
        d.phase = d.instant ? 'closed' : 'closing'
        reset()
        wake()
      }
    },
    [reset, set, wake],
  )

  function bloom(mode: 'pointer' | 'keys') {
    const d = m.current
    // A second press during the flood finishes it at once, so nothing is lost.
    const flooding = absorbing.current
    if (flooding) {
      if (flooding.playState === 'idle') {
        absorbing.current = null
        setShown(current.current.hex)
      } else {
        flooding.finish()
      }
    }
    d.pending = null
    d.arrived = false
    d.active = mode === 'keys' ? nearestPetal(current.current) : null
    d.tone = 0
    d.pull = 0
    d.pointing = mode === 'keys'
    d.angle = d.active !== null ? d.active * STEP : 0
    d.instant = mode === 'keys'
    d.latched = false
    d.wandered = false
    const wasClosed = d.phase === 'closed'
    d.phase = 'open'
    const origin = nearestPetal(current.current)
    d.petals.forEach((p, i) => {
      const steps = Math.min(Math.abs(i - origin), PETALS - Math.abs(i - origin))
      // Each petal starts a little later the farther it is from the current color.
      p.delay = mode === 'keys' ? 0 : steps * 0.012
      if (wasClosed) {
        p.radius = axis(dotSize * 0.2)
        p.twist = axis(CLOSED_TWIST)
        p.scale = axis(CLOSED_SCALE)
        p.opacity = axis(0)
      }
    })
    setOpen(mode)
    setActive(d.active)
    setTone(0)
    wake()
  }

  // While open the whole window listens, so the gesture survives leaving the button.
  useEffect(() => {
    if (open !== 'pointer') return
    const d = m.current

    function track(e: globalThis.PointerEvent) {
      const rect = dot.current!.parentElement!.getBoundingClientRect()
      const dx = e.clientX - (rect.left + rect.width / 2)
      const dy = e.clientY - (rect.top + rect.height / 2)
      const distance = Math.hypot(dx, dy)
      if (distance < radius * 0.42) {
        d.active = null
        d.pointing = false
        d.tone = 0
        d.pull = 0
        setActive(null)
        setTone(0)
      } else {
        d.wandered = true
        d.pointing = true
        d.angle = wrap((Math.atan2(dx, -dy) * 180) / Math.PI)
        const i = Math.round(d.angle / STEP) % PETALS
        const over = distance - radius
        d.active = i
        d.tone = clamp(over / (radius * 0.5), -1, 1)
        d.pull = rubberband(over, radius * 0.9)
        setActive(i)
        setTone(d.tone)
      }
      wake()
    }

    function press(e: globalThis.PointerEvent) {
      if (!d.latched || dot.current?.contains(e.target as Node)) return
      const rect = dot.current!.parentElement!.getBoundingClientRect()
      const far = Math.hypot(e.clientX - rect.left - rect.width / 2, e.clientY - rect.top - rect.height / 2)
      if (far > radius * 1.7) close()
      else track(e)
    }

    function release() {
      if (d.active !== null) {
        pick(d.active, d.tone, true)
      } else if (d.wandered || d.latched) {
        close() // came back to the center: nothing changes
      } else {
        d.latched = true // a plain tap keeps it open
      }
    }

    window.addEventListener('pointermove', track)
    window.addEventListener('pointerdown', press)
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', close)
    return () => {
      window.removeEventListener('pointermove', track)
      window.removeEventListener('pointerdown', press)
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', close)
    }
  }, [open, radius, close, pick, wake])

  function keys(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return
    const d = m.current
    if (!open) {
      if (!['Enter', ' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
      e.preventDefault()
      bloom('keys')
      return
    }
    if (e.key === 'Escape' || e.key === 'Tab') {
      if (e.key === 'Escape') e.preventDefault()
      close()
      d.instant = open === 'keys'
      return
    }
    if (open === 'pointer') return
    const i = d.active ?? 0
    d.instant = true
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const next = (i + (e.key === 'ArrowRight' ? 1 : PETALS - 1)) % PETALS
      d.active = next
      d.angle = next * STEP
      d.tone = 0
      d.pull = 0
      setActive(next)
      setTone(0)
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      d.tone = clamp(d.tone + (e.key === 'ArrowDown' ? 0.25 : -0.25), -1, 1)
      d.pull = d.tone * radius * 0.3
      setTone(d.tone)
    } else if (e.key === 'Enter' || e.key === ' ') {
      pick(i, d.tone, false)
    } else {
      return
    }
    e.preventDefault()
    wake()
  }

  const pickedHex =
    active === null
      ? null
      : toHex(active === GRAY ? color.h : petalHue(active), toneAt(active, tone), active === GRAY ? 0 : 1)
  const spoken = open && pickedHex ? parseHex(pickedHex, color.h) : color

  return (
    <>
      <span
        {...rest}
        className={className ? `cb ${className}` : 'cb'}
        data-size={size}
        data-disabled={disabled || undefined}
        data-open={open || undefined}
        style={{ '--cb-color': shown, ...style } as CSSProperties}
      >
        <span
          className="cb__stem"
          ref={stem}
          style={{ background: `linear-gradient(to top, ${shown}, ${pickedHex ?? emitted.current})` }}
          aria-hidden="true"
        />
        <span className="cb__ripple" ref={ripple} aria-hidden="true" />
        <span className="cb__ring" id={`${id}-petals`} role="listbox" aria-label={`${label} options`}>
          {Array.from({ length: PETALS }, (_, i) => {
            const hex =
              active === i && pickedHex ? pickedHex : i === GRAY ? toHex(color.h, GRAY_TONE, 0) : toHex(petalHue(i), PETAL_TONE)
            return (
              <span
                key={i}
                id={`${id}-${i}`}
                className="cb__petal"
                role="option"
                aria-selected={active === i}
                aria-label={describe({ h: petalHue(i), l: baseTone(i), s: i === GRAY ? 0 : 1, hex })}
                ref={(el) => {
                  if (el) petalEls.current[i] = el
                }}
              >
                <span className="cb__swatch" style={{ background: hex }}>
                  <span
                    className="cb__seed"
                    ref={(el) => {
                      if (el) seedEls.current[i] = el
                    }}
                  />
                </span>
              </span>
            )
          })}
        </span>
        <button
          ref={dot}
          type="button"
          className="cb__dot"
          disabled={disabled}
          aria-label={`${label}: ${describe(spoken)}`}
          aria-haspopup="listbox"
          aria-expanded={Boolean(open)}
          aria-controls={`${id}-petals`}
          aria-activedescendant={open && active !== null ? `${id}-${active}` : undefined}
          onPointerDown={(e) => {
            if (disabled || e.button !== 0) return
            if (open) {
              if (open === 'keys') close()
              return
            }
            // Open on the way down, so the ring is there before the finger moves.
            bloom('pointer')
          }}
          onKeyDown={keys}
        >
          <span className="cb__fill" ref={fill} aria-hidden="true" />
        </button>
      </span>
      {name && <input type="hidden" name={name} value={color.hex} />}
    </>
  )
}
