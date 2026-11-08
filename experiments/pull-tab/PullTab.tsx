import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import './PullTab.css'

type Size = 'sm' | 'md' | 'lg'

type CommonProps = Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange'> & {
  size?: Size
  disabled?: boolean
  /** The level of the heading around each question. */
  headingLevel?: 2 | 3 | 4 | 5 | 6
}

type SingleProps = {
  /** Lets several rows stay open. Without it, opening a row closes the one that was open. */
  multiple?: false
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string | null) => void
}

type MultipleProps = {
  multiple: true
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
}

export type PullTabProps = CommonProps & (SingleProps | MultipleProps)

export type PullTabItemProps = Omit<ComponentProps<'div'>, 'title'> & {
  value: string
  title: ReactNode
  disabled?: boolean
}

type Context = {
  open: string[]
  disabled: boolean
  headingLevel: 2 | 3 | 4 | 5 | 6
  /** Opens or closes a row. `instant` skips the motion (keyboard, find in page). */
  set: (value: string, open: boolean, instant?: boolean) => void
  /** True while a change that must not animate is being applied. */
  instant: React.RefObject<boolean>
}

const PullTabContext = createContext<Context | null>(null)

const toList = (v: string | string[] | null | undefined) => (v == null ? [] : Array.isArray(v) ? v : [v])

export function PullTab(props: PullTabProps) {
  const {
    multiple = false,
    value,
    defaultValue,
    onValueChange,
    size = 'md',
    disabled = false,
    headingLevel = 3,
    className,
    children,
    ...rest
  } = props as CommonProps & {
    multiple?: boolean
    value?: string | string[] | null
    defaultValue?: string | string[] | null
    onValueChange?: (value: never) => void
  }

  const controlled = value !== undefined
  const [inner, setInner] = useState(() => toList(defaultValue))
  const open = controlled ? toList(value) : inner
  const instant = useRef(false)

  const latest = useRef({ open, controlled, multiple, onValueChange })
  latest.current = { open, controlled, multiple, onValueChange }

  const set = useCallback((item: string, next: boolean, skip = false) => {
    const { open, controlled, multiple, onValueChange } = latest.current
    if (open.includes(item) === next) return
    const list = next ? (multiple ? [...open, item] : [item]) : open.filter((v) => v !== item)
    if (skip) {
      instant.current = true
      requestAnimationFrame(() => (instant.current = false))
    }
    if (!controlled) setInner(list)
    const notify = onValueChange as ((v: string[] | string | null) => void) | undefined
    notify?.(multiple ? list : (list[0] ?? null))
  }, [])

  return (
    <PullTabContext.Provider value={{ open, disabled, headingLevel, set, instant }}>
      <div
        {...rest}
        className={className ? `pull-tab ${className}` : 'pull-tab'}
        data-size={size}
        data-disabled={disabled || undefined}
      >
        {children}
      </div>
    </PullTabContext.Provider>
  )
}

/* Spring. Damping 1 doesn't overshoot, and response is roughly how many seconds it takes to get
   there, as in Apple's two-parameter model. */

type Spring = { x: number; v: number; to: number; response: number }

/** Returns true while the spring is still moving. */
function advance(s: Spring, dt: number) {
  const w = (2 * Math.PI) / s.response
  // Small fixed steps stay stable with a stiff spring, whatever the frame rate.
  for (let left = dt; left > 0; left -= 1 / 240) {
    const h = Math.min(left, 1 / 240)
    s.v += (-w * w * (s.x - s.to) - 2 * w * s.v) * h
    s.x += s.v * h
  }
  if (Math.abs(s.x - s.to) < 0.5 && Math.abs(s.v) < 5) {
    s.x = s.to
    s.v = 0
    return false
  }
  return true
}

// Opening takes a little longer than the usual 300 ms, because you watch the drawer come out;
// closing stays quick. Both can be caught at any moment.
const OPEN = 0.4
const CLOSE = 0.26

/** The further past the bound, the less it follows. */
const rubber = (over: number, limit: number) => (over * limit * 0.55) / (limit + 0.55 * Math.abs(over))

/** Where a flick comes to rest, as a distance. Exponential decay, the way a scroll view slows down. */
const project = (velocity: number) => velocity * 0.099

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

type Phase = 'open' | 'closed' | 'moving'
type Drag = { id: number; y: number; h: number; moved: boolean; samples: { t: number; y: number }[] }

export function PullTabItem({ value, title, disabled: itemDisabled, children, className, ...rest }: PullTabItemProps) {
  const ctx = useContext(PullTabContext)
  if (!ctx) throw new Error('PullTabItem must be inside a PullTab')
  const { set } = ctx
  const open = ctx.open.includes(value)
  const disabled = ctx.disabled || !!itemDisabled
  const Heading = `h${ctx.headingLevel}` as 'h3'

  const id = useId()
  const itemRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  const m = useRef({
    phase: (open ? 'open' : 'closed') as Phase,
    target: open,
    h: { x: 0, v: 0, to: 0, response: OPEN } as Spring,
    drag: null as Drag | null,
    pointer: '',
  }).current

  const fullHeight = () => drawerRef.current?.offsetHeight ?? 0

  /** Shows `h` pixels of the drawer: the panel grows and the drawer slides out from under the row. */
  const apply = useCallback((h: number, H: number) => {
    const panel = panelRef.current
    const drawer = drawerRef.current
    if (!panel || !drawer) return
    panel.style.height = `${Math.max(0, h)}px`
    drawer.style.transform = `translateY(${h - H}px)`
    itemRef.current?.toggleAttribute('data-visible', h > 0.5)
  }, [])

  const settle = useCallback(
    (isOpen: boolean) => {
      const panel = panelRef.current
      const drawer = drawerRef.current
      if (!panel || !drawer) return
      m.phase = isOpen ? 'open' : 'closed'
      m.h.x = m.h.to = isOpen ? drawer.offsetHeight : 0
      m.h.v = 0
      panel.style.height = isOpen ? '' : '0px'
      // Find in page can still reach a closed answer, and opens it.
      if (isOpen) panel.removeAttribute('hidden')
      else panel.setAttribute('hidden', 'until-found')
      drawer.style.transform = ''
      itemRef.current?.toggleAttribute('data-visible', isOpen)
    },
    [m],
  )

  /* Frame loop */

  const frame = useRef(0)
  const tick = useRef<(dt: number) => boolean>(() => false)
  tick.current = (dt) => {
    if (m.phase !== 'moving' || m.drag) return false
    const H = fullHeight()
    m.h.to = m.target ? H : 0
    const going = advance(m.h, dt)
    apply(m.h.x, H)
    if (!going) settle(m.target)
    return going
  }

  const run = useCallback(() => {
    if (frame.current) return
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now
      frame.current = tick.current(dt) ? requestAnimationFrame(loop) : 0
    }
    frame.current = requestAnimationFrame(loop)
  }, [])

  const stop = useCallback(() => {
    cancelAnimationFrame(frame.current)
    frame.current = 0
  }, [])

  useEffect(() => stop, [stop])

  /** Starts moving from wherever the drawer is now. */
  const begin = useCallback(() => {
    if (m.phase === 'moving') return
    panelRef.current?.removeAttribute('hidden')
    m.h.x = m.phase === 'open' ? fullHeight() : 0
    m.h.v = 0
    m.phase = 'moving'
  }, [m])

  /* Open and close */

  const mounted = useRef(false)
  useLayoutEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      if (!open) settle(false)
      return
    }
    m.target = open
    const instant = ctx.instant.current
    if (instant || reducedMotion()) {
      stop()
      settle(open)
      if (!instant && open) drawerRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'ease-out' })
      return
    }
    begin()
    m.h.response = open ? OPEN : CLOSE
    run()
    // Only a change of `open` starts the motion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Find in page opens the row that holds the match.
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const onMatch = () => set(value, true, true)
    panel.addEventListener('beforematch', onMatch)
    return () => panel.removeEventListener('beforematch', onMatch)
  }, [set, value])

  /* The row */

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return
    const root = itemRef.current?.closest('.pull-tab')
    if (!root) return
    const rows = [...root.querySelectorAll<HTMLButtonElement>('.pull-tab__trigger')].filter(
      (b) => !b.disabled && b.closest('.pull-tab') === root,
    )
    const i = rows.indexOf(e.currentTarget)
    const next =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? rows.length - 1
          : (i + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length
    e.preventDefault()
    rows[next]?.focus()
  }

  /* The tab: pull it with a mouse or a pen. A touch is a tap, so the page can still scroll. */

  const onTabDown = (e: PointerEvent<HTMLDivElement>) => {
    m.pointer = e.pointerType
    if (disabled || e.pointerType === 'touch' || e.button !== 0) return
    e.preventDefault()
    try {
      // Keeps the drag going when the pointer leaves the tab.
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // The pointer is already gone; the drag still works while it stays on the tab.
    }
    const h = m.phase === 'open' ? fullHeight() : m.phase === 'closed' ? 0 : m.h.x
    m.drag = { id: e.pointerId, y: e.clientY, h, moved: false, samples: [{ t: e.timeStamp, y: e.clientY }] }
  }

  const onTabMove = (e: PointerEvent<HTMLDivElement>) => {
    const drag = m.drag
    if (!drag || drag.id !== e.pointerId) return
    const dy = e.clientY - drag.y
    if (!drag.moved && Math.abs(dy) < 4) return
    if (!drag.moved) {
      drag.moved = true
      stop()
      begin()
      itemRef.current?.setAttribute('data-dragging', '')
    }
    const H = fullHeight()
    let h = drag.h + dy
    if (h > H) h = H + rubber(h - H, 80)
    if (h < 0) h = 0
    m.h.x = h
    apply(h, H)
    drag.samples.push({ t: e.timeStamp, y: e.clientY })
    if (drag.samples.length > 6) drag.samples.shift()
  }

  const onTabUp = (e: PointerEvent<HTMLDivElement>) => {
    const drag = m.drag
    if (!drag || drag.id !== e.pointerId) return
    m.drag = null
    itemRef.current?.removeAttribute('data-dragging')
    if (!drag.moved) {
      set(value, !open)
      return
    }
    // The speed over the last few moves decides, not only where it was let go.
    const first = drag.samples[0]
    const last = drag.samples[drag.samples.length - 1]
    const span = last.t - first.t
    const v = span > 0 && e.timeStamp - last.t < 80 ? ((last.y - first.y) / span) * 1000 : 0
    const next = m.h.x + project(v) > fullHeight() / 2
    m.target = next
    if (reducedMotion()) {
      settle(next)
    } else {
      m.h.v = v
      m.h.response = next ? OPEN : CLOSE
      run()
    }
    if (next !== open) set(value, next)
  }

  const onTabClick = () => {
    // Mouse and pen are handled on release; a touch only taps.
    if (m.pointer === 'touch' && !disabled) set(value, !open)
  }

  return (
    <div
      {...rest}
      ref={itemRef}
      className={className ? `pull-tab__item ${className}` : 'pull-tab__item'}
      data-state={open ? 'open' : 'closed'}
      data-disabled={disabled || undefined}
    >
      <Heading className="pull-tab__heading">
        <button
          type="button"
          id={`${id}-trigger`}
          className="pull-tab__trigger"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          disabled={disabled}
          // A click from the keyboard has no pointer behind it (detail 0), so it doesn't animate.
          onClick={(e) => set(value, !open, e.detail === 0)}
          onKeyDown={onKeyDown}
        >
          {title}
        </button>
      </Heading>
      <div ref={panelRef} id={`${id}-panel`} className="pull-tab__panel" role="region" aria-labelledby={`${id}-trigger`}>
        <div ref={drawerRef} className="pull-tab__drawer">
          {children}
        </div>
      </div>
      <div
        className="pull-tab__tab"
        aria-hidden="true"
        onPointerDown={onTabDown}
        onPointerMove={onTabMove}
        onPointerUp={onTabUp}
        onPointerCancel={onTabUp}
        onClick={onTabClick}
      >
        <span className="pull-tab__tab-clip">
          <span className="pull-tab__tab-face" />
        </span>
      </div>
    </div>
  )
}
