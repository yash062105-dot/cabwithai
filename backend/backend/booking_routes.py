from __future__ import annotations

from dataclasses import asdict
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from .allocation import DEFAULT_WEIGHTS, haversine_miles, rank_drivers
from .dependencies import get_current_driver, get_current_user, require_user
from .ml_service import EtaModelService
from .mongodb import DatabaseNotConfigured, get_database, object_id
from .realtime import emit_booking_status, emit_driver_event
from .schemas import BookingCreateRequest, DriverLocationRequest, RideActionRequest

router = APIRouter(tags=["bookings"])
_eta_service: EtaModelService | None = None
CAB_FARES = {
    "Mini": {"base_fare": 110, "fare_per_km": 12},
    "Sedan": {"base_fare": 160, "fare_per_km": 16},
    "SUV": {"base_fare": 240, "fare_per_km": 24},
    "Auto": {"base_fare": 70, "fare_per_km": 9},
}


def now() -> datetime:
    return datetime.now(timezone.utc)


def serialize(value):
    if isinstance(value, dict):
        return {key: serialize(item) for key, item in value.items()}
    if isinstance(value, list):
        return [serialize(item) for item in value]
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    return value


def database_error(exc: Exception) -> HTTPException:
    if isinstance(exc, DatabaseNotConfigured):
        return HTTPException(status_code=503, detail="MongoDB is not configured")
    return HTTPException(status_code=503, detail="Database is unavailable")


def eta_service() -> EtaModelService:
    global _eta_service
    if _eta_service is None:
        _eta_service = EtaModelService()
    return _eta_service


def active_drivers() -> list[dict]:
    return list(
        get_database().drivers.find(
            {
                "available": True,
                "role": "driver",
                "$or": [
                    {"status": "active"},
                    {"status": {"$exists": False}},
                ],
            }
        )
    )


@router.get("/cab-options")
def cab_options(_: dict = Depends(require_user)) -> list[dict]:
    try:
        counts = {}
        for driver in active_drivers():
            cab_type = driver.get("vehicle_type")
            if cab_type in CAB_FARES:
                counts[cab_type] = counts.get(cab_type, 0) + 1
        return [
            {
                "type": cab_type,
                **fare,
                "available_drivers": counts[cab_type],
            }
            for cab_type, fare in CAB_FARES.items()
            if counts.get(cab_type, 0) > 0
        ]
    except Exception as exc:
        raise database_error(exc) from exc


@router.get("/driver/me")
def driver_profile(driver: dict = Depends(get_current_driver)) -> dict:
    return {
        "driver_id": driver["driver_id"],
        "name": driver.get("name", ""),
        "phone": driver.get("phone"),
        "online": driver.get("online", driver.get("available", False)),
        "available": driver.get("available", False),
        "completed_rides": driver.get("completed_rides", 0),
        "vehicle_type": driver.get("vehicle_type"),
        "vehicle_model": driver.get("vehicle_model"),
        "vehicle_number": driver.get("vehicle_number"),
        "license_number": driver.get("license_number"),
    }


def rank_database_drivers(drivers: list[dict], request: BookingCreateRequest):
    pickup_datetime = request.pickup_datetime or now()

    def predictor(driver, passenger_lat, passenger_lon, pickup_time):
        return eta_service().predict_seconds(driver["latitude"], driver["longitude"], passenger_lat, passenger_lon, pickup_time)

    return rank_drivers(drivers, request.pickup_lat, request.pickup_lon, predictor, request.weights, pickup_datetime)


@router.get("/drivers/nearest")
def nearest_drivers(
    pickup_lat: float = Query(ge=-90, le=90),
    pickup_lon: float = Query(ge=-180, le=180),
    limit: int = Query(default=10, ge=1, le=50),
    _: dict = Depends(require_user),
) -> list[dict]:
    try:
        drivers = active_drivers()
        rows = []
        for driver in drivers:
            rows.append({
                "driver_id": driver["driver_id"],
                "name": driver.get("name", ""),
                "phone": driver.get("phone"),
                "latitude": driver["latitude"],
                "longitude": driver["longitude"],
                "distance_miles": haversine_miles(driver["latitude"], driver["longitude"], pickup_lat, pickup_lon),
            })
        return sorted(rows, key=lambda row: row["distance_miles"])[:limit]
    except Exception as exc:
        raise database_error(exc) from exc


@router.post("/bookings", status_code=status.HTTP_201_CREATED)
async def create_booking(request: BookingCreateRequest, user: dict = Depends(require_user)) -> dict:
    reserved_driver_id = None
    reserved_booking_id = None
    try:
        db = get_database()
        candidates = [
            driver
            for driver in active_drivers()
            if driver.get("vehicle_type") == request.cab_type
        ]
        if not candidates:
            raise HTTPException(status_code=409, detail="No available drivers")
        ranked = rank_database_drivers(candidates, request)
        if not ranked:
            raise HTTPException(status_code=409, detail="No available drivers")
        pickup_datetime = request.pickup_datetime or now()
        trip_distance = haversine_miles(request.pickup_lat, request.pickup_lon, request.destination_lat, request.destination_lon)
        reserved = None
        for candidate in ranked:
            booking_id = ObjectId()
            result = db.drivers.update_one(
                {"driver_id": candidate.driver_id, "available": True},
                {"$set": {"available": False, "current_booking_id": booking_id, "updated_at": now()}},
            )
            if result.modified_count:
                reserved = (candidate, booking_id)
                reserved_driver_id = candidate.driver_id
                reserved_booking_id = booking_id
                break
        if reserved is None:
            raise HTTPException(status_code=409, detail="Drivers changed availability. Please try again")
        selected, booking_id = reserved
        fare = CAB_FARES[request.cab_type]
        estimated_fare = round(
            max(20, fare["base_fare"] + trip_distance * 1.60934 * fare["fare_per_km"]),
            2,
        )
        booking = {
            "_id": booking_id,
            "user_id": str(user["_id"]),
            "rider_name": user.get("name", "Passenger"),
            "driver_id": selected.driver_id,
            "driver_name": next((item.get("name", "") for item in candidates if item.get("driver_id") == selected.driver_id), ""),
            "driver_phone": next((item.get("phone") for item in candidates if item.get("driver_id") == selected.driver_id), None),
            "vehicle_type": next((item.get("vehicle_type") for item in candidates if item.get("driver_id") == selected.driver_id), request.cab_type),
            "vehicle_model": next((item.get("vehicle_model") for item in candidates if item.get("driver_id") == selected.driver_id), ""),
            "vehicle_number": next((item.get("vehicle_number") for item in candidates if item.get("driver_id") == selected.driver_id), ""),
            "status": "requested",
            "pickup_lat": request.pickup_lat,
            "pickup_lon": request.pickup_lon,
            "destination_lat": request.destination_lat,
            "destination_lon": request.destination_lon,
            "pickup_address": request.pickup_address,
            "destination_address": request.destination_address,
            "cab_type": request.cab_type,
            "payment_method": request.payment_method,
            "pickup_datetime": pickup_datetime,
            "distance_miles": trip_distance,
            "predicted_eta_seconds": selected.predicted_eta_seconds,
            "estimated_fare": estimated_fare,
            "fare_amount": None,
            "currency": "INR",
            "created_at": now(),
            "updated_at": now(),
        }
        db.bookings.insert_one(booking)
        db.assignments.insert_one({"booking_id": booking_id, "user_id": str(user["_id"]), "driver_id": selected.driver_id, "status": "requested", "ranked_drivers": [asdict(item) for item in ranked], "weights": {**DEFAULT_WEIGHTS, **(request.weights or {})}, "created_at": now()})
        await emit_driver_event(
            selected.driver_id,
            "ride_request",
            serialize(booking),
        )
        return serialize(booking)
    except HTTPException:
        raise
    except FileNotFoundError as exc:
        if reserved_driver_id and reserved_booking_id:
            get_database().drivers.update_one({"driver_id": reserved_driver_id, "current_booking_id": reserved_booking_id}, {"$set": {"available": True, "current_booking_id": None, "updated_at": now()}})
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        if reserved_driver_id and reserved_booking_id:
            try:
                get_database().drivers.update_one({"driver_id": reserved_driver_id, "current_booking_id": reserved_booking_id}, {"$set": {"available": True, "current_booking_id": None, "updated_at": now()}})
            except Exception:
                pass
        raise database_error(exc) from exc


def booking_for_user_or_driver(booking_id: str, user: dict | None = None, driver: dict | None = None) -> dict:
    try:
        query = {"_id": object_id(booking_id)}
        if user:
            query["user_id"] = str(user["_id"])
        if driver:
            query["driver_id"] = driver["driver_id"]
        booking = get_database().bookings.find_one(query)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid booking id") from exc
    except Exception as exc:
        raise database_error(exc) from exc
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.get("/bookings")
def user_bookings(user: dict = Depends(require_user)) -> list[dict]:
    try:
        return [serialize(item) for item in get_database().bookings.find({"user_id": str(user["_id"])}).sort("created_at", -1)]
    except Exception as exc:
        raise database_error(exc) from exc


@router.get("/driver/bookings")
def driver_bookings(driver: dict = Depends(get_current_driver)) -> list[dict]:
    try:
        statuses = ["requested", "accepted", "in_progress", "completed", "cancelled"]
        bookings = get_database().bookings.find({"driver_id": driver["driver_id"], "status": {"$in": statuses}}).sort("created_at", -1)
        return [serialize(item) for item in bookings]
    except Exception as exc:
        raise database_error(exc) from exc


@router.patch("/driver/availability")
def set_driver_availability(available: bool, driver: dict = Depends(get_current_driver)) -> dict:
    try:
        db = get_database()
        has_active_booking = db.bookings.find_one({"driver_id": driver["driver_id"], "status": {"$in": ["requested", "accepted", "in_progress"]}})
        result = db.drivers.update_one(
            {
                "driver_id": driver["driver_id"],
                "$or": [
                    {"status": "active"},
                    {"status": {"$exists": False}},
                ],
            },
            {"$set": {"online": available, "available": available and not bool(has_active_booking), "updated_at": now()}},
        )
        if not result.matched_count:
            raise HTTPException(status_code=404, detail="Driver not found")
        return {"driver_id": driver["driver_id"], "available": available}
    except HTTPException:
        raise
    except Exception as exc:
        raise database_error(exc) from exc


@router.patch("/driver/location")
def update_driver_location(request: DriverLocationRequest, driver: dict = Depends(get_current_driver)) -> dict:
    try:
        timestamp = now()
        result = get_database().drivers.update_one(
            {
                "driver_id": driver["driver_id"],
                "role": "driver",
                "$or": [
                    {"status": "active"},
                    {"status": {"$exists": False}},
                ],
            },
            {"$set": {"latitude": request.latitude, "longitude": request.longitude, "last_location_at": timestamp, "updated_at": timestamp}},
        )
        if not result.matched_count:
            raise HTTPException(status_code=404, detail="Driver not found")
        return {"latitude": request.latitude, "longitude": request.longitude, "updated_at": timestamp.isoformat()}
    except HTTPException:
        raise
    except Exception as exc:
        raise database_error(exc) from exc


@router.get("/bookings/{booking_id}")
def get_booking(booking_id: str, user: dict = Depends(get_current_user)) -> dict:
    booking = booking_for_user_or_driver(booking_id, user=user)
    try:
        driver = get_database().drivers.find_one(
            {"driver_id": booking["driver_id"]},
            {"latitude": 1, "longitude": 1, "last_location_at": 1, "_id": 0},
        )
    except Exception as exc:
        raise database_error(exc) from exc
    booking["driver_location"] = driver
    return serialize(booking)


@router.post("/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: str, user: dict = Depends(require_user)) -> dict:
    booking = booking_for_user_or_driver(booking_id, user=user)
    if booking["status"] not in {"requested", "accepted"}:
        raise HTTPException(status_code=409, detail="This booking cannot be cancelled now")
    try:
        db = get_database()
        updated_at = now()
        db.bookings.update_one({"_id": booking["_id"]}, {"$set": {"status": "cancelled", "updated_at": updated_at, "cancelled_at": updated_at}})
        db.assignments.update_one({"booking_id": booking["_id"]}, {"$set": {"status": "cancelled", "updated_at": updated_at}})
        driver = db.drivers.find_one({"driver_id": booking["driver_id"]}) or {}
        db.drivers.update_one({"driver_id": booking["driver_id"], "current_booking_id": booking["_id"]}, {"$set": {"available": bool(driver.get("online", True)), "current_booking_id": None, "updated_at": updated_at}})
        await emit_booking_status({**booking, "status": "cancelled", "updated_at": updated_at})
        return {"message": "Booking cancelled", "booking_id": str(booking["_id"])}
    except Exception as exc:
        raise database_error(exc) from exc


@router.post("/driver/bookings/{booking_id}/accept")
async def accept_booking(booking_id: str, driver: dict = Depends(get_current_driver)) -> dict:
    booking = booking_for_user_or_driver(booking_id, driver=driver)
    if booking["status"] != "requested":
        raise HTTPException(status_code=409, detail="Booking is not waiting for acceptance")
    try:
        updated_at = now()
        result = get_database().bookings.update_one({"_id": booking["_id"], "status": "requested"}, {"$set": {"status": "accepted", "accepted_at": updated_at, "updated_at": updated_at}})
        if not result.modified_count:
            raise HTTPException(status_code=409, detail="Booking status changed")
        get_database().assignments.update_one({"booking_id": booking["_id"]}, {"$set": {"status": "accepted", "updated_at": updated_at}})
        await emit_booking_status({**booking, "status": "accepted", "updated_at": updated_at})
        return {"message": "Booking accepted", "booking_id": str(booking["_id"]), "status": "accepted"}
    except HTTPException:
        raise
    except Exception as exc:
        raise database_error(exc) from exc


@router.post("/driver/bookings/{booking_id}/decline")
async def decline_booking(booking_id: str, driver: dict = Depends(get_current_driver)) -> dict:
    booking = booking_for_user_or_driver(booking_id, driver=driver)
    if booking["status"] != "requested":
        raise HTTPException(status_code=409, detail="Only requested bookings can be declined")
    try:
        db = get_database()
        updated_at = now()
        result = db.bookings.update_one({"_id": booking["_id"], "status": "requested"}, {"$set": {"status": "cancelled", "updated_at": updated_at, "cancelled_at": updated_at, "cancelled_by": "driver"}})
        if not result.modified_count:
            raise HTTPException(status_code=409, detail="Booking status changed")
        db.assignments.update_one({"booking_id": booking["_id"]}, {"$set": {"status": "cancelled", "updated_at": updated_at}})
        db.drivers.update_one({"driver_id": driver["driver_id"], "current_booking_id": booking["_id"]}, {"$set": {"available": bool(driver.get("online", True)), "current_booking_id": None, "updated_at": updated_at}})
        await emit_booking_status({**booking, "status": "cancelled", "updated_at": updated_at})
        return {"message": "Booking declined", "booking_id": str(booking["_id"]), "status": "cancelled"}
    except HTTPException:
        raise
    except Exception as exc:
        raise database_error(exc) from exc


@router.post("/driver/bookings/{booking_id}/start")
async def start_booking(booking_id: str, driver: dict = Depends(get_current_driver)) -> dict:
    booking = booking_for_user_or_driver(booking_id, driver=driver)
    if booking["status"] != "accepted":
        raise HTTPException(status_code=409, detail="Only accepted bookings can start")
    try:
        updated_at = now()
        result = get_database().bookings.update_one({"_id": booking["_id"], "status": "accepted"}, {"$set": {"status": "in_progress", "started_at": updated_at, "updated_at": updated_at}})
        if not result.modified_count:
            raise HTTPException(status_code=409, detail="Booking status changed")
        get_database().assignments.update_one({"booking_id": booking["_id"]}, {"$set": {"status": "in_progress", "updated_at": updated_at}})
        await emit_booking_status({**booking, "status": "in_progress", "updated_at": updated_at})
        return {"message": "Ride started", "booking_id": str(booking["_id"]), "status": "in_progress"}
    except HTTPException:
        raise
    except Exception as exc:
        raise database_error(exc) from exc


@router.post("/driver/bookings/{booking_id}/complete")
async def complete_booking(booking_id: str, request: RideActionRequest, driver: dict = Depends(get_current_driver)) -> dict:
    booking = booking_for_user_or_driver(booking_id, driver=driver)
    if booking["status"] != "in_progress":
        raise HTTPException(status_code=409, detail="Only active rides can be completed")
    fare = request.fare_amount if request.fare_amount is not None else booking.get("estimated_fare", 0)
    completed_at = now()
    try:
        db = get_database()
        result = db.bookings.update_one({"_id": booking["_id"], "status": "in_progress"}, {"$set": {"status": "completed", "fare_amount": fare, "completed_at": completed_at, "updated_at": completed_at}})
        if not result.modified_count:
            raise HTTPException(status_code=409, detail="Booking status changed")
        db.assignments.update_one({"booking_id": booking["_id"]}, {"$set": {"status": "completed", "updated_at": completed_at}})
        db.drivers.update_one({"driver_id": driver["driver_id"], "current_booking_id": booking["_id"]}, {"$set": {"available": bool(driver.get("online", True)), "current_booking_id": None, "updated_at": completed_at}, "$inc": {"completed_rides": 1}})
        base_transaction = {"booking_id": str(booking["_id"]), "driver_id": driver["driver_id"], "amount": fare, "currency": booking.get("currency", "INR"), "created_at": completed_at}
        db.transactions.insert_one({**base_transaction, "user_id": booking["user_id"], "type": "ride_payment", "direction": "debit"})
        db.transactions.insert_one({**base_transaction, "type": "ride_earning", "direction": "credit"})
        await emit_booking_status({**booking, "status": "completed", "updated_at": completed_at})
        return {"message": "Ride completed", "booking_id": str(booking["_id"]), "status": "completed", "fare_amount": fare}
    except HTTPException:
        raise
    except Exception as exc:
        raise database_error(exc) from exc


@router.get("/transactions/me")
def user_transactions(user: dict = Depends(require_user)) -> list[dict]:
    try:
        return [serialize(item) for item in get_database().transactions.find({"user_id": str(user["_id"])}).sort("created_at", -1)]
    except Exception as exc:
        raise database_error(exc) from exc


@router.get("/driver/transactions")
def driver_transactions(driver: dict = Depends(get_current_driver)) -> list[dict]:
    try:
        transactions = get_database().transactions.find({"driver_id": driver["driver_id"], "type": "ride_earning"})
        return [serialize(item) for item in transactions.sort("created_at", -1)]
    except Exception as exc:
        raise database_error(exc) from exc
