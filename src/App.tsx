
import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Routes, Route, Link } from 'react-router-dom'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Mail, Github, Linkedin, ArrowRight, Cpu, LineChart, Boxes, Users, Sun, Moon, Menu, X } from 'lucide-react'
import ProjectMNA from './pages/ProjectMNA'
import ProjectBank from './pages/ProjectBank'
import ProjectStock from './pages/ProjectStock'
import ProjectADAS from './pages/ProjectADAS'
import ProjectAnalytics from './pages/ProjectAnalytics'
import ProjectForecast from './pages/ProjectForecast'
import ProjectNLP from './pages/ProjectNLP'
import ProjectAccountRisk from './pages/ProjectAccountRisk'
import AmbientBackground from './components/AmbientBackground'

const TITLE = 'Data Scientist & Analytics Professional'
const LOCATION = 'Chicago, IL'
const EMAIL = 'smit@itjobinbox.com'
const GITHUB = 'https://github.com/smitpatel49'
const LINKEDIN = 'https://www.linkedin.com/in/smitpatel7/'
const FORM_ENDPOINT = ''

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
    degree: "Master's in Data Science (Concentration in Computational Methods)", gpa: 'GPA: 3.7/4.0',
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

const projects = [
  { slug:'analytics', title: 'Customer Retention & Revenue Analytics', summary: 'SQL cohort retention & purchase-funnel analysis, presented as an interactive dashboard.', tech:['SQL','PostgreSQL','Cohort Analysis','Dashboarding'] },
  { slug:'mna', title: 'Simulating Company Merger/Acquisition', summary: '20,000-trial Monte Carlo on deal accretion, with regression-based sensitivity analysis.', tech:['Python','NumPy','Monte Carlo','scikit-learn'] },
  { slug:'bank', title: 'Bank Marketing Classification', summary: 'Calibrated XGBoost scoring model vs. a Random Forest baseline, tuned to a call-center capacity constraint.', tech:['Python','XGBoost','scikit-learn','Calibration','FastAPI'] },
  { slug:'stock', title: 'Simulating a Buy/Sell Call for a Stock', summary: 'Regime-aware block bootstrap over 3,000 paths; VaR/CVaR and a fan chart.', tech:['Python','NumPy','Bootstrap Simulation','Risk (VaR/CVaR)'] },
  { slug:'adas', title: 'Lane & Road-Sign Detection for Self-Driving', summary: 'Perception → fusion → control architecture, validated with a real OpenCV pipeline on synthetic scenes.', tech:['Python','OpenCV','Segmentation','Object Detection','Control Systems'] },
  { slug:'forecast', title: 'Daily Demand Forecasting', summary: 'LightGBM forecasting with lag/rolling features, benchmarked honestly against a seasonal-naive baseline.', tech:['Python','Pandas','LightGBM','Time-Series'] },
  { slug:'nlp', title: 'Support Ticket Routing (NLP)', summary: 'TF-IDF baseline vs. a small transformer trained from scratch, with an honest look at where each one wins.', tech:['Python','scikit-learn','PyTorch','NLP'] },
  { slug:'account-risk', title: 'Account Health & Renewal-Risk Reporting', summary: 'A stakeholder-governed at-risk definition turned into a KPI dashboard for CS, AM, and Renewals.', tech:['Business Analysis','Requirements Gathering','Data Modeling','KPI Design'] },
]

const Section=({id,title,children,className}:{id:string;title:string;children:React.ReactNode;className?:string})=>(
  <section id={id} className={'section' + (className ? ' ' + className : '')}>
    <div className='section-stripe'></div>
    <motion.h2 initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:0.5}} transition={{duration:0.5}} className='section-title'>{title}</motion.h2>
    {children}
  </section>
)

const Pill=({children}:{children:React.ReactNode})=>(<span className='text-xs md:text-sm rounded-full border px-3 py-1 bg-white/60 dark:bg-white/5 backdrop-blur'>{children}</span>)

const ThemeToggle = () => {
  const getInitial = () => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  };
  const [dark, setDark] = useState(getInitial());

  useEffect(() => {
    const r = document.documentElement;
    if (dark) {
      r.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      (document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null)?.setAttribute('content','#0a0a0a');
    } else {
      r.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      (document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null)?.setAttribute('content','#ffffff');
    }
  }, [dark]);

  return (
    <Button variant='ghost' size='icon' aria-label='Toggle theme' className='ring-1 ring-neutral-200 dark:ring-neutral-800 hover:ring-accent-400/60 w-10 h-10' onClick={() => setDark(!dark)}>
      {dark ? <Sun className='w-6 h-6' strokeWidth={2.2}/> : <Moon className='w-6 h-6' strokeWidth={2.2}/>}
    </Button>
  );
};





const MobileMenu = ({open,onClose}:{open:boolean;onClose:()=>void}) => {
  React.useEffect(()=>{
    if(open){ document.body.classList.add('overflow-hidden') }
    return ()=>{ document.body.classList.remove('overflow-hidden') }
  },[open])

  if(!open) return <></>

  return (
    <div className='fixed inset-0 z-[100] xl:hidden'>
      <motion.div
        className='absolute inset-0 bg-black/50'
        initial={{opacity:0}}
        animate={{opacity:1}}
        exit={{opacity:0}}
        onClick={onClose}
      />
      <motion.div
        className='fixed top-0 left-0 h-screen w-screen bg-white dark:bg-neutral-900 p-5 overflow-y-auto flex flex-col'
        initial={{x:-320}}
        animate={{x:0}}
        exit={{x:-320}}
        transition={{type:'tween',duration:0.25}}
      >
        <div className='flex items-center justify-between mb-4'>
          <div className='font-semibold text-base'>Menu</div>
          <button onClick={onClose} className='rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800'>
            <X className='w-6 h-6'/>
          </button>
        </div>
        <nav className='grid text-base rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800'>
          <a href='/' onClick={onClose} className='px-4 py-3 bg-white/60 dark:bg-neutral-900/60 hover:bg-neutral-50 dark:hover:bg-neutral-800'>Home</a>
          <a href='/#about' onClick={onClose} className='px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800'>About</a>
          <a href='/#playground' onClick={onClose} className='px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800'>Playground</a>
          <a href='/#case-studies' onClick={onClose} className='px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800'>Experience</a>
          <a href='/#projects' onClick={onClose} className='px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800'>Projects</a>
          <a href='/#skills' onClick={onClose} className='px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800'>Skills</a>
          <a href='/#education' onClick={onClose} className='px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800'>Education</a>
          <a href='/#contact' onClick={onClose} className='px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800'>Contact</a>
        </nav>
        <div className='mt-6 flex flex-col gap-2'>
          <a href={'mailto:'+EMAIL} onClick={onClose} className='flex items-center gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800'>
            <Mail className='w-5 h-5'/><span>Email</span>
          </a>
          <a href={GITHUB} target='_blank' rel='noreferrer' onClick={onClose} className='flex items-center gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800'>
            <Github className='w-5 h-5'/><span>GitHub</span>
          </a>
          <a href={LINKEDIN} target='_blank' rel='noreferrer' onClick={onClose} className='flex items-center gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800'>
            <Linkedin className='w-5 h-5'/><span>LinkedIn</span>
          </a>
        </div>
      </motion.div>
    </div>
  )
}


const NAV_IDS = ['home','about','playground','case-studies','projects','skills','education','contact']

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
  const active = useActiveSection(NAV_IDS)
  const navCls = (id:string) => 'opacity-80 hover:opacity-100 transition-colors' + (active===id ? ' !opacity-100 text-accent-600 dark:text-accent-400 font-medium' : '')
  return (
    <div className='sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/40 dark:bg-neutral-900/60 border-b'>
      <div className='container-narrow h-14 grid grid-cols-[auto,1fr,auto] items-center gap-3'>
        <button onClick={()=>setOpen(true)} className='xl:hidden rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800'>
          <Menu className='w-6 h-6'/>
        </button>
        <nav className='hidden xl:flex justify-center gap-5 text-sm whitespace-nowrap'>
          <a href='/' className={navCls('home')}>Home</a>
          <a href='/#about' className={navCls('about')}>About</a>
          <a href='/#playground' className={navCls('playground')}>Playground</a>
          <a href='/#case-studies' className={navCls('case-studies')}>Experience</a>
          <a href='/#projects' className={navCls('projects')}>Projects</a>
          <a href='/#skills' className={navCls('skills')}>Skills</a>
          <a href='/#education' className={navCls('education')}>Education</a>
          <a href='/#contact' className={navCls('contact')}>Contact</a>
        </nav>
        <div className='justify-self-end flex items-center gap-2'>
          <ThemeToggle/>
          <a href={'mailto:'+EMAIL}><Button variant='ghost' size='icon' className='ring-1 ring-neutral-200 dark:ring-neutral-800 hover:ring-accent-400/60 w-10 h-10'><Mail className='w-6 h-6' strokeWidth={2.1}/></Button></a>
          <a href={GITHUB} target='_blank' rel='noreferrer'><Button variant='ghost' size='icon' className='ring-1 ring-neutral-200 dark:ring-neutral-800 hover:ring-accent-400/60 w-10 h-10'><Github className='w-6 h-6' strokeWidth={2.1}/></Button></a>
          <a href={LINKEDIN} target='_blank' rel='noreferrer'><Button variant='ghost' size='icon' className='ring-1 ring-neutral-200 dark:ring-neutral-800 hover:ring-accent-400/60 w-10 h-10'><Linkedin className='w-6 h-6' strokeWidth={2.1}/></Button></a>
        </div>
        <MobileMenu open={open} onClose={()=>setOpen(false)} />
      </div>
    </div>
  )
}

const Hero=()=>(
  <section id='home' className='container-narrow pt-12 pb-6 relative text-center'>
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.6}} className='flex flex-col gap-6'>
      <div className='flex items-center justify-center'>
        <div>
          <h1 className='text-4xl md:text-5xl font-semibold tracking-tight bg-gradient-to-r from-accent-600 to-accent-500 bg-clip-text text-transparent'>Smit Patel</h1>
          <p className='mt-2 text-[15px] md:text-[17px] opacity-80'>{TITLE} · {LOCATION}</p>
        </div>
      </div>
      <p className='text-[15px] md:text-[17px] leading-relaxed opacity-90'>I turn ambiguous business problems into decisions and systems, using data analysis, statistical modeling, and production ML. I work the full arc: scoping the business question, exploring and analyzing the data, building the model or dashboard, and shipping it into something people actually use.</p>
      <div className='flex gap-2 flex-wrap mt-2 justify-center'>{['Statistical Modeling','Production ML','Business Analytics'].map((t,i)=>(<Pill key={i}>{t}</Pill>))}</div>
    </motion.div>
  </section>
)

const Home=()=> (
  <div className='relative z-0 min-h-screen bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-neutral-100'>
    <AmbientBackground/>
    <Header/>
    <Hero/>

    <Section id='about' title='About' className='section-bg'>
          <div className='max-w-5xl mx-auto px-4 sm:px-6'>
        <div className='grid grid-cols-1 gap-6 text-sm leading-relaxed'>
          <div className='space-y-4 text-center'>
            <p>I like problems that don't come pre-labeled: the real first step is usually figuring out what's actually being asked, before reaching for a model or a dashboard. That's shaped a career that moves between business and data analysis, statistical modeling, and production ML, depending on what the problem actually needs. I've worked that way across consulting, research, and independent projects, in forecasting, risk, NLP, and computer vision.</p>
            <p>My toolkit runs from Python and SQL, through modern MLOps (Docker, MLflow, SageMaker), to the reporting layer stakeholders actually read: Power BI, Excel, plain language. I care less about which single label fits me, and more about whether the answer is trustworthy and someone can act on it.</p>
          </div>
          <div>
            <Card>
              <CardHeader><CardTitle className='text-base'>Quick Facts</CardTitle></CardHeader>
              <CardContent className='text-sm space-y-2'>
                <div className='flex items-center gap-2'><Boxes className='w-4 h-4 shrink-0'/> Comfortable owning a project end to end: framing the question, building the model or dashboard, and shipping something people actually use</div>
                <div className='flex items-center gap-2'><LineChart className='w-4 h-4 shrink-0'/> Domains I've worked across: forecasting and simulation, computer vision, NLP, and decision systems</div>
                <div className='flex items-center gap-2'><Cpu className='w-4 h-4 shrink-0'/> Also fluent in the less glamorous half of the job: CI/CD, containerized deployment, monitoring, and alerting</div>
                <div className='flex items-center gap-2'><Users className='w-4 h-4 shrink-0'/> Often the bridge between a vague business ask and the KPI, analysis, or dashboard that actually answers it</div>
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
          <CardHeader><CardTitle>Churn Scoring Simulator</CardTitle></CardHeader>
          <CardContent className='text-sm space-y-3'>
            <ChurnDemo />
          </CardContent>
        </Card>
        <Card className='hover:shadow-md transition-shadow'>
          <CardHeader><CardTitle>Quick NER Demo</CardTitle></CardHeader>
          <CardContent className='text-sm space-y-3'>
            <NerDemo />
          </CardContent>
        </Card>
        <Card className='hover:shadow-md transition-shadow'>
          <CardHeader><CardTitle>Mini SQL Playground</CardTitle></CardHeader>
          <CardContent className='text-sm space-y-3'>
            <SqlDemo />
          </CardContent>
        </Card>
      </div>
    
          </div>
      </Section>

    <Section id='case-studies' title='Experience' className='section-bg'>
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
          {projects.map((p,i) => (
            <motion.div key={i} initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:0.3}} transition={{duration:0.5}}
              className={(i===projects.length-1 && projects.length%2===1) ? 'sm:col-span-2 sm:max-w-[calc(50%-0.5rem)] sm:mx-auto' : ''}>
              <Card className='hover:shadow-md transition-shadow h-full flex flex-col'>
                <CardHeader><CardTitle className='flex items-center gap-2'><LineChart className='w-5 h-5'/><span>{p.title}</span></CardTitle></CardHeader>
                <CardContent className='text-sm space-y-4 text-left flex-1 flex flex-col'>
                  <p className='opacity-90'>{p.summary}</p>
                  <div className='flex gap-2 flex-wrap'>{p.tech.map((t,j)=>(<Badge key={j} variant='outline'>{t}</Badge>))}</div>
                  <div className='mt-auto pt-1'><Link to={'/projects/'+p.slug} className='inline-flex items-center gap-2 underline'>Read full case study <ArrowRight className='w-4 h-4'/></Link></div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
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
          {/* To enable Formspree: set FORM_ENDPOINT to your endpoint */}
          <form method={FORM_ENDPOINT ? 'POST' : 'GET'} action={FORM_ENDPOINT ? FORM_ENDPOINT : ('mailto:'+EMAIL)} className='space-y-3'>
            <div className='grid grid-cols-1 gap-3'>
              <input name='name' placeholder='Name' className='rounded-xl border p-3 bg-transparent' required/>
              <input name='email' type='email' placeholder='Email' className='rounded-xl border p-3 bg-transparent' required/>
            </div>
            <input name='subject' placeholder='Subject (optional)' className='rounded-xl border p-3 bg-transparent w-full'/>
            <textarea name='message' placeholder='Your message' className='rounded-xl border p-3 bg-transparent w-full h-32' required/>
            {FORM_ENDPOINT && <input type='hidden' name='_subject' value='New message from portfolio site'/>}
            <button className='bg-accent-600 text-white hover:bg-accent-700 rounded-2xl px-4 py-2 text-sm'>Send message</button>
          </form>
        </div>
        <div className='w-full flex flex-col items-center gap-3'>
          <a className='inline-flex items-center gap-2 underline' href={'mailto:'+EMAIL}><Mail className='w-5 h-5'/> {EMAIL}</a>
          <a className='inline-flex items-center gap-2 underline' href={GITHUB} target='_blank' rel='noreferrer'><Github className='w-5 h-5'/> GitHub</a>
          <a className='inline-flex items-center gap-2 underline' href={LINKEDIN} target='_blank' rel='noreferrer'><Linkedin className='w-5 h-5'/> LinkedIn</a>
        </div>
      </div>
    
          </div>
      </Section>

    <footer className='container-narrow pb-16 text-xs opacity-60 text-center'>© {new Date().getFullYear()} Smit Patel</footer>
  </div>
)

function sigmoid(x:number){ return 1/(1+Math.exp(-x)) }
function ChurnDemo(){
  const [tenure,setTenure]=useState(6)
  const [monthly,setMonthly]=useState(60)
  const [tickets,setTickets]=useState(3)
  const score = sigmoid(-1.4 + (12 - tenure)*0.18 + (monthly - 50)*0.02 + tickets*0.25)
  const pct = Math.round(score*100)
  return (
    <div>
      <div className='grid grid-cols-1 gap-3 items-center'>
        <label className='text-xs'>Tenure (months)</label>
        <input className='w-full' type='range' min={1} max={24} value={tenure} onChange={(e)=>setTenure(Number(e.target.value))}/>
        <label className='text-xs'>Monthly Spend ($)</label>
        <input className='w-full' type='range' min={10} max={200} value={monthly} onChange={(e)=>setMonthly(Number(e.target.value))}/>
        <label className='text-xs'>Support Tickets (30d)</label>
        <input className='w-full' type='range' min={0} max={10} value={tickets} onChange={(e)=>setTickets(Number(e.target.value))}/>
      </div>
      <div className='mt-4 text-sm'>Churn Probability: <span className='font-medium'>{pct}%</span></div>
      <div className='h-2 rounded bg-neutral-200 dark:bg-neutral-800 mt-2'><div className='h-2 rounded bg-neutral-900 dark:bg-neutral-100' style={{ width: String(pct) + '%' }} /></div>
      <div className='mt-3 text-xs opacity-70'>*Heuristic demo; production used LightGBM features.</div>
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

function parseLiteral(raw:string): string | number {
  const s = raw.trim()
  const unquoted = /^'(.*)'$/.test(s) ? s.slice(1,-1) : s
  if (unquoted !== '' && !isNaN(Number(unquoted))) return Number(unquoted)
  return unquoted
}
function compareOp(a:string|number, b:string|number, op:string){
  switch(op){
    case '=': return a==b; case '!=': return a!=b
    case '>': return a>b; case '<': return a<b
    case '>=': return a>=b; case '<=': return a<=b
    default: return false
  }
}
function runMiniSQL(query:string, table:SqlRow[]): { columns:string[]; rows:SqlRow[] } | { error:string } {
  const m = query.trim().match(/^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(\w+)(\s+ASC|\s+DESC)?)?(?:\s+LIMIT\s+(\d+))?\s*;?\s*$/i)
  if(!m) return { error: 'Unsupported query. Try: SELECT * FROM orders WHERE amount > 100 ORDER BY amount DESC LIMIT 5' }
  const [, colsRaw, tableName, whereRaw, orderCol, orderDirRaw, limitRaw] = m
  if(tableName.toLowerCase() !== 'orders') return { error: `Unknown table "${tableName}". Try: orders` }
  let rows = table.slice()

  if(whereRaw){
    const cm = whereRaw.trim().match(/^(\w+)\s*(>=|<=|!=|=|>|<)\s*(.+?)\s*$/)
    if(!cm) return { error: `Could not parse WHERE clause: "${whereRaw}"` }
    const [, col, op, litRaw] = cm
    if(!(col in table[0])) return { error: `Unknown column "${col}"` }
    const lit = parseLiteral(litRaw)
    rows = rows.filter(r=>{
      const cell = r[col]
      const a = (typeof cell==='string' && typeof lit==='string') ? cell.toLowerCase() : cell
      const b = (typeof cell==='string' && typeof lit==='string') ? lit.toLowerCase() : lit
      return compareOp(a,b,op)
    })
  }
  if(orderCol){
    if(!(orderCol in table[0])) return { error: `Unknown column "${orderCol}" in ORDER BY` }
    const dir = (orderDirRaw||'').trim().toUpperCase()==='DESC' ? -1 : 1
    rows = rows.slice().sort((a,b)=>{
      const av=a[orderCol], bv=b[orderCol]
      if(av<bv) return -1*dir; if(av>bv) return 1*dir; return 0
    })
  }
  if(limitRaw) rows = rows.slice(0, parseInt(limitRaw,10))

  let columns:string[]
  if(colsRaw.trim()==='*'){ columns = Object.keys(table[0]) }
  else {
    columns = colsRaw.split(',').map(c=>c.trim())
    for(const c of columns){ if(!(c in table[0])) return { error: `Unknown column "${c}" in SELECT` } }
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
      <textarea className='w-full h-20 p-2 rounded border bg-transparent font-mono text-xs' value={query} onChange={(e)=>setQuery(e.target.value)} spellCheck={false} />
      {('error' in result) ? (
        <div className='mt-3 text-xs text-red-500'>{result.error}</div>
      ) : (
        <div className='mt-3 overflow-x-auto'>
          <table className='w-full text-xs border-collapse'>
            <thead><tr>{result.columns.map(c=>(<th key={c} className='text-left border-b border-neutral-300 dark:border-neutral-700 px-2 py-1 opacity-70'>{c}</th>))}</tr></thead>
            <tbody>
              {result.rows.map((r,i)=>(
                <tr key={i} className='border-b border-neutral-200/50 dark:border-neutral-800/50'>
                  {result.columns.map(c=>(<td key={c} className='px-2 py-1'>{String(r[c])}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
          {result.rows.length===0 && <div className='text-xs opacity-60 mt-1'>No rows matched.</div>}
        </div>
      )}
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
      <textarea className='w-full h-28 p-2 rounded border bg-transparent' value={text} onChange={(e)=>setText(e.target.value)} />
      <div className='mt-3 text-sm leading-relaxed'>
        {ents.map((e,i)=>(<span key={i} className='px-1.5 py-0.5 rounded-md border mr-1'>{e.text} <span className='opacity-60 text-xs'>{e.label}</span></span>))}
      </div>
      <div className='mt-2 text-xs opacity-70'>Rule-based preview; production used BERT/GPT fine-tuning.</div>
    </div>
  )
}

export default function App(){
  return (
    <Routes>
      <Route path='/' element={<Home/>} />
      <Route path='/projects/analytics' element={<ProjectAnalytics/>} />
      <Route path='/projects/mna' element={<ProjectMNA/>} />
      <Route path='/projects/bank' element={<ProjectBank/>} />
      <Route path='/projects/stock' element={<ProjectStock/>} />
      <Route path='/projects/adas' element={<ProjectADAS/>} />
      <Route path='/projects/forecast' element={<ProjectForecast/>} />
      <Route path='/projects/nlp' element={<ProjectNLP/>} />
      <Route path='/projects/account-risk' element={<ProjectAccountRisk/>} />
    </Routes>
  )
}
