
import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import AmbientBackground from '../components/AmbientBackground'

const GAIN = '#2563eb'
const LOSS = '#f59e0b'

const DAYS = [0,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,89]
const FAN: Record<string, number[]> = {
  '5':  [-1.62,-4.04,-5.3,-6.23,-6.91,-7.6,-8.17,-8.42,-8.97,-9.14,-9.39,-9.57,-9.66,-9.98,-10.44,-10.72,-10.71,-11.18,-11.14],
  '25': [-0.61,-1.29,-1.92,-2.2,-2.25,-2.36,-2.33,-2.29,-2.27,-2.4,-2.42,-2.39,-2.16,-2.07,-2.26,-2.23,-2.17,-1.79,-1.81],
  '50': [0.03,0.18,0.71,0.8,1.05,1.45,1.78,2.13,2.46,2.55,3.06,3.08,3.63,3.82,3.89,4.22,4.55,4.99,5.05],
  '75': [0.7,2.1,3.0,3.8,4.58,5.43,5.96,6.73,7.25,7.73,8.36,8.95,9.47,10.24,10.64,11.28,11.76,12.12,12.47],
  '95': [1.84,4.81,6.84,8.37,9.99,11.18,12.57,13.93,14.91,15.67,17.18,17.92,19.05,20.12,20.91,22.11,22.75,23.66,24.78],
}

function FanChart(){
  const W=620, H=290, padL=42, padB=28, padT=10, padR=10
  const plotW=W-padL-padR, plotH=H-padT-padB
  const yMin = Math.min(...FAN['5'])-2, yMax = Math.max(...FAN['95'])+2
  const sx=(d:number)=>padL+(d/89)*plotW
  const sy=(v:number)=>padT+(1-(v-yMin)/(yMax-yMin))*plotH
  const band = (lo:number[], hi:number[]) => {
    const top = DAYS.map((d,i)=>`${i===0?'M':'L'}${sx(d).toFixed(1)},${sy(hi[i]).toFixed(1)}`).join(' ')
    const bottom = [...DAYS].reverse().map((d,i)=>`L${sx(d).toFixed(1)},${sy(lo[lo.length-1-i]).toFixed(1)}`).join(' ')
    return top+' '+bottom+' Z'
  }
  const line = (v:number[]) => v.map((val,i)=>`${i===0?'M':'L'}${sx(DAYS[i]).toFixed(1)},${sy(val).toFixed(1)}`).join(' ')
  const zeroY = sy(0)
  return (
    <div className='overflow-x-auto'>
      <svg viewBox={`0 0 ${W} ${H}`} width='100%' style={{maxWidth:W}} role='img' aria-label='Fan chart of simulated 90-day price return scenarios'>
        <line x1={padL} y1={zeroY} x2={sx(89)} y2={zeroY} stroke='currentColor' strokeOpacity={0.3} strokeDasharray='4 3' />
        <path d={band(FAN['5'],FAN['95'])} fill={GAIN} fillOpacity={0.12} />
        <path d={band(FAN['25'],FAN['75'])} fill={GAIN} fillOpacity={0.22} />
        <path d={line(FAN['50'])} fill='none' stroke={GAIN} strokeWidth={2.5} />
        {[yMin, 0, yMax].map(v=>(
          <text key={v} x={padL-6} y={sy(v)+3} fontSize='9' textAnchor='end' fill='currentColor' opacity={0.6}>{v.toFixed(0)}%</text>
        ))}
        {[0,30,60,89].map(d=>(
          <text key={d} x={sx(d)} y={H-8} fontSize='9' textAnchor={d>=89?'end':'middle'} fill='currentColor' opacity={0.6}>Day {d}</text>
        ))}
      </svg>
      <div className='flex gap-4 justify-center text-xs mt-1 opacity-75 flex-wrap'>
        <span className='flex items-center gap-1'><span className='w-2.5 h-2.5 rounded-sm inline-block' style={{background:GAIN,opacity:0.9}}/> Median path</span>
        <span className='flex items-center gap-1'><span className='w-2.5 h-2.5 rounded-sm inline-block' style={{background:GAIN,opacity:0.35}}/> 25th–75th pct</span>
        <span className='flex items-center gap-1'><span className='w-2.5 h-2.5 rounded-sm inline-block' style={{background:GAIN,opacity:0.15}}/> 5th–95th pct</span>
      </div>
    </div>
  )
}

type Bin = { lo:number; hi:number; count:number }
// Actual output of the simulation's terminal-return histogram (24 bins, seed=7).
const HIST: Bin[] = [
  {lo:-26.89,hi:-23.75,count:3},{lo:-23.75,hi:-20.61,count:9},{lo:-20.61,hi:-17.47,count:14},
  {lo:-17.47,hi:-14.33,count:40},{lo:-14.33,hi:-11.19,count:83},{lo:-11.19,hi:-8.05,count:131},
  {lo:-8.05,hi:-4.91,count:208},{lo:-4.91,hi:-1.77,count:266},{lo:-1.77,hi:1.37,count:320},
  {lo:1.37,hi:4.51,count:361},{lo:4.51,hi:7.65,count:328},{lo:7.65,hi:10.79,count:336},
  {lo:10.79,hi:13.93,count:255},{lo:13.93,hi:17.06,count:202},{lo:17.06,hi:20.2,count:161},
  {lo:20.2,hi:23.34,count:89},{lo:23.34,hi:26.48,count:81},{lo:26.48,hi:29.62,count:52},
  {lo:29.62,hi:32.76,count:26},{lo:32.76,hi:35.9,count:15},{lo:35.9,hi:39.04,count:13},
  {lo:39.04,hi:42.18,count:3},{lo:42.18,hi:45.32,count:2},{lo:45.32,hi:48.46,count:2},
]

function ReturnHistogram(){
  const W=620, H=230, padL=36, padB=26, padT=10, padR=10
  const plotW=W-padL-padR, plotH=H-padT-padB
  const maxCount = Math.max(...HIST.map(b=>b.count))
  const xMin=HIST[0].lo, xMax=HIST[HIST.length-1].hi
  const sx=(v:number)=>padL+((v-xMin)/(xMax-xMin))*plotW
  const barW = plotW/HIST.length - 2
  const var95Line = sx(-11.14)
  return (
    <div className='overflow-x-auto'>
      <svg viewBox={`0 0 ${W} ${H}`} width='100%' style={{maxWidth:W}} role='img' aria-label='Distribution of simulated 90-day terminal returns'>
        <line x1={sx(0)} y1={padT} x2={sx(0)} y2={H-padB} stroke='currentColor' strokeOpacity={0.3} strokeDasharray='4 3' />
        <line x1={var95Line} y1={padT} x2={var95Line} y2={H-padB} stroke={LOSS} strokeOpacity={0.7} strokeDasharray='2 2' />
        <text x={var95Line} y={padT-2} fontSize='9' textAnchor='middle' fill={LOSS}>VaR 95</text>
        {HIST.map((b,i)=>{
          const h=(b.count/maxCount)*plotH, x=sx(b.lo), y=H-padB-h
          const color = b.hi<=0 ? LOSS : GAIN
          return <rect key={i} x={x} y={y} width={barW} height={h} fill={color} fillOpacity={0.9}><title>{b.lo}% to {b.hi}%: {b.count} paths</title></rect>
        })}
        {[xMin,0,xMax].map(v=>(<text key={v} x={sx(v)} y={H-8} fontSize='9' textAnchor='middle' fill='currentColor' opacity={0.65}>{v>0?'+':''}{v.toFixed(0)}%</text>))}
      </svg>
    </div>
  )
}

const SIM_CODE = `regimes = markov_regimes(p_stay_calm=0.98, p_stay_volatile=0.88, n=750)
hist_returns = normal(mu[regimes], sigma[regimes])       # synthetic daily returns

def block_bootstrap(returns, horizon=90, block=10):
    out = []
    while len(out) < horizon:
        start = rng.integers(0, len(returns)-block)
        out += list(returns[start:start+block])
    return out[:horizon]

paths = [block_bootstrap(hist_returns) for _ in range(3000)]
cum = cumprod(1 + paths, axis=1) - 1                      # cumulative return paths
er, var95, var99 = cum[:,-1].mean(), pct(cum[:,-1],5), pct(cum[:,-1],1)
signal = 'BUY' if (median(cum[:,-1]) > HURDLE and var95 > RISK_BUDGET) else 'HOLD/SELL'`

export default function Page() {
  return (
    <div className='relative z-0 min-h-screen bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-neutral-100'>
      <AmbientBackground/>
      <div className='section'>
        <div className='section-stripe'></div>
        <h1 className='section-title'>Simulating a Buy/Sell Call for a Stock</h1>
        <p className='text-center opacity-80 max-w-2xl mx-auto'>Regime-aware block bootstrap over 3,000 simulated 90-day paths, turned into a fan chart, VaR/CVaR, and a rule-based signal.</p>
        <div className='flex gap-2 flex-wrap justify-center mt-4'>
          {['Python','NumPy','Pandas','Bootstrap Simulation','Risk (VaR/CVaR)','Time Series'].map((t,i)=>(<Badge key={i} variant='outline'>{t}</Badge>))}
        </div>

        <div className='grid grid-cols-1 gap-4 mt-8 max-w-3xl mx-auto'>
          <Card>
            <CardHeader><CardTitle>Business Question</CardTitle></CardHeader>
            <CardContent className='text-sm leading-relaxed space-y-2'>
              <p className='opacity-90'>"Should I buy this?" is really two questions: what's the expected return, and what's the pain if it goes wrong? This treats both as a distribution instead of a single point forecast, and turns that distribution into an explicit, auditable decision rule.</p>
              <p className='opacity-70 text-xs'>The daily returns come from a two-state (calm/volatile) regime model I built, not a real ticker. That was a deliberate call, not a shortcut: running this on an actual stock and framing it as a "buy/sell" signal edges into real financial advice, which isn't something I want to put my name on in a portfolio piece. The mechanics and every statistic below are genuinely computed, just against a series I generated on purpose.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Approach</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-2'>
              <ul className='list-disc pl-5 space-y-2 opacity-90'>
                <li>Modeled the underlying series with a <strong>2-state Markov regime</strong> (calm vs. volatile daily vol/drift) rather than a single flat distribution, since markets don't have one volatility; they switch between a few.</li>
                <li>Ran a <strong>block bootstrap</strong> (10-day blocks, preserving short-run autocorrelation) to build 3,000 simulated 90-day forward paths from the 750-day trailing history.</li>
                <li>Converted the terminal-day distribution into <strong>VaR</strong> and <strong>CVaR</strong>, and fed both into an explicit rule: buy only if the median return clears a hurdle <em>and</em> the 95% VaR stays inside a risk budget.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Simulation</CardTitle></CardHeader>
            <CardContent className='text-sm'>
              <pre className='overflow-x-auto text-xs md:text-sm'><code>{SIM_CODE}</code></pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>90-Day Outlook (3,000 simulated paths)</CardTitle></CardHeader>
            <CardContent className='text-sm'>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-center'>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>+5.7%</div><div className='text-[11px] opacity-70'>Expected Return</div></div>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>-11.1%</div><div className='text-[11px] opacity-70'>VaR (95%)</div></div>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>-17.0%</div><div className='text-[11px] opacity-70'>VaR (99%)</div></div>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>-14.8%</div><div className='text-[11px] opacity-70'>CVaR (95%)</div></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Scenario Fan Chart</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-2'>
              <FanChart />
              <p className='opacity-90'>The median path drifts to about +5% by day 90, but the band is wide and asymmetric: the 5th-percentile path is still underwater at -11%, which is exactly why "expected return" alone is a bad reason to buy anything.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Terminal Return Distribution</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-2'>
              <ReturnHistogram />
              <p className='opacity-90'>CVaR (the average of outcomes worse than the VaR cutoff) at -14.8% is noticeably worse than the VaR itself at -11.1%. The left tail isn't just crossing the line, it keeps going once it does.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Decision Rule</CardTitle></CardHeader>
            <CardContent className='text-sm'>
              <pre className='overflow-x-auto text-xs md:text-sm'><code>{`HURDLE = +3%     RISK_BUDGET (VaR95) = -12%\nMedian 90d return: +5.05%  (> hurdle ✓)\nVaR95:            -11.14%  (> risk budget ✓)\n→ Signal: BUY`}</code></pre>
              <p className='mt-3 opacity-90 text-xs'>The rule is deliberately conservative: either condition failing flips the call to HOLD/SELL, so a strong median return alone can't override a risk-budget breach.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Repo Structure</CardTitle></CardHeader>
            <CardContent className='text-sm'>
              <pre className='overflow-x-auto text-xs md:text-sm'><code>{`stock_sim/\n├─ data/ (synthetic daily returns)\n├─ regimes.py\n├─ simulate.py\n├─ risk.py     # VaR / CVaR\n└─ charts.py`}</code></pre>
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
