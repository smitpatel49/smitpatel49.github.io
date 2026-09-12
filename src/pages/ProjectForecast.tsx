
import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

const ACTUAL = '#0f172a'
const GBM = '#2563eb'
const NAIVE = '#94a3b8'

const TEST_ACTUAL = [180.0,151.0,160.1,143.2,153.4,171.1,199.4,158.8,168.9,153.5,154.1,152.3,170.1,172.0,180.3,147.6,158.4,140.6,146.8,152.5,173.6,176.3,147.1,142.5,132.5,141.3,143.9,157.4,161.4,155.8,165.7,133.4,152.5,156.7,160.4,159.5,140.7,137.7,131.3,123.3,137.0,164.1,149.6,131.3,133.3,138.7,134.1,141.6,165.9,163.0,137.8,138.8,139.5,181.7,149.9,157.2,150.4,120.5,133.4,113.3,119.3,153.3,156.6,156.4,125.3,114.1,120.8,125.0,139.9,156.9,137.5,128.7,113.4,124.9,122.0,130.4,142.7,137.2,121.3,136.5,118.3,118.2,116.8,135.3,135.1,116.2,131.7,116.5,130.8,135.1]
const TEST_GBM = [171.9,167.3,163.0,156.3,144.9,162.2,176.9,174.7,154.5,162.6,149.1,156.0,169.9,176.3,162.7,147.7,145.9,147.5,142.3,170.1,169.4,156.9,150.6,147.8,141.9,140.7,155.9,163.5,163.3,142.1,142.7,136.5,139.5,150.4,158.9,157.5,145.1,139.9,136.3,138.1,146.1,147.0,153.4,133.3,130.0,130.2,135.0,141.3,148.5,145.5,133.8,133.2,135.6,201.5,145.3,157.9,149.4,137.2,134.3,136.1,138.5,139.4,147.7,146.1,130.1,124.2,113.4,127.0,135.7,145.7,140.8,116.4,119.7,114.0,122.8,135.4,143.2,136.2,117.4,114.3,113.6,123.8,126.0,133.8,131.0,108.9,113.7,106.6,112.6,127.1]
const TEST_NAIVE = [170.3,172.2,166.3,159.1,152.2,166.3,176.5,180.0,151.0,160.1,143.2,153.4,171.1,199.4,158.8,168.9,153.5,154.1,152.3,170.1,172.0,180.3,147.6,158.4,140.6,146.8,152.5,173.6,176.3,147.1,142.5,132.5,141.3,143.9,157.4,161.4,155.8,165.7,133.4,152.5,156.7,160.4,159.5,140.7,137.7,131.3,123.3,137.0,164.1,149.6,131.3,133.3,138.7,134.1,141.6,165.9,163.0,137.8,138.8,139.5,181.7,149.9,157.2,150.4,120.5,133.4,113.3,119.3,153.3,156.6,156.4,125.3,114.1,120.8,125.0,139.9,156.9,137.5,128.7,113.4,124.9,122.0,130.4,142.7,137.2,121.3,136.5,118.3,118.2,116.8]

function ForecastChart(){
  const W=680, H=280, padL=40, padR=10, padT=14, padB=26
  const plotW=W-padL-padR, plotH=H-padT-padB
  const n = TEST_ACTUAL.length
  const all = [...TEST_ACTUAL, ...TEST_GBM, ...TEST_NAIVE]
  const yMin = Math.floor(Math.min(...all)/10)*10, yMax = Math.ceil(Math.max(...all)/10)*10
  const sx = (i:number) => padL + (i/(n-1))*plotW
  const sy = (v:number) => padT + (1-(v-yMin)/(yMax-yMin))*plotH
  const path = (arr:number[]) => arr.map((v,i)=>`${i===0?'M':'L'} ${sx(i).toFixed(1)} ${sy(v).toFixed(1)}`).join(' ')
  const yTicks = [yMin, Math.round((yMin+yMax)/2), yMax]
  return (
    <div className='overflow-x-auto'>
      <svg viewBox={`0 0 ${W} ${H}`} width='100%' style={{maxWidth:W}} role='img' aria-label='Actual demand vs. LightGBM and seasonal-naive forecasts over a 90-day holdout'>
        {yTicks.map(v=>(
          <g key={v}>
            <line x1={padL} y1={sy(v)} x2={W-padR} y2={sy(v)} stroke='currentColor' strokeOpacity={0.08} />
            <text x={padL-6} y={sy(v)+3} fontSize='9' textAnchor='end' fill='currentColor' opacity={0.6}>{v}</text>
          </g>
        ))}
        <path d={path(TEST_NAIVE)} fill='none' stroke={NAIVE} strokeWidth={1.5} strokeDasharray='3 3' opacity={0.8} />
        <path d={path(TEST_GBM)} fill='none' stroke={GBM} strokeWidth={1.8} />
        <path d={path(TEST_ACTUAL)} fill='none' stroke={ACTUAL} strokeWidth={1.8} opacity={0.85} />
        <text x={padL} y={H-6} fontSize='9' fill='currentColor' opacity={0.55}>day 1 of holdout</text>
        <text x={W-padR} y={H-6} fontSize='9' textAnchor='end' fill='currentColor' opacity={0.55}>day 90</text>
      </svg>
      <div className='flex gap-4 justify-center text-xs mt-1 opacity-80 flex-wrap'>
        <span className='flex items-center gap-1'><span className='w-3 h-0.5 inline-block' style={{background:ACTUAL}}/> Actual demand</span>
        <span className='flex items-center gap-1'><span className='w-3 h-0.5 inline-block' style={{background:GBM}}/> LightGBM forecast</span>
        <span className='flex items-center gap-1'><span className='w-3 h-0.5 inline-block border-t border-dashed' style={{borderColor:NAIVE}}/> Seasonal-naive forecast</span>
      </div>
    </div>
  )
}

const FEATURES: [string, number][] = [
  ['lag_28', 627], ['lag_7', 602], ['doy', 601], ['roll_std_7', 592], ['lag_1', 588], ['roll_std_28', 502],
]

function FeatureImportance(){
  const W=520, H=FEATURES.length*36+16, labelW=90
  const maxV = Math.max(...FEATURES.map(([,v])=>v))
  const plotW = W-labelW-50
  return (
    <div className='overflow-x-auto'>
      <svg viewBox={`0 0 ${W} ${H}`} width='100%' style={{maxWidth:W}} role='img' aria-label='LightGBM feature importance, top 6 features'>
        {FEATURES.map(([name,val],i)=>{
          const y=10+i*36, w=(val/maxV)*plotW
          return (
            <g key={name}>
              <text x={labelW-8} y={y+15} fontSize='11' textAnchor='end' fill='currentColor' opacity={0.8} fontFamily='monospace'>{name}</text>
              <rect x={labelW} y={y} width={w} height={20} rx={3} fill={GBM} fillOpacity={0.85}>
                <title>{name}: {val} splits</title>
              </rect>
              <text x={labelW+w+6} y={y+15} fontSize='10' fill='currentColor' opacity={0.7}>{val}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

const FEATURE_CODE = `for lag in [1, 7, 14, 28]:
    df[f'lag_{lag}'] = df.groupby('store_id')['units'].shift(lag)
for win in [7, 28]:
    df[f'roll_mean_{win}'] = df.groupby('store_id')['units'].shift(1).rolling(win).mean()
    df[f'roll_std_{win}']  = df.groupby('store_id')['units'].shift(1).rolling(win).std()
df['dow'], df['doy'], df['month'] = df.date.dt.dayofweek, df.date.dt.dayofyear, df.date.dt.month
df['is_weekend'], df['is_promo'] = df.dow.isin([5,6]).astype(int), df.promo_flag

model = lgb.LGBMRegressor(n_estimators=400, learning_rate=0.03, num_leaves=31, min_child_samples=20)
model.fit(X_train, y_train)
naive_forecast = df['units'].shift(7)   # this week = same weekday, last week`

export default function Page() {
  return (
    <div className='min-h-screen bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-neutral-100'>
      <div className='section'>
        <div className='section-stripe'></div>
        <h1 className='section-title'>Daily Demand Forecasting</h1>
        <p className='text-center opacity-80 max-w-2xl mx-auto'>Gradient-boosted forecasting with lag and rolling-window features, benchmarked against the seasonal-naive baseline it actually has to beat.</p>
        <div className='flex gap-2 flex-wrap justify-center mt-4'>
          {['Python','Pandas','LightGBM','Time-Series','Feature Engineering'].map((t,i)=>(<Badge key={i} variant='outline'>{t}</Badge>))}
        </div>

        <div className='grid grid-cols-1 gap-4 mt-8 max-w-3xl mx-auto'>
          <Card>
            <CardHeader><CardTitle>Business Question</CardTitle></CardHeader>
            <CardContent className='text-sm leading-relaxed space-y-2'>
              <p className='opacity-90'>Inventory and staffing decisions run on tomorrow's demand, not last year's average. A forecasting model only earns its keep if it beats the cheap baseline planners already use in its absence: assume this week looks like last week. This project builds that comparison honestly, on the same holdout period, rather than reporting the model's accuracy in isolation.</p>
              <p className='opacity-70 text-xs'>The daily demand series is synthetic (three years generated with trend, weekly seasonality, and promotional spikes plus noise), but the feature engineering, the seasonal-naive baseline, and the LightGBM training run below are all real, evaluated on a held-out final 90 days the model never saw during training.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Approach</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-2'>
              <ul className='list-disc pl-5 space-y-2 opacity-90'>
                <li>Engineered lag features (1, 7, 14, 28 days back) and rolling mean/std windows (7 and 28 days), plus calendar features (day of week, day of year, month, weekend flag) and a promo indicator.</li>
                <li>Set the baseline to <strong>seasonal-naive</strong>: this week's forecast equals the same weekday one week ago, the standard low-effort comparison point for daily retail-style demand.</li>
                <li>Trained a LightGBM regressor on 977 days and evaluated both the baseline and the model on the same trailing 90-day holdout, so the comparison isn't tilted by different test windows.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Feature Engineering & Training</CardTitle></CardHeader>
            <CardContent className='text-sm'>
              <pre className='overflow-x-auto text-xs md:text-sm'><code>{FEATURE_CODE}</code></pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Holdout Results (90 days)</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-3'>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-center'>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>8.31</div><div className='text-[11px] opacity-70'>LightGBM MAE (naive: 10.80)</div></div>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>10.46</div><div className='text-[11px] opacity-70'>LightGBM RMSE (naive: 14.76)</div></div>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>5.76%</div><div className='text-[11px] opacity-70'>LightGBM MAPE (naive: 7.57%)</div></div>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50 col-span-2 md:col-span-3'><div className='text-lg font-bold'>23.0% lower MAE</div><div className='text-[11px] opacity-70'>than seasonal-naive, on the same 90-day holdout</div></div>
              </div>
              <p className='opacity-90'>The gap holds across all three error metrics, not just the one that happened to look best, which is the usual tell for a real improvement rather than a cherry-picked comparison.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Actual vs. Forecast, Holdout Period</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-2'>
              <ForecastChart />
              <p className='opacity-90'>The naive line is a copy of last week shifted forward, so it tracks the actual series but always one week late to any turn. LightGBM picks up the same turns closer to when they happen, which is where most of its error reduction comes from.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>What the Model Leans On</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-2'>
              <FeatureImportance />
              <p className='opacity-90'>Recent history dominates: the two longest lags (7 and 28 days back) and short-term volatility (<code>roll_std_7</code>) matter more than the calendar features. <code>is_promo</code> and <code>is_weekend</code> rank low individually, mostly because their effect is already captured indirectly through the lag and rolling features.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Repo Structure</CardTitle></CardHeader>
            <CardContent className='text-sm'>
              <pre><code>{`demand_forecast/\n├─ generate_series.py   # synthetic 3-year daily series w/ trend, seasonality, promos\n├─ features.py           # lag/rolling/calendar feature builders\n├─ train.py               # LightGBM training + seasonal-naive baseline\n├─ evaluate.py            # MAE/RMSE/MAPE on the holdout, feature importance\n└─ data/ (daily_demand.csv)`}</code></pre>
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
