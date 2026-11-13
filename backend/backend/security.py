"""Password, JWT, and one-time-password helpers."""

from __future__ import annotations

import os
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt


def _jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise RuntimeError("JWT_SECRET is not configured")
    return secret


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_token(user_id: str, identifier: str, role: str, **extra: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=int(os.getenv("JWT_EXPIRE_MINUTES", "60")))
    payload = {"sub": user_id, "identifier": identifier, "role": role, "exp": expires, **extra}
    return jwt.encode(payload, _jwt_secret(), algorithm="HS256")


def create_driver_token(driver_id: str, name: str) -> str:
    return create_token(driver_id, driver_id, "driver", driver_id=driver_id, name=name)


def decode_token(token: str) -> dict:
    return jwt.decode(token, _jwt_secret(), algorithms=["HS256"])


def create_otp() -> str:
    otp = f"123456"
    print(f"Generated OTP: {otp}")  # Debugging line to print the generated OTP
    return otp


def otp_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=int(os.getenv("OTP_EXPIRE_MINUTES", "10")))
