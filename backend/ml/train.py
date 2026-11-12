"""Train and compare real regression models on NYC TLC trip records."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from .config import FEATURE_COLUMNS, MODEL_PATH, MODELS_DIR, PUBLIC_COLUMNS, RAW_DATA_DIR, REPORTS_DIR
from .features import load_zone_centroids, records_to_features


def load_records(data_dir: Path, months: list[int], sample_per_file: int | None) -> pd.DataFrame:
    frames = []
    for month in sorted(set(months)):
        path = data_dir / f"fhvhv_tripdata_2025-{month:02d}.parquet"
        if not path.exists():
            raise FileNotFoundError(f"Missing TLC file: {path}. Run ml.acquire first.")
        frame = pd.read_parquet(path, columns=PUBLIC_COLUMNS)
        if sample_per_file and len(frame) > sample_per_file:
            frame = frame.sample(sample_per_file, random_state=42)
        frames.append(frame)
    return pd.concat(frames, ignore_index=True)


def metrics(y_true: pd.Series, prediction) -> dict:
    prediction = np.maximum(prediction, 0)
    return {
        "mae_seconds": float(mean_absolute_error(y_true, prediction)),
        "rmse_seconds": float(np.sqrt(mean_squared_error(y_true, prediction))),
        "r2": float(r2_score(y_true, prediction)),
    }


def chronological_split(features: pd.DataFrame, target: pd.Series, audit: pd.DataFrame) -> dict:
    dates = pd.to_datetime(audit["pickup_datetime"])
    train_mask = dates < pd.Timestamp("2025-10-01")
    validation_mask = (dates >= pd.Timestamp("2025-10-01")) & (dates < pd.Timestamp("2025-12-01"))
    test_mask = dates >= pd.Timestamp("2025-12-01")
    if not (train_mask.any() and validation_mask.any() and test_mask.any()):
        # Useful for the documented three-month local run: first, second, last
        # chronological month, while retaining temporal separation.
        unique_months = sorted(dates.dt.to_period("M").unique())
        if len(unique_months) < 3:
            raise ValueError("At least three chronological months are required for train/validation/test")
        train_mask = dates.dt.to_period("M") == unique_months[0]
        validation_mask = dates.dt.to_period("M") == unique_months[1]
        test_mask = dates.dt.to_period("M") == unique_months[-1]
    return {
        "train": (features.loc[train_mask].reset_index(drop=True), target.loc[train_mask].reset_index(drop=True)),
        "validation": (features.loc[validation_mask].reset_index(drop=True), target.loc[validation_mask].reset_index(drop=True)),
        "test": (features.loc[test_mask].reset_index(drop=True), target.loc[test_mask].reset_index(drop=True)),
    }


def train(data_dir: Path, months: list[int], sample_per_file: int | None) -> dict:
    records = load_records(data_dir, months, sample_per_file)
    centroids = load_zone_centroids(data_dir / "taxi_zones.zip")
    features, target, audit = records_to_features(records, centroids)
    splits = chronological_split(features, target, audit)

    models = {
        "linear_regression": LinearRegression(),
        "random_forest": RandomForestRegressor(
            n_estimators=200, max_depth=24, min_samples_leaf=2, n_jobs=-1, random_state=42
        ),
        "hist_gradient_boosting": HistGradientBoostingRegressor(
            max_iter=250, learning_rate=0.08, max_leaf_nodes=31, l2_regularization=1.0, random_state=42
        ),
    }
    results = {}
    for name, model in models.items():
        x_train, y_train = splits["train"]
        x_validation, y_validation = splits["validation"]
        x_test, y_test = splits["test"]
        model.fit(x_train[FEATURE_COLUMNS], y_train)
        results[name] = {
            "validation": metrics(y_validation, model.predict(x_validation[FEATURE_COLUMNS])),
            "test": metrics(y_test, model.predict(x_test[FEATURE_COLUMNS])),
        }

    selected_name = min(
        results,
        key=lambda name: (
            results[name]["validation"]["mae_seconds"],
            results[name]["validation"]["rmse_seconds"],
        ),
    )
    selected_model = models[selected_name]
    MODELS_DIR.mkdir(exist_ok=True)
    REPORTS_DIR.mkdir(exist_ok=True)
    artifact = {
        "model": selected_model,
        "metadata": {
            "model_name": selected_name,
            "target": "dropoff_datetime - pickup_datetime seconds",
            "feature_columns": FEATURE_COLUMNS,
            "source": "NYC TLC 2025 HVFHV public trip records",
            "months": sorted(set(months)),
            "sample_per_file": sample_per_file,
            "rows": {name: len(values[0]) for name, values in splits.items()},
            "public_data_boundary": "Does not represent this cab company's drivers",
        },
    }
    joblib.dump(artifact, MODEL_PATH)
    report = {
        "selected_model": selected_name,
        "models": results,
        "rows": artifact["metadata"]["rows"],
        "features": FEATURE_COLUMNS,
        "target": artifact["metadata"]["target"],
        "source": artifact["metadata"]["source"],
    }
    (REPORTS_DIR / "model_comparison.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    (REPORTS_DIR / "model_metadata.json").write_text(json.dumps(artifact["metadata"], indent=2), encoding="utf-8")
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, default=RAW_DATA_DIR)
    parser.add_argument("--months", type=int, nargs="+", default=list(range(1, 13)))
    parser.add_argument("--sample-per-file", type=int, default=50000)
    args = parser.parse_args()
    print(json.dumps(train(args.data_dir, args.months, args.sample_per_file), indent=2))


if __name__ == "__main__":
    main()
