let lastKeyAt = -Infinity
let browserAnimates = false
let named: HTMLElement | null = null
let latest = 0

addEventListener('keydown', () => (lastKeyAt = performance.now()), true)
// A swipe back on iOS already plays its own animation; a second one on top would flash.
addEventListener('popstate', (e) => (browserAnimates = e.hasUAVisualTransition), true)

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

function stageOf(slug: string | undefined) {
  if (!slug || reducedMotion()) return null
  const el = document.querySelector<HTMLElement>(`[data-stage="${slug}"]`)
  if (!el) return null
  const { top, bottom } = el.getBoundingClientRect()
  return top < innerHeight && bottom > 0 ? el : null
}

// Only one element may hold the name at a time, even when navigations overlap:
// the browser drops the whole transition if it finds the name twice.
function nameStage(el: HTMLElement | null) {
  if (named) named.style.viewTransitionName = ''
  if (el) el.style.viewTransitionName = 'stage'
  named = el
}

/**
 * Runs a DOM update inside a view transition. With a slug, that experiment's stage on the
 * old page and on the new one are treated as one object that moves and grows. `update`
 * must apply its change synchronously, because the browser takes the new picture right after.
 */
export function transition(update: () => void, slug?: string) {
  const skip =
    !document.startViewTransition || browserAnimates || performance.now() - lastKeyAt < 500
  browserAnimates = false
  if (skip) {
    update()
    return
  }

  const id = ++latest
  nameStage(stageOf(slug))
  const shared = named !== null

  const view = document.startViewTransition(() => {
    nameStage(null)
    update()
    if (shared) nameStage(stageOf(slug))
  })

  // A newer navigation skips this one: that rejects `ready`, and it's expected.
  view.ready.catch(() => {})
  view.finished.finally(() => {
    if (id === latest) nameStage(null)
  })
}
