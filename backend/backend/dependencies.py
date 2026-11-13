from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .mongodb import get_database, object_id
from .security import decode_token

bearer = HTTPBearer(auto_error=True)


def get_authenticated_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("role") != "user":
            raise ValueError("User token required")
        user_id = object_id(payload["sub"])
        user = get_database().users.find_one({"_id": user_id})
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication")
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication")
    user_copy = dict(user)
    user_copy["role"] = "user"
    return user_copy


def get_authenticated_admin(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("role") != "admin":
            raise ValueError("Admin token required")
        admin_id = object_id(payload["sub"])
        admin = get_database().admins.find_one({"_id": admin_id})
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin authentication")
    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin authentication")
    admin_copy = dict(admin)
    admin_copy["role"] = "admin"
    return admin_copy


def get_authenticated_driver(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("role") != "driver" or not payload.get("driver_id"):
            raise ValueError("Driver token required")
        driver = get_database().drivers.find_one({"driver_id": payload["driver_id"]})
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid driver authentication")
    if not driver:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid driver authentication")
    driver_copy = dict(driver)
    driver_copy["role"] = "driver"
    return driver_copy


def get_authenticated_account(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    try:
        payload = decode_token(credentials.credentials)
        role = payload.get("role")
        if role == "driver" and payload.get("driver_id"):
            account = get_database().drivers.find_one({"driver_id": payload["driver_id"]})
            if account:
                account = dict(account)
                account["role"] = "driver"
        elif role == "admin":
            account = get_database().admins.find_one({"_id": object_id(payload["sub"])})
            if account:
                account = dict(account)
                account["role"] = "admin"
        elif role == "user":
            account = get_database().users.find_one({"_id": object_id(payload["sub"])})
            if account:
                account = dict(account)
                account["role"] = "user"
        else:
            account = None
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication")
    if not account:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication")
    return account


def require_active_account(account: dict) -> dict:
    account_status = account.get("status", "active")
    if account_status != "active":
        detail = "This account is blocked" if account_status == "blocked" else "This account is inactive"
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
    return account


def get_current_user(user: dict = Depends(get_authenticated_user)) -> dict:
    return require_active_account(user)


def get_current_admin(admin: dict = Depends(get_authenticated_admin)) -> dict:
    return require_active_account(admin)


def require_admin(admin: dict = Depends(get_current_admin)) -> dict:
    return admin


def get_current_driver(driver: dict = Depends(get_authenticated_driver)) -> dict:
    return require_active_account(driver)


def require_user(user: dict = Depends(get_current_user)) -> dict:
    return user
