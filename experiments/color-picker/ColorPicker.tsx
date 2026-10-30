import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import './ColorPicker.css'

export type ColorPickerProps = Omit<HTMLAttributes<HTMLElement>, 'onChange' | 'defaultValue'> & {
  /**
   * `drift`: one surface filled with the color. Drag it anywhere, flick it to coast.
   * `tuner`: a row of hairlines under a fixed needle. Scrub it like a radio dial.
   * `bloom`: a single dot. Press it, slide to a petal, let go.
   */
  variant?: 'drift' | 'tuner' | 'bloom'
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

const HUE_NAMES: [number, string][] = [
  [10, 'pink'], [50, 'red'], [75, 'orange'], [115, 'yellow'], [165, 'green'],
  [215, 'teal'], [275, 'blue'], [320, 'violet'], [360, 'pink'],
]

function describe({ h, l, s, hex }: Color) {
  const tone = l > 0.97 ? 'white' : l < 0.05 ? 'black' : s < 0.1 ? 'gray' : HUE_NAMES.find(([end]) => h < end)?.[1]
  const shade = l > 0.97 || l < 0.05 ? '' : l > 0.78 ? 'light ' : l < 0.42 ? 'dark ' : ''
  return `${shade}${tone}, ${hex}`
}

function useColor(value: string | undefined, defaultValue: string | undefined, onChange?: (hex: string) => void) {
  const [color, setState] = useState(() => parseHex(value ?? defaultValue ?? '#1a70e6'))
  const current = useRef(color)
  const emitted = useRef(color.hex)
  const callback = useRef(onChange)
  callback.current = onChange

  const set = useCallback((h: number, l: number, s = 1) => {
    const next = { h: wrap(h), l, s, hex: toHex(wrap(h), l, s) }
    current.current = next
    setState(next)
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
    setState(next)
  }, [value])

  return { color, current, set }
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

/** Remembers the last few pointer positions, to read the speed at release. */
function useVelocity() {
  const samples = useRef<{ x: number; y: number; t: number }[]>([])
  return {
    reset: () => void (samples.current = []),
    add(x: number, y: number) {
      const t = performance.now()
      samples.current.push({ x, y, t })
      while (samples.current.length > 2 && t - samples.current[0].t > 80) samples.current.shift()
    },
    /** Pixels per second. */
    read() {
      const list = samples.current
      if (list.length < 2) return { x: 0, y: 0 }
      const first = list[0]
      const last = list[list.length - 1]
      // A pointer that stopped before letting go has no speed left.
      const elapsed = performance.now() - last.t > 60 ? Infinity : Math.max(last.t - first.t, 1) / 1000
      return { x: (last.x - first.x) / elapsed, y: (last.y - first.y) / elapsed }
    },
  }
}

function rubberband(overshoot: number, dimension: number) {
  return (overshoot * dimension * 0.55) / (dimension + 0.55 * Math.abs(overshoot))
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function classes(variant: string, className?: string) {
  return `cp cp--${variant}${className ? ` ${className}` : ''}`
}

type VariantProps = Omit<ColorPickerProps, 'variant' | 'value' | 'defaultValue' | 'onChange' | 'name'> & {
  picker: ReturnType<typeof useColor>
}

/** Arrow keys for the two continuous variants. Keyboard changes never animate. */
function arrowKeys(e: KeyboardEvent, picker: VariantProps['picker'], hueStep: number) {
  const { h, l } = picker.current.current
  const fast = e.shiftKey ? 3 : 1
  if (e.key === 'ArrowLeft') picker.set(h - hueStep * fast, l)
  else if (e.key === 'ArrowRight') picker.set(h + hueStep * fast, l)
  else if (e.key === 'ArrowUp') picker.set(h, clamp(l + 0.02 * fast, 0, 1))
  else if (e.key === 'ArrowDown') picker.set(h, clamp(l - 0.02 * fast, 0, 1))
  else return false
  e.preventDefault()
  return true
}

/* Drift */

function Drift({ picker, size, disabled, className, style, ...rest }: VariantProps) {
  const { color, current, set } = picker
  const surface = useRef<HTMLDivElement>(null)
  const velocity = useVelocity()
  const m = useRef({
    dragging: false,
    pointer: 0,
    h: 0,
    l: 0, // may run past 0 or 1 while dragging
    px: 0,
    py: 0,
    degPerPx: 1,
    lPerPx: 1,
    height: 1,
    hueSpeed: 0,
    toneSpeed: 0,
    speedX: 0,
    speedY: 0,
    leanX: { x: 0, v: 0 } as Axis,
    leanY: { x: 0, v: 0 } as Axis,
    stretchX: { x: 0, v: 0 } as Axis,
    stretchY: { x: 0, v: 0 } as Axis,
    press: { x: 1, v: 0 } as Axis,
    edge: { x: 0, v: 0 } as Axis,
  })

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
        d.l = clamp(d.l, 0, 1)
        d.toneSpeed = 0
      }
      d.speedX = d.hueSpeed / d.degPerPx
      d.speedY = -d.toneSpeed / d.lPerPx
    }

    const moving = d.dragging || Math.abs(d.hueSpeed) > 1 || Math.abs(d.toneSpeed) > 0.004
    if (moving) set(d.h, clamp(d.l, 0, 1))

    // The surface leans and stretches along the direction it is being thrown.
    const overshoot = d.l < 0 ? d.l : d.l > 1 ? d.l - 1 : 0
    const edgeTarget = d.dragging ? -rubberband(overshoot / d.lPerPx, d.height) : 0
    spring(d.edge, edgeTarget, 1, 0.3, dt)
    spring(d.leanX, clamp(d.speedX * 0.006, -5, 5), 1, 0.22, dt)
    spring(d.leanY, clamp(d.speedY * 0.006, -5, 5), 1, 0.22, dt)
    spring(d.stretchX, clamp(Math.abs(d.speedX) / 22000, 0, 0.06), 1, 0.22, dt)
    spring(d.stretchY, clamp(Math.abs(d.speedY) / 22000, 0, 0.06), 1, 0.22, dt)
    spring(d.press, d.dragging ? 0.97 : 1, 1, 0.2, dt)
    if (d.dragging) {
      // Without a new pointer event, the pointer has stopped.
      d.speedX *= 0.85
      d.speedY *= 0.85
    }

    const scaleX = d.press.x * (1 + d.stretchX.x - d.stretchY.x * 0.5)
    const scaleY = d.press.x * (1 + d.stretchY.x - d.stretchX.x * 0.5)
    const el = surface.current
    if (el) {
      el.style.transform = `translate3d(${d.leanX.x.toFixed(2)}px, ${(d.leanY.x + d.edge.x).toFixed(2)}px, 0) scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`
    }

    const settled = [d.leanX, d.leanY, d.stretchX, d.stretchY, d.edge].every(
      (a) => Math.abs(a.x) < 0.002 && Math.abs(a.v) < 0.02,
    )
    const restored = Math.abs(d.press.x - 1) < 0.0005 && Math.abs(d.press.v) < 0.01
    if (!d.dragging && !moving && settled && restored) {
      if (el) el.style.transform = ''
      return false
    }
    return true
  })

  function down(e: PointerEvent<HTMLDivElement>) {
    if (disabled || e.button !== 0 || m.current.dragging) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const rect = e.currentTarget.getBoundingClientRect()
    const d = m.current
    // Grabbing it mid-flight stops the coast right where it is.
    Object.assign(d, {
      dragging: true,
      pointer: e.pointerId,
      h: current.current.h,
      l: current.current.l,
      px: e.clientX,
      py: e.clientY,
      degPerPx: 360 / (rect.width * 3),
      lPerPx: 1 / (rect.height * 2),
      height: rect.height,
      hueSpeed: 0,
      toneSpeed: 0,
      speedX: 0,
      speedY: 0,
    })
    velocity.reset()
    velocity.add(e.clientX, e.clientY)
    e.currentTarget.toggleAttribute('data-active', true)
    if (prefersReducedMotion()) return
    frames.start()
  }

  function move(e: PointerEvent<HTMLDivElement>) {
    const d = m.current
    if (!d.dragging || e.pointerId !== d.pointer) return
    d.h += (e.clientX - d.px) * d.degPerPx
    d.l -= (e.clientY - d.py) * d.lPerPx
    d.px = e.clientX
    d.py = e.clientY
    velocity.add(e.clientX, e.clientY)
    const speed = velocity.read()
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
      set(d.h, d.l)
      return
    }
    const speed = velocity.read()
    // A hard flick travels half the hue circle at most. Tone barely coasts, since
    // landing on pure black or white by accident would lose the color.
    d.hueSpeed = clamp(speed.x * d.degPerPx, -720, 720)
    d.toneSpeed = clamp(-speed.y * d.lPerPx, -0.4, 0.4)
    d.speedX = speed.x
    d.speedY = speed.y
    frames.start()
  }

  // The edges preview where each direction leads, so the map stays out of sight until needed.
  const hints = {
    '--cp-color': color.hex,
    '--cp-west': toHex(color.h - 50, color.l),
    '--cp-east': toHex(color.h + 50, color.l),
    '--cp-north': toHex(color.h, clamp(color.l + 0.22, 0, 1)),
    '--cp-south': toHex(color.h, clamp(color.l - 0.22, 0, 1)),
    ...style,
  } as CSSProperties

  return (
    <div
      aria-label="Color"
      {...rest}
      className={classes('drift', className)}
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
      style={hints}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={(e) => {
        if (disabled) return
        frames.stop()
        m.current.hueSpeed = 0
        m.current.toneSpeed = 0
        arrowKeys(e, picker, 4)
      }}
    >
      <div className="cp-drift__surface" ref={surface}>
        <div className="cp-drift__hints" aria-hidden="true" />
        <span className="cp-drift__hex" aria-hidden="true">{color.hex}</span>
      </div>
    </div>
  )
}

/* Tuner */

const TICK_DEGREES = 5
const TICK_COUNT = 360 / TICK_DEGREES
const TICK_SPACING = { sm: 5, md: 6, lg: 7 }

function Tuner({ picker, size = 'md', disabled, className, style, ...rest }: VariantProps) {
  const { color, current, set } = picker
  const track = useRef<HTMLDivElement>(null)
  const ticks = useRef<HTMLElement[]>([])
  const [width, setWidth] = useState(0)
  const velocity = useVelocity()
  const spacing = TICK_SPACING[size]
  const degPerPx = TICK_DEGREES / spacing
  const m = useRef({
    pointer: -1,
    axis: null as 'x' | 'y' | null,
    startX: 0,
    startY: 0,
    px: 0,
    py: 0,
    l: 0,
    height: 1,
    hue: { x: 0, v: 0 } as Axis,
    target: 0,
    band: { x: 0, v: 0 } as Axis,
  })
  const dot = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const el = track.current
    if (!el) return
    const observer = new ResizeObserver(() => setWidth(el.clientWidth))
    observer.observe(el)
    setWidth(el.clientWidth)
    return () => observer.disconnect()
  }, [])

  // Ticks near the needle grow and take their color; the rest stay short and gray.
  useLayoutEffect(() => {
    const sigma = Math.max(width * 0.26, 1)
    ticks.current.forEach((el, i) => {
      const delta = wrap(i * TICK_DEGREES - color.h + 180) - 180
      const x = (delta / TICK_DEGREES) * spacing
      if (Math.abs(x) > width / 2 + spacing) {
        el.style.visibility = 'hidden'
        return
      }
      const near = Math.exp(-((x / sigma) ** 2))
      el.style.visibility = 'visible'
      el.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0) scaleY(${(0.2 + 0.56 * near).toFixed(3)})`
      ;(el.firstElementChild as HTMLElement).style.opacity = near.toFixed(3)
    })
  }, [color.h, width, spacing])

  const hues = useMemo(
    () =>
      Array.from({ length: TICK_COUNT }, (_, i) => (
        <i
          key={i}
          className="cp-tuner__tick"
          ref={(el) => {
            if (el) ticks.current[i] = el
          }}
        >
          <b style={{ background: toHex(i * TICK_DEGREES, color.l) }} />
        </i>
      )),
    [color.l],
  )

  const frames = useFrames((dt) => {
    const d = m.current
    spring(d.hue, d.target, 0.85, 0.42, dt)
    spring(d.band, 0, 1, 0.3, dt)
    const atRest = Math.abs(d.hue.x - d.target) < 0.02 && Math.abs(d.hue.v) < 0.2
    if (atRest) {
      d.hue.x = d.target
      d.hue.v = 0
    }
    set(d.hue.x, current.current.l)
    if (dot.current) dot.current.style.translate = `0 ${d.band.x.toFixed(2)}px`
    return !atRest || Math.abs(d.band.x) > 0.05
  })

  function flyTo(target: number, speed: number) {
    const d = m.current
    d.target = target
    d.hue = { x: d.hue.x, v: speed }
    if (prefersReducedMotion()) {
      d.hue.x = target
      d.hue.v = 0
      set(target, current.current.l)
      return
    }
    frames.start()
  }

  function down(e: PointerEvent<HTMLDivElement>) {
    if (disabled || e.button !== 0 || m.current.pointer !== -1) return
    e.currentTarget.setPointerCapture(e.pointerId)
    frames.stop()
    const d = m.current
    d.pointer = e.pointerId
    d.axis = null
    d.startX = d.px = e.clientX
    d.startY = d.py = e.clientY
    d.l = current.current.l
    d.height = track.current?.clientHeight ?? 1
    d.hue = { x: current.current.h, v: 0 }
    velocity.reset()
    velocity.add(e.clientX, e.clientY)
    e.currentTarget.toggleAttribute('data-active', true)
  }

  function move(e: PointerEvent<HTMLDivElement>) {
    const d = m.current
    if (e.pointerId !== d.pointer) return
    if (!d.axis) {
      // A few pixels decide the axis, then it stays locked for the whole gesture.
      const dx = Math.abs(e.clientX - d.startX)
      const dy = Math.abs(e.clientY - d.startY)
      if (Math.max(dx, dy) < 4) return
      d.axis = dx >= dy ? 'x' : 'y'
    }
    if (d.axis === 'x') {
      d.hue.x -= (e.clientX - d.px) * degPerPx
      set(d.hue.x, current.current.l)
    } else {
      d.l -= (e.clientY - d.py) / d.height
      set(current.current.h, clamp(d.l, 0, 1))
      const over = d.l < 0 ? d.l : d.l > 1 ? d.l - 1 : 0
      d.band.x = -rubberband(over * d.height, d.height * 0.5)
      if (dot.current) dot.current.style.translate = `0 ${d.band.x.toFixed(2)}px`
    }
    d.px = e.clientX
    d.py = e.clientY
    velocity.add(e.clientX, e.clientY)
  }

  function up(e: PointerEvent<HTMLDivElement>) {
    const d = m.current
    if (e.pointerId !== d.pointer) return
    d.pointer = -1
    e.currentTarget.toggleAttribute('data-active', false)
    const snap = (hue: number) => Math.round(hue / TICK_DEGREES) * TICK_DEGREES

    if (d.axis === 'x') {
      // Land on the tick the flick was heading for, at the speed the finger left at.
      const speed = -velocity.read().x * degPerPx
      const decay = 0.996
      flyTo(snap(d.hue.x + ((speed / 1000) * decay) / (1 - decay)), speed)
    } else if (d.axis === 'y') {
      d.target = d.hue.x
      if (prefersReducedMotion()) {
        d.band.x = 0
        if (dot.current) dot.current.style.translate = ''
      } else {
        frames.start()
      }
    } else if (e.type === 'pointerup') {
      // A tap brings that tick under the needle.
      const rect = e.currentTarget.getBoundingClientRect()
      const offset = e.clientX - (rect.left + rect.width / 2)
      flyTo(snap(d.hue.x + offset * degPerPx), 0)
    }
  }

  return (
    <div
      aria-label="Color"
      {...rest}
      className={classes('tuner', className)}
      data-size={size}
      data-disabled={disabled || undefined}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(color.h)}
      aria-valuetext={describe(color)}
      style={{ '--cp-color': color.hex, '--cp-tone': (1 - color.l).toFixed(4), ...style } as CSSProperties}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={(e) => {
        if (disabled) return
        frames.stop()
        arrowKeys(e, picker, TICK_DEGREES)
      }}
    >
      <div className="cp-tuner__track" ref={track}>
        <div className="cp-tuner__ticks" aria-hidden="true">{hues}</div>
        <span className="cp-tuner__needle" aria-hidden="true" />
        <span className="cp-tuner__dot" ref={dot} aria-hidden="true" />
      </div>
      <span className="cp-tuner__hex" aria-hidden="true">{color.hex}</span>
    </div>
  )
}

/* Bloom */

const PETALS = 12
const HUE_PETALS = PETALS - 1
const FIRST_HUE = 25
const RADIUS = { sm: 58, md: 82, lg: 112 }
const PETAL_TONE = 0.68
const NEUTRAL_TONE = 0.6
// The last petal is gray. The others are evenly spaced hues, red at the top.
const petalHue = (i: number) => FIRST_HUE + (i * 360) / HUE_PETALS
const petalColor = (i: number, l: number) => (i === HUE_PETALS ? { s: 0, l } : { s: 1, l })
const baseTone = (i: number) => (i === HUE_PETALS ? NEUTRAL_TONE : PETAL_TONE)

function nearestPetal({ h, s }: Color) {
  if (s < 0.1) return HUE_PETALS
  return ((Math.round((h - FIRST_HUE) / (360 / HUE_PETALS)) % HUE_PETALS) + HUE_PETALS) % HUE_PETALS
}

function Bloom({ picker, size = 'md', disabled, className, style, 'aria-label': label = 'Color', ...rest }: VariantProps) {
  const { color, current, set } = picker
  const id = useId()
  const button = useRef<HTMLButtonElement>(null)
  const radius = RADIUS[size]
  const [open, setOpen] = useState<false | 'pointer' | 'keys'>(false)
  const [active, setActive] = useState<number | null>(null)
  const [tone, setTone] = useState(0) // -1 lightest, 0 the petal's own color, 1 darkest
  const [pull, setPull] = useState(0)
  const m = useRef({ latched: false, wandered: false, active: null as number | null, tone: 0 })
  const origin = nearestPetal(color)

  const toneAt = (i: number, offset: number) =>
    clamp(baseTone(i) - offset * (i === HUE_PETALS ? 0.58 : 0.3), 0, 1)

  const commit = useCallback(
    (i: number, offset: number) => {
      const { l, s } = petalColor(i, toneAt(i, offset))
      set(i === HUE_PETALS ? current.current.h : petalHue(i), l, s)
    },
    [current, set],
  )

  const close = useCallback(() => {
    setOpen(false)
    setActive(null)
    setPull(0)
    setTone(0)
    m.current.active = null
    m.current.latched = false
    m.current.wandered = false
  }, [])

  // While open the whole window listens, so the gesture survives leaving the button.
  useEffect(() => {
    if (open !== 'pointer') return
    const d = m.current

    function track(e: globalThis.PointerEvent) {
      const rect = button.current!.getBoundingClientRect()
      const dx = e.clientX - (rect.left + rect.width / 2)
      const dy = e.clientY - (rect.top + rect.height / 2)
      const distance = Math.hypot(dx, dy)
      if (distance < radius * 0.42) {
        d.active = null
        d.tone = 0
        setActive(null)
        setPull(0)
        setTone(0)
        return
      }
      d.wandered = true
      const angle = wrap((Math.atan2(dx, -dy) * 180) / Math.PI)
      const i = Math.round(angle / (360 / PETALS)) % PETALS
      const over = distance - radius
      d.active = i
      d.tone = clamp(over / (radius * 0.5), -1, 1)
      setActive(i)
      setTone(d.tone)
      setPull(rubberband(over, radius * 0.9))
    }

    function press(e: globalThis.PointerEvent) {
      if (!d.latched || e.target === button.current || button.current?.contains(e.target as Node)) return
      const rect = button.current!.getBoundingClientRect()
      const far = Math.hypot(e.clientX - rect.left - rect.width / 2, e.clientY - rect.top - rect.height / 2)
      if (far > radius * 1.7) close()
      else track(e)
    }

    function release() {
      if (d.active !== null) {
        commit(d.active, d.tone)
        close()
      } else if (d.wandered || d.latched) {
        close() // came back to the center: nothing changes
      } else {
        d.latched = true // a plain tap keeps it open
      }
    }

    function cancel() {
      close()
    }

    window.addEventListener('pointermove', track)
    window.addEventListener('pointerdown', press)
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', cancel)
    return () => {
      window.removeEventListener('pointermove', track)
      window.removeEventListener('pointerdown', press)
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', cancel)
    }
  }, [open, radius, commit, close])

  function keys(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return
    if (!open) {
      if (!['Enter', ' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
      e.preventDefault()
      const i = nearestPetal(current.current)
      m.current.active = i
      setActive(i)
      setOpen('keys')
      return
    }
    if (e.key === 'Escape' || e.key === 'Tab') {
      if (e.key === 'Escape') e.preventDefault()
      close()
      return
    }
    if (open === 'pointer') return
    const i = m.current.active ?? 0
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const next = (i + (e.key === 'ArrowRight' ? 1 : PETALS - 1)) % PETALS
      m.current.active = next
      m.current.tone = 0
      setActive(next)
      setTone(0)
      setPull(0)
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const next = clamp(m.current.tone + (e.key === 'ArrowDown' ? 0.25 : -0.25), -1, 1)
      m.current.tone = next
      setTone(next)
      setPull(next * radius * 0.3)
    } else if (e.key === 'Enter' || e.key === ' ') {
      commit(i, m.current.tone)
      close()
    } else {
      return
    }
    e.preventDefault()
  }

  const previewHex =
    active === null
      ? color.hex
      : (() => {
          const { l, s } = petalColor(active, toneAt(active, tone))
          return toHex(active === HUE_PETALS ? color.h : petalHue(active), l, s)
        })()

  const previewColor = parseHex(previewHex, color.h)

  return (
    <span
      {...rest}
      className={classes('bloom', className)}
      data-size={size}
      data-disabled={disabled || undefined}
      data-open={open || undefined}
      data-picking={active !== null || undefined}
      style={{ '--cp-color': previewHex, '--cp-radius': `${radius}px`, ...style } as CSSProperties}
    >
      <button
        ref={button}
        type="button"
        className="cp-bloom__dot"
        disabled={disabled}
        aria-label={`${label}: ${describe(open ? previewColor : color)}`}
        aria-haspopup="listbox"
        aria-expanded={Boolean(open)}
        aria-controls={`${id}-petals`}
        aria-activedescendant={active !== null ? `${id}-${active}` : undefined}
        onPointerDown={(e) => {
          if (disabled || e.button !== 0) return
          if (open) {
            if (open === 'keys') close()
            return
          }
          // Open on the way down, so the ring is there before the finger moves.
          m.current.latched = false
          m.current.wandered = false
          setOpen('pointer')
        }}
        onKeyDown={keys}
      />
      <span className="cp-bloom__ring" id={`${id}-petals`} role="listbox" aria-label={`${label} options`}>
        {Array.from({ length: PETALS }, (_, i) => {
          const isActive = active === i
          const steps = Math.min(Math.abs(i - origin), PETALS - Math.abs(i - origin))
          const hex = isActive
            ? previewHex
            : i === HUE_PETALS
              ? toHex(color.h, NEUTRAL_TONE, 0)
              : toHex(petalHue(i), PETAL_TONE)
          return (
            <span
              key={i}
              id={`${id}-${i}`}
              className="cp-bloom__petal"
              role="option"
              aria-selected={isActive}
              aria-label={describe({ h: petalHue(i), l: baseTone(i), s: i === HUE_PETALS ? 0 : 1, hex })}
              data-active={isActive || undefined}
              style={{ '--cp-angle': `${(i * 360) / PETALS}deg`, '--cp-delay': `${steps * 9}ms` } as CSSProperties}
            >
              <span
                className="cp-bloom__pull"
                style={{ transform: isActive ? `translateY(${(-pull).toFixed(2)}px)` : undefined }}
              >
                <span className="cp-bloom__swatch" style={{ background: hex }} />
              </span>
            </span>
          )
        })}
      </span>
    </span>
  )
}

export function ColorPicker({ variant = 'drift', size = 'md', value, defaultValue, onChange, name, ...rest }: ColorPickerProps) {
  const picker = useColor(value, defaultValue, onChange)
  const Variant = variant === 'tuner' ? Tuner : variant === 'bloom' ? Bloom : Drift
  return (
    <>
      <Variant picker={picker} size={size} {...rest} />
      {name && <input type="hidden" name={name} value={picker.color.hex} />}
    </>
  )
}
