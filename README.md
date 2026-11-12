# CAB Local Development

This workspace contains a React Native client in `cab/` and a FastAPI API in `backend/`. The app uses MongoDB for accounts, drivers, bookings, and ride transactions. This setup is for local development only.

## 1. Configure MongoDB Atlas

The backend uses MongoDB Atlas; a local MongoDB server is not required. Set `MONGODB_URI` in `backend/.env` to the Atlas driver's connection string and set `MONGODB_DATABASE` to the database name. In Atlas, allow the development machine's IP in Network Access and create a database user with read/write access. URL-encode reserved characters in the database user's password before placing it in the URI. Never commit or share `.env`.

## 2. Configure and start the API

From `backend/`, create `.env` from `.env.example` if one does not already exist. Set a private `JWT_SECRET`, Atlas URI, and admin credentials. Keep `OTP_DEV_MODE=true` for local testing; OTPs are returned by the API and printed in its terminal. The project already includes the trained ETA model at `backend/models/eta_travel_time.joblib`.

```sh
cd backend
test -f .env || cp .env.example .env
# Set MONGODB_URI in .env to your MongoDB Atlas connection string.
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m backend.bootstrap_admin
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Check `http://127.0.0.1:8000/health` and confirm `database.connected` is `true`; then open `http://127.0.0.1:8000/docs` for the local API. If it is false, verify the Atlas URI syntax, database user's credentials, Atlas IP access list, and outbound network access. The URI is never printed by the app.

## 3. Register a driver

Choose `Drive with CAB` on the registration screen, enter the driver's phone/name and vehicle/licence details, then verify the phone OTP. Driver profiles are created through `POST /auth/driver-signup`; initial coordinates come from the device GPS. Newly registered drivers start offline and can go online from their dashboard.

## 4. Run the mobile app

From `cab/`, install the JavaScript dependencies and start the Android app or iOS simulator:

```sh
cd cab
node --version  # React Native requires Node.js 22.11 or newer
pnpm install --frozen-lockfile
pnpm start
pnpm android
```

The Android emulator reaches the host API through `10.0.2.2`; iOS simulator uses `127.0.0.1`. For a physical Android device connected over USB, run `adb reverse tcp:8000 tcp:8000` and change `cab/src/constants/variable.ts` to the computer's LAN address if needed. After adding native modules, install iOS pods on macOS with `cd cab/ios && pod install` before building for iOS.

## Local flow

Location permission and a current device location are required before the app shows any screens. Riders use OpenStreetMap place search or tap the map to set the destination; drivers send foreground GPS updates while online or during an active ride. The map uses OpenStreetMap tiles and public routing/geocoding services, so internet access is required and public-service usage limits apply. Every ride is cash in hand; there is no payment gateway or wallet checkout. Completed cash fares are recorded in history/earnings. OTP uses development mode; no SMS provider is configured.