import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { projects, type ProjectMeta } from '../../data/projects'
import { useReveal } from './useReveal'

/*
 * Bento layout on a 6-column grid from lg up: the three featured projects take a row of large
 * tiles, then the compact tiles fill a row of three and a row of two. md uses 2 columns (the
 * first featured tile and the last compact one full width) and phones a single column.
 */
const FEATURED_SPAN = ['md:col-span-2 lg:col-span-2', 'lg:col-span-2', 'lg:col-span-2']
const COMPACT_SPAN = ['lg:col-span-2', 'lg:col-span-2', 'lg:col-span-2', 'lg:col-span-3', 'md:col-span-2 lg:col-span-3']

// The title link's ::after covers the whole tile, so the tile is one link whose accessible name
// is just the title; the focus ring is drawn on that overlay so it outlines the full tile.
const STRETCHED_LINK = 'focus:outline-none after:absolute after:inset-0 after:rounded-2xl ' +
  'focus-visible:after:ring-2 focus-visible:after:ring-accent-500 focus-visible:after:ring-offset-2 ' +
  'focus-visible:after:ring-offset-white dark:focus-visible:after:ring-offset-neutral-950'

// Hover lift only when motion is allowed; the ring and shadow change either way, so the
// hover state never depends on movement alone.
const TILE = 'group relative h-full glass p-5 sm:p-6 flex flex-col transition duration-200 ' +
  'hover:shadow-lg hover:ring-1 hover:ring-accent-500/30 focus-within:ring-1 focus-within:ring-accent-500/30 ' +
  'motion-safe:hover:-translate-y-0.5 motion-safe:focus-within:-translate-y-0.5'

function TileHead({ p, size }: { p: ProjectMeta; size: 'lg' | 'sm' }) {
  return (
    <div className='flex items-start gap-3'>
      <span className={'inline-flex items-center justify-center shrink-0 rounded-xl bg-accent-500/10 text-accent-700 dark:text-accent-400 ' + (size === 'lg' ? 'w-10 h-10' : 'w-8 h-8')}>
        <p.icon className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} aria-hidden='true'/>
      </span>
      <div className='min-w-0 flex-1'>
        <div className='text-[11px] uppercase tracking-wider font-medium text-neutral-600 dark:text-neutral-400'>{p.area}</div>
        <h3 className={'mt-0.5 font-semibold tracking-tight leading-snug ' + (size === 'lg' ? 'text-lg sm:text-xl' : 'text-base')}>
          <Link to={'/projects/' + p.slug} className={STRETCHED_LINK}>{p.title}</Link>
        </h3>
      </div>
      <ArrowUpRight className='w-4 h-4 shrink-0 mt-1 text-neutral-500 dark:text-neutral-400 transition-colors group-hover:text-accent-600 dark:group-hover:text-accent-400' aria-hidden='true'/>
    </div>
  )
}

function FeaturedTile({ p }: { p: ProjectMeta }) {
  return (
    <article className={TILE + ' gap-5'}>
      <TileHead p={p} size='lg'/>
      <div className='mt-auto pt-4'>
        <div className='text-4xl sm:text-5xl font-semibold tracking-tight tabular-nums text-accent-700 dark:text-accent-400'>{p.metric.value}</div>
        {/* Two lines reserved from lg up, so the three big numbers line up across the row. */}
        <div className='mt-1 text-sm text-neutral-700 dark:text-neutral-300 lg:min-h-[2.5rem]'>{p.metric.label}</div>
      </div>
      {p.result && <p className='text-sm leading-relaxed text-neutral-800 dark:text-neutral-200'>{p.result}</p>}
      <ul className='flex flex-wrap gap-1.5' aria-label='Methods and tools'>
        {p.tech.slice(0, 3).map(t => (
          <li key={t} className='rounded-full border border-neutral-300 dark:border-neutral-700 px-2.5 py-0.5 text-xs text-neutral-700 dark:text-neutral-300'>{t}</li>
        ))}
      </ul>
    </article>
  )
}

function CompactTile({ p }: { p: ProjectMeta }) {
  return (
    <article className={TILE + ' gap-4'}>
      <TileHead p={p} size='sm'/>
      <div className='mt-auto flex items-baseline gap-3'>
        <div className='text-2xl font-semibold tracking-tight tabular-nums whitespace-nowrap text-accent-700 dark:text-accent-400'>{p.metric.value}</div>
        <div className='text-xs leading-snug text-neutral-700 dark:text-neutral-300'>{p.metric.label}</div>
      </div>
    </article>
  )
}

function Reveal({ className, children }: { className: string; children: ReactNode }) {
  const reveal = useReveal(0.2)
  return <motion.li {...reveal} className={'reveal ' + className}>{children}</motion.li>
}

export default function ProjectBento() {
  const featured = projects.filter(p => p.featured)
  const compact = projects.filter(p => !p.featured)
  return (
    <ul className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4' role='list'>
      {featured.map((p, i) => (
        <Reveal key={p.slug} className={FEATURED_SPAN[i] ?? 'lg:col-span-2'}><FeaturedTile p={p}/></Reveal>
      ))}
      {compact.map((p, i) => (
        <Reveal key={p.slug} className={COMPACT_SPAN[i] ?? 'lg:col-span-2'}><CompactTile p={p}/></Reveal>
      ))}
    </ul>
  )
}
