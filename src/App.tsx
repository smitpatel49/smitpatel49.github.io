import React, { Suspense, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Routes, Route, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Mail, Github, Linkedin, Cpu, LineChart, Boxes, Users, Menu, X } from 'lucide-react'
import AmbientBackground from './components/AmbientBackground'
import ScrollManager from './components/ScrollManager'
import ThemeToggle from './components/ThemeToggle'
import { HeaderBar, HeaderIconLinks, PageHeader, SiteFooter, SkipLink, PAGE_SHELL } from './components/SiteChrome'
import NotFound from './pages/NotFound'
import { caseStudyPages } from './pages/caseStudies'
import { projects } from './data/projects'
import { useHeadMeta } from './hooks/useHeadMeta'
import { EMAIL, GITHUB, LINKEDIN } from './data/site'
import Hero from './components/home/Hero'
import ProjectBento from './components/home/ProjectBento'
import CopyEmailButton from './components/home/CopyEmailButton'
import { CommandMenu } from './components/home/CommandMenu'
import ViewTransitions from './components/home/ViewTransitions'
import { NAV_LINKS } from './components/home/sections'
import { useReveal } from './components/home/useReveal'

// The demos fetch their own data near the viewport; the code loads with the section.
const TryTheModels = React.lazy(() => import('./demos/TryTheModels'))

const skillGroups = [
  { group: 'Languages & Core', items: ['Python','SQL','Pandas','NumPy','Statistics'] },
  { group: 'Modeling & ML', items: ['LightGBM','XGBoost','Transformers (BERT/GPT)','TensorFlow','PyTorch','OpenCV'] },
  { group: 'Data Engineering & MLOps', items: ['Snowflake','Redshift','AWS SageMaker','AWS S3/Lambda','Docker','FastAPI','Flask','MLflow','Prometheus/Grafana'] },
  { group: 'Analytics & BI', items: ['Power BI','Tableau','Plotly','Excel/Google Sheets','A/B Testing'] },
]

const focusAreas = [
  { theme: 'Business & Data Analysis', status: 'Current',
    summary: 'Ongoing work at Sputnik, an IT staffing company, turning staffing and account activity into governed data models, stakeholder-reviewed requirements, and decision-ready reporting that surfaces which client relationships are profitable and which need attention. Builds on an earlier analyst engagement there, and a business-analysis thread also ran through a later consulting role.',
    tags: ['Business Analysis','Data Analysis','Requirements & UAT','Dashboards'] },
  { theme: 'Machine Learning & AI Systems', status: 'Past',
    summary: 'A consulting engagement at Sunrise Electronics Inc., a PCB fabrication company, centered on a multimodal specification pipeline that reconciles CAM files, PDFs, and OCR output into a single confidence-scored model, with human review built into the workflow. The same engagement carried data-science and business-analysis components alongside it, making it the most technically versatile role in my background.',
    tags: ['AI/ML Engineering','Document Intelligence','Data Science','Consulting'] },
  { theme: 'Research & Data', status: 'Past',
    summary: "Research and data work at CHARUSAT Research Center, held alongside undergraduate study at Charotar University of Science and Technology. Built a consistent reporting structure across a multi-project research portfolio, and designed and analyzed stakeholder surveys with an eye toward response bias and sample size.",
    tags: ['Research','Data Analysis','Survey Design'] },
]

const education = [
  { school: 'DePaul University', location: 'Chicago, IL',
    degree: 'Master’s in Data Science (Concentration in Computational Methods)', gpa: 'GPA: 3.7/4.0',
    bullets: [
      'Graduate President Scholar, $6,000 scholarship.',
      'Member of the Upsilon Pi Epsilon Honor Society and the Golden Key International Honor Society.',
    ] },
  { school: 'Charotar University of Science and Technology', location: 'Gujarat, India',
    degree: 'Bachelor of Computer Engineering', gpa: 'GPA: 3.86/4.0',
    bullets: [
      'Founding Chairperson of IEEE Student Branch.',
      'Member of the Computer Society of India and executive member of LinkedIn Local Chapter Anand.',
    ] },
]

const Section=({id,title,children,className}:{id:string;title:string;children:React.ReactNode;className?:string})=>{
  const reveal = useReveal(0.5)
  return (
    <section id={id} className={'section' + (className ? ' ' + className : '')}>
      <div className='section-stripe'></div>
      <motion.h2 {...reveal} className='section-title reveal'>{title}</motion.h2>
      {children}
    </section>
  )
}

// A plain GET-method form posting to a mailto: action is unreliable across
// browsers (Chrome in particular often just ignores the query string), so
// this builds the mailto: link by hand from the entered fields instead.
const ContactForm = () => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const name = String(data.get('name') || '').trim()
    const email = String(data.get('email') || '').trim()
    const subject = String(data.get('subject') || '').trim() || 'Message from portfolio site'
    const message = String(data.get('message') || '').trim()
    const body = `${message}\n\n---\nFrom: ${name}${email ? ' <' + email + '>' : ''}`
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }
  return (
    <form onSubmit={handleSubmit} className='space-y-3'>
      <div className='grid grid-cols-1 gap-3'>
        <div>
          <label htmlFor='contact-name' className='sr-only'>Name</label>
          <input id='contact-name' name='name' placeholder='Name' className='rounded-xl border p-3 bg-transparent w-full' required/>
        </div>
        <div>
          <label htmlFor='contact-email' className='sr-only'>Email</label>
          <input id='contact-email' name='email' type='email' placeholder='Email' className='rounded-xl border p-3 bg-transparent w-full' required/>
        </div>
      </div>
      <div>
        <label htmlFor='contact-subject' className='sr-only'>Subject (optional)</label>
        <input id='contact-subject' name='subject' placeholder='Subject (optional)' className='rounded-xl border p-3 bg-transparent w-full'/>
      </div>
      <div>
        <label htmlFor='contact-message' className='sr-only'>Your message</label>
        <textarea id='contact-message' name='message' placeholder='Your message' className='rounded-xl border p-3 bg-transparent w-full h-32' required/>
      </div>
      <button type='submit' className='bg-accent-600 text-white hover:bg-accent-700 rounded-2xl px-4 py-2 text-sm'>Send message</button>
      <p className='text-xs opacity-60'>Opens your email client with the message pre-filled.</p>
    </form>
  )
}

/**
 * Full-screen menu below the xl breakpoint: a modal dialog that closes on Escape, keeps
 * Tab inside itself, focuses Close on open and returns focus to the trigger on close.
 */
const MobileMenu = ({open,onClose,triggerRef}:{open:boolean;onClose:()=>void;triggerRef:React.RefObject<HTMLButtonElement>}) => {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(()=>{
    if(!open) return
    document.body.classList.add('overflow-hidden')
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key !== 'Tab' || !panelRef.current) return
      const items = [...panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]
      if (!items.length) return
      const first = items[0], last = items[items.length - 1]
      const inside = panelRef.current.contains(document.activeElement)
      if (e.shiftKey && (document.activeElement === first || !inside)) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && (document.activeElement === last || !inside)) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    const trigger = triggerRef.current
    return ()=>{
      document.body.classList.remove('overflow-hidden')
      document.removeEventListener('keydown', onKey)
      trigger?.focus({ preventScroll: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[open])

  const item = 'px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800'
  const card = 'flex items-center gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800'
  return (
    <AnimatePresence>
      {open && (
        <div key='mobile-menu' id='mobile-menu' role='dialog' aria-modal='true' aria-labelledby='mobile-menu-title' className='fixed inset-0 z-[100] xl:hidden'>
          <motion.div
            className='absolute inset-0 bg-black/50'
            initial={{opacity:0}}
            animate={{opacity:1}}
            exit={{opacity:0}}
            transition={{duration:0.2}}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            className='fixed top-0 left-0 h-screen w-screen bg-white dark:bg-neutral-900 p-5 overflow-y-auto flex flex-col'
            initial={{x:-320, opacity:0}}
            animate={{x:0, opacity:1}}
            exit={{x:-320, opacity:0}}
            transition={{type:'tween',duration:0.25}}
          >
            <div className='flex items-center justify-between mb-4'>
              <h2 id='mobile-menu-title' className='font-semibold text-base'>Menu</h2>
              <button ref={closeRef} type='button' onClick={onClose} aria-label='Close menu' className='rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800'>
                <X className='w-6 h-6' aria-hidden='true'/>
              </button>
            </div>
            <nav aria-label='Sections' className='grid text-base rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800'>
              {NAV_LINKS.map(([id,to,label],i)=>(
                <Link key={id} to={to} onClick={onClose} className={item + (i===0 ? ' bg-white/60 dark:bg-neutral-900/60' : '')}>{label}</Link>
              ))}
            </nav>
            <div className='mt-6 flex flex-col gap-2'>
              <a href={'mailto:'+EMAIL} onClick={onClose} className={card}>
                <Mail className='w-5 h-5' aria-hidden='true'/><span>Email</span>
              </a>
              <a href={GITHUB} target='_blank' rel='noreferrer' onClick={onClose} className={card}>
                <Github className='w-5 h-5' aria-hidden='true'/><span>GitHub</span><span className='sr-only'> (opens in a new tab)</span>
              </a>
              <a href={LINKEDIN} target='_blank' rel='noreferrer' onClick={onClose} className={card}>
                <Linkedin className='w-5 h-5' aria-hidden='true'/><span>LinkedIn</span><span className='sr-only'> (opens in a new tab)</span>
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}


const NAV_IDS = NAV_LINKS.map(([id])=>id)

function useActiveSection(ids:string[]){
  const [active,setActive] = useState(ids[0])
  useEffect(()=>{
    const els = ids.map(id=>document.getElementById(id)).filter(Boolean) as HTMLElement[]
    if(els.length===0) return
    const observer = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting) setActive(entry.target.id)
      })
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 })
    els.forEach(el=>observer.observe(el))
    return ()=>observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[ids.join(',')])
  return active
}

const Header=()=>{
  const [open,setOpen]=useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const active = useActiveSection(NAV_IDS)
  const navCls = (id:string) => 'opacity-80 hover:opacity-100 transition-colors' + (active===id ? ' !opacity-100 text-accent-600 dark:text-accent-400 font-medium' : '')
  return (
    <HeaderBar>
      <div className='container-narrow h-14 grid grid-cols-[auto,1fr,auto] items-center gap-3'>
        <button ref={triggerRef} type='button' onClick={()=>setOpen(true)} aria-label='Open menu' aria-expanded={open} aria-controls='mobile-menu' aria-haspopup='dialog' className='xl:hidden rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800'>
          <Menu className='w-6 h-6' aria-hidden='true'/>
        </button>
        <nav aria-label='Sections' className='hidden xl:flex justify-center gap-5 text-sm whitespace-nowrap'>
          {NAV_LINKS.map(([id,to,label])=>(
            <Link key={id} to={to} className={navCls(id)} aria-current={active===id ? 'location' : undefined}>{label}</Link>
          ))}
        </nav>
        <div className='justify-self-end flex items-center gap-2'>
          <CommandMenu/>
          <ThemeToggle/>
          <HeaderIconLinks/>
        </div>
        <MobileMenu open={open} onClose={()=>setOpen(false)} triggerRef={triggerRef} />
      </div>
    </HeaderBar>
  )
}

const Home=()=>{
  useHeadMeta()
  return (
  <div className={PAGE_SHELL}>
    <SkipLink/>
    <AmbientBackground/>
    <Header/>
    <main id='main-content'>
    <Hero/>

    <Section id='about' title='About' className='section-bg'>
          <div className='max-w-5xl mx-auto px-4 sm:px-6'>
        <div className='grid grid-cols-1 gap-6 text-sm leading-relaxed'>
          <div className='space-y-4 text-center'>
            <p>I like problems that don’t come pre-labeled: the real first step is usually figuring out what’s actually being asked, before reaching for a model or a dashboard. That’s shaped a career that moves between business and data analysis, statistical modeling, and production ML, depending on what the problem actually needs. I’ve worked that way across consulting, research, and independent projects, in forecasting, risk, NLP, and computer vision.</p>
            <p>My toolkit runs from Python and SQL, through modern MLOps (Docker, MLflow, SageMaker), to the reporting layer stakeholders actually read: Power BI, Excel, plain language. I care less about which single label fits me, and more about whether the answer is trustworthy and someone can act on it.</p>
          </div>
          <div>
            <Card>
              <CardHeader><CardTitle as='h3' className='text-base'>Quick Facts</CardTitle></CardHeader>
              <CardContent className='text-sm space-y-2'>
                <div className='flex items-center gap-2'><Boxes className='w-4 h-4 shrink-0' aria-hidden='true'/> Comfortable owning a project end to end: framing the question, building the model or dashboard, and shipping something people actually use</div>
                <div className='flex items-center gap-2'><LineChart className='w-4 h-4 shrink-0' aria-hidden='true'/> Domains I’ve worked across: forecasting and simulation, computer vision, NLP, and decision systems</div>
                <div className='flex items-center gap-2'><Cpu className='w-4 h-4 shrink-0' aria-hidden='true'/> Also fluent in the less glamorous half of the job: CI/CD, containerized deployment, monitoring, and alerting</div>
                <div className='flex items-center gap-2'><Users className='w-4 h-4 shrink-0' aria-hidden='true'/> Often the bridge between a vague business ask and the KPI, analysis, or dashboard that actually answers it</div>
              </CardContent>
            </Card>
          </div>
        </div>
      
          </div>
      </Section>

    <Section id='experience' title='Experience' className='section-bg'>
        <div className='max-w-5xl mx-auto px-4 sm:px-6'>
          <p className='text-sm opacity-70 text-center mb-6 max-w-2xl mx-auto'>Grouped by the kind of work rather than by employer, and kept intentionally high-level. Think of it as a complement to my resume, not a repeat of it.</p>
          <div className='grid grid-cols-1 gap-5'>
            {focusAreas.map((f,i) => (
              <div key={i} className='glass transition-shadow hover:shadow-md hover:ring-1 hover:ring-accent-500/25 p-5 rounded-2xl'>
                <div className='flex items-start justify-between border-b border-neutral-200/60 dark:border-neutral-800/60 pb-3 mb-3'>
                  <h3 className='text-lg font-semibold'>{f.theme}</h3>
                  {f.status === 'Current' && (
                    <div className='text-xs uppercase tracking-wide text-accent-600 dark:text-accent-400 font-medium whitespace-nowrap mt-1'>Ongoing</div>
                  )}
                </div>
                <p className='text-sm opacity-90'>{f.summary}</p>
                <div className='mt-3 text-xs opacity-70'>Focus: {f.tags.join(' · ')}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

    {/* Wider than the text sections from lg up, so the bento's three columns have room. */}
    <Section id='projects' title='Selected Projects' className='section-bg lg:max-w-5xl'>
      <div className='px-4 sm:px-6'>
        <ProjectBento/>
      </div>
    </Section>

    <Section id='demos' title='Try the models' className='section-bg'>
      <Suspense fallback={<p className='text-center text-sm opacity-70'>Loading the demos…</p>}>
        <TryTheModels/>
      </Suspense>
    </Section>

    <Section id='skills' title='Skills' className='section-bg'>
          <div className='max-w-5xl mx-auto px-4 sm:px-6'>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
        {skillGroups.map((g,i)=>(
          <div key={i} className='glass p-5 rounded-2xl'>
            <div className='text-xs uppercase tracking-wide opacity-60 font-medium mb-3'>{g.group}</div>
            <div className='flex flex-wrap gap-2'>{g.items.map((s,j)=>(<Badge key={j} variant='secondary' className='text-sm'>{s}</Badge>))}</div>
          </div>
        ))}
      </div>

          </div>
      </Section>

    <Section id='education' title='Education' className='section-bg'>
          <div className='max-w-5xl mx-auto px-4 sm:px-6'>
        <div className='grid grid-cols-1 gap-5'>
          {education.map((e,i) => (
            <div key={i} className='glass transition-shadow hover:shadow-md hover:ring-1 hover:ring-accent-500/25 p-5 rounded-2xl'>
              <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 border-b border-neutral-200/60 dark:border-neutral-800/60 pb-3 mb-3'>
                <div>
                  <h3 className='text-lg font-semibold'>{e.school}</h3>
                  <div className='text-sm opacity-80'>{e.degree}</div>
                </div>
                <div className='text-sm opacity-70 sm:text-right whitespace-nowrap'>
                  <div>{e.location}</div>
                  <div>{e.gpa}</div>
                </div>
              </div>
              <ul className='list-disc pl-6 space-y-2 text-sm text-left'>
                {e.bullets.map((b,j)=>(<li key={j}>{b}</li>))}
              </ul>
            </div>
          ))}
        </div>
          </div>
      </Section>

    <Section id='contact' title='Contact' className='section-bg'>
          <div className='max-w-5xl mx-auto px-4 sm:px-6'>
      <div className='grid grid-cols-1 gap-6'>
        <div className='w-full'>
          <ContactForm/>
        </div>
        <div className='w-full flex flex-col items-center gap-3'>
          <div className='flex flex-wrap items-center justify-center gap-x-3 gap-y-2'>
            <a className='inline-flex items-center gap-2 underline' href={'mailto:'+EMAIL}><Mail className='w-5 h-5' aria-hidden='true'/> {EMAIL}</a>
            <CopyEmailButton email={EMAIL}/>
          </div>
          <a className='inline-flex items-center gap-2 underline' href={GITHUB} target='_blank' rel='noreferrer'><Github className='w-5 h-5' aria-hidden='true'/> GitHub<span className='sr-only'> (opens in a new tab)</span></a>
          <a className='inline-flex items-center gap-2 underline' href={LINKEDIN} target='_blank' rel='noreferrer'><Linkedin className='w-5 h-5' aria-hidden='true'/> LinkedIn<span className='sr-only'> (opens in a new tab)</span></a>
        </div>
      </div>
    
          </div>
      </Section>
    </main>

    <SiteFooter/>
  </div>
  )
}

const PageFallback = () => (
  <div className={PAGE_SHELL}>
    <PageHeader/>
    <div className='section text-center text-sm opacity-60' role='status'>Loading…</div>
  </div>
)

export default function App(){
  return (
    <>
      <ScrollManager/>
      <ViewTransitions/>
      <Suspense fallback={<PageFallback/>}>
        <Routes>
          <Route path='/' element={<Home/>} />
          {projects.map(p => {
            const Page = caseStudyPages[p.slug]
            return <Route key={p.slug} path={'/projects/' + p.slug} element={Page ? <Page/> : <NotFound/>} />
          })}
          <Route path='*' element={<NotFound/>} />
        </Routes>
      </Suspense>
    </>
  )
}
