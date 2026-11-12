# AI-Driven Cab Booking Project Notes

## Project purpose

The system predicts travel time and uses that prediction to help select an available driver.

There are two separate parts:

1. The ML model predicts travel time.
2. The allocation engine ranks drivers using configurable weights.

The allocation formula is not the ML model.

## Folder structure

- `backend/`: FastAPI routes, request schemas, allocation logic, and database code.
- `ml/`: data download, cleaning, EDA, feature engineering, training, and evaluation.
- `models/`: saved Joblib model.
- `data/`: downloaded TLC data.
- `reports/`: schema, EDA, metadata, and model comparison reports.
- `tests/`: automated tests.
- `documents/`: project documents and notes.

## ML target

The model predicts passenger trip travel time in seconds.

```text
target = dropoff_datetime - pickup_datetime
```

The model is a real regression model trained on real public transportation records. It is not a rule-based score.

The saved model is:

```text
models/eta_travel_time.joblib
```

## Dataset

The main source is the official NYC Taxi & Limousine Commission High Volume FHV trip-record dataset.

The data is used to learn general NYC travel-time patterns. It does not represent this cab company's drivers.

The current local experiment used real records from January, October, and December 2025. The workflow can also download all twelve months of 2025.

Useful columns include:

- `pickup_datetime`
- `dropoff_datetime`
- `request_datetime`
- `PULocationID`
- `DOLocationID`
- `trip_time`
- `shared_request_flag`
- `wav_request_flag`

Fare, payment, tip, and post-trip fields are not used because they can cause data leakage.

## Feature engineering

The model uses:

- Origin and destination latitude/longitude
- Difference between origin and destination coordinates
- Straight-line distance
- Pickup hour
- Day of week
- Month
- Weekend indicator
- Shared-request and WAV-request indicators

Time values are represented with sine and cosine values so that times close to each other, such as 23:00 and 00:00, are treated as close.

## Data cleaning

The workflow:

1. Reads Parquet files.
2. Converts timestamps.
3. Removes missing and invalid locations.
4. Removes duplicates.
5. Removes impossible durations.
6. Joins locations with official taxi-zone geometry.
7. Creates the final feature table.

## Models compared

### Linear Regression

Used as a simple baseline model.

### Random Forest Regressor

Uses many decision trees and can learn non-linear patterns.

### HistGradientBoosting Regressor

Builds trees one after another and improves previous errors.

The current experiment selected HistGradientBoosting because it had the best validation result.

## Evaluation

The data is split by time instead of randomly:

- Earlier records: training
- Later records: validation
- Final records: test

Metrics:

- MAE: average absolute error in seconds.
- RMSE: gives more penalty to large errors.
- R²: how much variation in the target is explained by the model.

Current test result:

- MAE: about 290 seconds
- RMSE: about 453 seconds
- R²: about 0.696

## Backend routes

Start the backend:

```powershell
uvicorn backend.main:app --reload
```

Health check:

```http
GET /health
```

ETA prediction:

```http
POST /predict-eta
```

Driver assignment:

```http
POST /assign-driver
```

The assignment route first predicts ETA for available drivers and then ranks them using:

- Distance
- Predicted ETA
- Workload
- Acceptance rate

Availability is used as a filter. Unavailable drivers are not ranked.

## Database

MongoDB stores application data such as users, drivers, phone OTPs, bookings, assignments, and transactions. It is separate from the public TLC training data. Configure `MONGODB_URI` and `MONGODB_DATABASE` in `.env` before using these routes.

## Booking lifecycle

1. A logged-in user calls `GET /drivers/nearest`.
2. The user sends pickup and destination to `POST /bookings`.
3. The backend ranks available drivers with the ETA model and reserves the best driver with status `requested`.
4. The driver uses the access token returned by admin driver creation and calls accept, start, and complete routes.
5. Completing a ride creates one user debit transaction and one driver earning transaction.

Drivers are created by admins, not through signup. Every user and driver record has a role: `user`, `admin`, or `driver`.

## Phone OTP

`POST /auth/request-otp` creates a hashed OTP record in MongoDB. `backend/sms_service.py` is the integration boundary for a future SMS provider. Until one is connected, use `OTP_DEV_MODE=true` locally; the development OTP is printed by the backend. Phone OTP is the normal user signup and login flow.

The existing admin email/password login remains as a temporary compatibility path so the current administrator is not locked out. New users cannot use email/password login.

## Driver live location

The Socket.IO server accepts a driver JWT and the `driver_location_update` event. It updates the driver's latest coordinates in MongoDB and emits `driver_location` only to the authenticated user room for that driver's active booking. A user must first emit `watch_booking` for a booking they own; the server verifies ownership before joining the room. Random users cannot subscribe to another user's booking room.

## Important limitation

The TLC dataset does not contain our drivers' live GPS positions or complete driver-arrival labels. Therefore, the model should be described as a public-data-trained travel-time model, not as a model trained on our company's drivers.

A future company-specific model would need request time, driver GPS, acceptance time, arrival time, pickup time, and actual route duration.

## Common viva questions

### Why is this a genuine ML project?

A regression model is trained on real records, compared with other models, evaluated using regression metrics, saved with Joblib, and loaded by FastAPI.

### Why is the weighted score not the ML model?

The weighted score is a manually configurable ranking formula. It is not learned from training examples.

### Why use public TLC data?

It provides real travel-time examples while the cab company is still collecting its own history.

### Why use time-based splitting?

It better represents real prediction of future trips from past trips and reduces temporal leakage.

### What is Joblib?

Joblib saves the trained model so the backend can load it later without retraining.

## Useful commands

```powershell
python -m ml.acquire --year 2025 --months 1 10 12
python -m ml.inspect_dataset --data-dir data/raw --months 1 10 12
python -m ml.eda --data-dir data/raw --months 1 10 12 --sample-per-file 20000
python -m ml.train --data-dir data/raw --months 1 10 12 --sample-per-file 50000
python -m pytest -q
```
