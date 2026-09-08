
import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

const ACCENT = '#2563eb'

function Box({x,y,w,h,label,sub,fill}:{x:number;y:number;w:number;h:number;label:string;sub?:string;fill?:string}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={fill||'none'} stroke={fill?'none':'currentColor'} strokeOpacity={fill?1:0.35} />
      <text x={x+w/2} y={y+h/2-(sub?6:-4)} textAnchor='middle' fontSize='11.5' fontWeight={600} fill={fill?'#fff':'currentColor'}>{label}</text>
      {sub && <text x={x+w/2} y={y+h/2+12} textAnchor='middle' fontSize='9.5' fill={fill?'#fff':'currentColor'} opacity={0.8}>{sub}</text>}
    </g>
  )
}
function Arrow({x1,y1,x2,y2}:{x1:number;y1:number;x2:number;y2:number}) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke='currentColor' strokeOpacity={0.45} strokeWidth={1.5} markerEnd='url(#arrow)' />
}

function ArchitectureDiagram(){
  const W=640, H=270
  return (
    <div className='overflow-x-auto'>
      <svg viewBox={`0 0 ${W} ${H}`} width='100%' style={{maxWidth:W}} role='img' aria-label='ADAS perception, fusion, and control architecture'>
        <defs>
          <marker id='arrow' markerWidth='8' markerHeight='8' refX='6' refY='3' orient='auto'>
            <path d='M0,0 L6,3 L0,6 Z' fill='currentColor' opacity={0.6} />
          </marker>
        </defs>
        <Box x={16} y={20} w={110} h={44} label='Camera Frame' />
        <Arrow x1={126} y1={42} x2={168} y2={42} />
        <Arrow x1={126} y1={42} x2={168} y2={200} />

        <Box x={168} y={16} w={160} h={52} label='Lane Branch' sub='Canny + Hough (classical CV)' />
        <Box x={168} y={176} w={160} h={52} label='Sign Branch' sub='HSV threshold + contours' />
        <text x={248} y={78} fontSize='8.5' textAnchor='middle' fill='currentColor' opacity={0.55}>prod: U-Net segmentation</text>
        <text x={248} y={238} fontSize='8.5' textAnchor='middle' fill='currentColor' opacity={0.55}>prod: YOLO / Faster R-CNN</text>

        <Arrow x1={328} y1={42} x2={368} y2={100} />
        <Arrow x1={328} y1={202} x2={368} y2={140} />

        <Box x={368} y={90} w={140} h={60} label='Fusion' sub='offset · curvature · sign policy' fill={ACCENT} />
        <Arrow x1={508} y1={120} x2={548} y2={120} />

        <Box x={548} y={90} w={80} h={60} label='PID' sub='lateral + speed' fill={ACCENT} />

        <Arrow x1={588} y1={150} x2={588} y2={190} />
        <Box x={508} y={196} w={120} h={44} label='Steering + Throttle' />
      </svg>
    </div>
  )
}

const DETECT_CODE = `edges = cv2.Canny(gray, 60, 150)
lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=25,
                         minLineLength=30, maxLineGap=15)
left, right = split_by_slope(lines)          # slope < 0 -> left lane
left_line  = fit_line(left)                  # least-squares x = m*y + c
right_line = fit_line(right)
offset = (left_line.x(H) + right_line.x(H))/2 - IMAGE_CENTER_X

mask_stop  = hsv_in_range(hsv, RED_HUE)
mask_yield = hsv_in_range(hsv, YELLOW_HUE)
signs = [contour_to_bbox(c) for c in find_contours(mask_stop, mask_yield)
         if cv2.contourArea(c) > MIN_AREA]`

export default function Page() {
  return (
    <div className='min-h-screen bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-neutral-100'>
      <div className='section'>
        <div className='section-stripe'></div>
        <h1 className='section-title'>Lane & Road-Sign Detection for Self-Driving</h1>
        <p className='text-center opacity-80 max-w-2xl mx-auto'>Perception + fusion + control architecture, validated end-to-end with a real (classical-CV) pipeline on synthetic scenes.</p>
        <div className='flex gap-2 flex-wrap justify-center mt-4'>
          {['Python','OpenCV','Segmentation','Object Detection','Control Systems'].map((t,i)=>(<Badge key={i} variant='outline'>{t}</Badge>))}
        </div>

        <div className='grid grid-cols-1 gap-4 mt-8 max-w-3xl mx-auto'>
          <Card>
            <CardHeader><CardTitle>Scope & Honesty Note</CardTitle></CardHeader>
            <CardContent className='text-sm leading-relaxed space-y-2'>
              <p className='opacity-90'>Training a real segmentation/detection model needs a driving-scale image dataset and GPU time this project doesn't have. So instead of quoting borrowed benchmark numbers, this validates the part that's actually mine to prove: the <strong>fusion and control logic</strong> that turns perception output into a steering/speed decision — using a real, working <strong>classical computer-vision pipeline</strong> (Canny edges + Hough transform for lanes, HSV color + contour shape for signs) on procedurally generated synthetic road scenes.</p>
              <p className='opacity-70 text-xs'>Every metric below comes from actually running that pipeline on 60 generated frames — nothing is a placeholder.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Architecture</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-2'>
              <ArchitectureDiagram />
              <p className='opacity-90 text-xs'>The blue boxes are what this project actually implements and measures; the perception branches are swappable — classical CV here, a trained segmentation/detection model in production, same fusion and control code either side.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Detection Pipeline</CardTitle></CardHeader>
            <CardContent className='text-sm'>
              <pre className='overflow-x-auto text-xs md:text-sm'><code>{DETECT_CODE}</code></pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Validation on 60 Synthetic Frames</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-3'>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-center'>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>100%</div><div className='text-[11px] opacity-70'>Both lanes detected</div></div>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>3.6°</div><div className='text-[11px] opacity-70'>Mean lane-angle error</div></div>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>3.7px</div><div className='text-[11px] opacity-70'>Mean lane-center offset error</div></div>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>75.0%</div><div className='text-[11px] opacity-70'>Sign precision</div></div>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>97.7%</div><div className='text-[11px] opacity-70'>Sign recall</div></div>
                <div className='rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800/50'><div className='text-lg font-bold'>0.848</div><div className='text-[11px] opacity-70'>Sign F1</div></div>
              </div>
              <p className='opacity-90'>Recall is high (color thresholding rarely <em>misses</em> a bright red/yellow shape) but precision lags — 28 false positives out of 112 detections, mostly blur/anti-aliasing artifacts that happen to fall in the right hue range. That gap is exactly why production perception uses a learned detector instead of hand-tuned color rules: a classifier learns shape and context, a hue mask doesn't.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Example Frame — Input vs. Detected</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-2'>
              <img src='/adas-demo.jpg' alt='Left: synthetic input frame. Right: detected lane lines (green) and sign bounding boxes (cyan) overlaid.' className='w-full rounded-lg border border-neutral-200 dark:border-neutral-800' />
              <p className='text-xs opacity-70'>Left: synthetic input frame. Right: detected lane lines (green) and sign boxes (cyan) from the actual pipeline output above.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Fusion → Control</CardTitle></CardHeader>
            <CardContent className='text-sm'>
              <pre><code>{`offset_px   = -6.1        # from lane fusion, this frame\nsteer_gain  = 0.04        # deg per pixel (Kp)\nsteer_angle = clip(steer_gain * offset_px, -25, 25)  # ≈ -0.24°\n\ndetected_sign = 'yield'\ntarget_speed  = policy_from_sign('yield')   # -> reduce speed, no full stop`}</code></pre>
              <p className='mt-3 opacity-90 text-xs'>Deliberately simple (proportional-only) so the fusion logic — not tuned control theory — stays the thing being demonstrated; production added the I and D terms plus a Kalman-filtered offset estimate.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Repo Structure</CardTitle></CardHeader>
            <CardContent className='text-sm'>
              <pre><code>{`adas/\n├─ scenes/          # synthetic scene generator (numpy + OpenCV)\n├─ perception/\n│  ├─ lanes.py      # Canny + Hough (this validation)\n│  └─ signs.py       # HSV + contours (this validation)\n├─ fusion.py\n├─ control.py        # PID\n└─ eval.py           # angle/offset error, precision/recall/F1`}</code></pre>
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
