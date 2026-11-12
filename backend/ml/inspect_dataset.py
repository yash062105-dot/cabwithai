"""Inspect downloaded TLC Parquet schemas without modeling."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd
import pyarrow.parquet as pq

from .config import PUBLIC_COLUMNS, RAW_DATA_DIR, REPORTS_DIR


def inspect(data_dir: Path, months: list[int]) -> dict:
    result = {"data_dir": str(data_dir), "files": []}
    for month in sorted(set(months)):
        path = data_dir / f"fhvhv_tripdata_2025-{month:02d}.parquet"
        if not path.exists():
            continue
        available_columns = set(pq.ParquetFile(path).schema.names)
        sample = pd.read_parquet(path, columns=[c for c in PUBLIC_COLUMNS if c in available_columns]).head(5)
        result["files"].append(
            {
                "path": str(path),
                "bytes": path.stat().st_size,
                "columns": list(sample.columns),
                "sample": sample.astype(str).to_dict(orient="records"),
            }
        )
    REPORTS_DIR.mkdir(exist_ok=True)
    output = REPORTS_DIR / "source_schema.json"
    output.write_text(json.dumps(result, indent=2, default=str), encoding="utf-8")
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, default=RAW_DATA_DIR)
    parser.add_argument("--months", type=int, nargs="+", default=list(range(1, 13)))
    args = parser.parse_args()
    result = inspect(args.data_dir, args.months)
    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()
