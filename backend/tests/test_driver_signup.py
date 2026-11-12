from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from backend import auth_routes
from backend import booking_routes
from backend.schemas import BookingCreateRequest, DriverLocationRequest, DriverSignupRequest, PhoneOtpRequest


class Collection:
    def __init__(self):
        self.records = []

    def find_one(self, query):
        return next((record for record in self.records if all(record.get(key) == value for key, value in query.items())), None)

    def insert_one(self, record):
        self.records.append(record)


def test_driver_signup_creates_driver_and_returns_driver_token(monkeypatch):
    users = Collection()
    drivers = Collection()
    database = SimpleNamespace(users=users, drivers=drivers)
    monkeypatch.setattr(auth_routes, "get_database", lambda: database)
    monkeypatch.setattr(auth_routes, "consume_otp", lambda *_: None)
    monkeypatch.setattr(auth_routes, "create_driver_token", lambda *_: "driver-token")

    request = DriverSignupRequest(
        name="Local Driver",
        phone="+919888888888",
        otp="123456",
        latitude=26.9124,
        longitude=75.7873,
        vehicle_type="Sedan",
        vehicle_model="Test Sedan",
        vehicle_number="RJ14CAB0001",
        license_number="DL123456",
    )

    response = auth_routes.driver_signup(request)

    assert response.access_token == "driver-token"
    assert response.driver_access_token == "driver-token"
    assert response.user["role"] == "driver"
    assert drivers.records[0]["phone"] == "+919888888888"
    assert drivers.records[0]["available"] is False
    assert drivers.records[0]["latitude"] == 26.9124


def test_booking_schema_rejects_non_cash_payment():
    with pytest.raises(ValidationError):
        BookingCreateRequest(
            pickup_lat=26.9,
            pickup_lon=75.7,
            destination_lat=26.91,
            destination_lon=75.8,
            payment_method="UPI",
        )


def test_driver_signup_rejects_phone_already_used_by_user(monkeypatch):
    users = Collection()
    users.records.append({"phone": "+919888888888"})
    database = SimpleNamespace(users=users, drivers=Collection())
    monkeypatch.setattr(auth_routes, "get_database", lambda: database)
    request = DriverSignupRequest(
        name="Local Driver",
        phone="+919888888888",
        otp="123456",
        latitude=26.9124,
        longitude=75.7873,
        vehicle_type="Sedan",
        vehicle_model="Test Sedan",
        vehicle_number="RJ14CAB0001",
        license_number="DL123456",
    )

    with pytest.raises(HTTPException) as error:
        auth_routes.driver_signup(request)

    assert error.value.status_code == 409


def test_signup_otp_reports_duplicate_phone_as_conflict(monkeypatch):
    users = Collection()
    users.records.append({"phone": "+919888888888"})
    database = SimpleNamespace(users=users, drivers=Collection())
    monkeypatch.setattr(auth_routes, "get_database", lambda: database)

    with pytest.raises(HTTPException) as error:
        auth_routes.request_otp(PhoneOtpRequest(phone="+919888888888", purpose="signup"))

    assert error.value.status_code == 409


def test_driver_location_endpoint_persists_coordinates(monkeypatch):
    class Drivers:
        def update_one(self, query, update):
            self.query = query
            self.update = update
            return SimpleNamespace(matched_count=1)

    drivers = Drivers()
    monkeypatch.setattr(booking_routes, "get_database", lambda: SimpleNamespace(drivers=drivers))

    result = booking_routes.update_driver_location(
        DriverLocationRequest(latitude=26.9124, longitude=75.7873),
        {"driver_id": "driver-test"},
    )

    assert drivers.query == {"driver_id": "driver-test", "role": "driver"}
    assert drivers.update["$set"]["latitude"] == 26.9124
    assert drivers.update["$set"]["longitude"] == 75.7873
    assert result["latitude"] == 26.9124