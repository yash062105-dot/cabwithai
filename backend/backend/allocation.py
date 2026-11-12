"""Configurable driver-ranking optimization, separate from the ML model."""

from __future__ import annotations

import math
from dataclasses import dataclass


DEFAULT_WEIGHTS = {
    "distance": 0.35,
    "predicted_eta": 0.35,
    "workload": 0.15,
    "acceptance_rate": 0.15,
}


@dataclass(frozen=True)
class CandidateScore:
    driver_id: str
    distance_miles: float
    predicted_eta_seconds: float
    workload: float
    acceptance_rate: float
    score: float


def haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 3958.7613
    lat1, lat2 = math.radians(lat1), math.radians(lat2)
    dlat = lat2 - lat1
    dlon = math.radians(lon2 - lon1)
    value = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return radius * 2 * math.asin(math.sqrt(max(0.0, min(1.0, value))))


def _normalise(value: float, low: float, high: float) -> float:
    if high <= low:
        return 0.0
    return (value - low) / (high - low)


def rank_drivers(drivers: list[dict], passenger_lat: float, passenger_lon: float, eta_predictor, weights: dict[str, float] | None = None, pickup_datetime=None) -> list[CandidateScore]:
    """Rank available drivers with a transparent weighted score.

    `eta_predictor` is injected; this function does not train or implement ML.
    """
    active = [driver for driver in drivers if driver.get("available", True)]
    if not active:
        return []
    selected_weights = {**DEFAULT_WEIGHTS, **(weights or {})}
    weight_total = sum(max(0.0, value) for value in selected_weights.values()) or 1.0
    selected_weights = {key: max(0.0, value) / weight_total for key, value in selected_weights.items()}

    rows = []
    for driver in active:
        distance = haversine_miles(driver["latitude"], driver["longitude"], passenger_lat, passenger_lon)
        eta_seconds = float(eta_predictor(driver, passenger_lat, passenger_lon, pickup_datetime))
        rows.append({**driver, "distance_miles": distance, "predicted_eta_seconds": max(0.0, eta_seconds)})
    distances = [row["distance_miles"] for row in rows]
    etas = [row["predicted_eta_seconds"] for row in rows]
    workloads = [float(row.get("workload", 0)) for row in rows]
    scores = []
    for row in rows:
        score = (
            selected_weights["distance"] * _normalise(row["distance_miles"], min(distances), max(distances))
            + selected_weights["predicted_eta"] * _normalise(row["predicted_eta_seconds"], min(etas), max(etas))
            + selected_weights["workload"] * _normalise(float(row.get("workload", 0)), min(workloads), max(workloads))
            + selected_weights["acceptance_rate"] * (1.0 - float(row.get("acceptance_rate", 0)))
        )
        scores.append(CandidateScore(row["driver_id"], row["distance_miles"], row["predicted_eta_seconds"], float(row.get("workload", 0)), float(row.get("acceptance_rate", 0)), score))
    return sorted(scores, key=lambda item: (item.score, item.predicted_eta_seconds, item.distance_miles))

