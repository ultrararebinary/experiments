import { useState } from 'react'

export function ThemeToggle() {
  // index.html sets the starting theme before the first paint.
  const [theme, setTheme] = useState(document.documentElement.dataset.theme ?? 'dark')
  const next = theme === 'dark' ? 'light' : 'dark'

  function toggle() {
    document.documentElement.dataset.theme = next
    setTheme(next)
    try {
      localStorage.setItem('theme', next)
    } catch {
      // Private window or blocked storage: the choice just won't survive a reload.
    }
  }

  return (
    <button className="theme-toggle" onClick={toggle}>
      {next === 'light' ? 'Light mode' : 'Dark mode'}
    </button>
  )
}
