from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo.errors import DuplicateKeyError

from ml.config import MODEL_METADATA_PATH, MODEL_PATH

from .dependencies import require_admin
from .mongodb import DatabaseNotConfigured, get_database, object_id
from .schemas import AdminUserCreateRequest, DriverCreateRequest, DriverUpdateRequest
from .security import create_driver_token

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


def serialize(value):
    if isinstance(value, dict):
        return {key: serialize(item) for key, item in value.items() if key != "password_hash"}
    if isinstance(value, list):
        return [serialize(item) for item in value]
    if hasattr(value, "__str__") and value.__class__.__name__ == "ObjectId":
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    return value


def db_error(exc: Exception) -> HTTPException:
    if isinstance(exc, DatabaseNotConfigured):
        return HTTPException(status_code=503, detail="MongoDB is not configured")
    return HTTPException(status_code=503, detail="Database is unavailable")


@router.get("/users")
def list_users(limit: int = Query(default=100, ge=1, le=200)) -> list[dict]:
    try:
        return [serialize(user) for user in get_database().users.find({}, {"password_hash": 0}).sort("created_at", -1).limit(limit)]
    except Exception as exc:
        raise db_error(exc) from exc


@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_user(request: AdminUserCreateRequest) -> dict:
    user = {"name": request.name.strip(), "phone": request.phone, "role": request.role, "status": "active", "created_at": datetime.now(timezone.utc)}
    try:
        result = get_database().users.insert_one(user)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="An account with this phone already exists") from exc
    except Exception as exc:
        raise db_error(exc) from exc
    user["_id"] = result.inserted_id
    return serialize(user)


@router.delete("/users/{user_id}")
def delete_user(user_id: str, admin: dict = Depends(require_admin)) -> dict:
    try:
        if object_id(user_id) == admin["_id"]:
            raise HTTPException(status_code=400, detail="You cannot delete your own admin account")
        db = get_database()
        result = db.users.delete_one({"_id": object_id(user_id)})
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid user id") from exc
    except Exception as exc:
        raise db_error(exc) from exc
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    db.admin_activity.insert_one({
        "admin_id": str(admin["_id"]),
        "action": "user.deleted",
        "entity_type": "user",
        "entity_id": user_id,
        "created_at": datetime.now(timezone.utc),
    })
    return {"message": "User deleted"}


@router.get("/drivers")
def list_drivers(limit: int = Query(default=100, ge=1, le=200)) -> list[dict]:
    try:
        return [serialize(driver) for driver in get_database().drivers.find().sort("updated_at", -1).limit(limit)]
    except Exception as exc:
        raise db_error(exc) from exc


@router.post("/drivers", status_code=status.HTTP_201_CREATED)
def create_driver(request: DriverCreateRequest) -> dict:
    driver = {**request.model_dump(), "status": "inactive", "available": False, "online": False, "role": "driver", "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)}
    try:
        get_database().drivers.insert_one(driver)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="A driver with this id already exists") from exc
    except Exception as exc:
        raise db_error(exc) from exc
    result = serialize(driver)
    result["driver_access_token"] = create_driver_token(driver["driver_id"], driver["name"])
    return result


@router.post("/drivers/{driver_id}/token")
def create_driver_access_token(driver_id: str) -> dict:
    try:
        driver = get_database().drivers.find_one({"driver_id": driver_id, "role": "driver"})
    except Exception as exc:
        raise db_error(exc) from exc
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return {"driver_id": driver_id, "driver_access_token": create_driver_token(driver_id, driver["name"])}


@router.patch("/drivers/{driver_id}")
def update_driver(driver_id: str, request: DriverUpdateRequest) -> dict:
    changes = request.model_dump(exclude_none=True)
    if not changes:
        raise HTTPException(status_code=400, detail="No driver fields were provided")
    changes["updated_at"] = datetime.now(timezone.utc)
    try:
        db = get_database()
        existing = db.drivers.find_one({"driver_id": driver_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Driver not found")
        if "available" in changes:
            if changes["available"] and existing.get("status", "active") != "active":
                raise HTTPException(status_code=409, detail="Only active drivers can be set available")
            changes["online"] = changes["available"]
        result = db.drivers.update_one({"driver_id": driver_id}, {"$set": changes})
        driver = db.drivers.find_one({"driver_id": driver_id})
    except HTTPException:
        raise
    except Exception as exc:
        raise db_error(exc) from exc
    if result.matched_count == 0 or not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return serialize(driver)


@router.delete("/drivers/{driver_id}")
def delete_driver(driver_id: str, admin: dict = Depends(require_admin)) -> dict:
    try:
        db = get_database()
        result = db.drivers.delete_one({"driver_id": driver_id})
    except Exception as exc:
        raise db_error(exc) from exc
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Driver not found")
    db.admin_activity.insert_one({
        "admin_id": str(admin["_id"]),
        "action": "driver.deleted",
        "entity_type": "driver",
        "entity_id": driver_id,
        "created_at": datetime.now(timezone.utc),
    })
    return {"message": "Driver deleted"}


def analysis() -> dict:
    try:
        db = get_database()
        return {
            "users": db.users.count_documents({}),
            "admins": db.users.count_documents({"role": "admin"}),
            "drivers": db.drivers.count_documents({}),
            "available_drivers": db.drivers.count_documents({"available": True}),
            "bookings": db.bookings.count_documents({}),
            "assignments": db.assignments.count_documents({}),
            "transactions": db.transactions.count_documents({}),
            "model_loaded": MODEL_PATH.exists(),
            "model_metadata": json.loads(MODEL_METADATA_PATH.read_text(encoding="utf-8")) if MODEL_METADATA_PATH.exists() else {},
        }
    except Exception as exc:
        raise db_error(exc) from exc


@router.get("/analysis")
def admin_analysis() -> dict:
    return analysis()


@router.get("/bookings")
def list_bookings(limit: int = Query(default=100, ge=1, le=200)) -> list[dict]:
    try:
        return [serialize(booking) for booking in get_database().bookings.find().sort("created_at", -1).limit(limit)]
    except Exception as exc:
        raise db_error(exc) from exc


@router.get("/transactions")
def list_transactions(limit: int = Query(default=100, ge=1, le=200)) -> list[dict]:
    try:
        return [serialize(transaction) for transaction in get_database().transactions.find().sort("created_at", -1).limit(limit)]
    except Exception as exc:
        raise db_error(exc) from exc
