# CAB Admin Console

The React + TypeScript admin console reads and updates live platform data through the FastAPI admin API. It does not use mock dashboard data or a WebSocket connection.

## Run locally

1. Start the backend and configure its `FRONTEND_ORIGINS` to include the admin origin (Vite defaults to `http://localhost:5173`).
2. Set `VITE_API_URL` if the backend is not at `http://localhost:8000`.
3. Install dependencies and start the console:

   ```sh
   pnpm install
   pnpm dev
   ```

Sign in with the provisioned administrator email and password. Admin accounts are provisioned by the backend bootstrap process.

## Modules

- Overview: account, fleet, ride, and recorded-payment summaries.
- Users and drivers: server-side search, status/date filters, pagination, account details, and audited status changes.
- Cabs and live monitoring: registered vehicles, current driver coordinates, and assigned ride details. Monitoring refreshes through REST polling.
- Rides: server-side ride filters and complete booking/payment details.
- Revenue: daily, weekly, and monthly aggregates from completed ride payment and driver earning ledger records.

Platform commission is not calculated because no commission policy or commission ledger is configured.

## Validation

```sh
pnpm run build
pnpm run lint
```
