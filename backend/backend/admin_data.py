from __future__ import annotations

import re
from datetime import datetime, time, timedelta, timezone
from math import ceil

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo import DESCENDING

from .admin_routes import db_error, serialize
from .dependencies import require_admin
from .mongodb import get_database, object_id
from .schemas import AccountStatusRequest, AccountStatus

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin)],
)
SORT_FIELDS = {"created_at", "name", "phone", "status", "updated_at"}
RIDE_STATUSES = {"requested", "accepted", "in_progress", "completed", "cancelled"}


def _account_query(role: str) -> dict:
    if role == "user":
        return {"$or": [{"role": "user"}, {"role": {"$exists": False}}]}
    return {"role": role}


def _date_query(created_from: datetime | None, created_to: datetime | None) -> dict:
    bounds = {}
    if created_from:
        bounds["$gte"] = created_from
    if created_to:
        bounds["$lt"] = created_to + timedelta(days=1)
    return {"created_at": bounds} if bounds else {}


def _paged(
    collection,
    query: dict,
    page: int,
    page_size: int,
    sort_by: str,
    sort_order: str,
    projection: dict | None = None,
) -> dict:
    total = collection.count_documents(query)
    direction = 1 if sort_order == "asc" else DESCENDING
    items = collection.find(query, projection).sort(sort_by, direction).skip(
        (page - 1) * page_size
    ).limit(page_size)
    return {
        "items": [serialize(item) for item in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": ceil(total / page_size) if total else 0,
    }


def _list_query(
    role: str | None,
    status: str | None,
    search: str | None,
    created_from: datetime | None,
    created_to: datetime | None,
    search_fields: tuple[str, ...],
) -> dict:
    clauses = []
    if role and role not in {"user", "driver"}:
        clauses.append(_account_query(role))
    if status:
        clauses.append({"status": status})
    clauses.append(_date_query(created_from, created_to))
    if search:
        pattern = re.compile(re.escape(search.strip()), re.IGNORECASE)
        clauses.append({"$or": [{field: pattern} for field in search_fields]})
    clauses = [clause for clause in clauses if clause]
    return {"$and": clauses} if clauses else {}


def _audit(admin: dict, action: str, entity_type: str, entity_id: str, details: dict) -> None:
    get_database().admin_activity.insert_one(
        {
            "admin_id": str(admin["_id"]),
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "details": details,
            "created_at": datetime.now(timezone.utc),
        }
    )


def _set_status(
    collection,
    query: dict,
    account_status: str,
    admin: dict,
    entity_type: str,
    entity_id: str,
) -> dict:
    db = get_database()
    account = collection.find_one(query)
    if not account:
        raise HTTPException(status_code=404, detail=f"{entity_type.capitalize()} not found")
    previous_status = account.get("status", "active")
    if previous_status == account_status:
        return serialize(account)

    updated_at = datetime.now(timezone.utc)
    changes = {"status": account_status, "updated_at": updated_at}
    if entity_type == "driver" and account_status != "active":
        changes.update({"online": False, "available": False})
    collection.update_one(query, {"$set": changes})
    updated = collection.find_one(query)
    _audit(
        admin,
        f"{entity_type}.status_changed",
        entity_type,
        entity_id,
        {"from": previous_status, "to": account_status},
    )
    return serialize(updated)


@router.get("/dashboard")
def dashboard() -> dict:
    try:
        db = get_database()
        users = db.users
        drivers = db.drivers
        bookings = db.bookings
        active_driver = {
            "online": True,
            "$or": [
                {"status": "active"},
                {"status": {"$exists": False}},
            ],
        }
        active_user = {
            "$or": [{"status": "active"}, {"status": {"$exists": False}}],
        }
        now = datetime.now(timezone.utc)
        today = datetime.combine(now.date(), time.min, tzinfo=timezone.utc)
        month = today.replace(day=1)
        ride_counts = {
            name: bookings.count_documents({"status": name})
            for name in sorted(RIDE_STATUSES)
        }
        revenue_match = {"type": "ride_payment", "direction": "debit"}
        revenue = list(
            db.transactions.aggregate(
                [
                    {"$match": revenue_match},
                    {
                        "$group": {
                            "_id": None,
                            "total": {"$sum": "$amount"},
                            "today": {
                                "$sum": {
                                    "$cond": [
                                        {"$gte": ["$created_at", today]},
                                        "$amount",
                                        0,
                                    ]
                                }
                            },
                            "month": {
                                "$sum": {
                                    "$cond": [
                                        {"$gte": ["$created_at", month]},
                                        "$amount",
                                        0,
                                    ]
                                }
                            },
                        }
                    },
                ]
            )
        )
        commissions = list(
            db.transactions.aggregate(
                [
                    {"$match": {"type": "platform_commission", "direction": "credit"}},
                    {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
                ]
            )
        )
        return {
            "users": {
                "total": users.count_documents({}),
                "active": users.count_documents(active_user),
                "inactive": users.count_documents({"status": "inactive"}),
                "blocked": users.count_documents({"status": "blocked"}),
            },
            "drivers": {
                "total": drivers.count_documents({}),
                "active": drivers.count_documents({"status": "active"})
                + drivers.count_documents({"status": {"$exists": False}}),
                "inactive": drivers.count_documents({"status": "inactive"}),
                "blocked": drivers.count_documents({"status": "blocked"}),
            },
            "cabs": {
                "total": drivers.count_documents(
                    {"vehicle_type": {"$exists": True, "$ne": None}}
                ),
                "live": drivers.count_documents(active_driver),
            },
            "rides": {
                "total": bookings.count_documents({}),
                "ongoing": sum(
                    ride_counts.get(status, 0)
                    for status in ("requested", "accepted", "in_progress")
                ),
                "completed": ride_counts.get("completed", 0),
                "cancelled": ride_counts.get("cancelled", 0),
                "by_status": ride_counts,
            },
            "revenue": {
                "total": revenue[0]["total"] if revenue else 0,
                "today": revenue[0]["today"] if revenue else 0,
                "month": revenue[0]["month"] if revenue else 0,
                "platform_earnings": commissions[0]["total"] if commissions else 0,
                "commission_records": bool(commissions),
            },
            "generated_at": now.isoformat(),
        }
    except Exception as exc:
        raise db_error(exc) from exc


@router.get("/users/page")
def page_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    status: AccountStatus | None = None,
    search: str | None = Query(default=None, max_length=100),
    created_from: datetime | None = None,
    created_to: datetime | None = None,
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
) -> dict:
    if sort_by not in SORT_FIELDS:
        raise HTTPException(status_code=422, detail="Invalid sort field")
    try:
        query = _list_query(
            "user", status, search, created_from, created_to, ("name", "phone", "email")
        )
        return _paged(
            get_database().users,
            query,
            page,
            page_size,
            sort_by,
            sort_order,
            {"password_hash": 0},
        )
    except Exception as exc:
        raise db_error(exc) from exc


@router.get("/users/{user_id}/details")
def user_details(user_id: str) -> dict:
    try:
        db = get_database()
        user = db.users.find_one({"_id": object_id(user_id)}, {"password_hash": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        bookings = list(db.bookings.find({"user_id": user_id}).sort("created_at", DESCENDING).limit(50))
        payments = list(
            db.transactions.aggregate(
                [
                    {"$match": {"user_id": user_id, "type": "ride_payment", "direction": "debit"}},
                    {"$group": {"_id": None, "total": {"$sum": "$amount"}, "rides": {"$sum": 1}}},
                ]
            )
        )
        return {
            "user": serialize(user),
            "bookings": [serialize(item) for item in bookings],
            "spending": payments[0]["total"] if payments else 0,
            "paid_rides": payments[0]["rides"] if payments else 0,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise db_error(exc) from exc


@router.patch("/users/{user_id}/status")
def change_user_status(
    user_id: str,
    request: AccountStatusRequest,
    admin: dict = Depends(require_admin),
) -> dict:
    try:
        return _set_status(
            get_database().users,
            {"_id": object_id(user_id)},
            request.status,
            admin,
            "user",
            user_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid user id") from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise db_error(exc) from exc


@router.get("/drivers/page")
def page_drivers(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    status: AccountStatus | None = None,
    search: str | None = Query(default=None, max_length=100),
    created_from: datetime | None = None,
    created_to: datetime | None = None,
    online: bool | None = None,
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
) -> dict:
    if sort_by not in SORT_FIELDS:
        raise HTTPException(status_code=422, detail="Invalid sort field")
    try:
        query = _list_query(
            "driver",
            status,
            search,
            created_from,
            created_to,
            ("name", "phone", "driver_id", "vehicle_number", "vehicle_model"),
        )
        if online is not None:
            query = {"$and": [query, {"online": online}]} if query else {"online": online}
        return _paged(
            get_database().drivers,
            query,
            page,
            page_size,
            sort_by,
            sort_order,
        )
    except Exception as exc:
        raise db_error(exc) from exc


@router.get("/drivers/{driver_id}/details")
def driver_details(driver_id: str) -> dict:
    try:
        db = get_database()
        driver = db.drivers.find_one({"driver_id": driver_id})
        if not driver:
            raise HTTPException(status_code=404, detail="Driver not found")
        bookings = list(db.bookings.find({"driver_id": driver_id}).sort("created_at", DESCENDING).limit(50))
        earnings = list(
            db.transactions.aggregate(
                [
                    {"$match": {"driver_id": driver_id, "type": "ride_earning", "direction": "credit"}},
                    {"$group": {"_id": None, "total": {"$sum": "$amount"}, "rides": {"$sum": 1}}},
                ]
            )
        )
        return {
            "driver": serialize(driver),
            "bookings": [serialize(item) for item in bookings],
            "earnings": earnings[0]["total"] if earnings else 0,
            "completed_rides": earnings[0]["rides"] if earnings else 0,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise db_error(exc) from exc


@router.patch("/drivers/{driver_id}/status")
def change_driver_status(
    driver_id: str,
    request: AccountStatusRequest,
    admin: dict = Depends(require_admin),
) -> dict:
    try:
        return _set_status(
            get_database().drivers,
            {"driver_id": driver_id},
            request.status,
            admin,
            "driver",
            driver_id,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise db_error(exc) from exc


@router.get("/bookings/page")
def page_bookings(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    status: str | None = None,
    search: str | None = Query(default=None, max_length=100),
    user_id: str | None = None,
    driver_id: str | None = None,
    created_from: datetime | None = None,
    created_to: datetime | None = None,
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
) -> dict:
    if status and status not in RIDE_STATUSES:
        raise HTTPException(status_code=422, detail="Invalid ride status")
    clauses = []
    if status:
        clauses.append({"status": status})
    if user_id:
        clauses.append({"user_id": user_id})
    if driver_id:
        clauses.append({"driver_id": driver_id})
    if search:
        if ObjectId.is_valid(search):
            clauses.append({"_id": object_id(search)})
        else:
            clauses.append({"_id": None})
    clauses.append(_date_query(created_from, created_to))
    filtered_clauses = [clause for clause in clauses if clause]
    query = {"$and": filtered_clauses} if filtered_clauses else {}
    try:
        db = get_database()
        result = _paged(
            db.bookings,
            query,
            page,
            page_size,
            "created_at",
            sort_order,
        )
        for booking in result["items"]:
            payment = db.transactions.find_one(
                {
                    "booking_id": booking["_id"],
                    "type": "ride_payment",
                    "direction": "debit",
                },
                {"_id": 1},
            )
            booking["payment_status"] = (
                "paid"
                if payment
                else "not charged"
                if booking.get("status") == "cancelled"
                else "unpaid"
            )
        return result
    except Exception as exc:
        raise db_error(exc) from exc


@router.get("/bookings/{booking_id}/details")
def booking_details(booking_id: str) -> dict:
    try:
        db = get_database()
        booking = db.bookings.find_one({"_id": object_id(booking_id)})
        if not booking:
            raise HTTPException(status_code=404, detail="Ride not found")
        user = None
        try:
            user = db.users.find_one(
                {"_id": object_id(str(booking.get("user_id", "")))},
                {"password_hash": 0},
            )
        except ValueError:
            pass
        driver = db.drivers.find_one({"driver_id": booking.get("driver_id")})
        payment = db.transactions.find_one(
            {
                "booking_id": str(booking["_id"]),
                "type": "ride_payment",
                "direction": "debit",
            }
        )
        return {
            "ride": serialize(booking),
            "user": serialize(user) if user else None,
            "driver": serialize(driver) if driver else None,
            "payment": serialize(payment) if payment else None,
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid ride id") from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise db_error(exc) from exc


@router.get("/monitoring")
def live_monitoring(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=100, ge=1, le=200),
) -> dict:
    try:
        db = get_database()
        query = {
            "online": True,
            "$or": [{"status": "active"}, {"status": {"$exists": False}}],
        }
        total = db.drivers.count_documents(query)
        drivers = list(
            db.drivers.find(query).sort("last_location_at", DESCENDING)
            .skip((page - 1) * page_size).limit(page_size)
        )
        rows = []
        for driver in drivers:
            booking = db.bookings.find_one(
                {
                    "driver_id": driver["driver_id"],
                    "status": {"$in": ["accepted", "in_progress"]},
                },
                sort=[("created_at", DESCENDING)],
            )
            row = serialize(driver)
            row["current_ride"] = serialize(booking) if booking else None
            if booking:
                user = db.users.find_one(
                    {"_id": object_id(booking["user_id"])},
                    {"name": 1, "phone": 1},
                )
                row["current_ride"]["rider"] = serialize(user) if user else None
            rows.append(row)
        return {
            "items": rows,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": ceil(total / page_size) if total else 0,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as exc:
        raise db_error(exc) from exc


@router.get("/revenue")
def revenue_analytics(
    period: str = Query(default="day", pattern="^(day|week|month)$"),
) -> dict:
    formats = {"day": "%Y-%m-%d", "week": "%G-W%V", "month": "%Y-%m"}
    try:
        db = get_database()
        receipts = list(
            db.transactions.aggregate(
                [
                    {"$match": {"type": "ride_payment", "direction": "debit"}},
                    {
                        "$group": {
                            "_id": {
                                "$dateToString": {
                                    "format": formats[period],
                                    "date": "$created_at",
                                    "timezone": "UTC",
                                }
                            },
                            "revenue": {"$sum": "$amount"},
                            "rides": {"$sum": 1},
                        }
                    },
                    {"$sort": {"_id": 1}},
                ]
            )
        )
        driver_earnings = list(
            db.transactions.aggregate(
                [
                    {"$match": {"type": "ride_earning", "direction": "credit"}},
                    {
                        "$group": {
                            "_id": "$driver_id",
                            "earnings": {"$sum": "$amount"},
                            "rides": {"$sum": 1},
                        }
                    },
                    {"$sort": {"earnings": -1}},
                ]
            )
        )
        cab_earnings = list(
            db.transactions.aggregate(
                [
                    {"$match": {"type": "ride_payment", "direction": "debit"}},
                    {
                        "$group": {
                            "_id": "$driver_id",
                            "earnings": {"$sum": "$amount"},
                            "rides": {"$sum": 1},
                        }
                    },
                    {"$sort": {"earnings": -1}},
                ]
            )
        )
        driver_ids = list(
            {
                row["_id"]
                for row in [*driver_earnings, *cab_earnings]
                if row.get("_id")
            }
        )
        drivers = {
            driver["driver_id"]: driver
            for driver in db.drivers.find(
                {"driver_id": {"$in": driver_ids}},
                {"name": 1, "vehicle_number": 1, "driver_id": 1},
            )
        }
        return {
            "period": period,
            "revenue_by_period": [serialize(row) for row in receipts],
            "driver_earnings": [
                {
                    **serialize(row),
                    "driver": serialize(drivers.get(row["_id"], {})),
                }
                for row in driver_earnings
            ],
            "cab_earnings": [
                {
                    **serialize(row),
                    "driver": serialize(drivers.get(row["_id"], {})),
                }
                for row in cab_earnings
            ],
        }
    except Exception as exc:
        raise db_error(exc) from exc


@router.get("/activity")
def recent_admin_activity(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
) -> dict:
    try:
        return _paged(
            get_database().admin_activity,
            {},
            page,
            page_size,
            "created_at",
            "desc",
        )
    except Exception as exc:
        raise db_error(exc) from exc
