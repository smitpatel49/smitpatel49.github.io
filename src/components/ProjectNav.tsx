import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Home } from 'lucide-react'
import { projects } from '../data/projects'

export function ProjectBreadcrumb({ slug }: { slug: string }) {
  const current = projects.find(p => p.slug === slug)
  return (
    <nav aria-label='Breadcrumb' className='text-xs sm:text-sm text-center opacity-70 mb-3'>
      <ol className='flex flex-wrap items-center justify-center gap-1.5'>
        <li><Link to='/' className='hover:underline hover:opacity-100 transition-opacity'>Home</Link></li>
        <li aria-hidden='true' className='opacity-50'>/</li>
        <li><Link to='/#projects' className='hover:underline hover:opacity-100 transition-opacity'>Projects</Link></li>
        <li aria-hidden='true' className='opacity-50'>/</li>
        <li aria-current='page' className='opacity-90 max-w-[60vw] sm:max-w-none truncate'>{current?.title ?? slug}</li>
      </ol>
    </nav>
  )
}

const CARD = 'group flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors'

/**
 * Previous / Home / Next at the foot of a case study, in the order of the home page's
 * project grid. No wraparound: the first project has no Previous and the last no Next; an
 * empty cell keeps Home centered on wider screens.
 */
export function ProjectPager({ slug }: { slug: string }) {
  const idx = projects.findIndex(p => p.slug === slug)
  if (idx === -1) return null
  const prev = idx > 0 ? projects[idx - 1] : null
  const next = idx < projects.length - 1 ? projects[idx + 1] : null
  const spacer = <div aria-hidden='true' className='hidden sm:block' />
  return (
    <nav aria-label='Other case studies' className='mt-10 pt-6 border-t border-neutral-200/70 dark:border-neutral-800/70'>
      <div className='grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-3 items-stretch text-sm'>
        {prev ? (
          <Link to={'/projects/' + prev.slug} className={CARD}>
            <ChevronLeft className='w-4 h-4 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity' aria-hidden='true'/>
            <span className='min-w-0'>
              <span className='block text-[11px] uppercase tracking-wide opacity-60'>Previous</span>
              <span className='block truncate font-medium'>{prev.title}</span>
            </span>
          </Link>
        ) : spacer}
        <Link to='/' aria-label='Back to home' className='flex items-center justify-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors'>
          <Home className='w-4 h-4' aria-hidden='true'/> <span>Home</span>
        </Link>
        {next ? (
          <Link to={'/projects/' + next.slug} className={CARD + ' justify-end text-right'}>
            <span className='min-w-0'>
              <span className='block text-[11px] uppercase tracking-wide opacity-60'>Next</span>
              <span className='block truncate font-medium'>{next.title}</span>
            </span>
            <ChevronRight className='w-4 h-4 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity' aria-hidden='true'/>
          </Link>
        ) : spacer}
      </div>
    </nav>
  )
}
