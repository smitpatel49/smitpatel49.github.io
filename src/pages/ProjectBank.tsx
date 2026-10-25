import { CaseStudyPage, Block, Stats, Figure, DataTable, Steps, Bullets, CodeNote } from '../components/CaseStudy'

const IMG = '/media/bank/'

export default function Page() {
  return (
    <CaseStudyPage slug='bank' lede='A call center can reach about 15% of the customer list in a campaign, so the model is judged on one thing: the hit rate in the slice that actually gets called.'
      summary={{
        problem: 'Rank a bank’s customers for a term-deposit campaign when the calls run out after about 15% of the list.',
        approach: 'Four models compared by 5-fold cross-validation on precision in the top 15%, a test set scored once with bootstrap intervals, served by a CLI and FastAPI.',
        result: '3.0× lift in the top 15% (95% CI 2.6–3.4×): a 28.6% hit rate against a 9.7% base rate; 3.2× on the real UCI calls.',
        decision: 'The weekly call list, and whether extra call capacity is worth paying for.',
        stack: ['Python', 'scikit-learn', 'XGBoost', 'FastAPI', 'Docker'],
        data: {
          synthetic: '12,000 customers drawn from a known response model.',
          real: 'UCI Bank Marketing, 45,211 calls by a Portuguese bank, 2008–2010.',
        },
      }}>

      <Block title='Overview'>
        <p>A bank runs a term-deposit campaign. The real question isn’t “will this customer subscribe?” but “who goes at the top of the list?” Capacity is fixed, so the people using this are a campaign manager deciding whom to call this week, and whoever decides whether more call capacity would pay for itself.</p>
        <Bullets items={[
          <><b>Selection on the business metric.</b> Four models (logistic regression, logistic regression with spline terms, random forest, XGBoost) are compared by 5-fold cross-validation on precision in the top 15%, not accuracy: predicting “no” for everyone is 90% accurate.</>,
          <><b>Honest evaluation.</b> An 80/20 stratified split made once, early; the test set is scored once, after every choice is made, with bootstrap intervals and paired comparisons between models.</>,
          <><b>No leakage.</b> Only information available before the call. Call duration, the strongest predictor in the real data, is only known after the call and is excluded.</>,
        ]} />
        <p>The data: 12,000 synthetic customers drawn from a known response model, so there’s a ground truth to check against, and the public UCI Bank Marketing data (45,211 calls by a Portuguese bank, 2008–2010; Moro, Rita &amp; Cortez, 2014, CC BY 4.0) run through the same pipeline.</p>
      </Block>

      <Block title='Headline numbers'>
        <Stats items={[
          { value: '3.0×', label: 'Lift in the top 15% (95% CI 2.6–3.4×)' },
          { value: '28.6%', label: 'Hit rate at capacity, against a 9.7% base rate' },
          { value: '44%', label: 'Of all subscribers reached with 15% of the calls' },
          { value: '3.2×', label: 'Lift on the real UCI calls (95% CI 3.0–3.4×)' },
        ]} />
        <p>Calling the model’s top 15% finds three times as many subscribers per call as calling at random, on synthetic data and on real calls alike.</p>
      </Block>

      <Block title='A plain logistic regression is enough'>
        <p>On the synthetic test set (2,400 customers, 360 calls at capacity), logistic regression did as well as random forest and XGBoost, so that’s what ships.</p>
        <DataTable head={['Model (test set)', 'ROC-AUC', 'Avg. precision', 'Precision @ 15%']} highlight={0} rows={[
          ['Logistic regression (selected)', '0.729', '0.277', '28.6%'],
          ['Logistic regression + splines', '0.725', '0.269', '28.1%'],
          ['Random forest', '0.720', '0.265', '27.5%'],
          ['XGBoost', '0.723', '0.267', '26.7%'],
        ]} />
        <p>The differences are small. The paired bootstrap interval for “logistic regression minus XGBoost” at capacity is 0.0 to +4.7 points, and the intervals against the other two include zero. The point isn’t that logistic regression is better; it’s that the complex models don’t earn their extra cost here.</p>
        <Figure src={IMG + 'reliability.webp'} alt='Reliability plot: observed subscription rate against mean predicted probability for each decile of the test set, with a dashed diagonal for perfect calibration. The points follow the diagonal from about 0.03 to 0.31, with small wobbles in the lower deciles.' caption='Observed subscription rate against mean predicted probability, by decile of the test set. The dashed line is perfect calibration.' />
        <p>The probabilities feed an expected-value calculation (p × $150 − $10 per call), so they need to mean what they say. Sigmoid and isotonic calibration were compared by cross-validated Brier score and neither improved on the raw model by a meaningful margin, so no calibration step was added. Test Brier score: 0.079; mean prediction 9.8% against a 9.7% base rate.</p>
      </Block>

      <Block title='What drives the ranking'>
        <Figure src={IMG + 'feature_importance.webp'} alt='Horizontal bar chart of permutation importance on the test set. Previous campaign outcome is far ahead at about 0.12 drop in average precision; job, housing loan, contact type and contacts this campaign follow at about 0.016–0.023; balance, days since previous contact, education and personal loan are smaller; age is about zero.' caption='Permutation importance on the test set: the drop in average precision when each input is shuffled.' />
        <p>A successful previous campaign matters far more than anything else: shuffling it costs 0.12 of average precision. Job, an existing housing loan and contact channel follow, at about 0.02 each. If I were advising the bank, the cheapest improvement isn’t a fancier model, it’s logging previous-campaign outcomes more carefully.</p>
      </Block>

      <Block title='Capacity is the constraint'>
        <Figure src={IMG + 'profit_curve.webp'} alt='Profit curve: campaign profit in thousands of dollars against the share of customers called in model order. Profit rises steeply to about $11.9k at the 15% capacity line, keeps rising to a peak of about $15.8k at 52% of the list, then falls to about $10.8k when everyone is called.' caption='Test-set campaign profit at $150 per sale and $10 per call, calling customers in model order. The dashed line is the 15% call capacity.' />
        <p>Profit keeps rising until about 52% of the list has been called. At 15% capacity the campaign makes about $11.9k on this test slice, against a peak of $15.8k. That gives the business a number to weigh against hiring or outsourcing more calls; the margin and cost are assumptions, and real figures drop straight into the same code.</p>
      </Block>

      <Block title='Real data: UCI Bank Marketing'>
        <p>The same pipeline on 45,211 real calls (11.7% subscribed) gives <b>37.4% precision in the top 15% and 3.2× lift</b>, with recall of 48%. This time the tree models beat logistic regression.</p>
        <DataTable head={['Model (test set, 9,043 calls)', 'ROC-AUC', 'Avg. precision', 'Precision @ 15%']} highlight={2} rows={[
          ['Logistic regression', '0.742', '0.359', '34.4%'],
          ['Logistic regression + splines', '0.753', '0.374', '35.8%'],
          ['Random forest (selected by CV)', '0.760', '0.391', '37.4%'],
          ['XGBoost', '0.764', '0.396', '37.0%'],
        ]} />
        <Figure src={IMG + 'uci_roc_pr_curves.webp'} alt='Two panels for the UCI test set: ROC curves and precision-recall curves for logistic regression, logistic splines, random forest and XGBoost. The four curves nearly overlap; in the precision-recall panel, random forest and XGBoost sit slightly above logistic regression between about 20% and 60% recall, all well above the base-rate line.' caption='UCI test set: ROC (left) and precision–recall (right) for the four candidates. The dashed line on the right is the base rate, i.e. random calling.' />
        <p>The paired interval for “random forest minus logistic regression” at capacity is +1.6 to +4.4 points; random forest and XGBoost are tied (−0.5 to +1.5). The synthetic response model is mostly additive and real behavior has interactions, which is a useful reminder of what synthetic data can and can’t tell you. Previous-campaign outcome is again the strongest signal by far.</p>
      </Block>

      <Block title='Lessons'>
        <p><b>The ranking survives drift; the probabilities don’t.</b> The UCI file is in date order, so training on the earliest 80% and scoring the latest 20% is the question a bank would actually face. The subscription rate jumps from 6.7% to 31.6% between the two periods. The ranking still works (ROC-AUC 0.71; 55% of the top 15% subscribe, against a 32% base rate), but the model predicts 14% on average. Rank with it, but recalibrate on recent calls before using expected value to decide how many calls to make.</p>
        <p><b>The leaky column.</b> With call duration, a boosted model scores ROC-AUC 0.93 in cross-validation; without it, 0.80. It would make the model look great and be useless for deciding whom to call. Day and month go too: the subscription rate climbs from 3% to over 40% across the file, so month mostly encodes when, not who.</p>
      </Block>

      <Block title='How it works'>
        <Steps items={[
          { title: 'Data', text: '12,000 synthetic customers from a known response model, or the UCI calls mapped onto the same columns, using only pre-call information.' },
          { title: 'Split', text: '80% development, 20% test, stratified, made once before any modeling.' },
          { title: 'Selection', text: 'four pipelines compared by 5-fold CV on precision in the top 15%, then calibration chosen by CV Brier score.' },
          { title: 'Evaluation', text: 'the test set scored once: precision, recall and lift at capacity with bootstrap intervals, paired intervals between models, reliability, permutation importance and a profit curve.' },
          { title: 'Serving', text: 'the saved model behind a batch scoring CLI and a FastAPI service with /score and /rank, which refuse invalid batches and flag category values never seen in training.' },
        ]} />
        <p className='opacity-80'>Python 3.12, scikit-learn, XGBoost, FastAPI and Docker; 83 tests cover the metrics, scoring checks, the CLI, the API and the Docker image.</p>
      </Block>

      <Block title='Limitations'>
        <Bullets items={[
          'The main results are on synthetic data. The UCI data is one bank, 2008–2010, with a base rate that drifts sharply over time and no customer ID, so the same person can appear on both sides of a split.',
          '“Contacts this campaign” includes the last call, and calling usually stops once a customer says yes, so it isn’t fully known in advance. A production model should count only contacts made before scoring.',
          'Age and job are model inputs; a real deployment would need a fairness and legal review first.',
          'No drift monitoring yet: I’d track the score distribution and realized hit rate per campaign and retrain when they drift.',
          'The profit numbers use assumed economics ($150 per sale, $10 per call).',
        ]} />
      </Block>

      <CodeNote tests={83} extras={['a batch scoring CLI', 'a FastAPI service and Dockerfile', 'a model card']} />
    </CaseStudyPage>
  )
}
