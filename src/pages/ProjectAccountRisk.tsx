import { CaseStudyPage, Block, Stats, Figure, DataTable, Steps, Bullets, DashboardLink, CodeNote } from '../components/CaseStudy'

const IMG = '/media/account-risk/'

export default function Page() {
  return (
    <CaseStudyPage slug='account-risk' lede='One agreed definition of an at-risk account, written once and traced to tests, then checked against 453 past renewals: the agreed rule caught 14% of the ARR that later churned, and moving one threshold catches 48%.'
      summary={{
        problem: 'Pick the accounts Customer Success should call before renewal, and find out whether the at-risk rule stakeholders agreed on actually catches churn.',
        approach: 'Requirements traced to tests, checks on five CRM extracts, and one rule shared by the worklist, the dashboard and a backtest against 453 past renewals.',
        result: 'The agreed 30-day rule caught 14% of churned ARR; a 14-day threshold catches 48%, against 21% for random flagging at the same volume.',
        decision: 'Whether to approve change request CR-01 (14 days instead of 30), and which accounts go on this week’s call list.',
        stack: ['Python', 'pandas', 'NumPy', 'scikit-learn', 'matplotlib', 'offline HTML dashboard'],
        data: {
          synthetic: '900 accounts across five CRM extracts, with 453 past renewal outcomes and a deliberately dirty current book.',
          real: 'none; the stakeholders and sign-offs are illustrative too.',
        },
      }}>

      <Block title='Overview'>
        <p>A B2B software company wants Customer Success to stop being surprised by churn at renewal time. Which accounts should account managers call this week, and is the rule that picks them any good? Four groups use the answer:</p>
        <Bullets items={[
          <><b>CS leadership:</b> how much revenue is exposed, and where (KPI tiles, risk by tier, renewal schedule).</>,
          <><b>Account managers:</b> which accounts to call and what to say (a worklist by priority and ARR, with the reason for each flag).</>,
          <><b>Renewals team:</b> what’s coming up and how risky it is (monthly schedule with at-risk ARR).</>,
          <><b>Data steward:</b> which CRM records are broken (a data-review list naming each problem).</>,
        ]} />
        <p>The pipeline reads five CRM extracts (accounts, activity, tickets, CSAT, contacts) and checks them: a broken file stops the run with a one-line message, while a broken record goes to data review but is still scored, because a broken record is often the riskiest one. It then applies the agreed rule: <b>at risk</b> = inactive 30+ days <i>and</i> a warning sign (2+ open tickets, CSAT below 6, or the champion has left); <b>priority</b> = at risk and renewing within 90 days. Finally it backtests the rule against past renewals and tests a proposed change, CR-01: 14 days instead of 30.</p>
        <p className='opacity-70 text-xs'>All data is synthetic: 900 accounts with a hidden health score that drives activity, tickets, CSAT, champion turnover, seat use and churn, which the rule never sees. A 1 July 2025 snapshot has the outcome of every renewal in the next six months (453 renewals, 70 churned); the 1 January 2026 book is deliberately dirty, the way real CRM exports are. The stakeholders and sign-offs are illustrative.</p>
      </Block>

      <Block title='Headline numbers'>
        <Stats items={[
          { value: '14%', label: 'Churned ARR caught by the agreed 30-day rule' },
          { value: '48%', label: 'Caught with 14 days instead (CR-01)' },
          { value: '21%', label: 'Caught by random flagging at the same volume' },
          { value: '+19 to +51', label: 'Points more churned ARR caught (95% interval)' },
        ]} />
        <p>The improvement is clear, but its size isn’t: with 70 churners every percentage is loose, and 14 days was picked by looking at this same history.</p>
      </Block>

      <Block title='Backtest of the proposed change'>
        <p>The agreed rule is precise but far too narrow. On the renewals from July to December 2025 it flags only 6% of accounts:</p>
        <DataTable head={['Rule', 'Flagged', 'Precision', 'Churners caught', 'Churned ARR caught']} highlight={1} rows={[
          ['Current (30 days)', '6%', '39%', '16%', '14%'],
          ['Proposed (14 days)', '21%', '34%', '46%', '48%'],
          ['Logistic health score, same volume', '21%', '36%', '49%', '46%'],
          ['Random, same volume', '21%', '', '', '21%'],
        ]} />
        <p>The 14-day rule flags 21% of renewing accounts, slightly over the 20% CS says it can work, and a third of flagged accounts really did churn, against a 15% base rate. Three honest caveats:</p>
        <Bullets items={[
          'It flags every account the 30-day rule does and more, so of course it catches more. The fair test is chance at the same volume: flagging 21% of renewals at random catches about 21% of churned ARR (95% range 9–36%). Per flagged account it’s no more precise than the current rule (34% vs. 39%; the difference is −20 to +10 points with 95% confidence).',
          'With only 70 churners every percentage is loose. Resampling the renewals 2,000 times gives 4–27% for the current rule and 31–65% for the proposed one.',
          '14 days was chosen on this same history, so 48% is an in-sample number. It’s one threshold moved, not a search over hundreds of combinations, but the real test is the next two quarters of renewals.',
        ]} />
        <Figure src={IMG + 'rule_tradeoff.webp'} alt='Scatter of churned ARR caught against share of renewing accounts flagged for 288 rule variants, with the current rule, proposed rule and logistic score highlighted and a dashed line for random flagging' caption='Share of renewing accounts flagged against share of churned ARR caught, July–December 2025 renewals. Gray dots are the 288 rule variants tried; the current rule sits at 6% flagged and 14% caught, the proposed rule at 21% and 48%, and the logistic score at 21% and 46%. The dashed diagonal is flagging at random.' />
      </Block>

      <Block title='The book today'>
        <p>On the current book (830 accounts, $22.3M ARR, as of 1 January 2026) the approved rule flags <b>58 accounts</b> ($1.60M ARR), <b>16</b> of them priority ($330k renewing within 90 days), and <b>32 accounts</b> go to the data-review list. CR-01 would add 119 accounts to the worklist (58 → 177). Of the flagged accounts, 43 have 2+ open tickets, 32 a CSAT below 6 and 17 a departed champion (an account can have several).</p>
        <DataTable head={['Tier', 'Accounts', 'At risk', 'Risk rate', 'ARR at risk']} rows={[
          ['SMB', 454, 31, '6.8%', '$299,600'],
          ['Mid-Market', 282, 19, '6.7%', '$574,400'],
          ['Enterprise', 94, 8, '8.5%', '$721,100'],
        ]} />
        <p>The extract carries the problems real exports do: 14 missing activity dates, 4 missing renewal dates, 6 unknown champion statuses, 3 impossible CSAT scores, 2 negative ARR values and 3 duplicate activity rows. The checks find all of them.</p>
        <Figure src={IMG + 'dashboard_preview.webp'} alt='Screenshot of the account health dashboard: KPI tiles, the proposed-change callout, risk by tier, warning signs and the start of the renewal schedule' caption='The top of the dashboard: KPI tiles, the CR-01 callout, risk by tier (count and ARR), the warning signs behind each flag, and the start of the renewal schedule.' />
        <DashboardLink href='/dashboards/account-health.html' label='Open the account health dashboard' note='One offline file from the committed run: KPIs, risk by tier, renewal schedule, the worklist with filters and the data-review list, with a toggle to see which accounts the proposed rule would add.' />
      </Block>

      <Block title='Requirements, traced to tests'>
        <p>Every requirement has an ID and at least one test named after it: 11 requirements, 13 tests named <code>test_req01_…</code> to <code>test_req11_…</code>. A few that shaped the design:</p>
        <Bullets items={[
          <><b>REQ-02:</b> inactivity on its own never flags an account (healthy accounts go quiet over holidays).</>,
          <><b>REQ-03:</b> a missing CSAT means “unknown”, not “unhappy”; about 12% of accounts never answer the survey.</>,
          <><b>REQ-06:</b> data problems never silently remove an account; it’s scored and also listed for review, with the problem named.</>,
          <><b>REQ-09:</b> ARR at risk counts each account once, even when several warning signs apply.</>,
          <><b>REQ-11:</b> before any change, the rule must catch more churned ARR at past renewals than flagging the same share at random.</>,
        ]} />
        <p>The rule is written once and used for the worklist, the dashboard and the backtest, so they can’t disagree.</p>
      </Block>

      <Block title='What the search and the model taught'>
        <Bullets items={[
          <><b>The best-looking variant was overfitting.</b> Held to the 14-day rule’s volume, the best of 288 variants caught 50% of churned ARR. Repeating the search 50 times on a random half of the renewals and scoring the winner on the other half: 54% where it was picked, 41% where it wasn’t. The 14-day rule averaged 46% on the same held-out halves and did at least as well in 88% of splits.</>,
          <><b>A logistic health score did no better.</b> Cross-validated on the same signals it catches 46% at the same volume, against 48%, well within the noise of 70 churners, and it’s much harder to explain.</>,
          <><b>But the model found what the rule misses.</b> Seat utilization is the strongest churn signal, and the rule doesn’t use it at all. That became the next change request, CR-02, once Product and CS agree what an “active seat” is.</>,
        ]} />
      </Block>

      <Block title='How it works'>
        <Steps items={[
          { title: 'Read', text: 'five CSVs, either the bundled synthetic extract or your own; ISO dates (with time zones converted to UTC), numbers with currency signs, and the common spellings of yes/no are understood.' },
          { title: 'Check', text: 'shape problems (a missing file or column, a non-integer account id) stop the run with one line; record problems (missing dates, impossible values, unknown tiers) go to the data-review list.' },
          { title: 'Score', text: 'the at-risk and priority rule, written once, with the reason for each flag in plain words.' },
          { title: 'Backtest', text: 'the rule against renewal outcomes, with a random baseline at the same volume, 2,000 bootstrap resamples, a 288-variant grid with a split-half overfitting check, and a cross-validated logistic score.' },
          { title: 'Report', text: 'the worklist, renewal schedule, data-review list, metrics and a one-file dashboard whose text follows the numbers.' },
        ]} />
        <p className='opacity-80'>Python 3.12, pandas and NumPy for the pipeline and bootstrap, scikit-learn for the logistic score, matplotlib for the chart; the dashboard is a single offline HTML page with the data embedded.</p>
      </Block>

      <Block title='Limitations'>
        <Bullets items={[
          'One backtest window with 70 churners: the improvement is clear (19 to 51 points more churned ARR caught, 95% interval), its size isn’t. The backtest should be re-run every quarter.',
          'A single snapshot per account. In practice you’d score weekly and ask whether the account was flagged at any point in the 90 days before renewal.',
          'No save-play effect: if CS saves flagged accounts, the rule will look worse in future backtests than it really is. A small hold-out group would measure that.',
          'The backtest always runs on the synthetic history; your own extract can be scored but not validated until past renewal outcomes are added as a sixth file.',
          'CS capacity (20% of renewing accounts) is a fixed constant from one conversation, and should become a parameter.',
        ]} />
      </Block>

      <CodeNote tests={45} extras={['REQUIREMENTS.md with each requirement traced to its tests', 'the offline dashboard']} />
    </CaseStudyPage>
  )
}
