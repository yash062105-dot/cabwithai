from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .mongodb import DatabaseNotConfigured, get_database, object_id
from .security import decode_token

bearer = HTTPBearer(auto_error=True)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("role") == "driver":
            raise ValueError("Driver token used on a user route")
        user_id = object_id(payload["sub"])
        user = get_database().users.find_one({"_id": user_id})
    except (DatabaseNotConfigured, RuntimeError, ValueError, KeyError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication")
    if not user or user.get("status", "active") != "active":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User is not active")
    return user


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


def get_current_driver(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("role") != "driver" or not payload.get("driver_id"):
            raise ValueError("Driver token required")
        driver = get_database().drivers.find_one({"driver_id": payload["driver_id"], "$or": [{"role": "driver"}, {"role": {"$exists": False}}]})
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid driver authentication")
    if not driver:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Driver is not active")
    return driver


def require_user(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "user":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User access required")
    return user
