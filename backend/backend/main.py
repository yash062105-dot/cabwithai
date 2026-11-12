from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone
import os

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pymongo.errors import PyMongoError

from .allocation import DEFAULT_WEIGHTS, rank_drivers
from .admin_routes import analysis as build_analysis
from .admin_routes import router as admin_router
from .admin_data import router as admin_data_router
from .auth_routes import router as auth_router
from .booking_routes import router as booking_router
from .dependencies import require_admin
from .mongodb import DatabaseNotConfigured, close_database, database_health, ensure_indexes
from .ml_service import EtaModelService
from .realtime import create_socket_app
from .schemas import AssignmentRequest, AssignmentResponse, EtaRequest, EtaResponse
from ml.config import MODEL_PATH

load_dotenv()

_eta_service: EtaModelService | None = None


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        ensure_indexes()
    except (DatabaseNotConfigured, PyMongoError):
        pass
    try:
        yield
    finally:
        close_database()


app = FastAPI(title="AI-Driven Cab Booking API", version="1.0.0", lifespan=lifespan)
allowed_origins = [origin.strip() for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(admin_data_router)
app.include_router(booking_router)


@app.get("/", include_in_schema=False)
def root() -> dict:
    return {
        "service": "AI-Driven Cab Booking API",
        "status": "running",
        "docs": "/docs",
        "routes": ["/health", "/predict-eta", "/assign-driver", "/drivers/nearest", "/bookings/*", "/transactions/*", "/auth/*", "/admin/*", "/analysis"],
    }


@app.get("/favicon.ico", include_in_schema=False, status_code=204)
def favicon() -> Response:
    return Response(status_code=204)


def get_eta_service() -> EtaModelService:
    global _eta_service
    if _eta_service is None:
        _eta_service = EtaModelService()
    return _eta_service


@app.get("/health")
def health() -> dict:
    database = database_health()
    return {"status": "ok", "model_loaded": MODEL_PATH.exists(), "database": database, "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/analysis", tags=["admin"], dependencies=[Depends(require_admin)])
def analysis() -> dict:
    return build_analysis()


@app.post("/predict-eta", response_model=EtaResponse)
def predict_eta(request: EtaRequest) -> EtaResponse:
    try:
        service = get_eta_service()
        seconds = service.predict_seconds(**request.model_dump())
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return EtaResponse(
        predicted_travel_time_seconds=seconds,
        predicted_travel_time_minutes=seconds / 60,
        model_name=service.metadata["model_name"],
        source_note="Trained on official NYC TLC public trip records; not company-driver data.",
    )


@app.post("/assign-driver", response_model=AssignmentResponse)
def assign_driver(request: AssignmentRequest) -> AssignmentResponse:
    try:
        service = get_eta_service()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    def predictor(driver, passenger_lat, passenger_lon, pickup_datetime):
        return service.predict_seconds(driver["latitude"], driver["longitude"], passenger_lat, passenger_lon, pickup_datetime)

    ranked = rank_drivers(
        [driver.model_dump() for driver in request.drivers],
        request.passenger_lat,
        request.passenger_lon,
        predictor,
        request.weights,
        request.pickup_datetime,
    )
    weights = {**DEFAULT_WEIGHTS, **(request.weights or {})}
    return AssignmentResponse(
        assigned_driver_id=ranked[0].driver_id if ranked else None,
        ranked_drivers=[score.__dict__ for score in ranked],
        weights=weights,
    )


socket_app = create_socket_app(app, allowed_origins)
