import { CaseStudyPage, Block, Stats, Figure, DataTable, Steps, Bullets, DashboardLink, CodeNote } from '../components/CaseStudy'

const IMG = '/media/analytics/'

export default function Page() {
  return (
    <CaseStudyPage slug='analytics' lede='Two questions a growth team asks every month, “do new customers come back?” and “where do shoppers drop out?”, answered in SQL, checked twice over, and rerun on a real retailer’s invoices.'>

      <Block title='Overview'>
        <p>The two questions sound alike but need different denominators. Retention is a cohort question, counted per customer; drop-off is a funnel question, counted per session. The answers feed two decisions: how much each acquisition channel can cost per customer before it loses money, and whether a product change (here a mobile checkout fix) earned its keep.</p>
        <p>The pipeline audits the tables (keys, dates, every purchase event reconciled to exactly one order), runs six SQL reports in SQLite, adds Wilson intervals and a difference-in-differences estimate, and writes report CSVs, a summary and a single-file offline dashboard.</p>
        <Bullets items={[
          <><b>Synthetic store:</b> a two-year event log (2024–2025) with 11,092 customers, 141,422 sessions and 17,038 orders, with effects planted on purpose so the analysis can be checked against known answers.</>,
          <><b>Real data:</b> Online Retail II, two years of invoices from an online UK gift retailer whose customers are mostly small shops (Chen, 2019, CC BY 4.0). It has orders but no sessions, so the cohort, value and revenue reports run on it unchanged and the funnel reports don’t.</>,
        ]} />
        <p className='opacity-70 text-xs'>Every report is computed twice more, in plain pandas and in a real PostgreSQL 16 instance, and the tests check they agree.</p>
      </Block>

      <Block title='Headline numbers'>
        <Stats items={[
          { value: '7.5%', label: 'Paid-social customers buying in month 3 (other channels 19–22%)' },
          { value: '$162 vs $321', label: '12-month value: paid social vs email' },
          { value: '+20.0 pts', label: 'Mobile checkout fix (95% CI 17.4–23.1; true +19)' },
          { value: '92%', label: 'Real retailer’s revenue from returning customers' },
        ]} />
        <p>Paid social brings customers who don’t stay, the checkout fix worked by about as much as the generator says it should, and on the real retailer retention, not acquisition, is the business.</p>
      </Block>

      <Block title='Paid social brings customers who don’t stay'>
        <Figure src={IMG + 'retention_by_channel.webp'} alt='Line chart of the share of customers buying again in each of months 1 to 12 after their first order, by acquisition channel, with shaded 95% Wilson intervals. Paid social sits around 5–11%, well below email, organic and paid search at roughly 12–27%.' caption='Share of each channel’s customers who buy again N months after their first order, pooled over cohorts old enough to reach that month. Bands are 95% Wilson intervals.' />
        <p>Three months after their first order, 7.5% of paid-social customers buy again, against 19–22% for every other channel, and the intervals don’t come close. Over their first 12 months (the first-order month plus the next 11) a paid-social customer spends $162 on average, against $321 for one acquired by email. That gap is the ceiling on what paid social can cost per customer.</p>
        <DataTable head={['Channel', 'Month-3 retention', '95% CI', '12-month value']} highlight={3} rows={[
          ['Email', '21.8%', '19.5–24.3%', '$321'],
          ['Organic', '19.4%', '17.6–21.3%', '$277'],
          ['Paid search', '19.2%', '17.1–21.5%', '$249'],
          ['Paid social', '7.5%', '5.8–9.6%', '$162'],
        ]} />
      </Block>

      <Block title='Mobile checkout was the leak, and the fix worked'>
        <Figure src={IMG + 'checkout_trend.webp'} alt='Line chart of monthly checkout completion by device, January 2024 to December 2025. Desktop stays near 75–80% throughout; mobile runs around 50–57% until a dashed line marking the June 2025 mobile checkout fix, then jumps to about 70–74%.' caption='Share of checkouts that become purchases, by device and month. The dashed line marks the 2025-06-01 mobile checkout change.' />
        <p>Mobile and desktop shoppers add to cart at the same rate (35%), so the leak is later. Mobile completed 53% of checkouts in the six months before the 2025-06-01 checkout change and 72% in the six months after; desktop went from 78% to 77% over the same months, so it serves as the control. The difference-in-differences is <b>+20.0 points (95% CI 17.4–23.1)</b>, from 1,000 bootstraps that resample customers rather than sessions, because one customer’s sessions aren’t independent. The generator’s true effect is +19.</p>
        <p>The funnel only counts a step if it happens after the previous one in the same session. Over the full two years:</p>
        <DataTable head={['Device', 'View → cart', 'Cart → checkout', 'Checkout → purchase', 'View → purchase']} rows={[
          ['Desktop', '35.1%', '55.1%', '77.4%', '15.0%'],
          ['Mobile', '34.5%', '47.0%', '61.9%', '10.1%'],
        ]} />
      </Block>

      <Block title='The dashboard'>
        <Figure src={IMG + 'dashboard_preview.webp'} alt='Top of the retention dashboard: KPI tiles for revenue ($1,422,453), buying customers (6,010 of 11,092 signups), month-1 retention (21%), repeat revenue share (60%) and session conversion (12.0%), above a cohort-by-month retention heatmap whose unobserved cells are left blank.' caption='The top of the synthetic-store dashboard: KPI tiles, then cohort retention with months a cohort hasn’t reached left blank rather than shown as zero.' />
        <p>The dashboard is one HTML file with no external requests, so it can be emailed or dropped into a shared drive. On the synthetic store, 6,010 of 11,092 signups bought, 12.0% of sessions ended in a purchase, 21% of new customers bought again the next month, and returning customers brought in 60% of revenue.</p>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          <DashboardLink href='/dashboards/retention.html' label='Synthetic store dashboard' note='Cohorts, channel curves, funnel and checkout trend' />
          <DashboardLink href='/dashboards/retention-online-retail.html' label='Online Retail II dashboard' note='The same reports on real invoices, without the funnel' />
        </div>
      </Block>

      <Block title='Real data: Online Retail II'>
        <p>The cleaning turns 1,067,371 invoice lines into 35,534 orders from 5,812 customers (£16.0M, December 2009 to November 2011): lines without a customer ID and 26,481 exact duplicates go, only product lines stay, and each cancellation is netted against the sales it cancels, latest first.</p>
        <p>There are no channels, so customers are split into segments, and the start of the data decides what “new” can mean. Someone first seen in 2010 may be new or may be an older customer returning after a gap. Only customers whose first order is from December 2010 on, with none in the 12 months before, count as new.</p>
        <Figure src={IMG + 'retail_retention_by_segment.webp'} alt='Line chart of the share of Online Retail II customers buying again in months 1 to 12, by segment, with 95% Wilson bands. Customers existing at the start sit around 33–50%; the other three segments sit around 11–27%, and the new-outside-UK band is very wide.' caption='Online Retail II: share of each segment buying again N months after its first order in the data, with 95% Wilson intervals.' />
        <DataTable head={['Segment', 'Customers', 'Month-1 retention', '6-month value']} rows={[
          ['Existing at start (Dec 2009)', '951', '34.8%', '£2,382'],
          ['First seen Jan–Nov 2010', '3,275', '20.1%', '£909'],
          ['New UK', '1,401', '23.0%', '£754'],
          ['New outside UK', '185', '20.6%', '£1,213'],
        ]} />
        <Bullets items={[
          'About one new customer in five buys again the next month: 23% of new UK customers (95% CI 21–25%), flattening to about 17% in months 5–8.',
          'New customers outside the UK come back about as often but spend 1.6× as much in their first six months (bootstrap 95% CI 1.1–2.2×). That rests on only 94 of the 185, the ones old enough to have six months of history, so it’s a lead to check, not a budget.',
          'From December 2010, when new customers can be identified, returning customers bring in 92% of revenue, and about 132 new customers a month place a first order (December 2010 to November 2011).',
        ]} />
      </Block>

      <Block title='What broke, and a trap in the real data'>
        <p><b>A bug the tests caught.</b> In my first generator, two funnel steps could get the same timestamp, so the strict “after the previous step” join quietly dropped about 11% of carts.</p>
        <p><b>Who counts as new.</b> Treating the invoices as if they started in December 2010 and counting first orders in January–November 2011 gives about 309 “new” customers a month; with the full year of history before them it’s 137 over the same months. With a short lookback, more than half of the apparent new customers are returning ones, which is why the segments above exist.</p>
      </Block>

      <Block title='How it works'>
        <Steps items={[
          { title: 'Data', text: 'generate a synthetic event log with planted effects, read your own CSV export, or clean the Online Retail II invoices into the same customers and orders tables.' },
          { title: 'Audit', text: 'keys, foreign keys, ISO dates and positive amounts, and every purchase event reconciled to exactly one order before any SQL runs.' },
          { title: 'SQL reports', text: 'cohort retention, retention curves by channel, value per customer, an ordered session funnel, monthly checkout completion and new-vs-returning revenue, each with its denominator documented.' },
          { title: 'Statistics', text: 'Wilson intervals on retention rates, and a difference-in-differences estimate for the checkout change with a customer-level bootstrap.' },
          { title: 'Outputs', text: 'report CSVs, a summary file, a single-file offline dashboard and the figures, for each dataset.' },
        ]} />
        <p className='opacity-80'>Python 3.12 and SQLite, with a PostgreSQL 16 port of every report; pandas, NumPy and matplotlib. 49 tests, including recomputing each report in pandas and comparing it with PostgreSQL.</p>
      </Block>

      <Block title='Limitations'>
        <Bullets items={[
          'Cohorts are 80–380 customers, so single heatmap cells move by ±5 points from noise alone; the channel curves pool cohorts for that reason.',
          'The checkout comparison is a difference-in-differences, not an experiment. It assumes mobile and desktop would have moved in parallel without the fix, plausible here because desktop is flat, but I’d still want an A/B test before crediting a real change.',
          'The synthetic patterns were built into the generator; the point is whether the method finds and measures them correctly.',
          'Online Retail II has no channels, sessions or costs, so it says nothing about the funnel or acquisition payback. It’s one retailer, and most of its customers are small shops buying stock rather than consumers.',
          'Only twelve monthly cohorts in Online Retail II are known to be new. New-customer curves past month 8 and their 12-month value are too thin to quote, and there’s no new-customer trend to report.',
        ]} />
      </Block>

      <CodeNote tests={49} extras={['a PostgreSQL port of all six reports', 'the offline dashboards']} />
    </CaseStudyPage>
  )
}
