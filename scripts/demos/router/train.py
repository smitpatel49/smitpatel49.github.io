"""Train the ticket-routing project's words-only TF-IDF router exactly as its run.py does.

Shared by export_router.py (writes public/demos/router.json) and parity.py (checks the
browser implementation against scikit-learn). Nothing here is new modelling: it calls the
project's own generate(), split_validation(), TfidfModel and best_policy with run.py's defaults,
so the browser model is the "TF-IDF words" row of the project's README.

The project lives outside this repo (it's private); point at a local copy with --project or
the TICKET_ROUTING_DIR environment variable.
"""
from __future__ import annotations

import os
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd

# The project repo is private; point at a local checkout (default: a sibling folder).
DEFAULT_PROJECT = Path(os.environ.get("TICKET_ROUTING_DIR", Path(__file__).resolve().parents[4] / "ticket-routing"))
TESTS = ("test_new_wording", "test_new_issue_type")


@dataclass
class Trained:
    """The fitted words-only model, its policy, and the data it was trained and tuned on."""

    model: object  # routing.models.TfidfModel(use_chars=False), fitted and calibrated
    threshold: float
    runner_up_max: float
    queues: list[str]
    split: dict[str, pd.DataFrame]
    val_thr: pd.DataFrame
    project: Path


def train(project: Path = DEFAULT_PROJECT) -> Trained:
    """Reproduce run.py's synthetic run for the words-only model (default seed).

    run.py fits both TF-IDF models on the training split, temperature-scales them on the first
    half of validation, then searches each model's routing policy on the second half
    (policy_by_model). This does the same for the words-only model alone; the data, the split
    and the model are deterministic, so the result is the model behind the README's numbers.
    """
    project = project.resolve()
    if not (project / "run.py").is_file():
        raise SystemExit(f"no ticket-routing project at {project} (pass --project or set TICKET_ROUTING_DIR)")
    sys.path.insert(0, str(project))
    import run
    from routing import evaluation as ev
    from routing.generate import QUEUES, generate
    from routing.models import TfidfModel

    df = generate(seed=run.DEFAULT_SEED)
    split = {name: g for name, g in df.groupby("split")}
    train_set = split["train"]
    val_cal, val_thr = run.split_validation(split, run.DEFAULT_SEED)
    model = TfidfModel(use_chars=False).fit(train_set.text, train_set.queue).calibrate(val_cal.text, val_cal.queue)
    threshold, runner_up_max = ev.best_policy(val_thr.queue, model.predict_proba(val_thr.text), queues=QUEUES)
    return Trained(model, float(threshold), float(runner_up_max), list(QUEUES), split, val_thr, project)


def parts(model: object) -> tuple[object, object]:
    """(TfidfVectorizer, LogisticRegression) of a fitted words-only TfidfModel."""
    pipeline = model.pipeline  # type: ignore[attr-defined]
    return pipeline.steps[0][1], pipeline.steps[1][1]


def accuracy(labels: pd.Series, probs: np.ndarray, queues: list[str]) -> float:
    """Share of tickets whose top queue is the label (the project's `scores()["accuracy"]`)."""
    return float((np.array(queues)[probs.argmax(axis=1)] == labels.to_numpy()).mean())
