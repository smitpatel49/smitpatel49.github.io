
import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import AmbientBackground from '../components/AmbientBackground'

const ACCRETIVE = '#2563eb' // blue (good / accretive)
const DILUTIVE = '#f59e0b'  // amber (caution / dilutive)

type Bin = { lo:number; hi:number; count:number }
const HIST: Bin[] = [
  {lo:-6.05,hi:-5.29,count:4},{lo:-5.29,hi:-4.54,count:25},{lo:-4.54,hi:-3.79,count:98},
  {lo:-3.79,hi:-3.03,count:245},{lo:-3.03,hi:-2.28,count:482},{lo:-2.28,hi:-1.53,count:776},
  {lo:-1.53,hi:-0.77,count:1194},{lo:-0.77,hi:-0.02,count:1625},{lo:-0.02,hi:0.73,count:1993},
  {lo:0.73,hi:1.49,count:2300},{lo:1.49,hi:2.24,count:2260},{lo:2.24,hi:2.99,count:2206},
  {lo:2.99,hi:3.75,count:1805},{lo:3.75,hi:4.5,count:1569},{lo:4.5,hi:5.25,count:1250},
  {lo:5.25,hi:6.01,count:797},{lo:6.01,hi:6.76,count:591},{lo:6.76,hi:7.52,count:379},
  {lo:7.52,hi:8.27,count:224},{lo:8.27,hi:9.02,count:104},{lo:9.02,hi:9.78,count:47},
  {lo:9.78,hi:10.53,count:16},{lo:10.53,hi:11.28,count:7},{lo:11.28,hi:12.04,count:3},
]

function AccretionHistogram(){
  const W=620, H=260, padL=36, padB=28, padT=10, padR=10
  const plotW=W-padL-padR, plotH=H-padT-padB
  const maxCount = Math.max(...HIST.map(b=>b.count))
  const xMin = HIST[0].lo, xMax = HIST[HIST.length-1].hi
  const sx=(v:number)=>padL+((v-xMin)/(xMax-xMin))*plotW
  const barW = plotW/HIST.length - 2
  const zeroX = sx(0)
  return (
    <div className='overflow-x-auto'>
      <svg viewBox={`0 0 ${W} ${H}`} width='100%' style={{maxWidth:W}} role='img' aria-label='Distribution of simulated EPS accretion/dilution'>
        <line x1={zeroX} y1={padT} x2={zeroX} y2={H-padB} stroke='currentColor' strokeOpacity={0.35} strokeDasharray='4 3' />
        {HIST.map((b,i)=>{
          const h = (b.count/maxCount)*plotH
          const x = sx(b.lo)
          const y = H-padB-h
          const color = b.hi<=0 ? DILUTIVE : ACCRETIVE
          return <rect key={i} x={x} y={y} width={barW} height={h} fill={color} fillOpacity={0.9}>
            <title>{b.lo}% to {b.hi}%: {b.count.toLocaleString()} trials</title>
          </rect>
        })}
        {[xMin,0,xMax].map(v=>(
          <text key={v} x={sx(v)} y={H-8} fontSize='9' textAnchor='middle' fill='currentColor' opacity={0.65}>{v>0?'+':''}{v.toFixed(0)}%</text>
        ))}
        <text x={W/2} y={H-1} fontSize='0'></text>
      </svg>
      <div className='flex gap-4 justify-center text-xs mt-1 opacity-75'>
        <span className='flex items-center gap-1'><span className='w-2.5 h-2.5 rounded-sm inline-block' style={{background:DILUTIVE}}/> Dilutive</span>
        <span className='flex items-center gap-1'><span className='w-2.5 h-2.5 rounded-sm inline-block' style={{background:ACCRETIVE}}/> Accretive</span>
      </div>
    </div>
  )
}

const SENSITIVITY: [string, number][] = [
  ['Cash % of Financing', 0.882],
  ['Purchase Premium', -0.533],
  ['Debt % of Financing', 0.288],
  ['Pretax Synergies', 0.212],
]

function TornadoChart(){
  const W=560, H= SENSITIVITY.length*44 + 20, midX = W/2, maxAbs = Math.max(...SENSITIVITY.map(([,v])=>Math.abs(v)))
  const scale = (W/2 - 90)/maxAbs
  return (
    <div className='overflow-x-auto'>
      <svg viewBox={`0 0 ${W} ${H}`} width='100%' style={{maxWidth:W}} role='img' aria-label='Sensitivity of EPS accretion to deal inputs'>
        <line x1={midX} y1={10} x2={midX} y2={H-10} stroke='currentColor' strokeOpacity={0.3} />
        {SENSITIVITY.map(([name,val],i)=>{
          const y = 20 + i*44
          const w = Math.abs(val)*scale
          const x = val>=0 ? midX : midX-w
          const color = val>=0 ? ACCRETIVE : DILUTIVE
          return (
            <g key={name}>
              <text x={midX} y={y-8} fontSize='11' textAnchor='middle' fill='currentColor' opacity={0.8}>{name}</text>
              <rect x={x} y={y} width={w} height={20} rx={3} fill={color}>
                <title>{name}: standardized effect {val.toFixed(3)}</title>
              </rect>
              <text x={val>=0 ? x+w+6 : x-6} y={y+14} fontSize='10' textAnchor={val>=0?'start':'end'} fill='currentColor' opacity={0.8}>{val>0?'+':''}{val.toFixed(2)}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

const SIM_CODE = `premium = rng.triangular(0.20, 0.45, 0.90, N)         # deal premium
synergy_pretax = rng.triangular(3e6, 10e6, 22e6, N)   # annual pretax synergies
cash_pct, debt_pct, stock_pct = rng.dirichlet([1.6, 2.2, 2.8], N).T

purchase_price = target_mcap * (1 + premium)
new_shares = (purchase_price*stock_pct) / (acq_price*0.97)
combined_ni = acq_ni + tgt_ni + synergy_pretax*(1-TAX) \\
              - (purchase_price*debt_pct)*DEBT_RATE*(1-TAX) \\
              - (purchase_price*cash_pct)*CASH_YIELD*(1-TAX)
accretion = (combined_ni/(acq_shares+new_shares) - acq_eps) / acq_eps

# Sensitivity: standardized regression of accretion on each input,
# not a naive one-at-a-time tornado -- holds correlations in the sample intact.
coefs = LinearRegression().fit(zscore(inputs), zscore(accretion)).coef_`

export default function Page() {
  return (
    <div className='relative z-0 min-h-screen bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-neutral-100'>
      <AmbientBackground/>
      <div className='section'>
        <div className='section-stripe'></div>
        <h1 className='section-title'>Simulating Company Merger/Acquisition</h1>
        <p className='text-center opacity-80 max-w-2xl mx-auto'>20,000-trial Monte Carlo on deal premium, synergies, and financing mix, with sensitivity from standardized regression rather than a naive one-at-a-time tornado.</p>
        <div className='flex gap-2 flex-wrap justify-center mt-4'>
          {['Python','NumPy','Monte Carlo','scikit-learn','Sensitivity Analysis'].map((t,i)=>(<Badge key={i} variant='outline'>{t}</Badge>))}
        </div>

        <div className='grid grid-cols-1 gap-4 mt-8 max-w-3xl mx-auto'>
          <Card>
            <CardHeader><CardTitle>Business Question</CardTitle></CardHeader>
            <CardContent className='text-sm leading-relaxed space-y-2'>
              <p className='opacity-90'>Deal teams almost never get a single-number answer to "will this be accretive?" The honest answer is a distribution, since the premium paid, synergy realization, and financing mix are all still being negotiated. This models that distribution directly, instead of pretending one base case is the forecast.</p>
              <p className='opacity-70 text-xs'>The acquirer and target are a made-up profile, not an actual pair of companies. I'd rather not run a simulation against real tickers and let it look like a claim about an actual deal, so I built a clean illustrative case instead. Every number below is still a genuine output of running that simulation, nothing here is filled in by hand.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Deal Setup</CardTitle></CardHeader>
            <CardContent className='text-sm'>
              <div className='grid grid-cols-2 gap-3 text-center'>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>18.0×</div><div className='text-[11px] opacity-70'>Acquirer P/E</div></div>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>15.0×</div><div className='text-[11px] opacity-70'>Target P/E (pre-premium)</div></div>
              </div>
              <p className='mt-3 opacity-90'>The target trades cheaper than the acquirer, the classic setup where a deal <em>should</em> be accretive on paper, but a large enough premium or too much stock financing can still erase that edge. That tension is exactly what the simulation is measuring.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Monte Carlo Simulation</CardTitle></CardHeader>
            <CardContent className='text-sm'>
              <pre className='overflow-x-auto text-xs md:text-sm'><code>{SIM_CODE}</code></pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Results (20,000 trials)</CardTitle></CardHeader>
            <CardContent className='text-sm'>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-center'>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>77.5%</div><div className='text-[11px] opacity-70'>P(Accretive)</div></div>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>+1.9%</div><div className='text-[11px] opacity-70'>Median EPS impact</div></div>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>-2.1%</div><div className='text-[11px] opacity-70'>5th percentile (downside)</div></div>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>+6.4%</div><div className='text-[11px] opacity-70'>95th percentile (upside)</div></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Distribution of EPS Accretion / Dilution</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-2'>
              <AccretionHistogram />
              <p className='opacity-90'>Roughly one simulated outcome in four lands dilutive. The deal "works" in most scenarios, but not comfortably enough to wave off the downside tail.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Sensitivity (standardized regression coefficients)</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-2'>
              <TornadoChart />
              <p className='opacity-90'>The financing mix (how much is paid in cash versus stock) moves accretion more than the premium negotiated or the synergies promised. That's the actionable takeaway for a deal team: fighting for a lower price helps, but the financing structure is the bigger lever.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Repo Structure</CardTitle></CardHeader>
            <CardContent className='text-sm'>
              <pre className='overflow-x-auto text-xs md:text-sm'><code>{`mna/\n├─ data/ (illustrative deal assumptions)\n├─ mna/\n│  ├─ __init__.py\n│  ├─ simulate.py\n│  ├─ sensitivity.py\n│  └─ charts.py\n├─ notebooks/\n└─ cli.py   # mna simulate --trials 20000 --seed 11`}</code></pre>
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
