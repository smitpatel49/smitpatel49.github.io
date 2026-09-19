
import React from 'react'
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
        <li><a href='/#projects' className='hover:underline hover:opacity-100 transition-opacity'>Projects</a></li>
        <li aria-hidden='true' className='opacity-50'>/</li>
        <li aria-current='page' className='opacity-90 max-w-[60vw] sm:max-w-none truncate'>{current?.title ?? slug}</li>
      </ol>
    </nav>
  )
}

export function ProjectPager({ slug }: { slug: string }) {
  const idx = projects.findIndex(p => p.slug === slug)
  if (idx === -1) return null
  const prev = projects[(idx - 1 + projects.length) % projects.length]
  const next = projects[(idx + 1) % projects.length]
  return (
    <nav aria-label='Other case studies' className='mt-10 pt-6 border-t border-neutral-200/70 dark:border-neutral-800/70'>
      <div className='grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-stretch text-sm'>
        <Link to={'/projects/' + prev.slug} className='group flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors'>
          <ChevronLeft className='w-4 h-4 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity' aria-hidden='true'/>
          <span className='min-w-0'>
            <span className='block text-[11px] uppercase tracking-wide opacity-60'>Previous</span>
            <span className='block truncate font-medium'>{prev.title}</span>
          </span>
        </Link>
        <Link to='/' aria-label='Back to home' className='flex items-center justify-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors'>
          <Home className='w-4 h-4' aria-hidden='true'/> <span>Home</span>
        </Link>
        <Link to={'/projects/' + next.slug} className='group flex items-center gap-2 justify-end text-right rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors'>
          <span className='min-w-0'>
            <span className='block text-[11px] uppercase tracking-wide opacity-60'>Next</span>
            <span className='block truncate font-medium'>{next.title}</span>
          </span>
          <ChevronRight className='w-4 h-4 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity' aria-hidden='true'/>
        </Link>
      </div>
    </nav>
  )
}
