"""Cleaning and feature engineering shared by training and inference."""

from __future__ import annotations

import io
import math
import zipfile
from pathlib import Path

import numpy as np
import pandas as pd
import shapefile
from pyproj import CRS, Transformer

from .config import FEATURE_COLUMNS, PUBLIC_COLUMNS


def _shape_centroid(points: list[tuple[float, float]]) -> tuple[float, float]:
    if not points:
        return (math.nan, math.nan)
    # The mean of boundary points is a stable zone-center approximation and avoids
    # introducing any synthetic location data.
    xs = np.asarray([point[0] for point in points], dtype=float)
    ys = np.asarray([point[1] for point in points], dtype=float)
    return float(xs.mean()), float(ys.mean())


def load_zone_centroids(zone_zip: Path) -> pd.DataFrame:
    """Read official TLC zone geometry and return LocationID -> WGS84 centroid."""
    with zipfile.ZipFile(zone_zip) as archive:
        names = {name.lower(): name for name in archive.namelist()}
        shp_name = next(name for key, name in names.items() if key.endswith(".shp"))
        shx_name = next(name for key, name in names.items() if key.endswith(".shx"))
        dbf_name = next(name for key, name in names.items() if key.endswith(".dbf"))
        prj_name = next((name for key, name in names.items() if key.endswith(".prj")), None)
        reader = shapefile.Reader(
            shp=io.BytesIO(archive.read(shp_name)),
            shx=io.BytesIO(archive.read(shx_name)),
            dbf=io.BytesIO(archive.read(dbf_name)),
        )
        source_crs = CRS.from_wkt(archive.read(prj_name).decode("utf-8")) if prj_name else CRS.from_epsg(4326)

        transformer = Transformer.from_crs(source_crs, CRS.from_epsg(4326), always_xy=True)
        records: list[dict] = []
        for shape_record in reader.iterShapeRecords():
            attrs = shape_record.record.as_dict()
            location_id = attrs.get("LocationID") or attrs.get("locationid")
            x, y = _shape_centroid(shape_record.shape.points)
            lon, lat = transformer.transform(x, y)
            records.append({"LocationID": int(location_id), "lat": lat, "lon": lon})
    return pd.DataFrame(records).drop_duplicates("LocationID").set_index("LocationID")


def _flag(series: pd.Series) -> pd.Series:
    return series.fillna("N").astype(str).str.upper().isin(["Y", "1", "TRUE"]).astype(float)


def _distance_miles(lat1: pd.Series, lon1: pd.Series, lat2: pd.Series, lon2: pd.Series) -> pd.Series:
    earth_radius_miles = 3958.7613
    lat1_rad, lat2_rad = np.radians(lat1), np.radians(lat2)
    dlat = lat2_rad - lat1_rad
    dlon = np.radians(lon2) - np.radians(lon1)
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(dlon / 2) ** 2
    return earth_radius_miles * 2 * np.arcsin(np.sqrt(np.clip(a, 0, 1)))


def _time_features(pickup: pd.Series) -> pd.DataFrame:
    hour = pickup.dt.hour + pickup.dt.minute / 60.0
    dow = pickup.dt.dayofweek
    month = pickup.dt.month
    return pd.DataFrame(
        {
            "pickup_hour_sin": np.sin(2 * np.pi * hour / 24),
            "pickup_hour_cos": np.cos(2 * np.pi * hour / 24),
            "pickup_dow_sin": np.sin(2 * np.pi * dow / 7),
            "pickup_dow_cos": np.cos(2 * np.pi * dow / 7),
            "pickup_month_sin": np.sin(2 * np.pi * month / 12),
            "pickup_month_cos": np.cos(2 * np.pi * month / 12),
            "is_weekend": (dow >= 5).astype(float),
        },
        index=pickup.index,
    )


def records_to_features(records: pd.DataFrame, zone_centroids: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series, pd.DataFrame]:
    """Clean public records and create inference-compatible features.

    Returns features, target seconds, and a cleaned audit frame.
    """
    missing = set(PUBLIC_COLUMNS) - set(records.columns)
    if missing:
        raise ValueError(f"Missing expected TLC columns: {sorted(missing)}")

    frame = records.copy()
    for column in ["request_datetime", "pickup_datetime", "dropoff_datetime"]:
        frame[column] = pd.to_datetime(frame[column], errors="coerce")
    for column in ["PULocationID", "DOLocationID"]:
        frame[column] = pd.to_numeric(frame[column], errors="coerce")

    frame["duration_seconds"] = (frame["dropoff_datetime"] - frame["pickup_datetime"]).dt.total_seconds()
    frame["reported_trip_time"] = pd.to_numeric(frame["trip_time"], errors="coerce")
    frame["duration_difference_seconds"] = (frame["duration_seconds"] - frame["reported_trip_time"]).abs()

    frame = frame.dropna(subset=["pickup_datetime", "dropoff_datetime", "PULocationID", "DOLocationID", "duration_seconds"])
    frame = frame[(frame["duration_seconds"] >= 30) & (frame["duration_seconds"] <= 4 * 60 * 60)]
    frame = frame[frame["PULocationID"].isin(zone_centroids.index) & frame["DOLocationID"].isin(zone_centroids.index)]
    frame = frame.drop_duplicates()

    origin = zone_centroids.reindex(frame["PULocationID"].astype(int)).reset_index(drop=True)
    destination = zone_centroids.reindex(frame["DOLocationID"].astype(int)).reset_index(drop=True)
    pickup = frame["pickup_datetime"].reset_index(drop=True)
    features = pd.DataFrame(
        {
            "origin_lat": origin["lat"].to_numpy(),
            "origin_lon": origin["lon"].to_numpy(),
            "destination_lat": destination["lat"].to_numpy(),
            "destination_lon": destination["lon"].to_numpy(),
        }
    )
    features["delta_lat"] = features["destination_lat"] - features["origin_lat"]
    features["delta_lon"] = features["destination_lon"] - features["origin_lon"]
    features["straight_line_distance_miles"] = _distance_miles(
        features["origin_lat"], features["origin_lon"], features["destination_lat"], features["destination_lon"]
    )
    features = pd.concat([features, _time_features(pickup).reset_index(drop=True)], axis=1)
    features["shared_request"] = _flag(frame["shared_request_flag"]).reset_index(drop=True)
    features["wav_request"] = _flag(frame["wav_request_flag"]).reset_index(drop=True)
    features["access_a_ride"] = _flag(frame["access_a_ride_flag"]).reset_index(drop=True)
    features = features[FEATURE_COLUMNS].astype(float)
    target = frame["duration_seconds"].reset_index(drop=True).astype(float)
    audit = frame.reset_index(drop=True)
    return features, target, audit


def make_inference_features(
    origin_lat: float,
    origin_lon: float,
    destination_lat: float,
    destination_lon: float,
    pickup_datetime: pd.Timestamp,
    shared_request: bool = False,
    wav_request: bool = False,
    access_a_ride: bool = False,
) -> pd.DataFrame:
    """Build the same feature schema for an application prediction."""
    row = pd.DataFrame(
        {
            "origin_lat": [origin_lat],
            "origin_lon": [origin_lon],
            "destination_lat": [destination_lat],
            "destination_lon": [destination_lon],
        }
    )
    row["delta_lat"] = row["destination_lat"] - row["origin_lat"]
    row["delta_lon"] = row["destination_lon"] - row["origin_lon"]
    row["straight_line_distance_miles"] = _distance_miles(
        row["origin_lat"], row["origin_lon"], row["destination_lat"], row["destination_lon"]
    )
    row = pd.concat([row, _time_features(pd.Series([pd.Timestamp(pickup_datetime)]))], axis=1)
    row["shared_request"] = float(shared_request)
    row["wav_request"] = float(wav_request)
    row["access_a_ride"] = float(access_a_ride)
    return row[FEATURE_COLUMNS].astype(float)

