"""Socket.IO driver location updates with booking-level authorization."""

from __future__ import annotations

import math
from datetime import datetime, timezone

import socketio

from .mongodb import get_database, object_id
from .security import decode_token


def booking_room(user_id: str, booking_id: str) -> str:
    return f"booking-user:{user_id}:{booking_id}"


def create_socket_app(fastapi_app, allowed_origins: list[str]):
    sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins=allowed_origins)

    async def get_session(sid: str) -> dict | None:
        try:
            return await sio.get_session(sid)
        except KeyError:
            return None

    @sio.event
    async def connect(sid, environ, auth):
        token = auth.get("token") if isinstance(auth, dict) else None
        if not token:
            return False
        try:
            payload = decode_token(token)
            role = payload.get("role")
            db = get_database()
            if role == "driver":
                driver_id = payload.get("driver_id")
                driver = db.drivers.find_one({"driver_id": driver_id, "role": "driver"})
                if not driver:
                    return False
                await sio.save_session(sid, {"role": "driver", "driver_id": driver_id})
            else:
                user = db.users.find_one({"_id": object_id(payload["sub"]), "status": "active"})
                if not user or user.get("role") not in {"user", "admin"}:
                    return False
                await sio.save_session(sid, {"role": user.get("role"), "user_id": str(user["_id"])})
            return True
        except Exception:
            return False

    @sio.event
    async def watch_booking(sid, data):
        session = await get_session(sid)
        if not session or session.get("role") not in {"user", "admin"}:
            return {"ok": False, "error": "User authentication required"}
        try:
            booking_id = str(data["booking_id"])
            booking = get_database().bookings.find_one({"_id": object_id(booking_id), "user_id": session["user_id"]})
        except Exception:
            booking = None
        if not booking:
            return {"ok": False, "error": "Booking not found for this user"}
        await sio.enter_room(sid, booking_room(session["user_id"], booking_id))
        return {"ok": True, "booking_id": booking_id}

    @sio.event
    async def unwatch_booking(sid, data):
        session = await get_session(sid)
        if not session or not session.get("user_id"):
            return {"ok": False, "error": "User authentication required"}
        booking_id = str(data.get("booking_id", "")) if isinstance(data, dict) else ""
        await sio.leave_room(sid, booking_room(session["user_id"], booking_id))
        return {"ok": True}

    @sio.event
    async def driver_location_update(sid, data):
        session = await get_session(sid)
        if not session or session.get("role") != "driver":
            return {"ok": False, "error": "Driver authentication required"}
        try:
            latitude = float(data["latitude"])
            longitude = float(data["longitude"])
            if not math.isfinite(latitude) or not math.isfinite(longitude) or not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
                raise ValueError
            db = get_database()
            timestamp = datetime.now(timezone.utc)
            db.drivers.update_one({"driver_id": session["driver_id"], "role": "driver"}, {"$set": {"latitude": latitude, "longitude": longitude, "last_location_at": timestamp, "updated_at": timestamp}})
            booking = db.bookings.find_one({"driver_id": session["driver_id"], "status": {"$in": ["requested", "accepted", "in_progress"]}})
            if booking:
                payload = {"booking_id": str(booking["_id"]), "driver_id": session["driver_id"], "latitude": latitude, "longitude": longitude, "timestamp": timestamp.isoformat()}
                await sio.emit("driver_location", payload, room=booking_room(booking["user_id"], str(booking["_id"])))
            return {"ok": True, "delivered_to_booking_user": bool(booking)}
        except (KeyError, TypeError, ValueError):
            return {"ok": False, "error": "latitude and longitude must be valid numbers"}
        except Exception:
            return {"ok": False, "error": "Could not update driver location"}

    @sio.event
    async def update_location(sid, data):
        return await driver_location_update(sid, data)

    return socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
