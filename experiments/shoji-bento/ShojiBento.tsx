import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import './ShojiBento.css'

type Size = 'sm' | 'md' | 'lg'
type Rect = { x: number; y: number; w: number; h: number }
const r = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h })

export type ShojiItem = {
  id: string
  label: string
  value: ReactNode
  detail?: ReactNode
  /** Fills the compartment with the text color. One per grid is plenty. */
  solid?: boolean
}

export type ShojiBentoProps = Omit<ComponentProps<'div'>, 'children'> & {
  /** The size also sets the number of compartments: 3, 5 or 7. */
  size?: Size
  items: ShojiItem[]
  disabled?: boolean
}

// Compartments on a small grid of units. Edit these to get another arrangement, as long as
// straight cuts can divide it.
const LAYOUTS: Record<Size, Rect[]> = {
  sm: [r(0, 0, 4, 3), r(4, 0, 2, 4), r(0, 3, 4, 1)],
  md: [r(0, 0, 2, 3), r(2, 0, 4, 2), r(2, 2, 1.5, 2), r(3.5, 2, 2.5, 2), r(0, 3, 2, 1)],
  lg: [r(0, 0, 3, 4), r(3, 0, 5, 2), r(3, 2, 2, 2), r(5, 2, 3, 2), r(0, 4, 2, 2), r(2, 4, 1, 2), r(3, 4, 5, 2)],
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

/* Helpers */

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** The further past the bound, the less it follows. It never goes further than `limit`. */
const rubber = (over: number, limit: number) =>
  (over * limit * 0.55) / (limit + 0.55 * Math.abs(over))

/** Where a flick comes to rest, as a distance. Exponential decay, the way a scroll view slows down. */
const project = (velocity: number) => velocity * 0.099

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** Stands in for movement when reduced motion is on: the change arrives as a short fade. */
const fadeIn = (el: HTMLElement | null) =>
  el?.animate([{ opacity: 0.5 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' })

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

function useBounds(ref: React.RefObject<HTMLElement | null>, onChange: (w: number, h: number) => void) {
  const latest = useRef(onChange)
  latest.current = onChange
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    latest.current(el.clientWidth, el.clientHeight)
    const observer = new ResizeObserver(() => latest.current(el.clientWidth, el.clientHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
}

/** Keeps the last 100 ms of a drag, to know how fast it was going at the end. */
function velocityTracker() {
  const history: { t: number; x: number; y: number }[] = []
  return {
    push(e: PointerEvent) {
      history.push({ t: e.timeStamp, x: e.clientX, y: e.clientY })
      while (history.length > 2 && e.timeStamp - history[0].t > 100) history.shift()
    },
    at(e: PointerEvent) {
      const a = history[0]
      const b = history[history.length - 1]
      // A finger that stopped before letting go has no speed left.
      if (!a || a === b || e.timeStamp - b.t > 80) return { x: 0, y: 0 }
      const dt = (b.t - a.t) / 1000
      return { x: (b.x - a.x) / dt, y: (b.y - a.y) / dt }
    },
  }
}

function Face({ item }: { item: ShojiItem }) {
  // The CSS needs the length to size the value so that it just fits its compartment.
  const length = typeof item.value === 'string' ? item.value.length : 3
  return (
    <>
      <span className="shoji__label">{item.label}</span>
      {item.detail != null && <span className="shoji__detail">{item.detail}</span>}
      <span className="shoji__value" style={{ '--length': length } as React.CSSProperties}>
        {item.value}
      </span>
    </>
  )
}

/* The grid is one rectangle and the lines are what you touch. Straight cuts make a tree, so each
   line only divides the part of the rectangle that its parent gave it. */

const MIN_CELL = 56
const HOVER_LEAN = 10
const SNAP_STEPS = 12

type Leaf = { leaf: number }
type Split = {
  axis: 'x' | 'y'
  home: number
  a: SeamNode
  b: SeamNode
  id: number
  spring: Spring
  // Where the line rests, not counting the hover lean.
  rest: number
  // Limits and length in pixels, refreshed each time the tree is laid out.
  lo: number
  hi: number
  span: number
}
type SeamNode = Leaf | Split

function buildTree(cells: Rect[]) {
  const splits: Split[] = []
  const cut = (list: { i: number; c: Rect }[]): SeamNode => {
    if (list.length === 1) return { leaf: list[0].i }
    for (const axis of ['x', 'y'] as const) {
      const start = axis === 'x' ? 'x' : 'y'
      const length = axis === 'x' ? 'w' : 'h'
      const from = Math.min(...list.map(({ c }) => c[start]))
      const to = Math.max(...list.map(({ c }) => c[start] + c[length]))
      const line = list
        .map(({ c }) => c[start] + c[length])
        .find((at) => at < to && list.every(({ c }) => c[start] + c[length] <= at || c[start] >= at))
      if (line === undefined) continue
      const home = (line - from) / (to - from)
      const id = splits.length
      const split: Split = {
        axis, home, id, spring: spring(home, 0.0002), rest: home, lo: home, hi: home, span: 0,
        a: { leaf: -1 }, b: { leaf: -1 },
      }
      splits.push(split)
      split.a = cut(list.filter(({ c }) => c[start] < line))
      split.b = cut(list.filter(({ c }) => c[start] >= line))
      return split
    }
    throw new Error('This layout cannot be divided by straight cuts')
  }
  return { root: cut(cells.map((c, i) => ({ i, c }))), splits }
}

const isLeaf = (n: SeamNode): n is Leaf => 'leaf' in n
const holds = (n: SeamNode, cell: number): boolean =>
  isLeaf(n) ? n.leaf === cell : holds(n.a, cell) || holds(n.b, cell)
const firstLeaf = (n: SeamNode): number => (isLeaf(n) ? n.leaf : firstLeaf(n.a))

function minSpan(n: SeamNode, axis: 'x' | 'y'): number {
  if (isLeaf(n)) return MIN_CELL
  const [a, b] = [minSpan(n.a, axis), minSpan(n.b, axis)]
  return n.axis === axis ? a + b : Math.max(a, b)
}

function Grid({ size, items, disabled, className, ...rest }: ShojiBentoProps & { size: Size }) {
  const [{ root, splits }] = useState(() => buildTree(LAYOUTS[size]))
  const frame = useRef<HTMLDivElement>(null)
  const cellEls = useRef<(HTMLDivElement | null)[]>([])
  const lineEls = useRef<(HTMLDivElement | null)[]>([])
  const bounds = useRef({ w: 0, h: 0 })
  const live = useRef<{ drag: Split | null; claimed: number | null; hover: number | null }>({
    drag: null,
    claimed: null,
    hover: null,
  })
  const grab = useRef({ start: 0, from: 0, tracker: velocityTracker() })

  function place(n: SeamNode, x: number, y: number, w: number, h: number) {
    if (isLeaf(n)) {
      const el = cellEls.current[n.leaf]
      if (!el) return
      el.style.transform = `translate(${x}px, ${y}px)`
      el.style.width = `${w}px`
      el.style.height = `${h}px`
      return
    }
    const horizontal = n.axis === 'x'
    n.span = horizontal ? w : h
    n.lo = minSpan(n.a, n.axis) / n.span
    n.hi = 1 - minSpan(n.b, n.axis) / n.span
    if (n.lo > n.hi) n.lo = n.hi = n.home
    const ratio = n === live.current.drag ? n.spring.x : clamp(n.spring.x, n.lo, n.hi)
    // Whole pixels keep the 1 px line sharp.
    const at = Math.round(ratio * n.span)
    const line = lineEls.current[n.id]
    if (horizontal) {
      if (line) {
        line.style.transform = `translate(${x + at}px, ${y}px)`
        line.style.height = `${h}px`
      }
      place(n.a, x, y, at, h)
      place(n.b, x + at, y, w - at, h)
    } else {
      if (line) {
        line.style.transform = `translate(${x}px, ${y + at}px)`
        line.style.width = `${w}px`
      }
      place(n.a, x, y, w, at)
      place(n.b, x, y + at, w, h - at)
    }
  }
  const paint = () => place(root, 0, 0, bounds.current.w, bounds.current.h)

  const wake = useFrames((dt) => {
    let moving = false
    for (const s of splits) {
      if (s === live.current.drag) continue
      if (advance(s.spring, dt)) moving = true
    }
    paint()
    return moving
  })

  useBounds(frame, (w, h) => {
    bounds.current = { w, h }
    paint()
    // Settle anything the new size pushed past its limits.
    for (const s of splits) s.rest = clamp(s.rest, s.lo, s.hi)
    paint()
  })

  function retarget(response: number) {
    const { hover, drag } = live.current
    for (const s of splits) {
      if (s === drag) continue
      let lean = 0
      if (hover !== null && s.span) {
        if (holds(s.a, hover)) lean = HOVER_LEAN / s.span
        else if (holds(s.b, hover)) lean = -HOVER_LEAN / s.span
      }
      aim(s.spring, clamp(s.rest + lean, s.lo, s.hi), response)
    }
    wake()
  }

  /** A press gives the compartment most of the room. A second press gives it back. */
  function claim(cell: number) {
    if (disabled || !window.getSelection()?.isCollapsed) return
    const state = live.current
    const next = state.claimed === cell ? null : cell
    state.claimed = next
    for (const s of splits) {
      s.rest = s.home
      if (next === null) continue
      if (holds(s.a, next)) s.rest = s.home + (s.hi - s.home) * 0.7
      else if (holds(s.b, next)) s.rest = s.home + (s.lo - s.home) * 0.7
    }
    if (reducedMotion()) {
      for (const s of splits) jump(s.spring, s.rest)
      paint()
      fadeIn(frame.current)
      return
    }
    retarget(0.42)
  }

  function setHover(cell: number | null, e: PointerEvent) {
    if (disabled || e.pointerType !== 'mouse' || reducedMotion()) return
    live.current.hover = cell
    retarget(0.6)
  }

  const coordinate = (s: Split, e: PointerEvent) => (s.axis === 'x' ? e.clientX : e.clientY)

  function onLineDown(s: Split, e: PointerEvent<HTMLDivElement>) {
    if (disabled || live.current.drag) return
    e.currentTarget.setPointerCapture(e.pointerId)
    e.currentTarget.dataset.grabbed = ''
    e.preventDefault()
    e.currentTarget.focus({ preventScroll: true })
    live.current.drag = s
    live.current.claimed = null
    // From where the line is right now, even mid-flight, and from where it was grabbed.
    s.spring.x = clamp(s.spring.x, s.lo, s.hi)
    s.spring.v = 0
    grab.current = { start: coordinate(s, e), from: s.spring.x * s.span, tracker: velocityTracker() }
    grab.current.tracker.push(e)
  }

  function onLineMove(s: Split, e: PointerEvent) {
    if (live.current.drag !== s) return
    grab.current.tracker.push(e)
    const raw = grab.current.from + coordinate(s, e) - grab.current.start
    const [min, max] = [s.lo * s.span, s.hi * s.span]
    const at = raw < min ? min - rubber(min - raw, 40) : raw > max ? max + rubber(raw - max, 40) : raw
    s.spring.x = s.spring.to = at / s.span
    paint()
  }

  function onLineUp(s: Split, e: PointerEvent<HTMLDivElement>) {
    if (live.current.drag !== s) return
    delete e.currentTarget.dataset.grabbed
    live.current.drag = null
    const { x, y } = grab.current.tracker.at(e)
    const velocity = (s.axis === 'x' ? x : y) / s.span
    const landing = s.spring.x + project(velocity)
    s.rest = clamp(Math.round(landing * SNAP_STEPS) / SNAP_STEPS, s.lo, s.hi)
    e.currentTarget.setAttribute('aria-valuenow', String(Math.round(s.rest * 100)))
    if (reducedMotion()) {
      jump(s.spring, s.rest)
      paint()
      return
    }
    // Only a throw earns the overshoot.
    aim(s.spring, s.rest, 0.38, Math.abs(velocity) > 0.3 ? 0.78 : 1)
    s.spring.v = velocity
    wake()
  }

  function setRest(s: Split, to: number, el: HTMLElement) {
    live.current.claimed = null
    s.rest = clamp(to, s.lo, s.hi)
    jump(s.spring, s.rest)
    el.setAttribute('aria-valuenow', String(Math.round(s.rest * 100)))
    paint()
  }

  function onLineKey(s: Split, e: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return
    const [back, forth] = s.axis === 'x' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown']
    const step = 1 / SNAP_STEPS
    if (e.key === back) setRest(s, s.rest - step, e.currentTarget)
    else if (e.key === forth) setRest(s, s.rest + step, e.currentTarget)
    else if (e.key === 'Home') setRest(s, s.lo, e.currentTarget)
    else if (e.key === 'End') setRest(s, s.hi, e.currentTarget)
    else if (e.key === 'Enter') setRest(s, s.home, e.currentTarget)
    else return
    e.preventDefault()
  }

  return (
    <div
      {...rest}
      ref={frame}
      className={['shoji', className].filter(Boolean).join(' ')}
      data-size={size}
      data-disabled={disabled || undefined}
    >
      {LAYOUTS[size].map((_, i) => {
        const item = items[i]
        if (!item) return null
        return (
          <div
            key={item.id}
            ref={(el) => {
              cellEls.current[i] = el
            }}
            className="shoji__cell"
            data-solid={item.solid || undefined}
            onClick={() => claim(i)}
            onPointerEnter={(e) => setHover(i, e)}
            onPointerLeave={(e) => setHover(null, e)}
          >
            <Face item={item} />
          </div>
        )
      })}
      {splits.map((s) => (
        <div
          key={s.id}
          ref={(el) => {
            lineEls.current[s.id] = el
          }}
          className="shoji__line"
          data-axis={s.axis}
          // Where lines meet in a T, the one that runs straight through is the one you grab.
          style={{ zIndex: splits.length - s.id }}
          role="separator"
          aria-orientation={s.axis === 'x' ? 'vertical' : 'horizontal'}
          aria-label={`Between ${items[firstLeaf(s.a)]?.label} and ${items[firstLeaf(s.b)]?.label}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(s.home * 100)}
          tabIndex={disabled ? undefined : 0}
          onPointerDown={(e) => onLineDown(s, e)}
          onPointerMove={(e) => onLineMove(s, e)}
          onPointerUp={(e) => onLineUp(s, e)}
          onPointerCancel={(e) => onLineUp(s, e)}
          onDoubleClick={(e) => {
            if (!disabled) setRest(s, s.home, e.currentTarget)
          }}
          onKeyDown={(e) => onLineKey(s, e)}
        />
      ))}
    </div>
  )
}

export function ShojiBento({ size = 'md', ...props }: ShojiBentoProps) {
  // Springs are built once per arrangement, so another size starts from a clean slate.
  return <Grid key={size} size={size} {...props} />
}
