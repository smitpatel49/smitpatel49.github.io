import React, { createContext, useContext, useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Lock, ExternalLink } from 'lucide-react'
import { ProjectBreadcrumb, ProjectPager } from './ProjectNav'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import AmbientBackground from './AmbientBackground'
import { PageHeader, SiteFooter, SkipLink, PAGE_SHELL } from './SiteChrome'
import NotFound from '../pages/NotFound'
import { useHeadMeta } from '../hooks/useHeadMeta'
import { projects, type ProjectMeta } from '../data/projects'
import { EMAIL } from '../data/site'
import imageSizes from '../data/imageSizes.json'

/**
 * Shared building blocks for the eight case-study pages, so every page has the same
 * structure: a summary, overview, headline numbers, results, how it works, lessons,
 * limitations, and a note on the code.
 */

const ProjectContext = createContext<string>('')

/**
 * The “at a glance” rows at the top of a case study. Plain strings on purpose:
 * scripts/case-studies.mjs reads them (via each page’s `summary` prop) to build the page’s
 * Open Graph image and its alt text, so the card and the link preview can’t drift apart.
 */
export type SummaryContent = {
  problem: string
  approach: string
  /** The single most important number, with what it’s measured against. */
  result: string
  decision: string
  stack: string[]
  data: { synthetic: string; real: string }
}

type CaseStudyProps = { slug: string; lede: string; summary: SummaryContent; children: React.ReactNode }

export function CaseStudyPage({ slug, ...rest }: CaseStudyProps) {
  const meta = projects.find(p => p.slug === slug)
  if (!meta) return <NotFound/>
  return <CaseStudyLayout meta={meta} {...rest} />
}

function CaseStudyLayout({ meta, lede, summary, children }: Omit<CaseStudyProps, 'slug'> & { meta: ProjectMeta }) {
  useHeadMeta({ title: meta.title, description: meta.summary, path: '/projects/' + meta.slug, type: 'article' })
  return (
    <div className={PAGE_SHELL}>
      <SkipLink/>
      <AmbientBackground/>
      <PageHeader/>
      <ProjectContext.Provider value={meta.title}>
      <main id='main-content'>
        <div className='section'>
          <div className='section-stripe'></div>
          <ProjectBreadcrumb slug={meta.slug} />
          <h1 className='section-title'>{meta.title}</h1>
          <p className='text-center opacity-80 max-w-2xl mx-auto'>{lede}</p>
          <div className='flex gap-2 flex-wrap justify-center mt-4'>
            {meta.tech.map(t => <Badge key={t} variant='outline'>{t}</Badge>)}
          </div>
          <div className='grid grid-cols-1 gap-4 mt-8 max-w-3xl mx-auto'>
            <Summary {...summary} />
            {children}
          </div>
          <ProjectPager slug={meta.slug} />
        </div>
      </main>
      </ProjectContext.Provider>
      <SiteFooter/>
    </div>
  )
}

/**
 * A scannable summary card: a definition list so screen readers announce each label with
 * its value. Rows stack label-over-value on phones and sit side by side from `sm` up.
 */
export function Summary({ problem, approach, result, decision, stack, data }: SummaryContent) {
  const rows: { term: string; value: React.ReactNode; strong?: boolean }[] = [
    { term: 'Problem', value: problem },
    { term: 'Approach', value: approach },
    { term: 'Result', value: result, strong: true },
    { term: 'Decision it supports', value: decision },
    { term: 'Stack', value: stack.join(', ') },
    { term: 'Data', value: <>
      <span className='block'><span className='font-medium'>Synthetic:</span> {data.synthetic}</span>
      <span className='block'><span className='font-medium'>Real:</span> {data.real}</span>
    </> },
    { term: 'My role', value: 'Designed and built end to end (a solo project)' },
  ]
  return (
    <Card>
      <CardHeader><CardTitle as='h2'>At a glance</CardTitle></CardHeader>
      <CardContent className='text-sm leading-relaxed'>
        <dl className='divide-y divide-neutral-200/70 dark:divide-neutral-800/70'>
          {rows.map(r => (
            <div key={r.term} className={`grid gap-x-4 gap-y-0.5 py-2 px-2 sm:grid-cols-[9.5rem_1fr] ${r.strong ? 'rounded-lg bg-accent-500/10 dark:bg-accent-500/15' : ''}`}>
              <dt className='text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400 sm:pt-0.5'>{r.term}</dt>
              <dd className={r.strong ? 'font-semibold text-neutral-900 dark:text-white' : 'opacity-90'}>{r.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

/** A titled card; the basic section of a case study. */
export function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle as='h2'>{title}</CardTitle></CardHeader>
      <CardContent className='text-sm leading-relaxed space-y-3'>{children}</CardContent>
    </Card>
  )
}

/** A row of headline numbers. Values are strings so they can carry units and signs. */
export function Stats({ items }: { items: { value: string; label: string }[] }) {
  const cols = items.length >= 4 ? 'grid-cols-2 md:grid-cols-4' : items.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'
  return (
    <div className={`grid ${cols} gap-3 text-center`}>
      {items.map(s => (
        <div key={s.label} className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'>
          <div className='text-lg font-bold'>{s.value}</div>
          <div className='text-[11px] opacity-70'>{s.label}</div>
        </div>
      ))}
    </div>
  )
}

const SIZES: Record<string, number[]> = imageSizes

/**
 * A result figure from the project's results/ folder, copied into public/media/<slug>/
 * as WebP. Width and height come from src/data/imageSizes.json (npm run images:sizes), so
 * the browser reserves the right space before the image loads.
 */
export function Figure({ src, alt, caption, maxWidth }: { src: string; alt: string; caption?: string; maxWidth?: number }) {
  const size = SIZES[src]
  return (
    <figure className='space-y-2'>
      <img src={src} alt={alt} loading='lazy' decoding='async' width={size?.[0]} height={size?.[1]} style={maxWidth ? { maxWidth } : undefined} className='w-full h-auto mx-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white' />
      {caption && <figcaption className='text-xs opacity-70 text-center'>{caption}</figcaption>}
    </figure>
  )
}

/**
 * A short looping clip (a replacement for an animated GIF): WebM with an MP4 fallback and
 * a poster from the first frame. It plays muted and looped; when the visitor prefers
 * reduced motion it doesn’t autoplay and starts paused on the poster. Native controls are
 * always shown so the clip can be paused.
 */
export function Video({ base, label, caption, maxWidth }: { base: string; label: string; caption?: string; maxWidth?: number }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLVideoElement>(null)
  const poster = base + '_poster.jpg'
  const size = SIZES[poster]
  useEffect(() => {
    const v = ref.current
    if (!v) return
    if (reduce) v.pause()
    else v.play().catch(() => { /* autoplay refused: the controls are there */ })
  }, [reduce])
  return (
    <figure className='space-y-2'>
      <video ref={ref} aria-label={label} poster={poster} width={size?.[0]} height={size?.[1]}
        autoPlay={!reduce} muted loop playsInline controls preload={reduce ? 'metadata' : 'auto'}
        style={maxWidth ? { maxWidth } : undefined}
        className='block w-full h-auto mx-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white'>
        <source src={base + '.webm'} type='video/webm' />
        <source src={base + '.mp4'} type='video/mp4' />
        <a href={base + '.mp4'}>Download the clip (MP4)</a>
      </video>
      {caption && <figcaption className='text-xs opacity-70 text-center'>{caption}</figcaption>}
    </figure>
  )
}

/** A compact data table. The first column is left-aligned, the rest right-aligned. */
export function DataTable({ head, rows, highlight }: { head: string[]; rows: (string | number)[][]; highlight?: number }) {
  return (
    <div className='overflow-x-auto'>
      <table className='w-full text-xs md:text-sm border-collapse'>
        <thead>
          <tr>{head.map((h, i) => <th key={h + i} className={`border-b border-neutral-300 dark:border-neutral-700 px-2 py-1.5 font-medium opacity-80 ${i ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={`border-b border-neutral-200/60 dark:border-neutral-800/60 ${i === highlight ? 'font-semibold' : ''}`}>
              {r.map((c, j) => <td key={j} className={`px-2 py-1.5 ${j ? 'text-right tabular-nums' : 'text-left'}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Numbered pipeline steps for the "How it works" section. */
export function Steps({ items }: { items: { title: string; text: string }[] }) {
  return (
    <ol className='space-y-2'>
      {items.map((s, i) => (
        <li key={s.title} className='flex gap-3'>
          <span className='shrink-0 w-6 h-6 rounded-full bg-accent-500/15 text-accent-700 dark:text-accent-400 text-xs font-semibold flex items-center justify-center'>{i + 1}</span>
          <span><span className='font-medium'>{s.title}.</span> <span className='opacity-90'>{s.text}</span></span>
        </li>
      ))}
    </ol>
  )
}

/** A plain bullet list. */
export function Bullets({ items }: { items: React.ReactNode[] }) {
  return <ul className='list-disc pl-5 space-y-1.5 opacity-90'>{items.map((b, i) => <li key={i}>{b}</li>)}</ul>
}

/** Link to an interactive dashboard hosted under public/dashboards/. */
export function DashboardLink({ href, label, note }: { href: string; label: string; note: string }) {
  return (
    <a href={href} target='_blank' rel='noopener' className='flex items-start gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors'>
      <ExternalLink className='w-4 h-4 mt-0.5 shrink-0 opacity-70' aria-hidden='true' />
      <span><span className='font-medium underline'>{label}</span><span className='sr-only'> (opens in a new tab)</span><span className='block text-xs opacity-70'>{note}</span></span>
    </a>
  )
}

/**
 * The closing "Code" card. The repositories are private, so this says what exists and
 * offers it on request instead of linking to a page visitors can't open.
 */
export function CodeNote({ tests, extras }: { tests: number; extras: string[] }) {
  const subject = encodeURIComponent('Code request: ' + useContext(ProjectContext))
  return (
    <Card>
      <CardHeader><CardTitle as='h2' className='flex items-center justify-center gap-2'><Lock className='w-4 h-4' aria-hidden='true' /> Code</CardTitle></CardHeader>
      <CardContent className='text-sm leading-relaxed space-y-3'>
        <p className='opacity-90'>The repository is private. It contains the full pipeline, {tests} automated tests with a CI workflow that lints and tests every push, a README with setup and usage, a code reference, and an executed walkthrough notebook{extras.length ? ', plus ' + extras.join(', ') : ''}.</p>
        <p><a className='underline' href={`mailto:${EMAIL}?subject=${subject}`}>Email me for access</a> <span className='opacity-70'>and I’ll share it.</span></p>
      </CardContent>
    </Card>
  )
}
