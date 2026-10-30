import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent,
} from 'react'
import './ColorDrift.css'

export type ColorDriftProps = Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> & {
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

function toHex(h: number, l: number) {
  const channels = oklchToLinear(l, maxChroma(l, h), h).map((v) => {
    const c = Math.min(1, Math.max(0, v))
    const encoded = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055
    return Math.round(encoded * 255).toString(16).padStart(2, '0')
  })
  return `#${channels.join('')}`
}

type Color = { h: number; l: number; hex: string }

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
  // Grays, black and white have no hue. Keep the last one so nothing jumps.
  const h = Math.hypot(a, bb) < 0.002 ? previousHue : wrap((Math.atan2(bb, a) * 180) / Math.PI)
  return { h, l, hex: `#${full}` }
}

const wrap = (h: number) => ((h % 360) + 360) % 360
const clamp = (v: number, low: number, high: number) => Math.min(high, Math.max(low, v))

const HUE_NAMES: [number, string][] = [
  [10, 'pink'], [50, 'red'], [75, 'orange'], [115, 'yellow'], [165, 'green'],
  [215, 'teal'], [275, 'blue'], [320, 'violet'], [360, 'pink'],
]

function describe({ h, l, hex }: Color) {
  const tone = l > 0.97 ? 'white' : l < 0.05 ? 'black' : HUE_NAMES.find(([end]) => h < end)?.[1]
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

/** Runs `onFrame(dt)` on every frame for as long as it returns true. */
function useFrames(onFrame: (dt: number) => boolean) {
  const callback = useRef(onFrame)
  callback.current = onFrame
  const handle = useRef(0)

  const start = useCallback(() => {
    if (handle.current) return
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 20)
      last = now
      handle.current = callback.current(dt) ? requestAnimationFrame(tick) : 0
    }
    handle.current = requestAnimationFrame(tick)
  }, [])

  const stop = useCallback(() => {
    cancelAnimationFrame(handle.current)
    handle.current = 0
  }, [])

  useEffect(() => stop, [stop])
  return { start, stop }
}

function rubberband(overshoot: number, dimension: number) {
  return (overshoot * dimension * 0.55) / (dimension + 0.55 * Math.abs(overshoot))
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const axis = (x = 0): Axis => ({ x, v: 0 })
const isAtRest = (a: Axis, target: number, near = 0.002, slow = 0.02) =>
  Math.abs(a.x - target) < near && Math.abs(a.v) < slow

export function ColorDrift({
  size = 'md',
  value,
  defaultValue,
  onChange,
  disabled,
  name,
  className,
  style,
  ...rest
}: ColorDriftProps) {
  const [color, setColor] = useState(() => parseHex(value ?? defaultValue ?? '#6f5bd6'))
  const current = useRef(color)
  const emitted = useRef(color.hex)
  const callback = useRef(onChange)
  callback.current = onChange

  const set = useCallback((h: number, l: number) => {
    const next = { h: wrap(h), l, hex: toHex(wrap(h), l) }
    current.current = next
    setColor(next)
    if (next.hex !== emitted.current) {
      emitted.current = next.hex
      callback.current?.(next.hex)
    }
  }, [])

  useEffect(() => {
    if (!value || value.toLowerCase() === emitted.current) return
    const next = parseHex(value, current.current.h)
    current.current = next
    emitted.current = next.hex
    setColor(next)
  }, [value])

  const body = useRef<HTMLDivElement>(null)
  const ink = useRef<HTMLDivElement>(null)
  const glint = useRef<HTMLDivElement>(null)
  const hex = useRef<HTMLSpanElement>(null)
  const samples = useRef<{ x: number; y: number; t: number }[]>([])
  const m = useRef({
    live: false,
    dragging: false,
    pointer: 0,
    h: 0,
    l: 0, // may run past 0 or 1 while dragging
    px: 0,
    py: 0,
    degPerPx: 1,
    lPerPx: 1,
    width: 1,
    height: 1,
    left: 0,
    top: 0,
    hueSpeed: 0,
    toneSpeed: 0,
    speedX: 0,
    speedY: 0,
    // The body's color trails the finger's, which is what makes it look like ink.
    lagHue: axis(),
    lagTone: axis(),
    inkX: axis(),
    inkY: axis(),
    leanX: axis(),
    leanY: axis(),
    shearX: axis(),
    shearY: axis(),
    stretchX: axis(),
    stretchY: axis(),
    press: axis(1),
    edge: axis(),
  })

  function readSpeed() {
    const list = samples.current
    if (list.length < 2) return { x: 0, y: 0 }
    const first = list[0]
    const last = list[list.length - 1]
    // A pointer that stopped before letting go has no speed left.
    if (performance.now() - last.t > 60) return { x: 0, y: 0 }
    const elapsed = Math.max(last.t - first.t, 1) / 1000
    return { x: (last.x - first.x) / elapsed, y: (last.y - first.y) / elapsed }
  }

  function addSample(x: number, y: number) {
    const t = performance.now()
    samples.current.push({ x, y, t })
    while (samples.current.length > 2 && t - samples.current[0].t > 80) samples.current.shift()
  }

  const frames = useFrames((dt) => {
    const d = m.current
    if (!d.dragging) {
      // Coasting: the speed decays exponentially, like a scrolling list.
      const decay = 0.996 ** (dt * 1000)
      d.hueSpeed *= decay
      d.toneSpeed *= decay
      d.h += d.hueSpeed * dt
      d.l += d.toneSpeed * dt
      if (d.l < 0 || d.l > 1) {
        // Running into black or white squashes the body, in proportion to the speed.
        const impact = Math.min(Math.abs(d.toneSpeed) / 0.4, 1)
        d.stretchY.v -= impact * 1.2
        d.stretchX.v += impact * 0.7
        d.edge.v += Math.sign(d.l - 0.5) * -impact * 90
        d.l = clamp(d.l, 0, 1)
        d.toneSpeed = 0
      }
      d.speedX = d.hueSpeed / d.degPerPx
      d.speedY = -d.toneSpeed / d.lPerPx
    }

    const moving = d.dragging || Math.abs(d.hueSpeed) > 1 || Math.abs(d.toneSpeed) > 0.004
    if (moving) set(d.h, clamp(d.l, 0, 1))

    const tone = clamp(d.l, 0, 1)
    spring(d.lagHue, d.h, 1, 0.7, dt)
    spring(d.lagTone, tone, 1, 0.7, dt)

    // The ink's center follows the finger. Once released, it runs ahead along the
    // direction of travel, so the color keeps sweeping across the body.
    if (d.dragging) {
      spring(d.inkX, clamp(d.px - d.left, 0, d.width), 1, 0.08, dt)
      spring(d.inkY, clamp(d.py - d.top, 0, d.height), 1, 0.08, dt)
    } else {
      spring(d.inkX, d.width / 2 + clamp(d.speedX * 0.2, -d.width, d.width), 1, 0.3, dt)
      spring(d.inkY, d.height / 2 + clamp(d.speedY * 0.2, -d.height, d.height), 1, 0.3, dt)
    }

    // Damping 1 under the finger; a released body has earned its wobble.
    const looseness = d.dragging ? 1 : 0.5
    const overshoot = d.l < 0 ? d.l : d.l > 1 ? d.l - 1 : 0
    spring(d.edge, d.dragging ? -rubberband(overshoot / d.lPerPx, d.height) : 0, d.dragging ? 1 : 0.55, 0.32, dt)
    spring(d.leanX, clamp(d.speedX * 0.012, -7, 7), looseness, 0.28, dt)
    spring(d.leanY, clamp(d.speedY * 0.012, -7, 7), looseness, 0.28, dt)
    spring(d.shearX, clamp(d.speedX * -0.004, -5, 5), looseness, 0.3, dt)
    spring(d.shearY, clamp(d.speedY * -0.004, -5, 5), looseness, 0.3, dt)
    spring(d.stretchX, clamp(Math.abs(d.speedX) / 12000, 0, 0.08), looseness, 0.32, dt)
    spring(d.stretchY, clamp(Math.abs(d.speedY) / 12000, 0, 0.08), looseness, 0.32, dt)
    if (d.dragging) spring(d.press, 0.965, 1, 0.14, dt)
    else spring(d.press, 1, 0.55, 0.36, dt)

    if (d.dragging) {
      // Without a new pointer event, the pointer has stopped.
      d.speedX *= 0.85
      d.speedY *= 0.85
    }

    const scaleX = d.press.x * (1 + d.stretchX.x - d.stretchY.x * 0.5)
    const scaleY = d.press.x * (1 + d.stretchY.x - d.stretchX.x * 0.5)
    if (body.current) {
      body.current.style.transform =
        `translate3d(${d.leanX.x.toFixed(2)}px, ${(d.leanY.x + d.edge.x).toFixed(2)}px, 0) ` +
        `skew(${d.shearX.x.toFixed(3)}deg, ${d.shearY.x.toFixed(3)}deg) ` +
        `scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`
    }
    if (ink.current) {
      const lag = toHex(wrap(d.lagHue.x), clamp(d.lagTone.x, 0, 1))
      ink.current.style.background =
        `radial-gradient(circle at ${d.inkX.x.toFixed(1)}px ${d.inkY.x.toFixed(1)}px in oklab, ` +
        `${current.current.hex} 8%, ${lag} 92%)`
    }
    if (glint.current) {
      glint.current.style.transform = `translate3d(${d.inkX.x.toFixed(1)}px, ${d.inkY.x.toFixed(1)}px, 0)`
    }
    if (hex.current) {
      // The label sits deeper than the surface, and blurs a little at speed.
      const blur = Math.min(Math.hypot(d.speedX, d.speedY) / 2400, 1.2)
      hex.current.style.transform = `translate3d(${(d.leanX.x * -1.6).toFixed(2)}px, ${(d.leanY.x * -1.6).toFixed(2)}px, 0)`
      hex.current.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : ''
    }

    const settled =
      !d.dragging &&
      !moving &&
      [d.leanX, d.leanY, d.shearX, d.shearY, d.stretchX, d.stretchY, d.edge].every((a) => isAtRest(a, 0)) &&
      isAtRest(d.press, 1, 0.0005, 0.01) &&
      isAtRest(d.lagHue, d.h, 0.1, 1) &&
      isAtRest(d.lagTone, tone, 0.001, 0.01)
    if (settled) {
      d.live = false
      for (const el of [body.current, hex.current]) {
        if (el) el.style.transform = ''
      }
      if (ink.current) ink.current.style.background = ''
      if (hex.current) hex.current.style.filter = ''
      return false
    }
    return true
  })

  function down(e: PointerEvent<HTMLDivElement>) {
    const d = m.current
    if (disabled || e.button !== 0 || d.dragging) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const rect = e.currentTarget.getBoundingClientRect()
    const { h, l } = current.current
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    // Grabbing it mid-flight stops the coast right where it is. Hue is unwrapped
    // while moving, so the lag keeps its distance from the wrapped value.
    d.lagHue.x = d.live ? d.lagHue.x + (h - d.h) : h
    d.lagTone.x = d.live ? d.lagTone.x : l
    if (!d.live) {
      d.inkX = axis(x)
      d.inkY = axis(y)
      d.lagHue.v = 0
      d.lagTone.v = 0
    }
    Object.assign(d, {
      live: true,
      dragging: true,
      pointer: e.pointerId,
      h,
      l,
      px: e.clientX,
      py: e.clientY,
      degPerPx: 360 / (rect.width * 3),
      lPerPx: 1 / (rect.height * 2),
      width: rect.width,
      height: rect.height,
      left: rect.left,
      top: rect.top,
      hueSpeed: 0,
      toneSpeed: 0,
      speedX: 0,
      speedY: 0,
    })
    samples.current = []
    addSample(e.clientX, e.clientY)
    e.currentTarget.toggleAttribute('data-active', true)
    if (prefersReducedMotion()) return
    // The body gives way around the point you grabbed, not around its center.
    if (body.current) body.current.style.transformOrigin = `${x}px ${y}px`
    frames.start()
  }

  function move(e: PointerEvent<HTMLDivElement>) {
    const d = m.current
    if (!d.dragging || e.pointerId !== d.pointer) return
    d.h += (e.clientX - d.px) * d.degPerPx
    d.l -= (e.clientY - d.py) * d.lPerPx
    d.px = e.clientX
    d.py = e.clientY
    addSample(e.clientX, e.clientY)
    const speed = readSpeed()
    d.speedX = speed.x
    d.speedY = speed.y
    if (prefersReducedMotion()) set(d.h, clamp(d.l, 0, 1))
  }

  function up(e: PointerEvent<HTMLDivElement>) {
    const d = m.current
    if (!d.dragging || e.pointerId !== d.pointer) return
    d.dragging = false
    d.l = clamp(d.l, 0, 1)
    e.currentTarget.toggleAttribute('data-active', false)
    if (prefersReducedMotion()) {
      d.live = false
      set(d.h, d.l)
      return
    }
    const speed = readSpeed()
    // A hard flick travels half the hue circle at most. Tone barely coasts, since
    // landing on pure black or white by accident would lose the color.
    d.hueSpeed = clamp(speed.x * d.degPerPx, -720, 720)
    d.toneSpeed = clamp(-speed.y * d.lPerPx, -0.4, 0.4)
    d.speedX = speed.x
    d.speedY = speed.y
    frames.start()
  }

  function keys(e: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled) return
    const { h, l } = current.current
    const fast = e.shiftKey ? 3 : 1
    let next: [number, number] | null = null
    if (e.key === 'ArrowLeft') next = [h - 4 * fast, l]
    else if (e.key === 'ArrowRight') next = [h + 4 * fast, l]
    else if (e.key === 'ArrowUp') next = [h, clamp(l + 0.02 * fast, 0, 1)]
    else if (e.key === 'ArrowDown') next = [h, clamp(l - 0.02 * fast, 0, 1)]
    if (!next) return
    e.preventDefault()
    // Keyboard changes never animate.
    frames.stop()
    m.current.live = false
    m.current.hueSpeed = 0
    m.current.toneSpeed = 0
    if (ink.current) ink.current.style.background = ''
    for (const el of [body.current, hex.current]) {
      if (el) el.style.transform = ''
    }
    set(next[0], next[1])
  }

  // The edges preview where each direction leads, so the map stays out of sight until needed.
  const vars = {
    '--cd-color': color.hex,
    '--cd-west': toHex(color.h - 50, color.l),
    '--cd-east': toHex(color.h + 50, color.l),
    '--cd-north': toHex(color.h, clamp(color.l + 0.22, 0, 1)),
    '--cd-south': toHex(color.h, clamp(color.l - 0.22, 0, 1)),
    ...style,
  } as CSSProperties

  return (
    <>
      <div
        aria-label="Color"
        {...rest}
        className={className ? `cd ${className}` : 'cd'}
        data-size={size}
        data-disabled={disabled || undefined}
        data-dark-text={color.l > 0.68 || undefined}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(color.h)}
        aria-valuetext={describe(color)}
        style={vars}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={keys}
      >
        <div className="cd__body" ref={body}>
          <div className="cd__ink" ref={ink} aria-hidden="true" />
          <div className="cd__hints" aria-hidden="true" />
          <div className="cd__glint" ref={glint} aria-hidden="true" />
          <span className="cd__hex" ref={hex} aria-hidden="true">{color.hex}</span>
        </div>
      </div>
      {name && <input type="hidden" name={name} value={color.hex} />}
    </>
  )
}
