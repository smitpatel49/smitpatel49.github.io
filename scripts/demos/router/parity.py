"""Check the browser router (src/demos/routerModel.ts + public/demos/router.json) against scikit-learn.

    python scripts/demos/router/parity.py [--project DIR] [--router FILE]

Retrains the words-only model as run.py does (train.py), runs the TypeScript module in Node on
every validation and test ticket plus some tokenizer edge cases, and checks:

  * probabilities: max abs difference ≤ 1e-6 on every ticket (the target; the full new-wording
    test set is the headline check)
  * tokens: the TypeScript analyzer gives exactly TfidfVectorizer.build_analyzer()'s n-grams
  * decisions and reasons: identical to the project's routing.policy.route()
  * accuracy and routing outcome of the browser model on both test sets, next to the README's
    words-only numbers (82.6% / 75.5%; 78% · 89.5% · 34% and 76% · 79.4% · −7%)

Exits with status 1 if any check fails.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from train import DEFAULT_PROJECT, TESTS, accuracy, parts, train

HERE = Path(__file__).resolve().parent
SITE = HERE.parents[2]
TOLERANCE = 1e-6

# Tokenizer edge cases: Unicode letters and digits, underscores, apostrophes, one-letter words,
# astral characters, combining marks, punctuation runs, empty-ish input and known bigrams.
EDGE_CASES = [
    "", "   ", "a", "I", "!!!", "Ü", "x_", "_x", "a_b c_d", "don't won’t", "e1043 ERR_SYNC_2 #48213 $19.99",
    "Ünïcödé wörds café naïve", "ΟΔΟΣ Σίσυφος", "İstanbul", "日本語 テキスト", "𝐀𝐁 𝐀", "café bill",
    "½ ² ३४ ٣٤", "tab\tseparated\nnew line", "I was charged twice charged twice CHARGED TWICE",
    "where is my order", "Subject: Help. I cannot log in to my account. Also, my order came broken.",
]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--project", type=Path, default=DEFAULT_PROJECT, help="local copy of ticket-routing")
    parser.add_argument("--router", type=Path, default=SITE / "public" / "demos" / "router.json")
    args = parser.parse_args()

    t = train(args.project)
    from routing import evaluation as ev
    from routing.policy import route

    vec, _ = parts(t.model)
    analyzer = vec.build_analyzer()
    sets = {"validation": t.split["validation"], **{s: t.split[s] for s in TESTS}}
    edge = [e for e in EDGE_CASES if e.strip()]  # route() rejects empty text, as the UI does
    texts = [x for d in sets.values() for x in d.text] + edge

    with tempfile.TemporaryDirectory() as tmp:
        src, dst = Path(tmp) / "in.json", Path(tmp) / "out.json"
        src.write_text(json.dumps({"texts": texts, "analyze": texts + EDGE_CASES}), encoding="utf-8")
        subprocess.run(["node", str(HERE / "parity_runner.mjs"), str(args.router), str(src), str(dst)],
                       check=True, cwd=SITE)
        ts = json.loads(dst.read_text(encoding="utf-8"))

    failures = []
    ts_probs = np.array(ts["probs"])
    py_probs = t.model.predict_proba(texts)
    router = {"model": t.model, "threshold": t.threshold, "runner_up_max": t.runner_up_max, "queues": t.queues}
    py_route = route(router, texts)

    print(f"{'set':<22}{'tickets':>8}{'max |Δp|':>12}{'decisions':>12}")
    start = 0
    for name, d in [*sets.items(), ("edge cases", edge)]:
        n = len(d)
        sl = slice(start, start + n)
        diff = float(np.abs(ts_probs[sl] - py_probs[sl]).max())
        same = int((np.array(ts["decisions"][sl]) == py_route.decision.to_numpy()[sl]).sum())
        reasons_same = bool((np.array(ts["reasons"][sl]) == py_route.reason.to_numpy()[sl]).all())
        print(f"{name:<22}{n:>8}{diff:>12.1e}{f'{same}/{n}':>12}")
        if diff > TOLERANCE:
            failures.append(f"{name}: max |Δp| {diff:.2e} > {TOLERANCE}")
        if same != n or not reasons_same:
            failures.append(f"{name}: decisions or reasons differ from routing.policy.route()")
        start += n

    token_mismatches = [s for s, toks in zip(texts + EDGE_CASES, ts["tokens"], strict=True) if analyzer(s) != toks]
    print(f"tokens identical to TfidfVectorizer on {len(texts) + len(EDGE_CASES) - len(token_mismatches)}"
          f"/{len(texts) + len(EDGE_CASES)} texts")
    if token_mismatches:
        failures.append(f"tokenizer differs on {len(token_mismatches)} texts, e.g. {token_mismatches[:3]!r}")

    print(f"\nbrowser model, policy threshold {t.threshold:.2f} and runner-up limit {t.runner_up_max:.2f}"
          f" (temperature {t.model.temperature}); {ts['msPerTicket']:.3f} ms per ticket in Node")
    start = len(sets["validation"])
    for s in TESTS:
        n = len(sets[s])
        p = ts_probs[start:start + n]
        out = ev.routing_outcome(sets[s].queue, p, t.threshold, t.runner_up_max)
        print(f"  {s:<20} accuracy {accuracy(sets[s].queue, p, t.queues):.1%}  |  auto-routed "
              f"{out['auto_routed_share']:.0%} at {out['auto_routed_accuracy']:.1%}, saving "
              f"{out['saving_vs_all_manual']:.0%}")
        start += n

    if failures:
        print("\nFAILED:\n  " + "\n  ".join(failures))
        sys.exit(1)
    print("\nparity OK")


if __name__ == "__main__":
    main()
