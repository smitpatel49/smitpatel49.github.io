import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { ICON_BUTTON } from './iconButton'

const STORAGE_KEY = 'theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function savedTheme(): 'dark' | 'light' | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'dark' || v === 'light' ? v : null
  } catch {
    return null
  }
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0a0a0a' : '#ffffff')
}

/**
 * Light/dark switch. The inline script in index.html applies the saved or system theme
 * before first paint; this reads that state, follows live OS changes until the visitor
 * makes a choice, and only writes to localStorage on an explicit toggle.
 */
export default function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => { applyTheme(dark) }, [dark])

  useEffect(() => {
    const mq = window.matchMedia?.(DARK_QUERY)
    if (!mq) return
    const onChange = (e: MediaQueryListEvent) => { if (!savedTheme()) setDark(e.matches) }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const toggle = () => {
    const next = !dark
    try { localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light') } catch { /* storage blocked: still switch for this page */ }
    setDark(next)
  }

  return (
    <button type='button' aria-label='Dark theme' aria-pressed={dark} onClick={toggle} className={ICON_BUTTON}>
      {dark ? <Sun className='w-6 h-6' strokeWidth={2.2} aria-hidden='true'/> : <Moon className='w-6 h-6' strokeWidth={2.2} aria-hidden='true'/>}
    </button>
  )
}
