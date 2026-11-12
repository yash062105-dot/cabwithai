# AI-Driven Cab Booking System

A Python-based cab booking platform with ETA prediction, driver assignment, authentication, and booking workflows.

## Overview

This project combines:

- ML: predicts trip duration from TLC taxi data
- Optimization: ranks available drivers using weighted scoring
- Backend: FastAPI service for booking, auth, predictions, and admin APIs
- Data layer: MongoDB for users, drivers, bookings, assignments, and transactions

## Key features

- ETA prediction for pickup-to-dropoff duration
- Driver matching and assignment based on proximity, workload, and score
- OTP-based user and driver registration/login
- Booking lifecycle: requested -> accepted -> in_progress -> completed
- Foreground driver GPS updates and rider live location tracking
- Cash-in-hand fare recording (no payment gateway)
- Admin dashboard endpoints for users, drivers, bookings, and transactions

## Tech stack

- Python 3.10+
- FastAPI
- MongoDB
- scikit-learn / joblib
- Socket.IO
- Local development with MongoDB Atlas

## Project structure

- `backend/` — FastAPI app, authentication, booking logic, admin APIs
- `ml/` — data acquisition, training, evaluation, and model scripts
- `models/` — trained ML artifacts
- `data/` — raw and processed datasets
- `notes/` — project notes

## Prerequisites

- Python 3.10+
- MongoDB Atlas account and connection string
- Virtual environment

## Setup

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

Create environment variables from `.env.example`:

```sh
test -f .env || cp .env.example .env
```

Set `MONGODB_URI` to the MongoDB Atlas connection string and `MONGODB_DATABASE` to the database name. Add the development machine's IP to the Atlas Network Access list and use a database user with read/write access. URL-encode reserved characters in the database password. Set a private `JWT_SECRET`; keep `OTP_DEV_MODE=true` only for local testing. Check `/health` and ensure `database.connected` is `true` before testing database-backed routes.

## Train the model

```powershell
python -m ml.acquire --year 2025 --months 1 10 12
python -m ml.train --data-dir data/raw --months 1 10 12 --sample-per-file 50000
```

The trained model is saved to `models/eta_travel_time.joblib`.

## Run the API

```sh
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Open the API docs at:

- `/docs`
- `/redoc`

Create the initial admin user:

```powershell
python -m backend.bootstrap_admin
```

## Main routes

### Core

- `GET /health`
- `POST /predict-eta`
- `POST /assign-driver`

### Authentication

- `POST /auth/request-otp`
- `POST /auth/signup`
- `POST /auth/driver-signup`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/forgot-password`
- `POST /auth/verify-otp`

### Booking and driver flows

- `GET /drivers/nearest`
- `POST /bookings`
- `GET /bookings`
- `GET /bookings/{booking_id}`
- `POST /bookings/{booking_id}/cancel`
- `POST /driver/bookings/{booking_id}/accept`
- `POST /driver/bookings/{booking_id}/start`
- `POST /driver/bookings/{booking_id}/complete`
- `PATCH /driver/availability`
- `PATCH /driver/location`

### Admin

- `GET/POST /admin/users`
- `DELETE /admin/users/{user_id}`
- `GET/POST /admin/drivers`
- `PATCH/DELETE /admin/drivers/{driver_id}`
- `GET /admin/bookings`
- `GET /admin/transactions`

## Notes

- TLC public taxi data is used only for travel-time learning.
- Runtime booking and driver state are stored in MongoDB.
- Drivers can register themselves by verifying their phone OTP and submitting vehicle/licence details. Document image upload/manual verification is not implemented.
- Drivers send foreground GPS coordinates while online or during an active ride; location permission is required in the mobile client.
- Maps and route search use OpenStreetMap, Nominatim, and OSRM public services; internet and their public usage limits apply.
- Every ride is cash in hand. The API records completed fare history but does not process a payment.

For additional project context, see `notes/PROJECT_NOTES.md`.
