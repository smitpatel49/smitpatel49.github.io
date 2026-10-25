import { CaseStudyPage, Block, Stats, Figure, DataTable, Steps, Bullets, CodeNote } from '../components/CaseStudy'

const IMG = '/media/mna/'

export default function Page() {
  return (
    <CaseStudyPage slug='mna' lede='A deal screen that keeps what the board decides (the financing mix) apart from what nobody controls (premium, synergies, rates, growth), then asks the question EPS can’t answer: is the price below what the target is worth to us?'
      summary={{
        problem: 'A board weighing a roughly $660M acquisition wants to know whether it dilutes EPS, how to pay for it and the most it should pay.',
        approach: '20,000 Monte Carlo draws of EPS accretion across 66 financing mixes under cash and leverage limits, then a DCF of the target and its synergies.',
        result: 'Walk-away premium of 20% against an expected 38%: accretive by year 3 in 93% of simulations, value-creating in only 5%.',
        decision: 'Whether to bid, how to finance the deal, and the premium at which to walk away.',
        stack: ['Python', 'NumPy', 'pandas', 'matplotlib'],
        data: {
          synthetic: 'a fictional mid-cap acquirer and target, with ranges for every uncertain input.',
          real: 'none; the companies are made up, so it’s no claim about a real deal.',
        },
      }}>

      <Block title='Overview'>
        <p>The board’s first question about an acquisition is usually “will this dilute our earnings per share, and for how long?” On its own that’s the wrong decision rule: EPS can rise while the price destroys value. This screen answers three questions from one set of assumptions, for a fictional mid-cap buying a smaller competitor for about $660M:</p>
        <Bullets items={[
          <><b>Accretion:</b> what happens to EPS in years 1–3, and how likely is it to be accretive?</>,
          <><b>Financing:</b> which mix of cash, new debt and new shares fits the cash and leverage limits, and how does each change the EPS picture?</>,
          <><b>Value:</b> is the price below what the target is worth to us, and what’s the highest premium with a positive NPV?</>,
        ]} />
        <p className='opacity-70 text-xs'>The companies are made up, so the screen can’t be read as a claim about a real deal. Every number on this page is an output of the committed run (20,000 draws, seed 11).</p>
      </Block>

      <Block title='Headline numbers'>
        <Stats items={[
          { value: '93%', label: 'Accretive by year 3 (proposed mix)' },
          { value: '5%', label: 'Simulations with a positive NPV' },
          { value: '−$93M', label: 'Median NPV at the expected price' },
          { value: '20%', label: 'Walk-away premium (expected: 38%)' },
        ]} />
        <p>The deal looks good on EPS and bad on value. The memo the model writes leads with that disagreement and explains it.</p>
      </Block>

      <Block title='Accretion isn’t value'>
        <Figure src={IMG + 'value_vs_eps.webp'} alt='Line chart of the share of simulations that are EPS-accretive in year 3, accretive in year 2, or create value (NPV above zero), by premium paid from 0% to 60% over the target’s market value, for the 20% cash / 40% debt / 40% stock mix. Year-3 accretion stays near 100% up to about a 35% premium and is still 53% at 60%; year-2 accretion falls from 85% at a 20% premium to 22% at the expected 38%; value creation falls from 98% with no premium to 47% at the 20% walk-away premium and under 1% at 38%.' caption='Share of simulations that are accretive (years 2 and 3) or create value, by premium paid. Accretion survives far higher premiums than value does.' />
        <p>The target’s standalone DCF is $498M of enterprise value, 4% under its market value, so the screen doesn’t find value by assuming the market is wrong. At median inputs, adding synergies ($139M of present value) and subtracting integration costs ($13M) and fees ($10M) makes it worth $614M to us, against $701M paid (equity plus the debt taken on): <b>NPV −$87M</b>. Across the simulations the median NPV is −$93M, positive in only 5%.</p>
        <p><b>Walk-away premium: 20%</b> at median inputs, 27% if synergies come in at their 90th percentile, 31% if they’re discounted at the WACC instead of WACC + 2 points. Synergies are assumed to keep growing after year 3 with no reinvestment; charging them the same reinvestment as the target’s own DCF cuts the walk-away premium to 15%.</p>
      </Block>

      <Block title='Why EPS and value disagree'>
        <p>Not because the target is cheap. At the expected 38% premium its earnings are bought at 20.6× against the acquirer’s own 18×, and the price is above the acquirer’s multiple at any premium over 20%. Paid entirely in stock, the deal is accretive by year 3 in only 32% of simulations; the proposed mix without synergies in 8%, against 93% with them.</p>
        <p>The accretion comes from the synergies, plus paying partly with debt and cash that cost less after tax (about 5.1% and 2.6%) than the acquirer’s 5.6% earnings yield. That flatters EPS at almost any price, which is why EPS alone is a poor decision rule.</p>
      </Block>

      <Block title='Financing: which mixes fit, and what they do'>
        <Figure src={IMG + 'financing_heatmap.webp'} alt='Heatmap of year-2 accretion probability by cash, debt and stock share, with infeasible mixes marked' />
        <p>Each of 66 financing mixes is evaluated against the <i>same</i> 20,000 draws, so differences between structures are the structure, not noise. Tested at a cautious price (the 90th-percentile premium) with fees paid from cash, <b>24 of 66</b> fit the cash and 3.0× leverage limits. The best, 20% cash / 60% debt / 20% stock, has a <b>42%</b> chance of year-2 accretion (the proposed 20/40/40: 27%) and breaks even with $15.9M of run-rate synergies instead of $18.6M. The memo is explicit that this is an accounting effect that adds risk.</p>
      </Block>

      <Block title='What moves the answer'>
        <div className='grid grid-cols-1 gap-3'>
          <Figure src={IMG + 'eps_by_year.webp'} alt='Distribution of EPS accretion in years 1, 2 and 3' caption='Year 1 dilutes in every draw; synergies phase in by year 3.' />
          <Figure src={IMG + 'tornado.webp'} alt='Tornado chart of year-2 EPS sensitivity' caption='10th to 90th percentile of each input, the others at their medians.' />
        </div>
        <p>The premium matters most: moving it from its 10th to 90th percentile swings year-2 EPS by 4.2 points, more than synergy delivery or target growth (3.0 each) or interest rates (2.3). Each scenario below changes one thing and reuses the base draws (year 2):</p>
        <DataTable head={['Scenario', 'P(accretive)', 'Median', '5th pct']} highlight={0} rows={[
          ['Base (20% cash / 40% debt / 40% stock)', '27%', '−1.6%', '−5.6%'],
          ['Pay 10 points more', '7%', '−3.5%', '−7.5%'],
          ['Synergies at half plan', '4%', '−3.6%', '−7.3%'],
          ['Rates up 200 bp', '4%', '−4.3%', '−8.5%'],
          ['Target earnings flat', '12%', '−2.6%', '−6.3%'],
          ['All-stock deal', '0%', '−5.8%', '−9.2%'],
        ]} />
      </Block>

      <Block title='How it works'>
        <Steps items={[
          { title: 'Inputs', text: 'deal.json holds the two companies, the financing limits and triangular ranges for every uncertain input; synergies are skewed below plan, because most deals under-deliver.' },
          { title: 'Simulation', text: '20,000 draws of premium, synergy realization, integration overrun, debt rate and target growth, shared by every financing mix.' },
          { title: 'EPS bridge', text: 'pro forma EPS for years 1–3: new shares at an issue discount, after-tax interest, interest lost on cash and fees, amortization of acquired intangibles.' },
          { title: 'Financing grid', text: '66 mixes on a 10% grid, each checked for cash and leverage at the 90th-percentile price, with breakeven synergies solved exactly.' },
          { title: 'Value', text: 'a value-driver DCF (growth paid for with reinvestment), synergies discounted at WACC + 2 points, NPV against the full price, and the walk-away premium solved in closed form.' },
          { title: 'Memo', text: 'a generated decision memo whose wording comes from the inputs and results, plus four charts.' },
        ]} />
        <p className='opacity-80'>Python 3.12, NumPy and pandas for the simulation, matplotlib for the charts; 66 tests check the arithmetic against hand calculations and closed forms.</p>
      </Block>

      <Block title='Limitations'>
        <Bullets items={[
          'A screen, not a full valuation: one WACC, a value-driver DCF, no balance sheet. The answer depends most on the synergy assumptions and discount rates, which live in deal.json so they can be argued about.',
          'No credit analysis beyond the leverage cap, and no view on whether the acquirer’s own stock is fairly priced, which changes how expensive paying in shares really is.',
          'The probabilities describe the assumed ranges, not the real world, and the inputs are drawn independently (in practice a high premium and strong target growth go together).',
        ]} />
      </Block>

      <CodeNote tests={66} extras={['a generated decision memo']} />
    </CaseStudyPage>
  )
}
