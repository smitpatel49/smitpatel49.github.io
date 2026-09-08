
import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

const BLUE_RAMP = ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8']

// Reusable small line-chart for ROC / PR curves.
function LineCurve({ points, color='#2563eb', diagonal=false, hLine, xLabel, yLabel }:
  { points:[number,number][]; color?:string; diagonal?:boolean; hLine?:number; xLabel:string; yLabel:string }) {
  const W=420, H=270, padL=40, padB=30, padT=10, padR=10
  const plotW=W-padL-padR, plotH=H-padT-padB
  const sx=(x:number)=>padL+x*plotW
  const sy=(y:number)=>padT+(1-y)*plotH
  const path = points.map((p,i)=>(i===0?'M':'L')+sx(p[0]).toFixed(1)+','+sy(p[1]).toFixed(1)).join(' ')
  const area = path + ` L${sx(points[points.length-1][0]).toFixed(1)},${sy(0).toFixed(1)} L${sx(points[0][0]).toFixed(1)},${sy(0).toFixed(1)} Z`
  const ticks=[0,0.25,0.5,0.75,1]
  return (
    <div className='overflow-x-auto'>
      <svg viewBox={`0 0 ${W} ${H}`} width='100%' style={{maxWidth:W}} role='img' aria-label={`${yLabel} vs ${xLabel} curve`}>
        {ticks.map(t=>(
          <g key={t}>
            <line x1={sx(t)} y1={padT} x2={sx(t)} y2={sy(0)} stroke='currentColor' strokeOpacity={0.08} />
            <line x1={padL} y1={sy(t)} x2={sx(1)} y2={sy(t)} stroke='currentColor' strokeOpacity={0.08} />
            <text x={sx(t)} y={H-8} fontSize='9' textAnchor='middle' fill='currentColor' opacity={0.6}>{t}</text>
            <text x={padL-6} y={sy(t)+3} fontSize='9' textAnchor='end' fill='currentColor' opacity={0.6}>{t}</text>
          </g>
        ))}
        {diagonal && <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} stroke='currentColor' strokeOpacity={0.3} strokeDasharray='4 3' />}
        {hLine!==undefined && <line x1={sx(0)} y1={sy(hLine)} x2={sx(1)} y2={sy(hLine)} stroke='currentColor' strokeOpacity={0.3} strokeDasharray='4 3' />}
        <path d={area} fill={color} fillOpacity={0.12} stroke='none' />
        <path d={path} fill='none' stroke={color} strokeWidth={2.5} />
        <text x={(padL+sx(1))/2} y={H-2} fontSize='10' textAnchor='middle' fill='currentColor' opacity={0.7}>{xLabel}</text>
        <text x={10} y={(padT+sy(0))/2} fontSize='10' textAnchor='middle' fill='currentColor' opacity={0.7} transform={`rotate(-90 10 ${(padT+sy(0))/2})`}>{yLabel}</text>
      </svg>
    </div>
  )
}

function ConfusionMatrix({ tn, fp, fn, tp }:{ tn:number; fp:number; fn:number; tp:number }) {
  const max = Math.max(tn,fp,fn,tp)
  const cell = (v:number, rLabel:string, cLabel:string) => {
    const pct = v/max
    const idx = Math.max(0, Math.min(BLUE_RAMP.length-1, Math.round(pct*(BLUE_RAMP.length-1))))
    const bg = BLUE_RAMP[idx]
    const text = idx>=5 ? '#ffffff' : '#0f172a'
    return (
      <div className='rounded-lg p-4 text-center' style={{background:bg}}>
        <div className='text-xl font-bold' style={{color:text}}>{v.toLocaleString()}</div>
        <div className='text-[10px] mt-1' style={{color:text, opacity:0.8}}>Actual {rLabel} · Predicted {cLabel}</div>
      </div>
    )
  }
  return (
    <div className='grid grid-cols-2 gap-2 max-w-sm'>
      {cell(tn,'No','No')}{cell(fp,'No','Yes')}
      {cell(fn,'Yes','No')}{cell(tp,'Yes','Yes')}
    </div>
  )
}

function FeatureImportance({ data }:{ data:{feature:string; importance:number}[] }) {
  const max = Math.max(...data.map(d=>d.importance))
  return (
    <div className='space-y-2'>
      {data.map((d,i)=>(
        <div key={d.feature} className='flex items-center gap-2 text-xs'>
          <div className='w-40 shrink-0 opacity-80 text-right'>{d.feature}</div>
          <div className='flex-1 bg-neutral-200/40 dark:bg-neutral-800/40 rounded h-4 relative'>
            <div className='h-4 rounded' style={{ width:`${(d.importance/max)*100}%`, background: BLUE_RAMP[7-Math.min(6,i)] }} />
          </div>
          <div className='w-12 text-right opacity-70'>{(d.importance*100).toFixed(1)}%</div>
        </div>
      ))}
    </div>
  )
}

const ROC_POINTS: [number,number][] = [[0,0],[0.007,0.096],[0.02,0.165],[0.043,0.242],[0.067,0.323],[0.101,0.41],[0.126,0.484],[0.149,0.534],[0.179,0.556],[0.201,0.593],[0.232,0.646],[0.265,0.668],[0.295,0.733],[0.329,0.767],[0.372,0.792],[0.425,0.82],[0.481,0.857],[0.546,0.882],[0.595,0.907],[0.65,0.919],[0.709,0.929],[0.764,0.966],[0.821,0.981],[0.922,0.991],[1,1]]
const PR_POINTS: [number,number][] = [[1,0.143],[0.991,0.152],[0.981,0.167],[0.969,0.174],[0.929,0.18],[0.919,0.191],[0.907,0.203],[0.885,0.211],[0.857,0.229],[0.82,0.244],[0.795,0.262],[0.77,0.28],[0.733,0.293],[0.668,0.297],[0.643,0.317],[0.596,0.328],[0.556,0.342],[0.54,0.369],[0.481,0.39],[0.401,0.417],[0.311,0.453],[0.227,0.51],[0.158,0.607],[0.081,0.684],[0,1]]
const FEATURE_IMPORTANCE = [
  { feature:'prev_campaign_success', importance:0.2442 },
  { feature:'balance', importance:0.1298 },
  { feature:'education_level', importance:0.1091 },
  { feature:'campaign_contacts', importance:0.0966 },
  { feature:'has_personal_loan', importance:0.0907 },
  { feature:'has_housing_loan', importance:0.0643 },
  { feature:'contacted_last_30d', importance:0.0589 },
  { feature:'pdays', importance:0.0542 },
]

const TRAIN_CODE = `scale_pos_weight = (y_train==0).sum() / (y_train==1).sum()
model = XGBClassifier(n_estimators=350, max_depth=4, learning_rate=0.05,
                       subsample=0.8, colsample_bytree=0.8,
                       scale_pos_weight=scale_pos_weight, eval_metric='auc')
model.fit(X_train, y_train)

# Isotonic calibration via 3-fold CV — fixes probability magnitudes,
# not ranking, so AUC stays ~flat while Brier score improves.
cal_model = CalibratedClassifierCV(model, method='isotonic', cv=3)
cal_model.fit(X_train, y_train)
proba = cal_model.predict_proba(X_test)[:, 1]

# Pick threshold from call-center capacity, not a fixed 0.5 cutoff
threshold = np.quantile(proba, 1 - CAPACITY_FRACTION)`

export default function Page() {
  return (
    <div className='min-h-screen bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-neutral-100'>
      <div className='section'>
        <div className='section-stripe'></div>
        <h1 className='section-title'>Bank Marketing Classification</h1>
        <p className='text-center opacity-80 max-w-2xl mx-auto'>Calibrated XGBoost scoring model with a capacity-constrained operating threshold, benchmarked against a Random Forest baseline.</p>
        <div className='flex gap-2 flex-wrap justify-center mt-4'>
          {['Python','XGBoost','scikit-learn','Random Forest','Calibration','FastAPI'].map((t,i)=>(<Badge key={i} variant='outline'>{t}</Badge>))}
        </div>

        <div className='grid grid-cols-1 gap-4 mt-8 max-w-3xl mx-auto'>
          <Card>
            <CardHeader><CardTitle>Business Question</CardTitle></CardHeader>
            <CardContent className='text-sm leading-relaxed space-y-2'>
              <p className='opacity-90'>A call center can only reach a fraction of the customer list in a campaign window. <em>Which customers are actually worth calling?</em> That's a ranking and capacity problem, not just an accuracy problem — so the model is judged on lift at a realistic contact rate, not on raw accuracy against a ~14% base rate.</p>
              <p className='opacity-70 text-xs'>Trained on a synthetic dataset shaped like the classic bank telemarketing problem (self-generated for demonstration) — the schema, training run, and every metric below are real; only the underlying rows are simulated.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Approach</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-2'>
              <ul className='list-disc pl-5 space-y-2 opacity-90'>
                <li>Trained an <strong>XGBoost</strong> classifier (350 trees, depth 4, class-weighted for the ~14% positive rate) and a Random Forest baseline on the same 75/25 split.</li>
                <li>Applied <strong>isotonic calibration</strong> (3-fold CV) so output scores are usable as real probabilities for expected-value math, not just for ranking.</li>
                <li>Set the operating threshold from <strong>call-center capacity</strong> (top 15% of scored customers) instead of the default 0.5 cutoff — the business constraint, not an arbitrary number, decides who gets called.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Training & Calibration</CardTitle></CardHeader>
            <CardContent className='text-sm'>
              <pre className='overflow-x-auto text-xs md:text-sm'><code>{TRAIN_CODE}</code></pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Metrics (held-out test set, n=2,250)</CardTitle></CardHeader>
            <CardContent className='text-sm'>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-center'>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>0.779</div><div className='text-[11px] opacity-70'>ROC-AUC</div></div>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>0.408</div><div className='text-[11px] opacity-70'>PR-AUC (base rate 0.143)</div></div>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>0.156 → 0.104</div><div className='text-[11px] opacity-70'>Brier, raw → calibrated</div></div>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>0.790</div><div className='text-[11px] opacity-70'>Random Forest AUC (baseline)</div></div>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>40.2%</div><div className='text-[11px] opacity-70'>Precision @ top 15%</div></div>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>2.8×</div><div className='text-[11px] opacity-70'>Lift over base rate</div></div>
              </div>
              <p className='mt-3 opacity-90'>Calibration barely moves AUC (0.778 → 0.779) — expected, since isotonic scaling preserves rank order — but nearly halves the Brier score, which is what actually matters once these probabilities feed an expected-value calculation. The Random Forest baseline actually edges out XGBoost on raw AUC here (0.790 vs. 0.779); XGBoost was carried forward anyway because it calibrates cleanly and the gap is within normal run-to-run noise on a dataset this size — worth re-checking on more data before treating it as settled.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>ROC Curve</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-2'>
              <LineCurve points={ROC_POINTS} diagonal xLabel='False Positive Rate' yLabel='True Positive Rate' />
              <p className='text-xs opacity-70'>Dashed line = random guessing. AUC 0.779.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Precision–Recall Curve</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-2'>
              <LineCurve points={PR_POINTS} hLine={0.143} xLabel='Recall' yLabel='Precision' />
              <p className='text-xs opacity-70'>Dashed line = base rate (14.3%), i.e. precision from calling customers at random. The gap above it is the model's entire value.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Confusion Matrix @ 15% Capacity Threshold</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-3'>
              <ConfusionMatrix tn={1726} fp={202} fn={186} tp={136} />
              <p className='opacity-90'>Of the 338 customers actually likely to subscribe, calling only the top 15% by score still reaches 136 of them (42% recall) while contacting 4x fewer people than a blanket campaign.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Feature Importance</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-3'>
              <FeatureImportance data={FEATURE_IMPORTANCE} />
              <p className='opacity-90'>Whether a customer said yes to a <em>previous</em> campaign dominates the model — unsurprising, but it means the single highest-leverage data investment isn't a new feature, it's better historical campaign-outcome logging.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Serving</CardTitle></CardHeader>
            <CardContent className='text-sm'>
              <pre><code>{`POST /predict  {customer_features...} -> {probability, decision}\n# decision = "contact" if probability >= threshold else "skip"\n# threshold recomputed weekly from current capacity`}</code></pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Repo Structure</CardTitle></CardHeader>
            <CardContent className='text-sm'>
              <pre><code>{`bank_marketing/\n├─ data/ (synthetic sample .csv)\n├─ features.py\n├─ train.py\n├─ calibrate.py\n├─ serve/\n│  ├─ app.py (FastAPI)\n│  └─ schemas.py\n└─ Dockerfile`}</code></pre>
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
