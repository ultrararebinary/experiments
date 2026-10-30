// Rebuilds the experiment previews in docs/readme/ and the list between the markers in README.md.
// Run it with `npm run readme`, which builds the site first. It drives Chrome through the
// DevTools protocol, so it needs no dependency: Node 22 or newer and a Chrome install.
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as sleep } from 'node:timers/promises'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SITE_PORT = 4320
const CDP_PORT = 9333
const LIVE = 'https://ultrararebinary.github.io/experiments/'
const CHROME =
  process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

// Some previews only show what they are once pressed. The script holds the pointer on this
// selector while it takes the picture.
const HOLD = { 'color-bloom': '.cb__dot' }

const VIEW = { width: 760, height: 2000 }
const THEMES = ['light', 'dark']
const START = '<!-- experiments:start -->'
const END = '<!-- experiments:end -->'

async function readExperiments() {
  const names = await readdir(join(ROOT, 'experiments'), { withFileTypes: true })
  const list = []
  for (const dir of names) {
    if (!dir.isDirectory()) continue
    const src = await readFile(join(ROOT, 'experiments', dir.name, 'demo.tsx'), 'utf8').catch(() => null)
    if (!src) continue
    const field = (key) => src.match(new RegExp(`${key}:\\s*(['"])(.*?)\\1`))?.[2]
    const [title, description, date] = [field('title'), field('description'), field('date')]
    if (!title || !description || !date) throw new Error(`${dir.name}/demo.tsx: meta is missing a field`)
    const order = Number(src.match(/order:\s*(\d+)/)?.[1] ?? 0)
    list.push({ slug: dir.name, title, description, date, order })
  }
  // Same order as the site: newest first.
  return list.sort((a, b) => b.date.localeCompare(a.date) || b.order - a.order || a.slug.localeCompare(b.slug))
}

async function waitForHttp(url) {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(url)).ok) return
    } catch {}
    await sleep(100)
  }
  throw new Error(`Nothing answered at ${url}`)
}

async function connect() {
  let target
  for (let i = 0; i < 100 && !target; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json()
      target = targets.find((t) => t.type === 'page')
    } catch {}
    if (!target) await sleep(100)
  }
  if (!target) throw new Error('Chrome did not open a page. Set CHROME_PATH if it lives elsewhere.')

  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.onopen = resolve
    ws.onerror = reject
  })
  let id = 0
  const pending = new Map()
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data)
    const call = pending.get(msg.id)
    if (!call) return
    pending.delete(msg.id)
    if (msg.error) call.reject(new Error(msg.error.message))
    else call.resolve(msg.result)
  }
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const n = ++id
      pending.set(n, { resolve, reject })
      ws.send(JSON.stringify({ id: n, method, params }))
    })
  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    })
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? 'evaluate failed')
    return result.value
  }
  return { send, evaluate, close: () => ws.close() }
}

const png = async (page, clip, file) => {
  const { data } = await page.send('Page.captureScreenshot', {
    format: 'png',
    clip: { ...clip, scale: 1 },
  })
  await writeFile(file, Buffer.from(data, 'base64'))
}

async function capture(page, experiments, outDir) {
  await page.send('Emulation.setDeviceMetricsOverride', {
    ...VIEW,
    deviceScaleFactor: 2,
    mobile: false,
  })

  for (const theme of THEMES) {
    await page.send('Page.navigate', { url: `http://127.0.0.1:${SITE_PORT}/experiments/` })
    await page.evaluate(`localStorage.setItem('theme', '${theme}')`).catch(() => {})
    await page.send('Page.navigate', { url: `http://127.0.0.1:${SITE_PORT}/experiments/` })
    for (let i = 0; i < 100; i++) {
      if (await page.evaluate(`document.querySelector('[data-stage]') !== null`).catch(() => false)) break
      await sleep(100)
    }
    // Fonts loaded and the arrival animation (300 ms plus up to 150 ms of delay) finished.
    await page.evaluate(`document.fonts.ready.then(() => true)`)
    await sleep(900)
    if ((await page.evaluate(`document.documentElement.dataset.theme`)) !== theme) {
      throw new Error(`The page is not in the ${theme} theme`)
    }

    // Stop just under the first preview, before the line of text that follows it.
    const bottom = await page.evaluate(
      `document.querySelector('[data-stage]').getBoundingClientRect().bottom + scrollY`,
    )
    await png(page, { x: 0, y: 0, width: VIEW.width, height: Math.ceil(bottom) + 8 }, join(outDir, `hero-${theme}.png`))

    for (const { slug } of experiments) {
      const rect = await page.evaluate(`(() => {
        const r = document.querySelector('[data-stage="${slug}"]').getBoundingClientRect()
        return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }
      })()`)
      const hold = HOLD[slug]
      let point
      if (hold) {
        point = await page.evaluate(`(() => {
          const r = document.querySelector('[data-stage="${slug}"] ${hold}').getBoundingClientRect()
          return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
        })()`)
        await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point })
        await page.send('Input.dispatchMouseEvent', {
          type: 'mousePressed', ...point, button: 'left', buttons: 1, clickCount: 1,
        })
        await sleep(900)
      }
      await png(page, rect, join(outDir, `${slug}-${theme}.png`))
      if (hold) {
        // Releasing on the dot itself cancels, so the color doesn't change.
        await page.send('Input.dispatchMouseEvent', {
          type: 'mouseReleased', ...point, button: 'left', buttons: 0, clickCount: 1,
        })
        await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 })
        await sleep(400)
      }
    }
  }
}

function listMarkdown(experiments) {
  return experiments
    .map(({ slug, title, description }) => {
      const url = `${LIVE}#/${slug}`
      return [
        `### [${title}](${url})`,
        '',
        // Each tag on its own line and no blank line inside: GitHub reads this as one block of
        // raw HTML. With `<a><picture>` on one line it empties the picture and keeps only the
        // light image.
        `<a href="${url}">`,
        `  <picture>`,
        `    <source media="(prefers-color-scheme: dark)" srcset="docs/readme/${slug}-dark.png">`,
        `    <img alt="${title}, as it looks on the site" src="docs/readme/${slug}-light.png">`,
        `  </picture>`,
        `</a>`,
        '',
        description,
      ].join('\n')
    })
    .join('\n\n')
}

async function updateReadme(experiments) {
  const file = join(ROOT, 'README.md')
  const text = await readFile(file, 'utf8')
  const start = text.indexOf(START)
  const end = text.indexOf(END)
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`README.md needs ${START} and ${END} around the list`)
  }
  const next = `${text.slice(0, start + START.length)}\n\n${listMarkdown(experiments)}\n\n${text.slice(end)}`
  await writeFile(file, next)
}

const experiments = await readExperiments()
const outDir = join(ROOT, 'docs', 'readme')
await mkdir(outDir, { recursive: true })

const profile = await mkdtemp(join(tmpdir(), 'experiments-readme-'))
const server = spawn(
  join(ROOT, 'node_modules', '.bin', 'vite'),
  ['preview', '--base', '/experiments/', '--host', '127.0.0.1', '--port', String(SITE_PORT), '--strictPort'],
  { cwd: ROOT, stdio: 'ignore' },
)
const chrome = spawn(
  CHROME,
  [
    '--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
    `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`, 'about:blank',
  ],
  { stdio: 'ignore' },
)

let page
try {
  await waitForHttp(`http://127.0.0.1:${SITE_PORT}/experiments/`)
  page = await connect()
  await capture(page, experiments, outDir)
  await updateReadme(experiments)
  console.log(`Updated ${experiments.length} previews and the list in README.md`)
} finally {
  page?.close()
  chrome.kill()
  server.kill()
  await rm(profile, { recursive: true, force: true }).catch(() => {})
}
