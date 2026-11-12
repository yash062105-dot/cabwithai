from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
RAW_DATA_DIR = PROJECT_ROOT / "data" / "raw"
PROCESSED_DATA_DIR = PROJECT_ROOT / "data" / "processed"
REPORTS_DIR = PROJECT_ROOT / "reports"
MODELS_DIR = PROJECT_ROOT / "models"

TLC_BASE_URL = "https://d37ci6vzurychx.cloudfront.net"
TLC_TRIP_URL = TLC_BASE_URL + "/trip-data/fhvhv_tripdata_{year}-{month:02d}.parquet"
TLC_ZONE_ZIP_URL = TLC_BASE_URL + "/misc/taxi_zones.zip"
TLC_ZONE_LOOKUP_URL = TLC_BASE_URL + "/misc/taxi_zone_lookup.csv"

MODEL_PATH = MODELS_DIR / "eta_travel_time.joblib"
MODEL_METADATA_PATH = REPORTS_DIR / "model_metadata.json"

PUBLIC_COLUMNS = [
    "request_datetime",
    "pickup_datetime",
    "dropoff_datetime",
    "PULocationID",
    "DOLocationID",
    "trip_time",
    "shared_request_flag",
    "wav_request_flag",
    "access_a_ride_flag",
]

FEATURE_COLUMNS = [
    "origin_lat",
    "origin_lon",
    "destination_lat",
    "destination_lon",
    "delta_lat",
    "delta_lon",
    "straight_line_distance_miles",
    "pickup_hour_sin",
    "pickup_hour_cos",
    "pickup_dow_sin",
    "pickup_dow_cos",
    "pickup_month_sin",
    "pickup_month_cos",
    "is_weekend",
    "shared_request",
    "wav_request",
    "access_a_ride",
]

