"""Export the demand-forecast backtest to the compact JSON the site's forecast explorer reads.

Usage (from the site root, with the demand-forecast checkout next to it or anywhere else):

    python scripts/demos/export_forecast.py /path/to/demand-forecast [public/demos/forecast.json]

Reads the project's committed backtest (results/backtest_predictions.csv.gz: 12 synthetic series,
four 4-week folds from 11 Sep to 31 Dec 2025, horizons 1-7) and keeps, per series, the daily
actual units, the promotion days, and for every horizon the point forecast (LightGBM trained on
absolute error, i.e. a median forecast) and the conformal q90 and q95 stock levels.

Forecasts are rounded to 2 decimals, except that a value just below a whole number is never
rounded up to it (44.996 becomes 44.99, not 45.00). Actual units are whole numbers, so
"actual <= stock" is unchanged, the in-stock rates computed from the JSON equal the project's
exactly, and the share served and leftover move only by rounding noise (check_forecast.mjs).
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import pandas as pd

LEVELS = {"forecast": "median", "q90_conformal": "q90", "q95_conformal": "q95"}


def round2(x: float) -> float:
    r = round(x, 2)
    # rounding up across a whole number would turn a sold-out day into an in-stock one
    if math.floor(r) > math.floor(x):
        r = round(math.floor(x) + 0.99, 2)
    return r


def main(project: Path, out: Path) -> None:
    df = pd.read_csv(project / "results" / "backtest_predictions.csv.gz", parse_dates=["date"])
    dates = sorted(df.date.unique())
    start = pd.Timestamp(dates[0])
    expected = pd.date_range(start, periods=len(dates))
    if list(pd.DatetimeIndex(dates)) != list(expected):
        raise SystemExit("backtest dates are not one contiguous daily range")
    if (df.units % 1 != 0).any():
        raise SystemExit("expected whole-unit actuals (flooring relies on it)")
    horizons = sorted(int(h) for h in df.horizon.unique())
    fold_starts = (df.groupby("fold").date.min().sort_index() - start).dt.days.tolist()

    series = []
    for name, g in df.groupby("series", sort=True):
        h1 = g[g.horizon == horizons[0]].sort_values("date")
        if len(h1) != len(dates):
            raise SystemExit(f"{name}: expected {len(dates)} days, got {len(h1)}")
        entry = {
            "store": str(h1.store.iloc[0]),
            "category": str(h1.category.iloc[0]),
            "units": [int(u) for u in h1.units],
            "promoDays": [int(i) for i in (h1.date[h1.promo == 1] - start).dt.days],
            "closedDays": [int(i) for i in (h1.date[h1.closed == 1] - start).dt.days],
        }
        for column, key in LEVELS.items():
            rows = []
            for h in horizons:
                gh = g[g.horizon == h].sort_values("date")
                if list(gh.units) != list(h1.units):
                    raise SystemExit(f"{name}: actuals differ between horizons")
                rows.append([round2(v) for v in gh[column]])
            entry[key] = rows
        series.append(entry)

    payload = {
        "_source": "demand-forecast results/backtest_predictions.csv.gz (committed rolling-origin backtest, "
                   "synthetic data). median = point forecast (LightGBM, absolute-error loss); q90/q95 = "
                   "split-conformal stock levels. Values rounded to 2 decimals, never up to a whole number. Arrays are indexed "
                   "[horizon - 1][day], day 0 = start.",
        "start": start.strftime("%Y-%m-%d"),
        "days": len(dates),
        "horizons": horizons,
        "foldStarts": [int(d) for d in fold_starts],
        "series": series,
    }
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"wrote {out} ({out.stat().st_size / 1024:.0f} KB, {len(series)} series x {len(dates)} days x "
          f"{len(horizons)} horizons)")


if __name__ == "__main__":
    if len(sys.argv) not in (2, 3):
        raise SystemExit(__doc__)
    main(Path(sys.argv[1]), Path(sys.argv[2] if len(sys.argv) == 3 else "public/demos/forecast.json"))
