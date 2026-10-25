"""Export the words-only ticket router to public/demos/router.json for the in-browser demo.

    python scripts/demos/router/export_router.py [--project DIR] [--out FILE]

Writes everything src/demos/routerModel.ts needs to reproduce TfidfModel(use_chars=False).
predict_proba and the routing policy:

  * vocab: the vectorizer's terms in feature-index order (sklearn sorts them), and df, each
    term's document frequency in the training split; idf = ln((1 + nDocs) / (1 + df)) + 1 is
    recomputed in the browser (exact integers are smaller than floats, and the check below
    confirms they rebuild sklearn's idf_)
  * coef: one row per queue (in queue order, not sklearn's alphabetical class order), stored as
    integers round(coef * 10^coefDecimals). coefDecimals is the coarsest rounding whose
    probabilities stay within ROUNDING_BUDGET of the unrounded model on validation and both test
    sets, a tenth of the 1e-6 parity target so the browser's own float differences have room
  * intercept, temperature, the 1e-12 that predict_proba adds before taking logs, the policy
    (threshold and runner-up limit from best_policy on the second validation half), and the
    accuracies the UI quotes

Every term is kept, including ones with tiny weights: the L2 norm of a ticket's TF-IDF vector
runs over all vocabulary terms, so dropping one would change every other feature's value.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from train import DEFAULT_PROJECT, TESTS, accuracy, parts, train

SITE = Path(__file__).resolve().parents[3]
ROUNDING_BUDGET = 1e-7
EPS = 1e-12  # TfidfModel.predict_proba: softmax(log(p + 1e-12) / T)


def softmax(z: np.ndarray) -> np.ndarray:
    z = z - z.max(axis=1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=1, keepdims=True)


def calibrated(logits: np.ndarray, temperature: float) -> np.ndarray:
    """TfidfModel.predict_proba from raw logistic-regression logits (columns already in queue order)."""
    return softmax(np.log(softmax(logits) + EPS) / temperature)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--project", type=Path, default=DEFAULT_PROJECT, help="local copy of ticket-routing")
    parser.add_argument("--out", type=Path, default=SITE / "public" / "demos" / "router.json")
    args = parser.parse_args()

    t = train(args.project)
    vec, clf = parts(t.model)
    order = [list(clf.classes_).index(q) for q in t.queues]
    coef, intercept = clf.coef_[order], clf.intercept_[order]
    terms = vec.get_feature_names_out().tolist()
    assert terms == sorted(terms) and len(set(terms)) == len(terms)

    n_docs = len(t.split["train"])
    df = np.rint((1 + n_docs) / np.exp(vec.idf_ - 1) - 1).astype(int)
    idf_rebuilt = np.log((1 + n_docs) / (1 + df.astype(float))) + 1
    assert np.array_equal(idf_rebuilt, vec.idf_), "df does not rebuild sklearn's idf_ exactly"

    # Pick the rounding on sklearn's own features, so only the coefficients differ.
    sets = {"validation": t.split["validation"], **{s: t.split[s] for s in TESTS}}
    features = {s: vec.transform(d.text) for s, d in sets.items()}
    exact = {s: t.model.predict_proba(d.text) for s, d in sets.items()}
    for s in sets:
        assert np.allclose(calibrated(features[s] @ coef.T + intercept, t.model.temperature), exact[s], atol=1e-12)
    decimals, worst = None, None
    for d in range(3, 10):
        rounded = np.round(coef * 10 ** d) / 10 ** d
        worst = max(np.abs(calibrated(features[s] @ rounded.T + intercept, t.model.temperature) - exact[s]).max()
                    for s in sets)
        if worst <= ROUNDING_BUDGET:
            decimals = d
            break
    assert decimals is not None, "no rounding within budget"

    shipped = json.loads((t.project / "results" / "metrics.json").read_text(encoding="utf-8"))
    words_metrics = shipped["models"]["tfidf_words"]
    chars_metrics = shipped["models"]["tfidf_words_chars"]
    acc = {s: accuracy(t.split[s].queue, exact[s], t.queues) for s in TESTS}
    # The model is deterministic, so these must be the README's words-only numbers.
    assert abs(acc["test_new_wording"] - words_metrics["test_new_wording"]["accuracy"]) < 1e-12
    assert abs(acc["test_new_issue_type"] - words_metrics["test_new_issue_type"]["accuracy"]) < 1e-12
    policy = shipped["routing_by_model"]["tfidf_words"]["test_new_wording"]
    assert (t.threshold, t.runner_up_max) == (policy["threshold"], policy["runner_up_max"])

    data = {
        "format": 1,
        "source": "ticket-routing: TfidfModel(use_chars=False) trained as in run.py (seed 67)",
        "queues": t.queues,
        "vectorizer": {"lowercase": True, "tokenPattern": vec.token_pattern, "ngramRange": list(vec.ngram_range),
                       "sublinearTf": bool(vec.sublinear_tf), "norm": vec.norm, "smoothIdf": bool(vec.smooth_idf),
                       "nDocs": n_docs},
        "temperature": float(t.model.temperature),
        "eps": EPS,
        "policy": {"threshold": t.threshold, "runnerUpMax": t.runner_up_max},
        "metrics": {"wordsNewWording": acc["test_new_wording"], "wordsNewIssueTypes": acc["test_new_issue_type"],
                    "shippedNewWording": chars_metrics["test_new_wording"]["accuracy"],
                    "shippedNewIssueTypes": chars_metrics["test_new_issue_type"]["accuracy"]},
        "intercept": intercept.tolist(),
        "coefDecimals": decimals,
        "vocab": terms,
        "df": df.tolist(),
        "coef": [[int(v) for v in row] for row in np.rint(coef * 10 ** decimals)],
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(data, separators=(",", ":"), ensure_ascii=False) + "\n"
    args.out.write_text(text, encoding="utf-8")
    print(f"wrote {args.out}: {len(text.encode()):,} bytes, {len(terms):,} terms, "
          f"coefficients to {decimals} decimals (max prob change {worst:.1e}), "
          f"T={t.model.temperature}, policy {t.threshold}/{t.runner_up_max}, "
          f"accuracy {acc['test_new_wording']:.4f} / {acc['test_new_issue_type']:.4f}")


if __name__ == "__main__":
    main()
