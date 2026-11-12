from __future__ import annotations

from datetime import datetime
from pathlib import Path

import joblib
import pandas as pd

from ml.config import MODEL_PATH
from ml.features import make_inference_features


class EtaModelService:
    def __init__(self, model_path: Path = MODEL_PATH):
        if not model_path.exists():
            raise FileNotFoundError(f"Trained model not found at {model_path}. Run python -m ml.train first.")
        artifact = joblib.load(model_path)
        self.model = artifact["model"]
        self.metadata = artifact["metadata"]

    def predict_seconds(self, origin_lat: float, origin_lon: float, destination_lat: float, destination_lon: float, pickup_datetime: datetime, shared_request: bool = False, wav_request: bool = False, access_a_ride: bool = False) -> float:
        features = make_inference_features(origin_lat, origin_lon, destination_lat, destination_lon, pd.Timestamp(pickup_datetime), shared_request, wav_request, access_a_ride)
        return max(0.0, float(self.model.predict(features)[0]))

