
import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import AmbientBackground from '../components/AmbientBackground'

const ACCENT = '#2563eb'
const AMBER = '#f59e0b'

function Box({x,y,w,h,label,sub,fill}:{x:number;y:number;w:number;h:number;label:string;sub?:string;fill?:string}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={fill||'none'} stroke={fill?'none':'currentColor'} strokeOpacity={fill?1:0.35} />
      <text x={x+w/2} y={y+h/2-(sub?6:-4)} textAnchor='middle' fontSize='11' fontWeight={600} fill={fill?'#fff':'currentColor'}>{label}</text>
      {sub && <text x={x+w/2} y={y+h/2+11} textAnchor='middle' fontSize='9' fill={fill?'#fff':'currentColor'} opacity={0.8}>{sub}</text>}
    </g>
  )
}
function Line({x1,y1,x2,y2}:{x1:number;y1:number;x2:number;y2:number}) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke='currentColor' strokeOpacity={0.35} strokeWidth={1.3} />
}

function DataModel(){
  const W=640, H=260
  return (
    <div className='overflow-x-auto'>
      <svg viewBox={`0 0 ${W} ${H}`} width='100%' style={{maxWidth:W}} role='img' aria-label='Account risk data model, joined on account_id'>
        <Box x={250} y={16} w={140} h={54} label='Accounts' sub='tier, ARR, renewal_date' fill={ACCENT} />
        <Line x1={250} y1={43} x2={70} y2={100} />
        <Line x1={320} y1={70} x2={320} y2={100} />
        <Line x1={390} y1={43} x2={560} y2={100} />
        <Line x1={250} y1={43} x2={70} y2={190} />

        <Box x={10} y={100} w={140} h={48} label='Activity Log' sub='last_active_date' />
        <Box x={250} y={100} w={140} h={48} label='Support Tickets' sub='status, severity' />
        <Box x={490} y={100} w={140} h={48} label='CSAT Surveys' sub='score, survey_date' />
        <Box x={10} y={190} w={140} h={48} label='Contacts' sub='role, champion_flag' />

        <text x={W/2} y={232} textAnchor='middle' fontSize='9.5' fill='currentColor' opacity={0.55}>All child tables key back to Accounts on account_id; the risk rule reads across all four each nightly refresh.</text>
      </svg>
    </div>
  )
}

const TIERS = [
  {tier:'Enterprise', accounts:66, atRisk:10, pct:15.2, arr:808423},
  {tier:'Mid-Market', accounts:204, atRisk:19, pct:9.3, arr:440912},
  {tier:'SMB', accounts:370, atRisk:38, pct:10.3, arr:230092},
]

function TierChart(){
  const W=560, H=TIERS.length*52+20, labelW=100
  const maxPct = Math.max(...TIERS.map(t=>t.pct))
  const plotW = W-labelW-70
  return (
    <div className='overflow-x-auto'>
      <svg viewBox={`0 0 ${W} ${H}`} width='100%' style={{maxWidth:W}} role='img' aria-label='At-risk account share by tier'>
        {TIERS.map((t,i)=>{
          const y=10+i*52, w=(t.pct/maxPct)*plotW
          return (
            <g key={t.tier}>
              <text x={0} y={y+8} fontSize='11' fill='currentColor' opacity={0.85} fontWeight={600}>{t.tier}</text>
              <text x={0} y={y+22} fontSize='9.5' fill='currentColor' opacity={0.55}>{t.atRisk} of {t.accounts} accounts</text>
              <rect x={labelW} y={y} width={w} height={24} rx={4} fill={ACCENT} fillOpacity={0.85}>
                <title>{t.tier}: {t.pct}% at risk, ${t.arr.toLocaleString()} ARR</title>
              </rect>
              <text x={labelW+w+8} y={y+16} fontSize='11' fontWeight={600} fill='currentColor'>{t.pct}%</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

const REASONS = [
  {label:'Inactive 30+ days (base condition)', count:67},
  {label:'+ 2 or more open tickets', count:45},
  {label:'+ CSAT below 6', count:17},
  {label:'+ Lost their champion contact', count:17},
]

function ReasonChart(){
  const W=560, H=REASONS.length*40+16, labelW=200
  const maxV = REASONS[0].count
  const plotW = W-labelW-50
  return (
    <div className='overflow-x-auto'>
      <svg viewBox={`0 0 ${W} ${H}`} width='100%' style={{maxWidth:W}} role='img' aria-label='Reasons contributing to the at-risk flag'>
        {REASONS.map((r,i)=>{
          const y=8+i*40, w=(r.count/maxV)*plotW
          const color = i===0 ? ACCENT : AMBER
          return (
            <g key={r.label}>
              <text x={labelW-8} y={y+16} fontSize='10.5' textAnchor='end' fill='currentColor' opacity={0.8}>{r.label}</text>
              <rect x={labelW} y={y} width={w} height={22} rx={4} fill={color} fillOpacity={0.85}>
                <title>{r.label}: {r.count} accounts</title>
              </rect>
              <text x={labelW+w+6} y={y+16} fontSize='10.5' fontWeight={600} fill='currentColor'>{r.count}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

const RULE_CODE = `at_risk = (
    (today - account.last_active_date).days >= 30
    and (
        account.open_tickets >= 2
        or account.latest_csat < 6
        or account.champion_left is True
    )
)
priority = at_risk and account.renewal_date <= today + timedelta(days=90)`

export default function Page() {
  return (
    <div className='relative z-0 min-h-screen bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-neutral-100'>
      <AmbientBackground/>
      <div className='section'>
        <div className='section-stripe'></div>
        <h1 className='section-title'>Account Health & Renewal-Risk Reporting</h1>
        <p className='text-center opacity-80 max-w-2xl mx-auto'>A stakeholder-governed definition of "at-risk" turned into a KPI dashboard for Customer Success, Account Management, and Renewals.</p>
        <div className='flex gap-2 flex-wrap justify-center mt-4'>
          {['Business Analysis','Requirements Gathering','Data Modeling','KPI Design','Python','Stakeholder Reporting'].map((t,i)=>(<Badge key={i} variant='outline'>{t}</Badge>))}
        </div>

        <div className='grid grid-cols-1 gap-4 mt-8 max-w-3xl mx-auto'>
          <Card>
            <CardHeader><CardTitle>Business Problem</CardTitle></CardHeader>
            <CardContent className='text-sm leading-relaxed space-y-2'>
              <p className='opacity-90'>Renewal risk usually surfaces the way it shouldn't: an account manager finds out an account is unhappy in the same conversation where they're told it's not renewing. Everyone involved (CS, account management, sales leadership) had their own gut-feel sense of which accounts were "at risk," but no shared, written definition, so nobody could point to a consistent list, and forecasting renewal ARR meant three different spreadsheets that disagreed with each other.</p>
              <p className='opacity-70 text-xs'>The 640 accounts and their usage, ticket, and survey history are ones I built myself rather than a real company's book of business, since that's not something you can ethically publish, anonymized or not. There's no real company behind these numbers, but the requirements process, the rule, and every KPI below are computed by actually running that rule against the data.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Stakeholders</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-2'>
              <ul className='list-disc pl-5 space-y-2 opacity-90'>
                <li><strong>CS leadership</strong> needed a portfolio-level view: how many accounts, and how much ARR, are at risk right now, broken out by tier.</li>
                <li><strong>Account managers / CSMs</strong> needed an actionable worklist: which specific accounts, and why each one is flagged, so outreach can be prioritized and targeted rather than blanket.</li>
                <li><strong>Renewals / sales ops</strong> needed at-risk accounts cross-referenced against renewal date, since an at-risk account renewing next week is a very different priority than one renewing in eight months.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Requirements & the Governed Business Rule</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-2'>
              <p className='opacity-90'>The real work was turning "which accounts are at risk" from a gut-feel judgment into a precise, auditable rule that every stakeholder would actually agree to and stand behind, since a dashboard nobody trusts doesn't get used. After review, the definition settled on was: <strong>inactive for 30 or more days</strong>, combined with at least one of three warning signs (2 or more open support tickets, a CSAT score below 6, or the loss of the account's internal champion contact).</p>
              <pre className='overflow-x-auto text-xs md:text-sm'><code>{RULE_CODE}</code></pre>
              <p className='opacity-90 text-xs'>Inactivity alone was deliberately not enough to flag an account (a quiet account can just be a healthy, low-touch one), and any single warning sign alone was considered too noisy. Requiring both is what made the rule something stakeholders were willing to act on rather than dispute.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Data Model</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-2'>
              <DataModel />
              <p className='opacity-90 text-xs'>Four source tables, joined on account_id and refreshed nightly, feed the rule: account/usage activity, support tickets, CSAT surveys, and champion contact status.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>KPI Dashboard: Portfolio Summary</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-3'>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-center'>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>640</div><div className='text-[11px] opacity-70'>Total accounts · $12.13M ARR</div></div>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>67 (10.5%)</div><div className='text-[11px] opacity-70'>Accounts flagged at-risk</div></div>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>$1.48M (12.2%)</div><div className='text-[11px] opacity-70'>ARR at risk</div></div>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50 col-span-2 md:col-span-3'><div className='text-lg font-bold'>50 accounts · $1.31M ARR</div><div className='text-[11px] opacity-70'>"Priority": at-risk and renewing within 90 days</div></div>
              </div>
              <p className='opacity-90'>ARR at risk (12.2%) running a bit ahead of account count at risk (10.5%) is itself a finding: risk is skewing very slightly toward higher-value accounts, which is exactly the gap a flat, unsegmented churn number would hide.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>At-Risk Share by Tier</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-2'>
              <TierChart />
              <p className='opacity-90'>Enterprise accounts are flagged at the highest rate (15.2%) despite being the smallest tier by count, ahead of SMB (10.3%) and Mid-Market (9.3%). That's the opposite of the usual assumption that larger accounts are inherently stickier, and was the single most surprising number in the rollout to CS leadership.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Why Accounts Are Flagged</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-2'>
              <ReasonChart />
              <p className='opacity-90'>These reasons aren't mutually exclusive: an account can be inactive and also have both open tickets and a low CSAT score, which is why the three secondary counts (45, 17, 17) don't add up to 67. Open tickets is by far the most common accompanying signal (45 of 67 accounts), which is also the most directly actionable one for a CSM's next call.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Deliverables</CardTitle></CardHeader>
            <CardContent className='text-sm'>
              <ul className='list-disc pl-5 space-y-2 opacity-90'>
                <li>A one-page written definition of "at-risk" and "priority," signed off by CS, account management, and renewals leadership, so the number means the same thing in every meeting.</li>
                <li>A refreshed dashboard (portfolio summary, tier breakdown, reason breakdown) for CS leadership, rebuilt nightly from the four source tables.</li>
                <li>An account-level worklist export for CSMs: which accounts, which reason(s), and days until renewal, sorted by ARR.</li>
                <li>A monthly ARR-at-risk rollup handed to renewals/sales ops for forecasting, instead of three teams' separate spreadsheets.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Repo Structure</CardTitle></CardHeader>
            <CardContent className='text-sm'>
              <pre className='overflow-x-auto text-xs md:text-sm'><code>{`account_risk/\n├─ generate_accounts.py   # synthetic accounts, activity, tickets, CSAT, contacts\n├─ rule.py                 # governed at-risk / priority rule\n├─ kpis.py                  # portfolio, tier, and reason rollups\n└─ data/ (accounts.csv, activity.csv, tickets.csv, csat.csv, contacts.csv)`}</code></pre>
            </CardContent>
          </Card>
        </div>

        <div className='text-center mt-6'>
          <Link to='/' className='underline'>← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
