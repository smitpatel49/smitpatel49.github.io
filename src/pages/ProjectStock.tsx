import { CaseStudyPage, Block, Stats, Figure, DataTable, Steps, Bullets, CodeNote } from '../components/CaseStudy'

const IMG = '/media/stock/'

export default function Page() {
  return (
    <CaseStudyPage slug='stock' lede='Resampling past returns understates next quarter’s tail risk, because markets switch between calm and stressed regimes that last for weeks. This measures by how much, against a known truth, and then on ten years of the S&P 500.'
      summary={{
        problem: 'Decide whether to keep holding a stock next quarter under a −12% VaR95 budget, and how far to trust that VaR.',
        approach: 'A hand-written two-state Student-t HMM drives a regime-aware simulation, checked against bootstraps and the true process; 1-day VaR backtested four ways.',
        result: 'Over 40 synthetic histories, regime-aware VaR95 is 0.4 points too optimistic on average, against 1.4 points for the plain bootstrap.',
        decision: 'Hold or reduce next quarter, and when to re-run that call: whenever the market changes regime.',
        stack: ['Python', 'NumPy', 'SciPy', 'arch', 'matplotlib'],
        data: {
          synthetic: '1,500 days with known regimes, plus 40 histories for the method study.',
          real: 'FRED’s S&P 500 index, 2016–2026 (derived quantities only).',
        },
      }}>

      <Block title='Overview'>
        <p>A portfolio manager holds a single stock and has agreed a rule in advance: <b>keep it if the median return over the next quarter (63 trading days) beats +3% and the 95% value-at-risk is no worse than −12%</b>. VaR95 is the 5th-percentile return. The rule is simple; the hard part is the distribution it’s applied to, and how far to trust the number.</p>
        <Bullets items={[
          <><b>Find the regimes:</b> a two-state hidden Markov model with Student-t returns in each state, fitted by EM in about 100 lines of NumPy, estimates how volatile each regime is, how long it lasts and which one the market is in today.</>,
          <><b>Simulate the quarter six ways:</b> plain and block bootstrap, a regime-aware bootstrap from today’s state (and from a calm or stressed start), and the fitted model simulated directly. 20,000 paths each.</>,
          <><b>Backtest 1-day VaR four ways:</b> historical, EWMA, GARCH(1,1) and the regime model, each using only data available at the time, scored with the Kupiec and Christoffersen tests.</>,
        ]} />
        <p>The main history is synthetic (1,500 trading days with known regimes and Student-t shocks), so every answer is compared with the process that really generated it, simulated from the regime it’s really in today. The real data is FRED’s S&amp;P 500 price index, 2016-10-04 to 2026-10-02. That series is copyrighted, so this page shows only derived quantities, never index levels or daily returns.</p>
      </Block>

      <Block title='Headline numbers'>
        <Stats items={[
          { value: '−12.0%', label: 'Regime-aware VaR95 against a −12% budget (MC interval −12.4% to −11.6%)' },
          { value: '−13.3%', label: 'VaR95 of the true process: the right call is reduce' },
          { value: '+0.4 vs +1.4 pts', label: 'Average VaR95 optimism over 40 histories: regime-aware vs bootstrap' },
          { value: '−19.3%', label: 'S&P 500 VaR95 from a stressed start (calm today: −10.3%)' },
        ]} />
        <p>A plain bootstrap says hold comfortably; the regime-aware simulation lands on the budget, a coin toss; the truth says reduce. The regime model closes most of the gap, not all of it.</p>
      </Block>

      <Block title='Next quarter: hold or reduce?'>
        <Figure src={IMG + 'method_comparison.webp'} alt='Horizontal bar chart of 63-day VaR95 and CVaR95 for the six simulation methods and the true process, with a dashed line at the −12% risk budget. The independent bootstrap has the mildest tail (VaR95 about −10.8%); the regime-aware simulations sit around −12%; starting stressed reaches about −17% VaR95 and −22% CVaR95; the true process, drawn hatched, is at about −13.3% VaR95 and −18.7% CVaR95.' caption='63-day VaR95 and CVaR95 (the average beyond VaR) by simulation method, on the synthetic history. The hatched bars are the true process; the dashed line is the −12% risk budget.' />
        <DataTable head={['Next quarter', 'Median', 'VaR95', 'CVaR95', 'Hold?']} highlight={6} rows={[
          ['Bootstrap, days drawn independently', '+3.3%', '−10.8%', '−14.2%', 'yes'],
          ['Block bootstrap (10-day blocks)', '+3.7%', '−11.8%', '−15.8%', 'yes'],
          ['Regime-aware (resampled days), from today’s state', '+4.3%', '−12.0%', '−17.1%', 'yes, by 0.04 pts'],
          ['Fitted HMM simulated directly', '+4.4%', '−11.8%', '−16.8%', 'yes'],
          ['Regime-aware, if starting calm', '+4.5%', '−11.8%', '−16.9%', 'yes'],
          ['Regime-aware, if starting stressed', '+1.5%', '−17.1%', '−22.3%', 'no'],
          ['True process, from today’s true state', '+2.4%', '−13.3%', '−18.7%', 'no'],
        ]} />
        <p>Bootstraps shuffle past days (or 10-day chunks), which breaks stressed spells into pieces, so the simulated quarter almost never contains the long run of bad days that produces a −15% quarter. The regime-aware simulation keeps that structure: it simulates which regime each future day is in, starting from today’s estimated state, then draws that day’s return from past days weighted by the model’s probability that they were in that regime.</p>
        <p>The remaining gap comes from this particular history: its 21 stressed spells averaged 10 days against the generator’s 17, and its calm days drifted up faster than the generator’s. To separate luck from bias, the comparison is repeated on 40 independent synthetic histories (a positive error means the method says the quarter is safer than it is):</p>
        <DataTable head={['Method', 'VaR95 error, average', 'VaR95 RMSE', 'CVaR95 error, average']} rows={[
          ['Bootstrap, days drawn independently', '+1.4 pts', '3.3 pts', '+3.2 pts'],
          ['Block bootstrap', '+1.0 pts', '3.5 pts', '+2.2 pts'],
          ['Regime-aware (resampled days)', '+0.4 pts', '3.3 pts', '+0.6 pts'],
          ['Fitted HMM simulated directly', '+0.1 pts', '3.1 pts', '+0.1 pts'],
        ]} />
        <p>The bootstraps are biased toward optimism, most of all beyond VaR; the regime methods are close to unbiased. But for every method the error from having only six years of history (about 3 points of VaR95) is bigger than the differences between methods, so a VaR this close to the budget should be read as “near the limit”, not as a pass.</p>
      </Block>

      <Block title='The regime model'>
        <Figure src={IMG + 'regimes.webp'} alt='Two panels for the synthetic history, 2020 to 2025. Top: the synthetic price with shaded spans where the model says the market is stressed. Bottom: the smoothed probability of the stressed regime, which rises to near 1 over gray bands marking the days the generator was actually stressed.' caption='Synthetic history. Top: simulated price with the spans the model labels stressed. Bottom: smoothed probability of the stressed regime against the generator’s true stressed days (gray).' />
        <DataTable head={['Parameters', 'Calm vol', 'Stressed vol', 'Stay calm', 'Stay stressed']} rows={[
          ['True', '0.80%', '2.20%', '0.985', '0.94'],
          ['Estimated', '0.81%', '2.11%', '0.982', '0.89'],
        ]} />
        <p>It labels 95% of days correctly. Today’s state, where every simulation starts, and every day of the VaR backtest come from the forward filter, which only sees data up to that day; tests check that changing later returns changes nothing earlier. Each state’s Student-t has 5 degrees of freedom, and refitting with 3 to 30 shows the likelihood peaks at 5 on both the synthetic history and the S&amp;P 500.</p>
      </Block>

      <Block title='Backtesting 1-day VaR'>
        <Figure src={IMG + 'var_backtest.webp'} alt='Synthetic history, last 500 days: gray bars of daily returns with four 1-day 95% VaR lines (historical, EWMA, GARCH and regime HMM) below them, and dots marking the days the regime VaR was breached.' caption='Synthetic history, last 500 days: 1-day 95% VaR from each method against the next day’s return (gray bars), with breaches of the regime VaR marked.' />
        <p>A 95% VaR should be breached on about 5% of days (Kupiec test), and a breach today shouldn’t make one tomorrow more likely (Christoffersen independence test). Over the last 1,250 synthetic days:</p>
        <DataTable head={['Method', 'Breach rate', 'Kupiec p', 'Breach after breach', 'Independence p']} rows={[
          ['Historical, 250-day window', '5.4%', '0.48', '16%', '0.00'],
          ['EWMA (λ = 0.94)', '4.6%', '0.55', '10%', '0.06'],
          ['GARCH(1,1), Student-t', '5.1%', '0.85', '11%', '0.06'],
          ['Regime HMM', '4.7%', '0.65', '12%', '0.02'],
        ]} />
        <p>All four get the overall rate right. Historical VaR fails badly on clustering. The regime model is better but still fails at the 5% level: it only recognizes a new stressed spell after a few bad days, and those first days are where breaches bunch up. GARCH passes both tests with the smallest average VaR. The regime model is better at “what does the next quarter look like” than “what happens tomorrow”.</p>
      </Block>

      <Block title='Real data: the S&P 500'>
        <Figure src={IMG + 'sp500_regimes.webp'} alt='Two panels for the S&P 500, late 2016 to 2026. Top: 21-day realized volatility in percent a year, with shaded stressed spans in early 2018, late 2018, 2019, 2020 (where volatility spikes to about 95%), late 2021 to early 2023, 2024 and April 2025 (about 50%). Bottom: the smoothed probability of the stressed regime.' caption='S&P 500: 21-day realized volatility (annualized) with the spans the model labels stressed, and the smoothed stressed-regime probability. No index levels are shown.' />
        <p>Calm days have 0.66% daily volatility and stressed days 1.71%. Both regimes are very persistent (0.990 and 0.977 chance of staying), so stressed spells last about 44 trading days on average. The market is calm today (2% chance of a stressed day tomorrow), so every method says hold: regime-aware median +5.6%, VaR95 −10.3%. Started from a stressed market, the same simulation gives median +0.8% and VaR95 −19.3%, so a rule like this should be re-run when the regime changes, not once a quarter.</p>
        <DataTable head={['1-day VaR, 2,263 days', 'Breach rate', 'Kupiec p', 'Breach after breach', 'Independence p']} highlight={1} rows={[
          ['Historical, 250-day window', '5.5%', '0.30', '17%', '0.00'],
          ['EWMA', '5.7%', '0.13', '8%', '0.32'],
          ['GARCH(1,1), Student-t', '7.8%', '0.00', '10%', '0.24'],
          ['Regime HMM', '6.9%', '0.00', '12%', '0.02'],
        ]} />
        <p>The ranking flips. GARCH, the best method on synthetic data, breaches on 7.8% of days, and EWMA, the simplest, is the only method that passes both tests. Real index returns are skewed to the left (skewness −0.37), which a symmetric Student-t can’t capture. Model rankings from synthetic data don’t transfer automatically, which is the reason to run on real data at all.</p>
      </Block>

      <Block title='What broke along the way'>
        <Bullets items={[
          <><b>Gaussian states.</b> My first version read every big move in a calm market as a one-day trip into the stressed state, and estimated stressed spells of about 3 days instead of the true ~17. Student-t states fixed it: stressed persistence went from 0.67 to 0.89 (true 0.94) and labeling accuracy from 91% to 95%.</>,
          <><b>Most-likely labels.</b> Giving each past day only to its most likely regime inflated the simulated volatility by 13–61% in five of six test samples with no regimes at all, and left the stressed pool empty in the sixth. Weighting days by regime probability fixed it, and there are tests for it.</>,
          <><b>GARCH on the real index.</b> Breaching 7.8% of days looked like a bug, but its forecasts match the arch package’s exactly. A fat-tailed t has a thinner 5% quantile than a normal (−1.57σ against −1.64σ), and the fitted mean nudges VaR up; a skewed-t is the next thing to try.</>,
        ]} />
      </Block>

      <Block title='How it works'>
        <Steps items={[
          { title: 'History', text: 'a synthetic two-regime history with a known future, FRED’s S&P 500 file, or your own price CSV, with at least 500 daily returns.' },
          { title: 'Regimes', text: 'a two-state Student-t HMM fitted by EM, a forward filter for today’s state with no look-ahead, and a smoother for the resampling weights.' },
          { title: 'Next quarter', text: 'six simulation methods over 63 trading days, each summarized as median, VaR95, CVaR95 and drawdown, with a Monte Carlo interval on VaR and the hold-or-reduce call.' },
          { title: 'Backtest', text: 'rolling 1-day VaR from four methods, refitted on an expanding window, scored with Kupiec and Christoffersen tests.' },
          { title: 'Method study', text: 'the simulation methods on 40 synthetic histories, each scored against the true process.' },
        ]} />
        <p className='opacity-80'>Python 3.12; the HMM is plain NumPy with no HMM library, SciPy for distributions and tests, the arch package for the GARCH baseline, matplotlib for the charts.</p>
      </Block>

      <Block title='Limitations'>
        <Bullets items={[
          'Two regimes is a simplification; real markets have more states and slowly changing volatility.',
          'The regime pools are only as good as the history: a crisis worse than anything in the data can’t be simulated by resampling it. Stress scenarios complement this; they aren’t replaced by it.',
          'The Student-t states are symmetric with degrees of freedom fixed at 5. On the S&P 500 that makes the direct simulation too optimistic and the 1-day HMM and GARCH VaRs breach too often.',
          'One history can’t settle a VaR this close to the budget: the error from six years of data is larger than the differences between methods.',
          'One asset, no transaction costs, no position sizing. The decision rule is illustrative, and this isn’t investment advice.',
        ]} />
      </Block>

      <CodeNote tests={57} extras={['a 40-history method study', 'a one-page risk report']} />
    </CaseStudyPage>
  )
}
