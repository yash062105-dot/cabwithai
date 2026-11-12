from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class EtaRequest(BaseModel):
    origin_lat: float = Field(ge=-90, le=90)
    origin_lon: float = Field(ge=-180, le=180)
    destination_lat: float = Field(ge=-90, le=90)
    destination_lon: float = Field(ge=-180, le=180)
    pickup_datetime: datetime
    shared_request: bool = False
    wav_request: bool = False
    access_a_ride: bool = False


class EtaResponse(BaseModel):
    predicted_travel_time_seconds: float
    predicted_travel_time_minutes: float
    model_name: str
    source_note: str


class DriverCandidate(BaseModel):
    driver_id: str
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    available: bool = True
    workload: float = Field(default=0, ge=0)
    acceptance_rate: float = Field(default=0, ge=0, le=1)


class AssignmentRequest(BaseModel):
    passenger_lat: float = Field(ge=-90, le=90)
    passenger_lon: float = Field(ge=-180, le=180)
    pickup_datetime: datetime
    drivers: list[DriverCandidate]
    weights: dict[str, float] | None = None


class AssignmentResponse(BaseModel):
    assigned_driver_id: str | None
    ranked_drivers: list[dict]
    weights: dict[str, float]


class PhoneOtpRequest(BaseModel):
    phone: str = Field(min_length=10, max_length=20)
    purpose: Literal["login", "signup", "reset"] = "login"


class VerifyOtpRequest(BaseModel):
    phone: str = Field(min_length=10, max_length=20)
    otp: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")
    purpose: Literal["login", "signup", "reset"] = "login"


class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=10, max_length=20)
    otp: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class DriverSignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=10, max_length=20)
    otp: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    vehicle_type: Literal["Mini", "Sedan", "SUV", "Auto"]
    vehicle_model: str = Field(min_length=2, max_length=100)
    vehicle_number: str = Field(min_length=4, max_length=30)
    license_number: str = Field(min_length=4, max_length=40)


class DriverLocationRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class LoginRequest(BaseModel):
    phone: str | None = Field(default=None, min_length=10, max_length=20)
    otp: str | None = Field(default=None, min_length=6, max_length=6, pattern=r"^\d{6}$")
    email: str | None = None
    password: str | None = None

    @model_validator(mode="after")
    def validate_login_method(self):
        phone_login = bool(self.phone and self.otp)
        legacy_admin_login = bool(self.email and self.password)
        if not phone_login and not legacy_admin_login:
            raise ValueError("Use phone and OTP. Email/password is only a temporary admin compatibility login.")
        return self


class AdminLoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=1, max_length=128)


class ForgotPasswordRequest(BaseModel):
    phone: str = Field(min_length=10, max_length=20)


class AdminUserCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=10, max_length=20)
    role: Literal["admin", "user"] = "user"


class DriverCreateRequest(BaseModel):
    driver_id: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=2, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    available: bool = True
    workload: float = Field(default=0, ge=0)
    acceptance_rate: float = Field(default=0, ge=0, le=1)
    vehicle_type: str | None = Field(default=None, max_length=30)
    vehicle_model: str | None = Field(default=None, max_length=100)
    vehicle_number: str | None = Field(default=None, max_length=30)


class DriverUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    available: bool | None = None
    workload: float | None = Field(default=None, ge=0)
    acceptance_rate: float | None = Field(default=None, ge=0, le=1)


class BookingCreateRequest(BaseModel):
    pickup_lat: float = Field(ge=-90, le=90)
    pickup_lon: float = Field(ge=-180, le=180)
    destination_lat: float = Field(ge=-90, le=90)
    destination_lon: float = Field(ge=-180, le=180)
    pickup_address: str | None = Field(default=None, max_length=200)
    destination_address: str | None = Field(default=None, max_length=200)
    cab_type: Literal["Mini", "Sedan", "SUV", "Auto"] = "Sedan"
    payment_method: Literal["Cash"] = "Cash"
    pickup_datetime: datetime | None = None
    weights: dict[str, float] | None = None


class RideActionRequest(BaseModel):
    fare_amount: float | None = Field(default=None, ge=0)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
    driver_access_token: str | None = None


class MessageResponse(BaseModel):
    message: str
    dev_otp: str | None = None
