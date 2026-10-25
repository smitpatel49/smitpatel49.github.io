import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'

// The dialog is its own chunk, fetched the first time the menu opens.
const CommandPalette = lazy(() => import('./CommandPalette'))

function isApple(): boolean {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  return /mac|iphone|ipad|ipod/i.test(nav.userAgentData?.platform || navigator.platform || navigator.userAgent)
}

/**
 * Calls `onOpen` on Cmd+K on Apple devices and Ctrl+K elsewhere. It overrides the browser's own
 * Ctrl/Cmd+K (a shortcut to the address bar's search); on a Mac, Ctrl+K stays free for text
 * fields, where it deletes to the end of the line.
 */
export function useCommandMenuShortcut(onOpen: () => void) {
  const latest = useRef(onOpen)
  latest.current = onOpen
  useEffect(() => {
    const apple = isApple()
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'k' || !(apple ? e.metaKey : e.ctrlKey) || e.altKey || e.shiftKey) return
      e.preventDefault()
      latest.current()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
}

/**
 * Header button plus the Ctrl/Cmd+K shortcut for the jump-to menu. Render it once per page, in
 * the header (it owns the shortcut, so a second copy would open two dialogs).
 */
export function CommandMenu() {
  const [open, setOpen] = useState(false)
  // Stays true after the first open, so the dialog stays mounted (closed) rather than re-suspending.
  const [loaded, setLoaded] = useState(false)
  // Client-only app (no hydration), so the platform can be read during the first render.
  const [apple] = useState(isApple)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const show = useCallback(() => { setLoaded(true); setOpen(true) }, [])
  useCommandMenuShortcut(show)

  // Warm the chunk on hover or focus, so the first open usually shows instantly.
  const preload = () => { void import('./CommandPalette') }

  return (
    <>
      <button
        ref={triggerRef}
        type='button'
        onClick={show}
        onPointerEnter={preload}
        onFocus={preload}
        aria-haspopup='dialog'
        aria-expanded={open}
        aria-keyshortcuts={apple ? 'Meta+K' : 'Control+K'}
        aria-label='Jump to a section or case study'
        className={
          'inline-flex items-center justify-center gap-2 h-10 shrink-0 rounded-full shadow-sm transition-all w-10 sm:w-auto sm:pl-3 sm:pr-2 ' +
          'ring-1 ring-neutral-200 dark:ring-neutral-800 hover:ring-accent-400/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 ' +
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/60'
        }
      >
        <Search className='w-5 h-5 sm:w-4 sm:h-4' strokeWidth={2.2} aria-hidden='true'/>
        <kbd aria-hidden='true' className='hidden sm:inline-flex items-center rounded-md border border-neutral-300 dark:border-neutral-700 px-1.5 py-0.5 font-sans text-[11px] leading-none text-neutral-600 dark:text-neutral-400'>
          {apple ? '⌘K' : 'Ctrl K'}
        </kbd>
      </button>
      {loaded && (
        <Suspense fallback={null}>
          <CommandPalette open={open} onClose={() => setOpen(false)} returnFocusTo={triggerRef}/>
        </Suspense>
      )}
    </>
  )
}
