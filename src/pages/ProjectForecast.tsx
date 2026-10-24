import { CaseStudyPage, Block, Stats, Figure, DataTable, Steps, Bullets, CodeNote } from '../components/CaseStudy'

const IMG = '/media/forecast/'

export default function Page() {
  return (
    <CaseStudyPage slug='forecast' lede='A daily forecast for each of the next seven days, for every store and category, plus stock levels that actually hit their service target, tested the way it would be used: retrained every four weeks and scored on forecasts made before the actuals were known.'>

      <Block title='Overview'>
        <p>A retailer that reorders weekly needs, each morning, a forecast for each of the next seven days and a sense of how wrong it might be. A replenishment planner would read the point forecast to see the week ahead and stock to the calibrated 90th or 95th percentile for a 90% or 95% in-stock target.</p>
        <Bullets items={[
          <><b>One global model per horizon:</b> LightGBM across all series for each of horizons 1–7, predicting sales as a ratio to the recent level, with quantile models calibrated by split-conformal prediction.</>,
          <><b>Leakage-safe:</b> features use sales up to the forecast origin only, plus planned promotions, holidays and closing days for the target day. A test scrambles every sale after the origin and checks no feature changes.</>,
          <><b>Rolling-origin backtest:</b> four folds of four weeks over the last 16 weeks of the data, against damped Holt-Winters and two naive baselines.</>,
        ]} />
        <p>The data: 12 simulated series (4 stores × 3 categories, daily, 2023–2025) with a known true mean, so the model is measured against the best any forecast could do; and 14 real series built from the invoices of Online Retail II, an online UK gift retailer whose customers are mostly small shops (Chen, 2019, CC BY 4.0).</p>
      </Block>

      <Block title='Headline numbers'>
        <Stats items={[
          { value: '27.5%', label: 'WAPE on synthetic data (Holt-Winters 29.1%)' },
          { value: '25.9%', label: 'Noise floor: forecasting the true mean' },
          { value: '80.6%', label: 'Coverage of the conformal 80% interval (raw: 74%)' },
          { value: '38.7% vs 38.0%', label: 'Real data: LightGBM vs Holt-Winters WAPE' },
        ]} />
        <p>On simulated data the model closes about three quarters of the gap between a weekday average and the noise floor. On real data it doesn’t beat Holt-Winters, and the page says so.</p>
      </Block>

      <Block title='Synthetic data: close to the noise floor'>
        <Figure src={IMG + 'model_comparison.webp'} alt='Horizontal bar chart of backtest WAPE from 11 September to 31 December 2025: LightGBM 27.5%, LightGBM on a raw target 28.1%, Holt-Winters 29.1%, 4-week weekday average 32.2%, same day last week 38.4%, with a dashed line at the 25.9% noise floor.' caption='Backtest WAPE over all 12 series and horizons 1–7, 11 September to 31 December 2025 (lower is better). The dashed line is the noise floor.' />
        <DataTable head={['Model', 'WAPE', 'Bias']} highlight={0} rows={[
          ['LightGBM, ratio to level, absolute-error loss', '27.5%', '−3.0%'],
          ['LightGBM on raw units', '28.1%', '−7.8%'],
          ['Holt-Winters (damped, weekly)', '29.1%', '+0.7%'],
          ['Weekday average (4 weeks)', '32.2%', '−0.4%'],
          ['Same weekday last week', '38.4%', '+0.2%'],
          ['Noise floor: the generator’s true mean', '25.9%', ''],
        ]} />
        <p>Error is almost flat across horizons 1–7 (27.2–27.6%): most of the signal is weekly and seasonal, and day-to-day noise dominates. The point model is trained on absolute error because WAPE rewards the median, so it runs about 3% low on average; stocking uses the upper quantiles anyway.</p>
      </Block>

      <Block title='What made the difference'>
        <Figure src={IMG + 'bias_by_store.webp'} alt='Horizontal bar chart of forecast bias by store for a raw-units target and a target scaled by recent level. Raw-target bias is about −9.8% for suburb, −7.5% for downtown, −8.8% for campus and about 0% for airport; the scaled target cuts it to about −1.6%, −4.0%, −6.2% and −1.4%.' caption='Forecast bias by store, raw-units target against the target scaled by the recent 28-day level (negative means under-forecast).' />
        <Bullets items={[
          <><b>Predicting a ratio instead of raw units.</b> Tree models can’t extrapolate, so trained on raw units LightGBM under-forecasts any growing series. Predicting sales as a ratio to the recent level and multiplying back took the fastest-growing store (suburb, +22% a year) from −9.8% bias to −1.6%.</>,
          <><b>One global model.</b> Twelve series share one model per horizon, with store and category as features: small series borrow strength from big ones, and a new store doesn’t mean a new model.</>,
          <><b>Planned promotions as inputs.</b> On promotion days the model’s error is 27.4%, against 35.5% for the weekday average, which has no idea a promotion is running.</>,
        ]} />
      </Block>

      <Block title='From forecast to stock level'>
        <p>Stock exactly the point forecast and you sell out on about half of all days. Raw quantile models came out overconfident: the 80% interval covered only 74% of actuals, and stocking to “q90” kept the shelf full on 86% of days, not 90%. So each model holds back its last eight weeks of training data and uses them for split-conformal calibration, widening the quantiles by the right amount. The calibration weeks are never the weeks being scored.</p>
        <Figure src={IMG + 'stocking_tradeoff.webp'} alt='Line chart of days fully in stock against leftover units per 100 sold, for raw quantile models and after conformal calibration. Both start at the point forecast (about 51% in stock, 14 leftover). Raw q90 reaches 86% and raw q95 91%; calibrated q90 reaches about 91% with 55 leftover and calibrated q95 96% with 77 leftover.' caption='Service against waste: days fully in stock against leftover units per 100 sold, stocking to the point forecast, q90 or q95, before and after conformal calibration.' />
        <DataTable head={['Stock to', 'Days fully in stock', 'Demand served', 'Leftover per 100 sold']} rows={[
          ['Point forecast', '51%', '85%', '14'],
          ['90th percentile, raw', '86%', '96%', '44'],
          ['90th percentile, conformal', '91%', '98%', '55'],
          ['95th percentile, raw', '91%', '98%', '59'],
          ['95th percentile, conformal', '96%', '99%', '77'],
        ]} />
        <p>After calibration the 80% interval covers 80.6% of actuals, so a service-level target can be set with the nominal quantile. The cost is visible too: going from 91% to 96% of days in stock takes 22 more leftover units per 100 sold.</p>
      </Block>

      <Block title='Real data: Online Retail II'>
        <p>Fourteen daily series (UK or international, by seven product groups from description keywords), backtested over 16 weeks from 19 August to 8 December 2011, straight into the pre-Christmas peak. The shop doesn’t trade on Saturdays, bank holidays or over Christmas; those days are a known calendar, forecast and stocked at zero. There’s no promotion data.</p>
        <DataTable head={['Model', 'WAPE', 'Bias']} highlight={2} rows={[
          ['LightGBM, trained on absolute error', '38.7%', '−15.2%'],
          ['LightGBM on raw units', '38.1%', '−18.6%'],
          ['Holt-Winters (damped, weekly)', '38.0%', '−11.8%'],
          ['Weekday average', '44.3%', '−8.6%'],
          ['Same weekday last week', '51.4%', '−5.0%'],
          ['LightGBM, first attempt (squared error)', '47.8%', '+0.5%'],
        ]} />
        <Figure src={IMG + 'retail_uk_christmas.webp'} alt='Daily units for the UK Christmas-goods series, late August to early December 2011: actual sales, the LightGBM forecast made 7 days ahead, and its shaded 80% conformal interval. Sales climb from near zero to 3,000–5,000 units a day by November, with zeros on closed days, and the forecast follows the rise with one spike to about 8,000 units falling outside the interval.' caption='Online Retail II, UK Christmas goods: actual daily units, the LightGBM forecast made a week in advance, and its 80% conformal interval.' />
        <Bullets items={[
          'Holt-Winters is as good or better: it wins the first three folds and loses only the four weeks before Christmas. Both beat the weekday average in every fold. On these series a well-specified classical model is the one to beat.',
          'The median runs low here (bias −15%): on spiky demand from shops ordering stock the median sits well below the mean. Fine for WAPE and stocking, wrong for planning total volume.',
          'The ratio-to-level trick doesn’t help (38.1% on raw units): these series are seasonal but have no steady growth trend.',
          'International series are much harder: 65–78% WAPE per series, against 30–37% in the UK.',
          'Calibration works once closed days are left out of it: on trading days the 80% interval covers 81.0% of actuals (raw 68.5%), and conformal q90 and q95 keep the shelf full on 90.5% and 96.0% of trading days. Counting closed days would flatter coverage to 83.9%.',
        ]} />
      </Block>

      <Block title='What broke: the first real-data attempt'>
        <p>Trained on squared error, LightGBM scored 47.8% on the real data, worse than the weekday average. Single large orders from shops put huge spikes in these series; a squared-error model chases them, while WAPE rewards the median. Training on absolute error fixed it. I changed the loss after seeing the backtest, so the honest claim is the reasoning (match the loss to the metric), backed by the synthetic data where it also helps slightly (27.5% against 27.6%), not a tuned number.</p>
        <p>The invoices had a trap of their own: the workbook’s two sheets overlap on 1–9 December 2010 (22,844 repeated lines), which without de-duplication looks like a pre-Christmas spike.</p>
      </Block>

      <Block title='How it works'>
        <Steps items={[
          { title: 'Series', text: 'simulated store/category sales with a known true mean, Online Retail II invoices turned into daily units with cancellations netted, or your own CSV.' },
          { title: 'Features', text: 'for each horizon 1–7: recent level and volatility, same-weekday lags, store, category, calendar, and the planned promotion, holiday and closed flags for the target day.' },
          { title: 'Models', text: 'one LightGBM point model (absolute error) and quantile models (10th, 50th, 90th, 95th) per horizon, with split-conformal calibration on held-back weeks.' },
          { title: 'Backtest', text: 'four folds of four weeks, retrained at each fold’s first origin, against damped Holt-Winters refitted per fold and two naive baselines.' },
          { title: 'Decision', text: 'quantiles turned into stock levels and scored as days in stock, demand served and leftover stock; then final models forecast the next week from an optional promotion plan and trading calendar.' },
        ]} />
        <p className='opacity-80'>Python 3.12, LightGBM, statsmodels for the Holt-Winters baseline, pandas and joblib; 46 tests, including the leakage scramble and conformal coverage on unseen weeks.</p>
      </Block>

      <Block title='Limitations'>
        <Bullets items={[
          'On the real data LightGBM doesn’t beat Holt-Winters overall; an ensemble of the two, scored on the same folds, is the next step.',
          'The point forecast is a median, so it runs low on skewed demand (−3% synthetic, −15% real). Volume planning needs a separate mean model.',
          'No price, weather or stock-out data. A day with zero stock records demand as zero, and the model learns that.',
          'The stocking table treats each day separately; a real replenishment policy plans over the lead time, including shelf life.',
          'The loss was switched after seeing the first real-data backtest, so the real-data number is slightly optimistic until confirmed on a later, untouched period.',
          'One calendar is shared by all series, so a single store closing on its own can’t be expressed.',
        ]} />
      </Block>

      <CodeNote tests={46} extras={['a model card', 'a next-week forecast script that takes a promotion plan and trading calendar']} />
    </CaseStudyPage>
  )
}
