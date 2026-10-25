import { CaseStudyPage, Block, Stats, Figure, DataTable, Steps, Bullets, CodeNote } from '../components/CaseStudy'

const IMG = '/media/nlp/'

export default function Page() {
  return (
    <CaseStudyPage slug='nlp' lede='A ticket classifier plus a cost-based policy that decides which tickets are safe to route without a person reading them, measured on wording and issue types the model never saw in training.'
      summary={{
        problem: 'Decide which support tickets can go to one of six queues without a person reading them, and what that saves.',
        approach: 'Four classifiers, from TF-IDF to a pretrained MiniLM encoder, and a cost-based routing policy, tested on held-out wording and on issue types never seen in training.',
        result: '80% of tickets auto-routed at 94.6% accuracy, cutting triage cost 57%, from $1.50 to $0.64 a ticket.',
        decision: 'How far to automate triage, and which model to trust when new issue types appear.',
        stack: ['Python', 'scikit-learn', 'PyTorch', 'Hugging Face transformers', 'MiniLM'],
        data: {
          synthetic: '12,000 tickets with known labels, typos, vague subject lines and two-issue tickets.',
          real: 'the Bitext customer-support dataset, 24,635 messages after de-duplication.',
        },
      }}>

      <Block title='Overview'>
        <p>A support team gets tickets for six queues (billing, technical, shipping, account access, returns, feature requests) and someone reads every one to forward it. Which tickets can be routed without a person, and what does that save? A support operations lead would use the answer to decide how far to automate triage. For each ticket the router outputs a suggested queue, its confidence, the runner-up, a decision and a reason, so the uncertain tickets reach a person with a suggestion attached.</p>
        <Bullets items={[
          <><b>Data:</b> 12,000 synthetic tickets with known labels, vague subject lines, typos, and 10% that describe two problems.</>,
          <><b>Models:</b> TF-IDF on words; TF-IDF on words plus character n-grams (shipped); a small transformer trained from scratch; and a frozen pretrained MiniLM encoder with logistic regression on top. On the synthetic tickets all four are temperature-scaled so a confidence of 0.9 means about 90% right; on Bitext there are too few validation errors to fit a temperature, so it stays at 1.</>,
          <><b>Policy:</b> a confidence threshold and a runner-up limit, chosen to minimize expected cost at $1.50 per manual triage and $8 per misroute.</>,
          <><b>Real-data check:</b> the public Bitext customer-support dataset, where the main lesson shows up more sharply.</>,
        ]} />
        <p className='opacity-70 text-xs'>The synthetic tickets make the ground truth exact; Bitext is real-world in vocabulary but partly generated and still templated. Bitext results appear here as statistics only.</p>
      </Block>

      <Block title='Headline numbers'>
        <Stats items={[
          { value: '80%', label: 'Tickets auto-routed (new wording)' },
          { value: '94.6%', label: 'Accuracy of the auto-routed tickets' },
          { value: '−57%', label: 'Triage cost, $1.50 → $0.64 per ticket' },
          { value: '85%', label: 'MiniLM on unseen Bitext intents (TF-IDF: 59%)' },
        ]} />
        <p>On familiar issues in new words, the cheap shipped model automates four tickets in five; on issue types it has never seen it still routes 76%, but at 86.6% accuracy, and that gap is the reason to monitor it.</p>
      </Block>

      <Block title='How you split the data decides the answer'>
        <p>With a random train/test split the shipped model scores <b>99.3%</b>, and that number means nothing: tickets that say almost the same thing land on both sides, so the test only checks memory. Two harder test sets are held out instead:</p>
        <Bullets items={[
          <><b>New wording.</b> Each issue type (“charged twice”) is written three ways, and one phrasing never appears in training. It’s what a deployed model faces every day.</>,
          <><b>New issue types.</b> One whole issue type per queue never appears in training. It’s what the model faces when the product changes.</>,
        ]} />
        <Figure src={IMG + 'model_comparison.webp'} alt='Bar chart of accuracy for four models on a random split, new wording and new issue types, with a dotted chance line' caption='Accuracy on a random split (shipped model only: 99%), on new wording of known issues and on new issue types, for the four models; the dotted line is chance, one in six. Every model loses ground on new issue types; MiniLM stays highest on both.' />
        <DataTable head={['Model', 'New wording', 'Macro F1', 'New issue types', '15% typos']} highlight={1} rows={[
          ['TF-IDF words', '82.6%', '0.811', '75.5%', '79.6%'],
          ['TF-IDF words + characters (shipped)', '88.2%', '0.867', '80.3%', '86.5%'],
          ['Transformer from scratch (241k params)', '82.7%', '0.824', '79.5%', '76.4%'],
          ['Pretrained MiniLM + logistic regression', '95.4%', '0.953', '88.6%', '93.9%'],
        ]} />
        <Bullets items={[
          'Character n-grams were the biggest single gain among the models trained here: new-wording accuracy goes from 82.6% to 88.2%, +5.5 points before rounding, and they hold up under typos (−1.7 points at a 15% typo rate, against −6.3 for the transformer).',
          'The transformer, trained from scratch on about 7,000 tickets, almost matches the shipped model on new issue types (79.5% vs. 80.3%) but trails on new wording and typos: attention has nothing to work with that n-grams don’t already capture.',
          'The pretrained encoder is where the real gain was, and it’s the best calibrated (ECE 0.012). The shipped router stays TF-IDF because it needs no 90 MB download and runs anywhere; where that’s acceptable, MiniLM is the better choice.',
        ]} />
        <Figure src={IMG + 'confusion_new_wording.webp'} alt='Confusion matrix of the shipped model on new wording, rows normalized, with the percentage printed in every cell' caption='The shipped model on new wording, each row normalized to 100%. Five queues are right 88–94% of the time; feature requests only 69%, with 26% read as technical, because “please add X to the dashboard” and “the dashboard is broken” share most of their words.' />
      </Block>

      <Block title='The routing policy'>
        <p>A ticket is auto-routed only if the top queue’s confidence is at least <b>0.70</b> and the runner-up scores below <b>0.15</b>. Both numbers were picked on a different half of the validation set from the one used for calibration, to minimize expected cost, and “route nothing” was one of the options searched, so on the tickets it was tuned on the policy can’t cost more than all-manual triage.</p>
        <p>The runner-up rule is for tickets that describe two problems. The label is the first issue; on those tickets the model always picks one of the two queues, but the other one 72% of the time. Sending them to a person moved the cost saving from 52% to 57% on new wording, and from 14% to 22% on new issue types.</p>
        <Figure src={IMG + 'coverage_vs_accuracy.webp'} alt='Line chart of the accuracy of auto-routed tickets against the share routed automatically, for validation, new wording and new issue types' caption='Accuracy of the auto-routed tickets against the share routed automatically as the threshold varies, for validation, new wording and new issue types; dots mark the chosen 0.70. Validation and new wording overlap (about 80% routed at 94.6%), while new issue types sit lower all the way along (76% routed at 86.6%): a threshold picked on familiar issues is too loose for unfamiliar ones.' />
        <p>The same policy search, run for each model on its own validation probabilities (auto-routed · accuracy · saving):</p>
        <DataTable head={['Model', 'New wording', 'New issue types']} highlight={1} rows={[
          ['TF-IDF words', '78% · 89.5% · 34%', '76% · 79.4% · −7%'],
          ['TF-IDF words + characters (shipped)', '80% · 94.6% · 57%', '76% · 86.6% · 22%'],
          ['Transformer from scratch', '66% · 95.6% · 50%', '62% · 96.7% · 51%'],
          ['Pretrained MiniLM', '91% · 98.4% · 83%', '79% · 94.6% · 56%'],
        ]} />
        <p>The transformer’s policy comes out cautious (threshold 0.84), which happens to protect it on new issue types; MiniLM is better on both kinds of text at once.</p>
      </Block>

      <Block title='Real data: Bitext customer support'>
        <p>The Bitext dataset (Bitext Innovations, CDLA-Sharing-1.0) has 26,872 customer messages in 27 intents and 11 categories; 2,237 exact duplicates are dropped, leaving 24,635, and the categories become the queues. It’s split the same way as the synthetic tickets: one whole intent per category held out as new issue types (9 intents, 8,276 messages), and the rest split 60/20/20 by groups of messages with the same set of words, so near-duplicates never straddle the split.</p>
        <Figure src={IMG + 'bitext_model_comparison.webp'} alt='Bar chart of accuracy on Bitext for four models on a random split, new wording and held-out intents' caption='The same comparison on Bitext. Every model rounds to 100% on new wording; on held-out intents TF-IDF words get 56%, words + characters 59%, the transformer 64% and MiniLM 85%. The dotted line is chance, one in eleven.' />
        <Bullets items={[
          <><b>New intents split cleanly in two.</b> Of the nine held-out intents, four share an obvious keyword with one in training (<code>switch_account</code>, <code>get_invoice</code>, <code>track_order</code>, <code>set_up_shipping_address</code>), and every model gets at least 98% of them. Four have no keyword to lean on, and the keyword models collapse: <code>review</code> 0–2%, <code>payment_issue</code> 5–11%, <code>contact_human_agent</code> 24–48%, <code>delivery_period</code> 10–25%. MiniLM gets 36%, 89%, 82% and 69%. The ninth, <code>track_refund</code>, is in between: it shares “refund” with <code>get_refund</code> but also reads like an account question, so word TF-IDF gets 64%, the transformer 78%, and character n-grams and MiniLM 98–100%.</>,
          <><b>Confidence warns, but a threshold tuned on familiar intents doesn’t listen.</b> The shipped model’s wrong answers on new intents have a median confidence of 0.53, against 0.98 when it’s right. But validation has almost no errors, so the policy search picks the lowest threshold it tries (0.30): on new intents that auto-routes 94% of tickets at 62% accuracy and costs <b>98% more</b> than having a person route everything. MiniLM, tuned the same way, auto-routes 95% at 87% and still <b>saves 29%</b>.</>,
        ]} />
        <p>Saving against routing everything by hand, on new intents, at fixed thresholds:</p>
        <DataTable head={['Model', '0.50', '0.70', '0.90', '0.99']} rows={[
          ['TF-IDF words', '−38%', '−14%', '+9%', '+12%'],
          ['TF-IDF words + characters (shipped)', '−43%', '−4%', '+26%', '+21%'],
          ['Transformer from scratch', '−52%', '−14%', '+28%', '0%'],
          ['Pretrained MiniLM', '+39%', '+53%', '+47%', '+20%'],
        ]} />
        <p>A high threshold rescues the keyword models only by sending most tickets to a person. MiniLM saves money at every threshold.</p>
      </Block>

      <Block title='What I learned'>
        <Bullets items={[
          <><b>The split is the experiment.</b> A random split reported 99.3% for a model that gets 80.3% on issue types it hasn’t seen. Holding out wording and whole issue types was the most important design decision in the project.</>,
          <><b>Calibration needs mistakes to calibrate against.</b> With fewer than 20 errors in the calibration half, fitting a temperature shrinks it toward zero and makes the model look certain, so the temperature stays at 1 instead. Every model had enough errors to calibrate on the synthetic tickets; on Bitext none did, so all four keep temperature 1.</>,
          <><b>Monitor with labels, not confidence.</b> On new issue types the model stays confident while getting worse. In production I’d log every human correction, track the weekly accuracy of auto-routed tickets and alert below 90%.</>,
          <><b>Pretraining beat architecture.</b> A transformer trained from scratch on about 7,000 tickets added nothing over n-grams; a frozen encoder that already knows “charged twice” and “double billing” mean nearly the same thing added the most.</>,
        ]} />
      </Block>

      <Block title='How it works'>
        <Steps items={[
          { title: 'Generate', text: 'synthetic tickets from 8–10 issue types per queue, each written three ways, with slots, generic subject lines, typos, case changes and second issues; or load Bitext with grouped splits.' },
          { title: 'Split', text: 'train, validation, new wording and new issue types, so held-out phrasing and issue types never reach training.' },
          { title: 'Train', text: 'TF-IDF words, TF-IDF words + character n-grams, a two-layer transformer with its own BPE tokenizer, and MiniLM embeddings into logistic regression, all behind the same predict_proba.' },
          { title: 'Calibrate', text: 'temperature scaling on one half of validation, falling back to 1 when that half has too few mistakes.' },
          { title: 'Choose the policy', text: 'search the confidence threshold and runner-up limit on the other half to minimize expected cost, with “route nothing” as an option.' },
          { title: 'Evaluate and route', text: 'accuracy, macro F1, calibration error and cost on both test sets; the saved router turns a CSV of tickets into a worklist with a decision and reason for each.' },
        ]} />
        <p className='opacity-80'>Python 3.12, scikit-learn, pandas and NumPy for the shipped router; PyTorch and tokenizers for the transformer and Hugging Face transformers for all-MiniLM-L6-v2, both optional.</p>
      </Block>

      <Block title='Limitations'>
        <Bullets items={[
          'Synthetic tickets have a much smaller vocabulary than real ones, and the difficulty of the held-out sets depends on how the templates were written. Bitext is real-world in vocabulary but still templated, with no two-issue messages. The relative findings are the useful part.',
          'One label per ticket. Real two-issue tickets might be better split, or routed to both queues.',
          'A threshold tuned on familiar issues is too loose for new ones (on Bitext’s new intents the shipped policy costs 98% more than all-manual), and confidence alone doesn’t reveal it.',
          'No PII redaction, English only, and the triage and misroute costs are assumptions to replace with real numbers.',
        ]} />
      </Block>

      <CodeNote tests={32} extras={['a command-line router that writes a triage worklist', 'a generated model card']} />
    </CaseStudyPage>
  )
}
