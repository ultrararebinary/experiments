import type { ComponentType } from 'react'

type DemoModule = {
  meta: { title: string; description: string; date: string }
  Preview: ComponentType
  default: ComponentType
}

export type Experiment = DemoModule['meta'] & {
  slug: string
  Preview: ComponentType
  Demo: ComponentType
  readme: string
  files: { name: string; code: string }[]
}

// Every folder in experiments/ with a demo.tsx shows up here. Nothing to register by hand.
const demos = import.meta.glob<DemoModule>('../experiments/*/demo.tsx', { eager: true })
const readmes = import.meta.glob<string>('../experiments/*/README.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const sources = import.meta.glob<string>(
  ['../experiments/*/*.tsx', '../experiments/*/*.css', '!../experiments/*/demo.tsx'],
  { query: '?raw', import: 'default', eager: true },
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
  .map(([path, mod]) => {
    const slug = folderOf(path)
    const files = Object.entries(sources)
      .filter(([file]) => folderOf(file) === slug)
      .map(([file, code]) => ({ name: file.split('/').pop()!, code }))
      // component first, then its stylesheet
      .sort((a, b) => Number(a.name.endsWith('.css')) - Number(b.name.endsWith('.css')))
    return {
      ...mod.meta,
      slug,
      Preview: mod.Preview,
      Demo: mod.default,
      readme: readmes[`../experiments/${slug}/README.md`] ?? '',
      files,
    }
  })
  .sort((a, b) => b.date.localeCompare(a.date))
