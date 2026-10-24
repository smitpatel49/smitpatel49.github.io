import React, { createContext, useContext } from 'react'
import { Lock, ExternalLink } from 'lucide-react'
import { ProjectBreadcrumb, ProjectPager } from './ProjectNav'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import AmbientBackground from './AmbientBackground'
import { useHeadMeta } from '../hooks/useHeadMeta'
import { projects } from '../data/projects'
import { EMAIL } from '../data/site'

/**
 * Shared building blocks for the eight case-study pages, so every page has the same
 * structure: overview, headline numbers, results, how it works, lessons, limitations,
 * and a note on the code.
 */

const ProjectContext = createContext<string>('')

export function CaseStudyPage({ slug, lede, children }: { slug: string; lede: string; children: React.ReactNode }) {
  const meta = projects.find(p => p.slug === slug)
  if (!meta) throw new Error(`unknown project slug: ${slug}`)
  useHeadMeta({ title: meta.title, description: meta.summary, path: '/projects/' + slug })
  return (
    <div className='relative z-0 min-h-screen bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-neutral-100'>
      <a href='#main-content' className='sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:rounded-xl focus:bg-accent-600 focus:text-white focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg'>Skip to main content</a>
      <AmbientBackground/>
      <ProjectContext.Provider value={meta.title}>
      <main id='main-content'>
        <div className='section'>
          <div className='section-stripe'></div>
          <ProjectBreadcrumb slug={slug} />
          <h1 className='section-title'>{meta.title}</h1>
          <p className='text-center opacity-80 max-w-2xl mx-auto'>{lede}</p>
          <div className='flex gap-2 flex-wrap justify-center mt-4'>
            {meta.tech.map(t => <Badge key={t} variant='outline'>{t}</Badge>)}
          </div>
          <div className='grid grid-cols-1 gap-4 mt-8 max-w-3xl mx-auto'>
            {children}
          </div>
          <ProjectPager slug={slug} />
        </div>
      </main>
      </ProjectContext.Provider>
    </div>
  )
}

/** A titled card; the basic section of a case study. */
export function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
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

/** A result figure from the project's results/ folder, copied into public/projects/<slug>/. */
export function Figure({ src, alt, caption, maxWidth }: { src: string; alt: string; caption?: string; maxWidth?: number }) {
  return (
    <figure className='space-y-2'>
      <img src={src} alt={alt} loading='lazy' style={maxWidth ? { maxWidth } : undefined} className='w-full h-auto mx-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white' />
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
      <span><span className='font-medium underline'>{label}</span><span className='block text-xs opacity-70'>{note}</span></span>
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
      <CardHeader><CardTitle className='flex items-center justify-center gap-2'><Lock className='w-4 h-4' aria-hidden='true' /> Code</CardTitle></CardHeader>
      <CardContent className='text-sm leading-relaxed space-y-3'>
        <p className='opacity-90'>The repository is private. It contains the full pipeline, {tests} automated tests with a CI workflow that lints and tests every push, a README with setup and usage, a code reference, and an executed walkthrough notebook{extras.length ? ', plus ' + extras.join(', ') : ''}.</p>
        <p><a className='underline' href={`mailto:${EMAIL}?subject=${subject}`}>Email me for access</a> <span className='opacity-70'>and I'll share it.</span></p>
      </CardContent>
    </Card>
  )
}
