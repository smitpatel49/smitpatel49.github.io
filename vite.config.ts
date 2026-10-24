import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// index.html's <noscript> fallback shows the contact email; take it from src/data/site.ts
// so there is only one place to change it.
function siteEmail(): Plugin {
  const src = readFileSync(new URL('./src/data/site.ts', import.meta.url), 'utf8')
  const email = src.match(/EMAIL\s*=\s*'([^']+)'/)?.[1]
  if (!email) throw new Error('EMAIL not found in src/data/site.ts')
  return { name: 'site-email', transformIndexHtml: html => html.replaceAll('%SITE_EMAIL%', email) }
}

export default defineConfig({
  plugins: [react(), siteEmail()],
  base: '/',            // <-- root site!
})
