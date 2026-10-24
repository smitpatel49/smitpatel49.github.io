import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Github, Linkedin } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { ICON_BUTTON } from './iconButton'
import { EMAIL, GITHUB, LINKEDIN } from '../data/site'

/** The sticky translucent bar shared by every page's header. */
export function HeaderBar({ children }: { children: ReactNode }) {
  return (
    <header className='site-header sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/40 dark:bg-neutral-900/60 border-b'>
      {children}
    </header>
  )
}

/** Email, GitHub and LinkedIn as round icon links (styled directly, no nested button). */
export function HeaderIconLinks({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <a href={'mailto:' + EMAIL} aria-label='Email Smit Patel' className={ICON_BUTTON}>
        <Mail className='w-6 h-6' strokeWidth={2.1} aria-hidden='true'/>
      </a>
      <a href={GITHUB} target='_blank' rel='noreferrer' aria-label='Smit Patel’s GitHub (opens in a new tab)' className={ICON_BUTTON}>
        <Github className='w-6 h-6' strokeWidth={2.1} aria-hidden='true'/>
      </a>
      <a href={LINKEDIN} target='_blank' rel='noreferrer' aria-label='Smit Patel’s LinkedIn (opens in a new tab)' className={ICON_BUTTON}>
        <Linkedin className='w-6 h-6' strokeWidth={2.1} aria-hidden='true'/>
      </a>
    </div>
  )
}

/** Header for case studies and other inner pages: name (home link), Projects link, theme toggle. */
export function PageHeader() {
  return (
    <HeaderBar>
      <div className='container-narrow h-14 flex items-center justify-between gap-3'>
        <nav aria-label='Site' className='flex items-center gap-5 text-sm whitespace-nowrap min-w-0'>
          <Link to='/' className='font-semibold text-base tracking-tight hover:text-accent-600 dark:hover:text-accent-400 transition-colors'>Smit Patel</Link>
          <Link to='/#projects' className='opacity-80 hover:opacity-100 transition-colors'>Projects</Link>
        </nav>
        <div className='flex items-center gap-2'>
          <ThemeToggle/>
          <HeaderIconLinks className='hidden sm:flex'/>
        </div>
      </div>
    </HeaderBar>
  )
}

/** Simple site footer used on every page. */
export function SiteFooter() {
  const link = 'underline-offset-2 hover:underline hover:opacity-100'
  return (
    <footer className='site-footer container-narrow pt-6 pb-16 text-xs opacity-70 text-center'>
      <div className='flex flex-wrap items-center justify-center gap-x-4 gap-y-2'>
        <span>© {new Date().getFullYear()} Smit Patel</span>
        <a className={link} href={'mailto:' + EMAIL}>{EMAIL}</a>
        <a className={link} href={GITHUB} target='_blank' rel='noreferrer'>GitHub<span className='sr-only'> (opens in a new tab)</span></a>
        <a className={link} href={LINKEDIN} target='_blank' rel='noreferrer'>LinkedIn<span className='sr-only'> (opens in a new tab)</span></a>
      </div>
    </footer>
  )
}

/** Skip link, ambient backdrop and page shell shared by every route. */
export const PAGE_SHELL = 'relative z-0 min-h-screen bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-neutral-100'

export function SkipLink() {
  return (
    <a href='#main-content' className='sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:rounded-xl focus:bg-accent-600 focus:text-white focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg'>Skip to main content</a>
  )
}
