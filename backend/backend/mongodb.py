"""MongoDB connection and collection helpers."""

from __future__ import annotations

import os
from typing import Any

from bson import ObjectId
from pymongo import ASCENDING, DESCENDING, MongoClient

_client: MongoClient | None = None


class DatabaseNotConfigured(RuntimeError):
    pass


def get_database():
    global _client
    uri = os.getenv("MONGODB_URI")
    if not uri:
        raise DatabaseNotConfigured("MONGODB_URI is not configured")
    if _client is None:
        _client = MongoClient(uri, serverSelectionTimeoutMS=3000, tz_aware=True)
    return _client[os.getenv("MONGODB_DATABASE", "cab_booking")]


def close_database() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None


def ensure_indexes() -> None:
    db = get_database()
    try:
        db.users.drop_index("email_1")
    except Exception:
        pass
    try:
        db.users.drop_index("email_unique_sparse")
    except Exception:
        pass
    try:
        db.users.drop_index("role_1_status_1_created_at_-1")
    except Exception:
        pass
    db.users.create_index([("phone", ASCENDING)], unique=True, sparse=True, name="phone_unique_sparse")
    db.users.create_index([("status", ASCENDING), ("created_at", DESCENDING)])
    db.admins.create_index([("email", ASCENDING)], unique=True, name="admin_email_unique")
    db.admins.create_index([("status", ASCENDING), ("created_at", DESCENDING)])
    db.drivers.create_index([("driver_id", ASCENDING)], unique=True)
    db.drivers.create_index([("phone", ASCENDING)], unique=True, sparse=True, name="driver_phone_unique_sparse")
    db.drivers.create_index([("status", ASCENDING), ("created_at", DESCENDING)])
    db.otp_codes.create_index([("expires_at", ASCENDING)], expireAfterSeconds=0)
    db.bookings.create_index([("created_at", DESCENDING)])
    db.assignments.create_index([("created_at", DESCENDING)])
    db.transactions.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
    db.transactions.create_index([("driver_id", ASCENDING), ("created_at", DESCENDING)])
    db.transactions.create_index([("type", ASCENDING), ("direction", ASCENDING), ("created_at", DESCENDING)])
    db.transactions.create_index([("booking_id", ASCENDING), ("type", ASCENDING)])
    db.admin_activity.create_index([("created_at", DESCENDING)])


def database_health() -> dict[str, Any]:
    if not os.getenv("MONGODB_URI"):
        return {"configured": False, "connected": False}
    try:
        get_database().command("ping")
        return {"configured": True, "connected": True}
    except Exception:
        return {"configured": True, "connected": False}


def object_id(value: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise ValueError("Invalid object id")
    return ObjectId(value)
