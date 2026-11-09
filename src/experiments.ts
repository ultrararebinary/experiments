import type { ComponentType } from 'react'

type DemoModule = {
  // `order` settles experiments added on the same day: the higher one comes first.
  meta: { title: string; description: string; date: string; order?: number }
  Preview: ComponentType
  default: ComponentType
}

export type Experiment = DemoModule['meta'] & {
  slug: string
  Preview: ComponentType
  Demo: ComponentType
}

/** What only the experiment page shows: the files to copy and the README as HTML. */
export type Details = {
  files: { name: string; code: string }[]
  notes: string
}

// Every folder in experiments/ with a demo.tsx shows up here. Nothing to register by hand.
// The demos load with the site, because the home page and the page transition need them at once.
const demos = import.meta.glob<DemoModule>('../experiments/*/demo.tsx', { eager: true })

// The code and the notes load only when an experiment page opens, so the home page doesn't
// download the text of every file.
const readmes = import.meta.glob<string>('../experiments/*/README.md', {
  query: '?raw',
  import: 'default',
})
const sources = import.meta.glob<string>(
  ['../experiments/*/*.tsx', '../experiments/*/*.css', '!../experiments/*/demo.tsx'],
  { query: '?raw', import: 'default' },
)

const folderOf = (path: string) => path.split('/')[2]

// In UTC, so the month doesn't change with the visitor's time zone.
export const formatDate = (date: string) =>
  new Date(`${date}T00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

export const experiments: Experiment[] = Object.entries(demos)
  .map(([path, mod]) => ({
    ...mod.meta,
    slug: folderOf(path),
    Preview: mod.Preview,
    Demo: mod.default,
  }))
  .sort((a, b) => b.date.localeCompare(a.date) || (b.order ?? 0) - (a.order ?? 0))

// One request per experiment, kept: going back to a page shows its code at once.
const loaded = new Map<string, Promise<Details>>()

export function loadDetails(slug: string): Promise<Details> {
  let details = loaded.get(slug)
  if (!details) {
    details = fetchDetails(slug)
    // A failed load is forgotten, so the next visit tries again.
    details.catch(() => loaded.delete(slug))
    loaded.set(slug, details)
  }
  return details
}

async function fetchDetails(slug: string): Promise<Details> {
  const readme = readmes[`../experiments/${slug}/README.md`]
  const [{ marked }, text, files] = await Promise.all([
    import('marked'),
    readme ? readme() : Promise.resolve(''),
    Promise.all(
      Object.entries(sources)
        .filter(([file]) => folderOf(file) === slug)
        .map(async ([file, load]) => ({ name: file.split('/').pop()!, code: await load() })),
    ),
  ])
  // component first, then its stylesheet
  files.sort((a, b) => Number(a.name.endsWith('.css')) - Number(b.name.endsWith('.css')))
  // The page already shows the title, so the README's first heading is dropped.
  // Links to other sites open in a new tab, so the visitor keeps their place in the gallery.
  const notes = marked
    .parse(text.replace(/^#\s.*\n/, ''), { async: false })
    .replace(/<a href="(https?:)/g, '<a target="_blank" rel="noopener noreferrer" href="$1')
  return { files, notes }
}
