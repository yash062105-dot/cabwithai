"""Download official NYC TLC source files and record a manifest."""

from __future__ import annotations

import argparse
import hashlib
import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from .config import (
    RAW_DATA_DIR,
    TLC_TRIP_URL,
    TLC_ZONE_LOOKUP_URL,
    TLC_ZONE_ZIP_URL,
)


def _download(url: str, destination: Path, force: bool = False) -> dict:
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists() and not force:
        size = destination.stat().st_size
    else:
        request = urllib.request.Request(url, headers={"User-Agent": "cab-booking-ml/1.0"})
        with urllib.request.urlopen(request, timeout=120) as response, destination.open("wb") as output:
            while chunk := response.read(1024 * 1024):
                output.write(chunk)
        size = destination.stat().st_size

    digest = hashlib.sha256()
    with destination.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return {
        "url": url,
        "path": str(destination),
        "bytes": size,
        "sha256": digest.hexdigest(),
        "downloaded_at_utc": datetime.now(timezone.utc).isoformat(),
    }


def download_sources(year: int, months: list[int], output_dir: Path, force: bool = False) -> dict:
    manifest = {"source": "NYC TLC official trip-record data", "year": year, "files": []}
    for month in months:
        filename = f"fhvhv_tripdata_{year}-{month:02d}.parquet"
        manifest["files"].append(_download(TLC_TRIP_URL.format(year=year, month=month), output_dir / filename, force))

    manifest["files"].append(_download(TLC_ZONE_ZIP_URL, output_dir / "taxi_zones.zip", force))
    manifest["files"].append(_download(TLC_ZONE_LOOKUP_URL, output_dir / "taxi_zone_lookup.csv", force))
    manifest_path = output_dir / "download_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--year", type=int, default=2025)
    parser.add_argument("--months", type=int, nargs="+", default=list(range(1, 13)))
    parser.add_argument("--data-dir", type=Path, default=RAW_DATA_DIR)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    manifest = download_sources(args.year, sorted(set(args.months)), args.data_dir, args.force)
    for item in manifest["files"]:
        print(f"{item['path']} ({item['bytes']:,} bytes) sha256={item['sha256']}")


if __name__ == "__main__":
    main()

