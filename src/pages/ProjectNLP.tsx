
import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import AmbientBackground from '../components/AmbientBackground'

const BLUE_RAMP = ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8']
function rampColor(pct: number) {
  const idx = Math.max(0, Math.min(BLUE_RAMP.length - 1, Math.round((pct / 100) * (BLUE_RAMP.length - 1))))
  return BLUE_RAMP[idx]
}
function textColorFor(pct: number) { return pct >= 45 ? '#ffffff' : '#0f172a' }

const CATEGORIES = ['Account Access', 'Billing', 'Feature Request', 'Shipping & Delivery', 'Technical Issue']
const SHORT = ['Access', 'Billing', 'Feature', 'Shipping', 'Technical']
const BASELINE_CM = [[105,1,1,0,1],[0,108,0,0,0],[0,0,105,0,2],[2,3,0,100,2],[0,0,2,0,106]]
const TRANSFORMER_CM = [[101,3,1,2,1],[1,106,1,0,0],[0,0,104,1,2],[2,3,2,96,4],[2,0,3,0,103]]

function ConfusionMatrix({ matrix, title }: { matrix: number[][]; title: string }) {
  const cell = 52, labelW = 82, headerH = 60, gap = 3
  const width = labelW + CATEGORIES.length * (cell + gap)
  const height = headerH + CATEGORIES.length * (cell + gap)
  const rowMax = matrix.map(row => Math.max(...row))
  return (
    <div className='overflow-x-auto'>
      <p className='text-xs opacity-60 mb-1'>{title} · rows = actual, columns = predicted</p>
      <svg viewBox={`0 0 ${width} ${height}`} width='100%' style={{maxWidth:width}} role='img' aria-label={`${title} confusion matrix`}>
        {SHORT.map((label, ci) => (
          <text key={label} x={labelW + ci*(cell+gap) + cell/2} y={headerH-8} textAnchor='middle' fontSize='10' fill='currentColor' opacity={0.7}
            transform={`rotate(-28 ${labelW + ci*(cell+gap) + cell/2} ${headerH-8})`}>{label}</text>
        ))}
        {matrix.map((row, ri) => (
          <g key={ri}>
            <text x={labelW-8} y={headerH + ri*(cell+gap) + cell/2 + 4} fontSize='10' textAnchor='end' fill='currentColor' opacity={0.75}>{SHORT[ri]}</text>
            {row.map((v, ci) => {
              const x = labelW + ci*(cell+gap), y = headerH + ri*(cell+gap)
              const pct = (v / rowMax[ri]) * 100
              const isDiag = ri === ci
              return (
                <g key={ci}>
                  <rect x={x} y={y} width={cell} height={cell} rx={6} fill={isDiag ? rampColor(pct) : rampColor(pct*0.55)}
                    stroke={isDiag ? 'currentColor' : 'none'} strokeOpacity={isDiag?0.25:0} strokeWidth={1.5}>
                    <title>Actual {CATEGORIES[ri]}, predicted {CATEGORIES[ci]}: {v}</title>
                  </rect>
                  <text x={x+cell/2} y={y+cell/2+4} textAnchor='middle' fontSize='12' fontWeight={isDiag?700:500} fill={textColorFor(pct)}>{v}</text>
                </g>
              )
            })}
          </g>
        ))}
      </svg>
    </div>
  )
}

const HISTORY = [
  {epoch:1,train_loss:0.5286,test_loss:0.1593},{epoch:2,train_loss:0.1053,test_loss:0.1491},
  {epoch:3,train_loss:0.0979,test_loss:0.1695},{epoch:4,train_loss:0.0768,test_loss:0.126},
  {epoch:5,train_loss:0.0767,test_loss:0.1301},{epoch:6,train_loss:0.0536,test_loss:0.1544},
  {epoch:7,train_loss:0.0358,test_loss:0.1596},{epoch:8,train_loss:0.046,test_loss:0.1781},
  {epoch:9,train_loss:0.0292,test_loss:0.1601},{epoch:10,train_loss:0.0255,test_loss:0.1792},
  {epoch:11,train_loss:0.0227,test_loss:0.2118},{epoch:12,train_loss:0.0343,test_loss:0.2145},
  {epoch:13,train_loss:0.0163,test_loss:0.2088},{epoch:14,train_loss:0.0149,test_loss:0.2339},
  {epoch:15,train_loss:0.0088,test_loss:0.2303},{epoch:16,train_loss:0.0047,test_loss:0.2607},
  {epoch:17,train_loss:0.0019,test_loss:0.2522},{epoch:18,train_loss:0.0016,test_loss:0.2596},
  {epoch:19,train_loss:0.0015,test_loss:0.2629},{epoch:20,train_loss:0.0013,test_loss:0.262},
  {epoch:21,train_loss:0.0012,test_loss:0.2612},{epoch:22,train_loss:0.0011,test_loss:0.2608},
  {epoch:23,train_loss:0.001,test_loss:0.262},{epoch:24,train_loss:0.001,test_loss:0.2618},
  {epoch:25,train_loss:0.0011,test_loss:0.2618},
]

function LossCurve(){
  const W=640, H=240, padL=40, padR=14, padT=14, padB=28
  const plotW=W-padL-padR, plotH=H-padT-padB
  const n=HISTORY.length
  const allVals = HISTORY.flatMap(h=>[h.train_loss,h.test_loss])
  const yMax = Math.ceil(Math.max(...allVals)*20)/20
  const sx=(i:number)=>padL+(i/(n-1))*plotW
  const sy=(v:number)=>padT+(1-v/yMax)*plotH
  const path=(key:'train_loss'|'test_loss')=>HISTORY.map((h,i)=>`${i===0?'M':'L'} ${sx(i).toFixed(1)} ${sy(h[key]).toFixed(1)}`).join(' ')
  return (
    <div className='overflow-x-auto'>
      <svg viewBox={`0 0 ${W} ${H}`} width='100%' style={{maxWidth:W}} role='img' aria-label='Training and test loss over 25 epochs, from-scratch transformer'>
        {[0, yMax/2, yMax].map(v=>(
          <g key={v}>
            <line x1={padL} y1={sy(v)} x2={W-padR} y2={sy(v)} stroke='currentColor' strokeOpacity={0.08} />
            <text x={padL-6} y={sy(v)+3} fontSize='9' textAnchor='end' fill='currentColor' opacity={0.6}>{v.toFixed(2)}</text>
          </g>
        ))}
        <path d={path('train_loss')} fill='none' stroke='#2563eb' strokeWidth={1.8} />
        <path d={path('test_loss')} fill='none' stroke='#f59e0b' strokeWidth={1.8} />
        <text x={padL} y={H-6} fontSize='9' fill='currentColor' opacity={0.55}>epoch 1</text>
        <text x={W-padR} y={H-6} fontSize='9' textAnchor='end' fill='currentColor' opacity={0.55}>epoch 25</text>
      </svg>
      <div className='flex gap-4 justify-center text-xs mt-1 opacity-80'>
        <span className='flex items-center gap-1'><span className='w-3 h-0.5 inline-block' style={{background:'#2563eb'}}/> Train loss</span>
        <span className='flex items-center gap-1'><span className='w-3 h-0.5 inline-block' style={{background:'#f59e0b'}}/> Test loss</span>
      </div>
    </div>
  )
}

const BASELINE_CODE = `vectorizer = TfidfVectorizer(ngram_range=(1,2), min_df=2, max_features=20000)
X = vectorizer.fit_transform(tickets.text)
clf = LogisticRegression(max_iter=1000, C=2.0)
clf.fit(X_train, y_train)  # 2,150 tickets, 5 categories`

const TRANSFORMER_CODE = `class TinyTransformer(nn.Module):
    def __init__(self, vocab_size, d_model=64, n_heads=4, n_layers=2, n_classes=5):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, d_model, padding_idx=0)
        self.pos = nn.Embedding(MAX_LEN, d_model)
        layer = nn.TransformerEncoderLayer(d_model, n_heads, dim_feedforward=128, batch_first=True)
        self.encoder = nn.TransformerEncoder(layer, n_layers)
        self.head = nn.Linear(d_model, n_classes)
    def forward(self, x, mask):
        h = self.encoder(self.embed(x) + self.pos(positions), src_key_padding_mask=mask)
        return self.head(h[:, 0])  # [CLS]-style pooled token

# 87,941 parameters total. Weights are randomly initialized -- no pretrained
# checkpoint is loaded, since huggingface.co is unreachable from this environment.`

export default function Page() {
  return (
    <div className='relative z-0 min-h-screen bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-neutral-100'>
      <AmbientBackground/>
      <div className='section'>
        <div className='section-stripe'></div>
        <h1 className='section-title'>Support Ticket Routing (NLP)</h1>
        <p className='text-center opacity-80 max-w-2xl mx-auto'>Classifying incoming support tickets into the right team queue, comparing a classical TF-IDF baseline against a small transformer trained from scratch.</p>
        <div className='flex gap-2 flex-wrap justify-center mt-4'>
          {['Python','scikit-learn','PyTorch','Transformers (from scratch)','NLP','Text Classification'].map((t,i)=>(<Badge key={i} variant='outline'>{t}</Badge>))}
        </div>

        <div className='grid grid-cols-1 gap-4 mt-8 max-w-3xl mx-auto'>
          <Card>
            <CardHeader><CardTitle>Business Question</CardTitle></CardHeader>
            <CardContent className='text-sm leading-relaxed space-y-2'>
              <p className='opacity-90'>Support tickets that get manually triaged sit in a queue before reaching the right team. Auto-routing on the ticket text (billing, technical, shipping, account access, feature request) cuts that wait to nearly zero for the tickets a model is confident about, while leaving the ambiguous ones for a human, which is exactly where the interesting part of this project turned out to be.</p>
              <p className='opacity-70 text-xs'>The 2,688 tickets are ones I generated with combinatorial templates rather than real customer support logs, which would drag in privacy and consent issues even if I could get access to some. I did make a point of baking in a deliberate share of blended, ambiguous phrasing so it wouldn't be a trivially easy dataset. Both models below were actually trained and evaluated on that data.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Data & Approach</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-2'>
              <ul className='list-disc pl-5 space-y-2 opacity-90'>
                <li>2,688 tickets across 5 categories, with roughly 12% written as blended examples (two categories' concerns in one ticket, e.g. a billing question that also mentions a shipping delay) to force real ambiguity into the test set rather than only clean, single-topic text.</li>
                <li><strong>Baseline:</strong> TF-IDF (unigrams + bigrams) into Logistic Regression, the classical, cheap-to-run approach.</li>
                <li><strong>Challenger:</strong> a small transformer encoder (2 layers, 4 attention heads, 64-dimensional embeddings, ~88K parameters) trained from scratch. No pretrained checkpoint (e.g. BERT) is used: this environment's network access does not reach huggingface.co, so pretrained weights simply aren't obtainable here. Rather than fake that step, the transformer is initialized randomly and trained end to end on the 2,150-ticket training split.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Baseline: TF-IDF + Logistic Regression</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-3'>
              <pre className='overflow-x-auto text-xs md:text-sm'><code>{BASELINE_CODE}</code></pre>
              <div className='grid grid-cols-2 gap-3 text-center'>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>97.4%</div><div className='text-[11px] opacity-70'>Accuracy (538 held-out tickets)</div></div>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>0.974</div><div className='text-[11px] opacity-70'>Macro F1</div></div>
              </div>
              <ConfusionMatrix matrix={BASELINE_CM} title='Baseline confusion matrix' />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Challenger: Transformer Trained From Scratch</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-3'>
              <pre className='overflow-x-auto text-xs md:text-sm'><code>{TRANSFORMER_CODE}</code></pre>
              <div className='grid grid-cols-2 gap-3 text-center'>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>94.8%</div><div className='text-[11px] opacity-70'>Accuracy (same 538 tickets)</div></div>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>0.948</div><div className='text-[11px] opacity-70'>Macro F1</div></div>
              </div>
              <ConfusionMatrix matrix={TRANSFORMER_CM} title='Transformer confusion matrix' />
              <LossCurve />
              <p className='opacity-90'>Train loss keeps falling toward zero past epoch 10, while test loss bottoms out around epoch 4 and then climbs, the textbook signature of overfitting. That's expected: 2,150 training tickets is a small dataset for a randomly initialized transformer to learn general language structure from, without the head start pretrained weights would normally give it.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>The Honest Result</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-2'>
              <p className='opacity-90'>On the full test set the classical baseline edges out the transformer (97.4% vs. 94.8%), and the gap widens sharply on the 60 deliberately blended, ambiguous tickets: <strong>76.7% for the baseline vs. 53.3% for the transformer</strong>. A transformer's usual advantage is learning richer context from large-scale pretraining; without that pretraining, and with only a few thousand examples, it has no edge over TF-IDF features a logistic regression can already separate cleanly, and it struggles more on exactly the ambiguous cases where deeper context would matter most.</p>
              <p className='opacity-70 text-xs'>This is reported as it actually ran. The point of including it isn't that transformers are worse (pretrained ones, given real data access, are the industry default for a reason), it's that a from-scratch transformer on limited data is not automatically better than a well-tuned classical model, and knowing when to reach for which is the actual skill.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Repo Structure</CardTitle></CardHeader>
            <CardContent className='text-sm'>
              <pre className='overflow-x-auto text-xs md:text-sm'><code>{`ticket_routing/\n├─ generate_tickets.py     # combinatorial + blended synthetic tickets\n├─ baseline_tfidf.py        # TF-IDF + LogisticRegression\n├─ transformer_scratch.py   # from-scratch encoder, training loop\n├─ evaluate.py               # accuracy/F1/confusion matrix, blended-subset slice\n└─ data/ (tickets.json)`}</code></pre>
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
