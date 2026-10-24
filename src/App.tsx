import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Routes, Route, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Mail, Github, Linkedin, ArrowRight, Cpu, LineChart, Boxes, Users, Menu, X } from 'lucide-react'
import AmbientBackground from './components/AmbientBackground'
import ScrollManager from './components/ScrollManager'
import ThemeToggle from './components/ThemeToggle'
import { HeaderBar, HeaderIconLinks, PageHeader, SiteFooter, SkipLink, PAGE_SHELL } from './components/SiteChrome'
import NotFound from './pages/NotFound'
import { caseStudyPages } from './pages/caseStudies'
import { projects } from './data/projects'
import { useHeadMeta } from './hooks/useHeadMeta'
import { EMAIL, GITHUB, LINKEDIN } from './data/site'

const TITLE = 'Data Scientist & Analytics Professional'
const LOCATION = 'Chicago, IL'


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

/**
 * Fade-and-rise as an element scrolls into view. With reduced motion it renders in its
 * final state (initial={false}), and print CSS forces `.reveal` visible, so content is
 * never left invisible if the in-view animation doesn't fire.
 */
function useReveal(amount: number) {
  const reduce = useReducedMotion()
  return reduce
    ? { initial: false as const }
    : { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount }, transition: { duration: 0.5 } }
}

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

const Pill=({children}:{children:React.ReactNode})=>(<span className='text-xs md:text-sm rounded-full border px-3 py-1 bg-white/60 dark:bg-white/5 backdrop-blur'>{children}</span>)

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

const NAV_LINKS: [id: string, to: string, label: string][] = [
  ['home', '/', 'Home'],
  ['about', '/#about', 'About'],
  ['playground', '/#playground', 'Playground'],
  ['experience', '/#experience', 'Experience'],
  ['projects', '/#projects', 'Projects'],
  ['skills', '/#skills', 'Skills'],
  ['education', '/#education', 'Education'],
  ['contact', '/#contact', 'Contact'],
]

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
          <ThemeToggle/>
          <HeaderIconLinks/>
        </div>
        <MobileMenu open={open} onClose={()=>setOpen(false)} triggerRef={triggerRef} />
      </div>
    </HeaderBar>
  )
}

const Hero=()=>(
  <section id='home' className='container-narrow pt-12 pb-6 relative text-center'>
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.6}} className='reveal flex flex-col gap-6'>
      <div className='flex items-center justify-center'>
        <div>
          <h1 className='hero-name text-4xl md:text-5xl font-semibold tracking-tight bg-gradient-to-r from-accent-600 to-accent-500 bg-clip-text text-transparent'>Smit Patel</h1>
          {/* Title and location wrap as whole units: stacked on phones, one line with a separator from sm up. */}
          <p className='mt-2 text-[15px] md:text-[17px] opacity-80'>
            <span className='block sm:inline'>{TITLE}</span><span className='sr-only'>, </span><span className='hidden sm:inline' aria-hidden='true'> · </span><span className='block sm:inline'>{LOCATION}</span>
          </p>
        </div>
      </div>
      <p className='text-[15px] md:text-[17px] leading-relaxed opacity-90'>I turn ambiguous business problems into decisions and systems, using data analysis, statistical modeling, and production ML. I work the full arc: scoping the business question, exploring and analyzing the data, building the model or dashboard, and shipping it into something people actually use.</p>
      <div className='flex gap-2 flex-wrap mt-2 justify-center'>{['Statistical Modeling','Production ML','Business Analytics'].map((t,i)=>(<Pill key={i}>{t}</Pill>))}</div>
    </motion.div>
  </section>
)

const ProjectCard=({p}:{p:typeof projects[number]})=>{
  const reveal = useReveal(0.3)
  return (
    <motion.div {...reveal} className='reveal'>
      <Card className='hover:shadow-md transition-shadow h-full flex flex-col'>
        <CardHeader><CardTitle as='h3' className='flex items-center gap-2'><span className='inline-flex items-center justify-center w-8 h-8 shrink-0 rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400'><p.icon className='w-4 h-4' aria-hidden='true'/></span><span>{p.title}</span></CardTitle></CardHeader>
        <CardContent className='text-sm space-y-4 text-left flex-1 flex flex-col'>
          <p className='opacity-90'>{p.summary}</p>
          <div className='flex gap-2 flex-wrap'>{p.tech.map((t,j)=>(<Badge key={j} variant='outline'>{t}</Badge>))}</div>
          <div className='mt-auto pt-1'><Link to={'/projects/'+p.slug} className='inline-flex items-center gap-2 underline'>Read full case study<span className='sr-only'>: {p.title}</span> <ArrowRight className='w-4 h-4' aria-hidden='true'/></Link></div>
        </CardContent>
      </Card>
    </motion.div>
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

    <Section id='playground' title='Interactive Playground' className='section-bg'>
          <div className='max-w-5xl mx-auto px-4 sm:px-6'>
      <div className='grid grid-cols-1 gap-4'>
        <Card className='hover:shadow-md transition-shadow'>
          <CardHeader><CardTitle as='h3'>Churn Scoring Simulator</CardTitle></CardHeader>
          <CardContent className='text-sm space-y-3'>
            <ChurnDemo />
          </CardContent>
        </Card>
        <Card className='hover:shadow-md transition-shadow'>
          <CardHeader><CardTitle as='h3'>Quick NER Demo</CardTitle></CardHeader>
          <CardContent className='text-sm space-y-3'>
            <NerDemo />
          </CardContent>
        </Card>
        <Card className='hover:shadow-md transition-shadow'>
          <CardHeader><CardTitle as='h3'>Mini SQL Playground</CardTitle></CardHeader>
          <CardContent className='text-sm space-y-3'>
            <SqlDemo />
          </CardContent>
        </Card>
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

    <Section id='projects' title='Selected Projects' className='section-bg'>
          <div className='max-w-5xl mx-auto px-4 sm:px-6'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch'>
          {projects.map(p => <ProjectCard key={p.slug} p={p}/>)}
        </div>
      
          </div>
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
          <a className='inline-flex items-center gap-2 underline' href={'mailto:'+EMAIL}><Mail className='w-5 h-5' aria-hidden='true'/> {EMAIL}</a>
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

function sigmoid(x:number){ return 1/(1+Math.exp(-x)) }

const Slider=({id,label,value,min,max,onChange}:{id:string;label:string;value:number;min:number;max:number;onChange:(v:number)=>void})=>(
  <div className='space-y-1'>
    <div className='flex items-baseline justify-between gap-3'>
      <label htmlFor={id} className='text-xs'>{label}</label>
      <output htmlFor={id} className='text-xs font-medium tabular-nums'>{value}</output>
    </div>
    <input id={id} className='w-full' type='range' min={min} max={max} value={value} onChange={(e)=>onChange(Number(e.target.value))}/>
  </div>
)

function ChurnDemo(){
  const [tenure,setTenure]=useState(6)
  const [monthly,setMonthly]=useState(60)
  const [tickets,setTickets]=useState(3)
  const score = sigmoid(-1.4 + (12 - tenure)*0.18 + (monthly - 50)*0.02 + tickets*0.25)
  const pct = Math.round(score*100)
  return (
    <div>
      <div className='grid grid-cols-1 gap-3'>
        <Slider id='churn-tenure' label='Tenure (months)' value={tenure} min={1} max={24} onChange={setTenure}/>
        <Slider id='churn-spend' label='Monthly Spend ($)' value={monthly} min={10} max={200} onChange={setMonthly}/>
        <Slider id='churn-tickets' label='Support Tickets (30d)' value={tickets} min={0} max={10} onChange={setTickets}/>
      </div>
      <div className='mt-4 text-sm' aria-live='polite'>Churn Probability: <span className='font-medium'>{pct}%</span></div>
      <div className='h-2 rounded bg-neutral-200 dark:bg-neutral-800 mt-2' aria-hidden='true'><div className='h-2 rounded bg-neutral-900 dark:bg-neutral-100' style={{ width: String(pct) + '%' }} /></div>
      <div className='mt-3 text-xs opacity-70'>*A toy scoring formula to show the idea; it isn’t one of the projects below.</div>
    </div>
  )
}

type SqlRow = Record<string, string | number>
const ORDERS_TABLE: SqlRow[] = [
  { id:1, customer:'Ava',    region:'West',  amount:120, status:'shipped' },
  { id:2, customer:'Liam',   region:'East',  amount:75,  status:'pending' },
  { id:3, customer:'Noah',   region:'West',  amount:200, status:'shipped' },
  { id:4, customer:'Emma',   region:'South', amount:50,  status:'cancelled' },
  { id:5, customer:'Olivia', region:'East',  amount:300, status:'shipped' },
  { id:6, customer:'Ethan',  region:'West',  amount:90,  status:'pending' },
]
const ORDERS_COLUMNS = Object.keys(ORDERS_TABLE[0])
// Lower-cased name -> real column, so identifiers are case-insensitive and only real
// columns resolve (a plain `in` check would also accept toString, constructor, ...).
const ORDERS_COLUMN_SET = new Map(ORDERS_COLUMNS.map(c => [c.toLowerCase(), c]))
const SQL_EXAMPLE = 'SELECT * FROM orders WHERE amount > 100 ORDER BY amount DESC LIMIT 5'

type SqlResult = { columns:string[]; rows:SqlRow[] } | { error:string }

function resolveColumn(name:string): string | undefined {
  return ORDERS_COLUMN_SET.get(name.toLowerCase())
}
function unknownColumn(name:string, where:string){
  return { error: `Unknown column “${name}” in ${where}. Columns: ${ORDERS_COLUMNS.join(', ')}.` }
}
function compareOp(a:string|number, b:string|number, op:string){
  switch(op){
    case '=': return a===b
    case '!=': case '<>': return a!==b
    case '>': return a>b
    case '<': return a<b
    case '>=': return a>=b
    case '<=': return a<=b
    default: return false
  }
}

/** A deliberately small SQL subset: SELECT cols FROM orders [WHERE col op value] [ORDER BY col [ASC|DESC]] [LIMIT n]. */
function runMiniSQL(query:string, table:SqlRow[]): SqlResult {
  const q = query.trim().replace(/;\s*$/, '').trim()
  if (!q) return { error: `Type a query, for example: ${SQL_EXAMPLE}` }
  if (!/^SELECT\b/i.test(q)) return { error: `Only SELECT queries are supported. Try: ${SQL_EXAMPLE}` }
  const m = q.match(/^SELECT\s+([\s\S]+?)\s+FROM\s+(\S+)([\s\S]*)$/i)
  if (!m) return { error: `Expected SELECT <columns> FROM orders. Try: ${SQL_EXAMPLE}` }
  const [, colsRaw, tableName, restRaw] = m
  if (tableName.toLowerCase() !== 'orders') return { error: `Unknown table “${tableName}”. The only table is orders.` }

  const unsupported = restRaw.replace(/'(?:[^']|'')*'/g, "''").match(/\b(JOIN|GROUP\s+BY|HAVING|UNION|OFFSET)\b/i)
  if (unsupported) return { error: `${unsupported[1].toUpperCase().replace(/\s+/, ' ')} isn’t supported here; this mini engine handles WHERE, ORDER BY and LIMIT.` }
  const rest = restRaw.match(/^(?:\s+WHERE\s+([\s\S]+?))?(?:\s+ORDER\s+BY\s+(\S+?)(?:\s+(ASC|DESC))?)?(?:\s+LIMIT\s+(\S+))?\s*$/i)
  if (!rest) return { error: `Couldn’t read “${restRaw.trim()}”. After FROM orders, use WHERE, ORDER BY and LIMIT, in that order.` }
  const [, whereRaw, orderRaw, orderDir, limitRaw] = rest
  let rows = table.slice()

  if (whereRaw) {
    if (/\b(AND|OR)\b/i.test(whereRaw.replace(/'(?:[^']|'')*'/g, "''")))
      return { error: 'AND and OR aren’t supported: use a single condition, such as amount > 100.' }
    const cm = whereRaw.trim().match(/^(\w+)\s*(>=|<=|!=|<>|=|>|<)\s*([\s\S]+)$/)
    if (!cm) return { error: `Couldn’t read the WHERE condition “${whereRaw.trim()}”. Use column, operator, value, such as region = 'West'.` }
    const [, colRaw, op, litRaw] = cm
    const col = resolveColumn(colRaw)
    if (!col) return unknownColumn(colRaw, 'WHERE')
    const numeric = typeof table[0][col] === 'number'
    const lit = litRaw.trim()
    let value: string | number
    const quoted = lit.match(/^'((?:[^']|'')*)'$/)
    if (quoted) {
      const text = quoted[1].replace(/''/g, "'")
      if (numeric) {
        if (text.trim() === '' || isNaN(Number(text))) return { error: `${col} is a number column, so compare it with a number, such as ${col} > 100.` }
        value = Number(text)
      } else value = text.toLowerCase()
    } else if (/^-?\d+(\.\d+)?$/.test(lit)) {
      if (!numeric) return { error: `${col} is a text column, so put the value in single quotes, such as ${col} = 'value'.` }
      value = Number(lit)
    } else if (/^\w+$/.test(lit)) {
      return numeric
        ? { error: `${col} is a number column, so compare it with a number, such as ${col} > 100.` }
        : { error: `Text values need single quotes: ${col} ${op} '${lit}'.` }
    } else {
      return { error: `Couldn’t read the value “${lit}”. Use a number or text in single quotes.` }
    }
    rows = rows.filter(r => {
      const cell = r[col]
      return compareOp(typeof cell === 'string' ? cell.toLowerCase() : cell, value, op)
    })
  }

  if (orderRaw) {
    const col = resolveColumn(orderRaw)
    if (!col) return unknownColumn(orderRaw, 'ORDER BY')
    const dir = (orderDir || '').toUpperCase() === 'DESC' ? -1 : 1
    rows = rows.slice().sort((a,b)=>{
      const av=a[col], bv=b[col]
      if(av<bv) return -1*dir; if(av>bv) return 1*dir; return 0
    })
  }

  if (limitRaw !== undefined) {
    if (!/^\d+$/.test(limitRaw)) return { error: `LIMIT needs a whole number, such as LIMIT 5.` }
    rows = rows.slice(0, parseInt(limitRaw, 10))
  }

  let columns:string[]
  if (colsRaw.trim() === '*') columns = ORDERS_COLUMNS
  else {
    columns = []
    for (const raw of colsRaw.split(',').map(c=>c.trim())) {
      if (raw === '*') return { error: 'Use * on its own, or list column names.' }
      if (!/^\w+$/.test(raw)) return { error: `Only column names or * can be selected; “${raw}” isn’t supported (no functions, expressions or aliases).` }
      const col = resolveColumn(raw)
      if (!col) return unknownColumn(raw, 'SELECT')
      columns.push(col)
    }
  }
  const outRows = rows.map(r=>{ const o:SqlRow={}; columns.forEach(c=>o[c]=r[c]); return o })
  return { columns, rows: outRows }
}

function SqlDemo(){
  const [query,setQuery] = useState("SELECT customer, region, amount FROM orders WHERE amount > 80 ORDER BY amount DESC LIMIT 5;")
  const result = useMemo(()=>runMiniSQL(query, ORDERS_TABLE), [query])
  return (
    <div>
      <div className='text-xs opacity-70 mb-2'>Table: <code>orders(id, customer, region, amount, status)</code></div>
      <label htmlFor='sql-query' className='sr-only'>SQL query</label>
      <textarea id='sql-query' className='w-full h-20 p-2 rounded border bg-transparent font-mono text-xs' value={query} onChange={(e)=>setQuery(e.target.value)} spellCheck={false} aria-describedby='sql-result' />
      <div id='sql-result' aria-live='polite'>
        {('error' in result) ? (
          <div className='mt-3 text-xs text-red-600 dark:text-red-400'>{result.error}</div>
        ) : (
          <div className='mt-3 overflow-x-auto'>
            <table className='w-full text-xs border-collapse'>
              <thead><tr>{result.columns.map((c,i)=>(<th key={c+':'+i} className='text-left border-b border-neutral-300 dark:border-neutral-700 px-2 py-1 opacity-70'>{c}</th>))}</tr></thead>
              <tbody>
                {result.rows.map((r,i)=>(
                  <tr key={i} className='border-b border-neutral-200/50 dark:border-neutral-800/50'>
                    {result.columns.map((c,j)=>(<td key={c+':'+j} className='px-2 py-1'>{String(r[c])}</td>))}
                  </tr>
                ))}
              </tbody>
            </table>
            {result.rows.length===0 && <div className='text-xs opacity-60 mt-1'>No rows matched.</div>}
          </div>
        )}
      </div>
      <div className='mt-3 text-xs opacity-70'>*Runs a simplified SQL subset (SELECT/FROM/WHERE/ORDER BY/LIMIT) against an in-memory sample table, for demonstration only, not a full SQL engine.</div>
    </div>
  )
}

function extractNER(t:string){
  const res: {text:string;label:string}[] = []
  const push=(m:RegExpMatchArray|null,label:string)=>{ if(!m) return; m.forEach(v=>res.push({text:v,label})) }
  push(t.match(/\b\d{4}-\d{2}-\d{2}\b/g), 'DATE')
  push(t.match(/\bNorthwind\b/g), 'ORG')
  push(t.match(/\b\d{3}-\d{2}\b/g), 'CLAIM_ID')
  push(t.match(/\b[A-Z][a-z]+\s[A-Z][a-z]+\b/g), 'PERSON')
  return res
}
function NerDemo(){
  const [text,setText] = useState('Smit Patel visited Northwind on 2025-02-17 about claim 000-01.')
  const ents = extractNER(text)
  return (
    <div>
      <label htmlFor='ner-text' className='sr-only'>Text to tag</label>
      <textarea id='ner-text' className='w-full h-28 p-2 rounded border bg-transparent' value={text} onChange={(e)=>setText(e.target.value)} />
      <div className='mt-3 text-sm leading-relaxed' aria-live='polite'>
        {ents.map((e,i)=>(<span key={i} className='px-1.5 py-0.5 rounded-md border mr-1'>{e.text} <span className='opacity-60 text-xs'>{e.label}</span></span>))}
      </div>
      <div className='mt-2 text-xs opacity-70'>Rule-based toy example; it isn’t one of the projects below.</div>
    </div>
  )
}

/** Light placeholder while a case-study chunk loads. */
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
