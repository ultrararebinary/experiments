import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves the site from /experiments/
export default defineConfig({
  base: '/experiments/',
  plugins: [react()],
})
