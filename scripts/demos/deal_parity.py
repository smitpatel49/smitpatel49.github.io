"""Parity test: the site's TypeScript deal model against the mna project's Python model.

Usage (site root; needs Node, the site's node_modules, and NumPy/pandas for the mna package):

    python scripts/demos/deal_parity.py /path/to/mna

Evaluates both on the same grid (premium x 66 financing mixes x synergy realization, every other
input at its closed-form median) and asserts every output agrees to 1e-9 relative: EPS accretion
for years 1-3, price, fees, cash used, new shares, leverage, both limit tests, the NPV and its
parts, and the walk-away premium. It also checks that the TS copy of deal.json, the medians and
the cautious (90th-percentile) premium match the project. Exit code 1 on any mismatch.
"""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np

REL_TOL = 1e-9
SITE = Path(__file__).resolve().parents[2]


def main(mna: Path) -> int:
    sys.path.insert(0, str(mna))
    from dealsim.analysis import CAUTIOUS_PERCENTILE
    from dealsim.model import Structure, project, within_limits
    from dealsim.simulate import medians, percentile
    from dealsim.value import npv, walk_away_premium

    deal = json.loads((mna / "deal.json").read_text(encoding="utf-8"))
    med = medians(deal)
    premiums = sorted({*np.round(np.arange(0, 0.6001, 0.05), 2).tolist(), float(med["premium"])})
    realizations = [0.0, 0.4, float(med["synergy_realization"]), 1.0, 1.2]
    levels = np.round(np.arange(0, 1.0001, 0.1), 1)
    mixes = [(float(c), float(d), round(1 - c - d, 1)) for c in levels for d in levels if c + d <= 1 + 1e-9]
    grid = [{"premium": p, "cash": c, "debt": d, "stock": s, "synergy_realization": r}
            for (c, d, s) in mixes for p in premiums for r in realizations]

    with tempfile.TemporaryDirectory() as tmp:
        grid_path, out_path = Path(tmp) / "grid.json", Path(tmp) / "ts.json"
        grid_path.write_text(json.dumps(grid), encoding="utf-8")
        subprocess.run(["node", str(SITE / "scripts/demos/deal-eval.mjs"), str(grid_path), str(out_path)],
                       check=True, cwd=SITE)
        ts = json.loads(out_path.read_text(encoding="utf-8"))

    failures: list[str] = []
    worst = {"rel": 0.0, "abs": 0.0}

    def close(name: str, py: float, js: float) -> None:
        diff = abs(py - js)
        scale = max(abs(py), abs(js))
        rel = diff / scale if scale else 0.0
        worst["rel"], worst["abs"] = max(worst["rel"], rel), max(worst["abs"], diff)
        if rel > REL_TOL:
            failures.append(f"{name}: python {py!r} vs ts {js!r} (rel {rel:.2e})")

    # inputs: the TS constant must be deal.json without its comment keys
    def strip(x):
        return {k: strip(v) for k, v in x.items() if not k.startswith("_")} if isinstance(x, dict) else x
    if ts["extras"]["deal"] != strip(deal):
        failures.append("DEAL in dealModel.ts differs from deal.json")
    for k, v in med.items():
        close(f"median {k}", float(v), ts["extras"]["medians"][k])
    close("cautious premium", float(percentile(deal, "premium", CAUTIOUS_PERCENTILE)), ts["extras"]["cautious_premium"])

    walk = {r: walk_away_premium(deal, {**med, "synergy_realization": r}) for r in realizations}
    i = 0
    for (c, d, s) in mixes:
        structure = Structure(c, d, s)
        n = len(premiums) * len(realizations)
        draws = {k: np.full(n, float(v)) for k, v in med.items()}
        draws["premium"] = np.repeat(premiums, len(realizations)).astype(float)
        draws["synergy_realization"] = np.tile(realizations, len(premiums)).astype(float)
        proj = project(deal, draws, structure)
        cash_ok, lev_ok, _ = within_limits(deal, structure, proj["price"])
        value = npv(deal, draws)
        for j in range(n):
            js = ts["results"][i]
            g = grid[i]
            assert (g["premium"], g["synergy_realization"]) == (draws["premium"][j], draws["synergy_realization"][j])
            tag = f"mix {c:.0%}/{d:.0%}/{s:.0%} premium {g['premium']:.4f} synergies {g['synergy_realization']:.3f}"
            for y in range(3):
                close(f"{tag} accretion y{y + 1}", float(proj["accretion"][j, y]), js["accretion"][y])
            for key in ("price", "fees", "cash_used", "new_shares", "leverage"):
                close(f"{tag} {key}", float(proj[key][j]), js[key])
            if bool(cash_ok[j]) != js["cash_ok"] or bool(lev_ok[j]) != js["leverage_ok"]:
                failures.append(f"{tag}: limit tests differ")
            for key in ("standalone_value", "synergy_value", "integration_cost_value", "cost_of_acquisition", "npv"):
                close(f"{tag} {key}", float(value[key][j]), js[key])
            close(f"{tag} walk-away", float(walk[g["synergy_realization"]]), js["walk_away"])
            i += 1

    print(f"{len(grid)} combinations ({len(mixes)} mixes x {len(premiums)} premiums x {len(realizations)} "
          f"synergy levels), 15 outputs each")
    print(f"max relative difference {worst['rel']:.2e}, max absolute difference {worst['abs']:.2e}")
    if failures:
        print(f"FAIL: {len(failures)} mismatches", *failures[:20], sep="\n  ")
        return 1
    print(f"PASS: Python and TypeScript agree to {REL_TOL:g} relative")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    sys.exit(main(Path(sys.argv[1]).resolve()))
