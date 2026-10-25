import { CaseStudyPage, Block, Stats, Figure, Video, DataTable, Steps, Bullets, CodeNote } from '../components/CaseStudy'

const IMG = '/media/adas/'

export default function Page() {
  return (
    <CaseStudyPage slug='adas' lede='A simulated car drives a 900 m track using only its camera: classical computer vision finds the lane and the stop and yield signs, a tracker bridges dropouts, and PID control drives. It holds in stress conditions, and breaks, at the same places every lap, when night, rain and a lead car come together.'
      summary={{
        problem: 'Find out whether a camera-only stack of classical vision and control can keep a car in its lane and obey stop and yield signs, and where it breaks.',
        approach: 'Closed-loop simulation at 20 Hz: rendered camera frames, bird’s-eye lane fitting, an odometry-predicted tracker, sign detection and PID control.',
        result: 'No lane departures and 12/12 stops over 6 stress laps; with night, rain and a lead car combined, only 6/12 yields obeyed.',
        decision: 'What a perception front end must deliver (sign confirmation range, lane dropout rate) before it’s connected to a controller.',
        stack: ['Python', 'OpenCV', 'NumPy', 'pandas', 'matplotlib'],
        data: {
          synthetic: 'a simulated 900 m track with exact ground truth for every frame.',
          real: 'none; no real roads or vehicles.',
        },
      }}>

      <Block title='Overview'>
        <p>Can a camera-only driver-assistance stack, built from classical computer vision and control with no learned models, keep a car in its lane and handle stop and yield signs, and where does it break? The answer is for someone deciding what a perception front end has to deliver before it’s worth connecting to a controller: how far ahead a sign must be confirmed, how often the lane may drop out, and how much a tracker can paper over.</p>
        <Bullets items={[
          <><b>Render:</b> a pinhole camera 1.4 m above a flat road draws a 640×360 frame, with shadows, worn paint, roadside look-alikes, night, rain or a lead car as configured.</>,
          <><b>Perceive:</b> lane paint is masked, warped to a bird’s-eye view and fitted with a quadratic per line; signs are found by color, shape and position and confirmed over several frames.</>,
          <><b>Track and control:</b> a lane tracker moves its last estimate with the car’s own (deliberately imperfect) odometry and coasts through dropouts; a steering PID and a speed planner drive.</>,
          <><b>Move and score:</b> a bicycle model advances the car at 20 Hz, so each frame depends on how the car drove the previous one, and perception errors become real steering errors.</>,
        ]} />
        <p className='opacity-70 text-xs'>Everything is simulated, so the ground truth (the car’s true offset, the road curvature, the distance to every real sign) is known exactly for every frame. A ground-truth-perception lap, measured the same way, isolates what the camera costs.</p>
      </Block>

      <Block title='Headline numbers'>
        <Stats items={[
          { value: '0', label: 'Lane departures in 6 stress laps' },
          { value: '0.39–0.43 m', label: 'Worst offset, stress laps (line at 0.9 m)' },
          { value: '12/12', label: 'Stops made in stress laps (yields also 12/12)' },
          { value: '6/12', label: 'Yields obeyed with night, rain and a lead car' },
        ]} />
        <p>On the main laps, stress included, the camera matches the ground-truth lap within noise, so perception isn’t the limiting factor; stack every condition at once and both the lane tracker and the sign detector give out.</p>
      </Block>

      <Block title='The drive, and four laps of the same track'>
        <Video base={IMG + 'drive_stress'} maxWidth={480} label='Camera view from the stress lap: the car approaches a stop sign under tree shadows with worn lane paint, the detected sign is boxed with its distance, the car stops, waits and drives on' caption='Real time, 262–312 m of the stress lap. The overlay shows the fitted lane lines, the estimated lane center (green), a box and distance on each detected sign, and the car’s speed, target speed, steering angle and offset. The car stops at the stop sign, waits two seconds and moves off.' />
        <DataTable head={['Setup', 'Lateral RMS', 'Worst offset', 'Departures', 'Stops', 'Yields', 'Sign confirmed at']} highlight={2} rows={[
          ['Ground-truth perception', '0.15\u00a0m', '0.36\u00a0m', 0, '2/2', '2/2', '40\u00a0m (by design)'],
          ['Camera, clean', '0.15\u00a0m', '0.37\u00a0m', 0, '2/2', '2/2', 'stop 37\u00a0m, yield 28\u00a0m'],
          ['Camera, stress', '0.13\u00a0m', '0.39\u00a0m', 0, '2/2', '2/2', 'stop 32–34\u00a0m, yield 26–28\u00a0m'],
          ['Stress, no temporal filtering', '0.15\u00a0m', '0.70\u00a0m', 0, '2/2', '2/2', 'stop 35–36\u00a0m, yield 27–29\u00a0m'],
        ]} />
        <p>A departure means a wheel crossed the line (|offset| &gt; 0.9 m). In stress conditions the camera’s lane-position estimate is off by 7.7 cm on average (95th percentile 23 cm); without temporal filtering that grows to 12.0 cm / 36 cm and the worst offset goes from 0.39 to 0.70 m. There were no false sign detections in any lap. A stop counts if the car comes to rest before the sign and waits two seconds (it rests 1.0–1.5 m short); a yield counts at no more than 17.25 km/h at the sign, and obeyed yields are passed at 16.0–16.5 km/h.</p>
        <p>One lap is one sample, so the stress lap was repeated with five more noise seeds. Across the six: worst offset 0.39–0.43 m, no departures, 12/12 stops and 12/12 yields.</p>
        <Figure src={IMG + 'lateral_error.webp'} alt='Line chart of offset from lane center along the track for the four main laps, with the road curvature and sign positions below' caption='Offset from lane center along the track for the four main laps (top), with road curvature and the stop and yield signs below; the dashed lines at ±0.9 m mark a wheel over the line. The camera laps follow the ground-truth lap closely; the lap without temporal filtering is the jumpiest and ends at −0.70 m, its worst offset.' />
      </Block>

      <Block title='Harder conditions: finding the breaking point'>
        <p>A stack that passes everything hasn’t been tested hard enough, so there are four more laps: night (headlights only, more noise), rain (washed-out contrast, streaks and drops on the lens), a lead car 8–14 m ahead that really hides the far end of the lines and any sign behind it, and all of them at once on top of the stress conditions.</p>
        <Figure src={IMG + 'condition_everything.webp'} alt='Camera frame at night in rain, with a car ahead in the lane showing red tail lights' caption='One frame from the combined condition: night, rain and a lead car on top of the stress conditions.' />
        <DataTable head={['Setup', 'Departures', 'RMS / worst', 'Fresh lane measurement', 'Offset error p95', 'Unplanned stops', 'Yields']} highlight={3} rows={[
          ['Night', 0, '0.14\u00a0/\u00a00.36\u00a0m', '100%', '11\u00a0cm', '0\u00a0s', '2/2'],
          ['Rain', 0, '0.13\u00a0/\u00a00.34\u00a0m', '100%', '16\u00a0cm', '0\u00a0s', '2/2'],
          ['Lead car', 0, '0.13\u00a0/\u00a00.35\u00a0m', '98%', '18\u00a0cm', '0\u00a0s', '2/2'],
          ['Everything at once', 1, '0.18\u00a0/\u00a01.00\u00a0m', '56%', '38\u00a0cm', '26.7\u00a0s', '1/2'],
        ]} />
        <p>Each condition alone is handled, with every stop made. Combined, the stack breaks, so that lap was also repeated with five more seeds. Across the six:</p>
        <Bullets items={[
          <><b>Lane keeping fails at one S-bend.</b> The camera gets a fresh lane measurement on only 20–75% of frames. When the lane stays lost for more than 0.6 s the planner straightens the wheel and stops the car; in three of six laps that happens where a 90 m-radius bend turns into the opposite one, and the car drifts outward and puts a wheel up to 10 cm over the line (worst offset up to 1.00 m).</>,
          <><b>Long nuisance stops.</b> Every lap stands still at least once with the lane lost, always at the same two spots, for 0.6 to 170 s per lap. One lap was cut off at the 240 s limit before it reached the second stop sign. Safe in a sim; a hazard in traffic.</>,
          <><b>The sign detector fails outright.</b> Behind the lead car, at night, in rain, the first yield sign is confirmed only 12.2 m before the car reaches it, too late to slow from 40 km/h, and the car passes it at 18–19 km/h: 6/12 yields. That’s effectively one scenario repeated, not six independent results: scenery and the lead car’s gap are fixed by position, so only noise and rain change with the seed, and five of the six laps confirm the sign at the identical 12.21 m.</>,
          <>No phantom signs in any lap: the lead car’s red tail lights never fooled it.</>,
        ]} />
        <Figure src={IMG + 'lateral_error_hard.webp'} alt='Line chart of offset from lane center for the stress lap and the night, rain, lead car and combined laps' caption='Offset from lane center for the stress lap and the four harder conditions. Night, rain and the lead car alone stay within about ±0.4 m; with everything at once the car swings out to 1.00 m, past the line, at the S-bend just after 600 m.' />
      </Block>

      <Block title='Detection range against stopping distance'>
        <p>A sign must be seen in 3 of the last 5 frames to count. Across all 22 camera laps, stop signs are confirmed 24.6–37.4 m ahead. Stopping 3 m short of a sign from 40 km/h at the planned 2.5 m/s² takes about 28 m, so most confirmations leave room; in rain, with everything combined and in one stress lap, some don’t, and the car still stops only because it can brake at 4 m/s² when the plan runs late. Every logged stop, ground truth included, ends with 0.45–0.7 s at that limit.</p>
        <p>Odometry is deliberately imperfect (speed reads 2% high, steering has a 0.2° offset). On the stress lap the worst offset is 0.36 m with perfect odometry, 0.39 m with the default errors and 0.48 m with a 0.5° steering offset, with no departures and every sign handled. The effect isn’t ordered by error size (a 0.2° offset alone gives 0.46 m), so at this level it’s mixed up with how each lap happens to unfold.</p>
      </Block>

      <Block title='What broke along the way'>
        <Bullets items={[
          <><b>The camera couldn’t see far enough.</b> At 320×180 a stop sign became detectable at about 22 m, but stopping 3 m short from 50 km/h at 2.5 m/s² needs about 42 m. I raised the resolution to 640×360 (a clean stop sign is detected from about 40 m) and dropped cruise speed to 40 km/h. A per-image F1 score would never have shown this constraint.</>,
          <><b>The car drove off the road in the stress test.</b> In an S-bend under a shadow the faded yellow line disappeared and the search latched onto the white line, shifting the lane estimate by a whole lane width. Fixes: track yellow and white paint separately, and reject any estimate that jumps further than the car physically could.</>,
          <><b>Parked red cars looked like stop signs.</b> Fill and aspect ratio weren’t enough. Real signs are mounted above the camera, so a sign’s center must be above the horizon.</>,
          <><b>The car rolled through stop signs.</b> A plain P controller on speed lagged a target that kept dropping. A higher gain, and planning the braking curve at 2.5 m/s² while the car can brake at 4, fixed it.</>,
          <><b>With everything at once, the car left the road, twice.</b> First the tracker re-acquired on a garbage fit (a 2.5 m offset and a 22° heading error while the car was 20 cm off-center), because its plausibility gate had switched itself off after four missed frames; worst offset 4.7 m. With the gate made permanent it still failed, more slowly: during dropouts the tracker handed the controller a frozen estimate while the car kept moving. The real fix was predicting the lane forward with odometry. A filter that stops predicting when measurements stop is only half a filter.</>,
        ]} />
      </Block>

      <Block title='How it works'>
        <Steps items={[
          { title: 'Lanes', text: 'paint is pixels bright compared with the rest of their row (so lines inside shadows still count) or yellow; the frame is warped to a top-down view, exact on flat ground, and each line is fitted as y = a·x² + b·x + c, giving offset, heading error and curvature directly.' },
          { title: 'Tracking', text: 'between frames the last estimate is moved with the car’s odometry (the predict step of a Kalman filter); estimates more than 40 cm or 4° from the prediction are rejected, accepted ones are smoothed, and up to 12 missed frames (0.6 s) are coasted.' },
          { title: 'Signs', text: 'red and yellow blobs are tested for fill ratio, convexity, corner count and position above the horizon, confirmed in 3 of 5 frames, ranged from apparent size and then dead-reckoned with the same odometry.' },
          { title: 'Control', text: 'steering is PID on where the lane center will be 8 m ahead plus a curvature feedforward term; speed is capped by lateral acceleration in curves, a braking curve to stop 3 m short of a stop sign, and 15 km/h past a yield sign. If the lane is lost, the wheel is held straight and the car brakes to a stop.' },
          { title: 'Car and evaluation', text: 'a kinematic bicycle model with steering-rate and acceleration limits at 20 Hz; every lap is scored on lateral error, departures, nuisance stops, perception error and sign compliance against the logged ground truth.' },
        ]} />
        <Figure src={IMG + 'lane_pipeline.webp'} alt='Four panels: a camera frame with a shadow across the road, its paint mask, the bird’s-eye warp, and the fitted lane line in the top-down view' caption='The lane pipeline on one stress-condition frame: camera image, paint mask, bird’s-eye warp, and the quadratic fit in the top-down view.' />
        <p className='opacity-80'>Python 3.12, OpenCV for rendering, color masks, contours and the bird’s-eye remap, NumPy for geometry and the vehicle model, pandas for the per-frame logs, matplotlib and imageio for the figures. No learned models, no GPU, no downloads.</p>
      </Block>

      <Block title='Limitations'>
        <Bullets items={[
          'A simple simulator, not real roads. Real perception needs learned models (segmentation for lanes, a detector for signs) trained on diverse labeled video; the controllers and the evaluation harness would carry over to a real stack, the perception front end wouldn’t.',
          'The flat-ground assumption behind the exact bird’s-eye warp breaks on hills. One track, fixed sign colors and shapes, a yellow left line and a known lane width.',
          'The lead car is scenery: no adaptive cruise, no intersections, and no safety case.',
          'With everything combined, the stack loses the lane at one S-bend, stalls for long periods and confirms the first yield sign too late; the repeat laps are close to one scenario repeated.',
          'It must never control a real vehicle.',
        ]} />
      </Block>

      <CodeNote tests={37} extras={['a system card with the tested operating domain and known failure modes']} />
    </CaseStudyPage>
  )
}
