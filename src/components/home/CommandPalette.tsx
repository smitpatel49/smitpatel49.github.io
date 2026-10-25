import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, FileText, Hash, Search } from 'lucide-react'
import { projects } from '../../data/projects'
import { NAV_LINKS } from './sections'
import { navigateWithTransition } from './ViewTransitions'

type Item = {
  key: string
  label: string
  /** Shown at the right of the row and searched along with the label. */
  hint: string
  to: string
  /** Extra search terms that aren't shown (a case study's methods and tools). */
  terms: string
  /** For sections: the element id to move focus to after the jump. */
  sectionId?: string
}

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'Sections',
    items: NAV_LINKS.map(([id, to, label]) => ({ key: 's-' + id, label, hint: 'Section', to, terms: '', sectionId: id })),
  },
  {
    title: 'Case studies',
    items: projects.map(p => ({ key: 'p-' + p.slug, label: p.title, hint: p.area, to: '/projects/' + p.slug, terms: p.tech.join(' ') })),
  },
]

/** Every word typed must appear somewhere in the item; label matches sort before the rest. */
function filterGroups(query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return GROUPS
  return GROUPS.map(g => {
    const hits = g.items.filter(it => {
      const text = `${it.label} ${it.hint} ${it.terms}`.toLowerCase()
      return words.every(w => text.includes(w))
    })
    const inLabel = (it: Item) => words.every(w => it.label.toLowerCase().includes(w))
    return { ...g, items: [...hits.filter(inLabel), ...hits.filter(it => !inLabel(it))] }
  }).filter(g => g.items.length > 0)
}

/** After a same-page jump, put keyboard focus at the section's heading so Tab continues from there. */
function focusSection(id: string) {
  requestAnimationFrame(() => {
    const heading = document.getElementById(id)?.querySelector<HTMLElement>('h1, h2')
    if (!heading) return
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1')
    heading.classList.add('focus:outline-none')
    heading.focus({ preventScroll: true })
  })
}

/**
 * The jump-to dialog: a combobox (the search field) controlling a listbox of sections and case
 * studies, with the active option tracked by aria-activedescendant so focus never leaves the
 * field. Arrow keys move (wrapping), Enter opens, Escape or a click outside closes, and Tab
 * cycles between the field and the close button. Focus returns to where it was on close.
 */
export default function CommandPalette({ open, onClose, returnFocusTo }: {
  open: boolean
  onClose: () => void
  returnFocusTo: RefObject<HTMLElement>
}) {
  const navigate = useNavigate()
  const uid = useId()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef(true)

  const groups = useMemo(() => filterGroups(query), [query])
  const flat = useMemo(() => groups.flatMap(g => g.items), [groups])
  const optionId = (i: number) => `${uid}-opt-${i}`

  useEffect(() => { setActive(0) }, [query])

  // A layout effect, so a reopened menu never paints a frame with the previous query.
  useLayoutEffect(() => {
    if (!open) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    restoreFocus.current = true
    setQuery('')
    setActive(0)
    document.body.classList.add('overflow-hidden')
    inputRef.current?.focus()
    return () => {
      document.body.classList.remove('overflow-hidden')
      if (restoreFocus.current) {
        const target = previous && previous !== document.body && previous.isConnected ? previous : returnFocusTo.current
        target?.focus({ preventScroll: true })
      }
    }
  }, [open, returnFocusTo])

  // Keep the active option visible while arrowing through a scrolled list.
  useEffect(() => {
    if (!open) return
    document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, open])

  const choose = (item: Item | undefined) => {
    if (!item) return
    restoreFocus.current = false
    onClose()
    const samePage = new URL(item.to, window.location.href).pathname === window.location.pathname
    navigateWithTransition(navigate, item.to)
    if (samePage && item.sectionId) focusSection(item.sectionId)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    const n = flat.length
    // On the Close button, Enter and Space keep their native meaning (close); the arrow keys
    // still move through the results, and send focus back to the field.
    const inField = e.target === inputRef.current
    switch (inField || e.key !== 'Enter' ? e.key : '') {
      case 'ArrowDown': e.preventDefault(); inputRef.current?.focus(); if (n) setActive(a => (a + 1) % n); break
      case 'ArrowUp': e.preventDefault(); inputRef.current?.focus(); if (n) setActive(a => (a - 1 + n) % n); break
      case 'Enter': e.preventDefault(); choose(flat[active]); break
      case 'Escape': e.preventDefault(); onClose(); break
      case 'Tab': {
        const focusables = [...(panelRef.current?.querySelectorAll<HTMLElement>('input, button') ?? [])]
        if (focusables.length < 2) { e.preventDefault(); break }
        const i = focusables.indexOf(document.activeElement as HTMLElement)
        const next = e.shiftKey ? (i <= 0 ? focusables.length - 1 : i - 1) : (i + 1) % focusables.length
        e.preventDefault()
        focusables[next].focus()
        break
      }
    }
  }

  if (!open) return null

  let index = -1
  return createPortal(
    <div className='cmdk fixed inset-0 z-[120] px-4' onKeyDown={onKeyDown}>
      <div className='cmdk-backdrop absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]' onClick={onClose} aria-hidden='true'/>
      <div
        ref={panelRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby={uid + '-title'}
        className='cmdk-panel relative mx-auto mt-[10vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xl ring-1 ring-neutral-200 dark:ring-neutral-800'
      >
        <h2 id={uid + '-title'} className='sr-only'>Jump to a section or case study</h2>
        <div className='flex items-center gap-3 px-4 border-b border-neutral-200 dark:border-neutral-800'>
          <Search className='w-4 h-4 shrink-0 text-neutral-500 dark:text-neutral-400' aria-hidden='true'/>
          <input
            ref={inputRef}
            type='text'
            role='combobox'
            aria-expanded='true'
            aria-controls={uid + '-list'}
            aria-autocomplete='list'
            aria-activedescendant={flat.length ? optionId(active) : undefined}
            aria-label='Search sections and case studies'
            placeholder='Search sections and case studies'
            autoComplete='off'
            spellCheck={false}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className='h-14 flex-1 min-w-0 bg-transparent text-base outline-none placeholder:text-neutral-500 dark:placeholder:text-neutral-400'
          />
          <button
            type='button'
            onClick={onClose}
            aria-label='Close'
            className='shrink-0 rounded-md border border-neutral-300 dark:border-neutral-700 px-1.5 py-0.5 text-[11px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500'
          >
            Esc
          </button>
        </div>
        <div ref={listRef} id={uid + '-list'} role='listbox' aria-label='Results' className='max-h-[min(60vh,26rem)] overflow-y-auto overscroll-contain p-2'>
          {groups.map((g, gi) => (
            <div key={g.title} role='group' aria-labelledby={`${uid}-group-${gi}`} className='py-1'>
              <div id={`${uid}-group-${gi}`} aria-hidden='true' className='px-3 pt-2 pb-1 text-[11px] uppercase tracking-wider font-medium text-neutral-600 dark:text-neutral-400'>{g.title}</div>
              {g.items.map(item => {
                const i = ++index
                const selected = i === active
                return (
                  <div
                    key={item.key}
                    id={optionId(i)}
                    role='option'
                    aria-selected={selected}
                    onClick={() => choose(item)}
                    onPointerMove={() => { if (!selected) setActive(i) }}
                    className={'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer ' + (selected ? 'bg-accent-500/10 text-accent-700 dark:text-accent-400' : '')}
                  >
                    {item.sectionId
                      ? <Hash className='w-4 h-4 shrink-0 opacity-70' aria-hidden='true'/>
                      : <FileText className='w-4 h-4 shrink-0 opacity-70' aria-hidden='true'/>}
                    <span className='flex-1 min-w-0 truncate'>{item.label}</span>
                    <span className={'shrink-0 text-xs ' + (selected ? '' : 'text-neutral-600 dark:text-neutral-400')}>{item.hint}</span>
                    <CornerDownLeft className={'w-3.5 h-3.5 shrink-0 ' + (selected ? 'opacity-80' : 'opacity-0')} aria-hidden='true'/>
                  </div>
                )
              })}
            </div>
          ))}
          {flat.length === 0 && <p className='px-3 py-6 text-center text-sm text-neutral-600 dark:text-neutral-400'>No matches for “{query}”.</p>}
        </div>
        <div className='hidden sm:flex items-center gap-4 px-4 py-2 border-t border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400' aria-hidden='true'>
          <span><kbd className='font-sans'>↑</kbd> <kbd className='font-sans'>↓</kbd> to move</span>
          <span><kbd className='font-sans'>Enter</kbd> to open</span>
          <span><kbd className='font-sans'>Esc</kbd> to close</span>
        </div>
        <p role='status' className='sr-only'>{flat.length === 1 ? '1 result' : `${flat.length} results`}</p>
      </div>
    </div>,
    document.body,
  )
}
