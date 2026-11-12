"""Create a reproducible exploratory-analysis summary from TLC records."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd

from .config import PUBLIC_COLUMNS, RAW_DATA_DIR, REPORTS_DIR
from .features import load_zone_centroids, records_to_features


def load_sample(data_dir: Path, months: list[int], sample_per_file: int | None) -> pd.DataFrame:
    frames = []
    for month in sorted(set(months)):
        path = data_dir / f"fhvhv_tripdata_2025-{month:02d}.parquet"
        if not path.exists():
            continue
        frame = pd.read_parquet(path, columns=PUBLIC_COLUMNS)
        if sample_per_file and len(frame) > sample_per_file:
            frame = frame.sample(sample_per_file, random_state=42)
        frames.append(frame)
    if not frames:
        raise FileNotFoundError("No requested TLC Parquet files found")
    return pd.concat(frames, ignore_index=True)


def create_report(data_dir: Path, months: list[int], sample_per_file: int | None) -> dict:
    records = load_sample(data_dir, months, sample_per_file)
    centroids = load_zone_centroids(data_dir / "taxi_zones.zip")
    features, target, audit = records_to_features(records, centroids)
    pickup = audit["pickup_datetime"]
    report = {
        "source": "NYC TLC 2025 HVFHV public trip records",
        "months": sorted(set(months)),
        "input_rows": int(len(records)),
        "clean_rows": int(len(audit)),
        "dropped_rows": int(len(records) - len(audit)),
        "feature_columns": list(features.columns),
        "target": "dropoff_datetime - pickup_datetime seconds",
        "target_summary_seconds": target.describe().to_dict(),
        "missing_values": records.isna().sum().to_dict(),
        "duration_by_hour_seconds": target.groupby(pickup.dt.hour).mean().to_dict(),
        "duration_by_weekday_seconds": target.groupby(pickup.dt.dayofweek).mean().to_dict(),
        "distance_summary_miles": features["straight_line_distance_miles"].describe().to_dict(),
    }
    REPORTS_DIR.mkdir(exist_ok=True)
    (REPORTS_DIR / "eda_summary.json").write_text(json.dumps(report, indent=2, default=float), encoding="utf-8")
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, default=RAW_DATA_DIR)
    parser.add_argument("--months", type=int, nargs="+", default=list(range(1, 13)))
    parser.add_argument("--sample-per-file", type=int, default=50000)
    args = parser.parse_args()
    print(json.dumps(create_report(args.data_dir, args.months, args.sample_per_file), indent=2, default=float))


if __name__ == "__main__":
    main()

