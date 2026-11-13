import asyncio
from datetime import datetime, timezone

from fastapi import FastAPI

from backend import realtime


def test_booking_status_is_sent_to_rider_and_driver_rooms(monkeypatch):
    emissions = []

    class SocketServer:
        async def emit(self, event, payload, room):
            emissions.append((event, payload, room))

    booking = {
        "_id": "booking-1",
        "user_id": "user-1",
        "driver_id": "driver-1",
        "status": "accepted",
        "updated_at": datetime(2026, 1, 1, tzinfo=timezone.utc),
    }
    monkeypatch.setattr(realtime, "_socket_server", SocketServer())

    asyncio.run(realtime.emit_booking_status(booking))

    payload = {
        "booking_id": "booking-1",
        "status": "accepted",
        "updated_at": "2026-01-01T00:00:00+00:00",
    }
    assert emissions == [
        ("booking_status", payload, "booking-user:user-1:booking-1"),
        ("booking_status", payload, "driver:driver-1"),
    ]


def test_socket_app_does_not_apply_browser_origin_allowlist():
    socket_app = realtime.create_socket_app(FastAPI())

    assert socket_app.engineio_server.eio.cors_allowed_origins == []