from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.errors import DuplicateKeyError

from .dependencies import get_authenticated_account
from .mongodb import DatabaseNotConfigured, get_database
from .schemas import AdminLoginRequest, DriverSignupRequest, ForgotPasswordRequest, LoginRequest, MessageResponse, PhoneOtpRequest, SignupRequest, TokenResponse, VerifyOtpRequest
from .security import create_driver_token, create_otp, create_token, hash_password, otp_expiry, verify_password
from .sms_service import SmsNotConfigured, send_otp_sms

router = APIRouter(prefix="/auth", tags=["authentication"])


def normalize_phone(phone: str) -> str:
    value = "".join(character for character in phone.strip() if character.isdigit() or character == "+")
    if value.count("+") > 1 or ("+" in value and not value.startswith("+")):
        raise HTTPException(status_code=422, detail="Invalid phone number")
    digits = value.lstrip("+")
    if not digits.isdigit() or not 10 <= len(digits) <= 15:
        raise HTTPException(status_code=422, detail="Invalid phone number")
    return value


def public_user(user: dict) -> dict:
    role = user.get("role", "admin" if user.get("email") and not user.get("phone") else "user")
    result = {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "phone": user.get("phone"),
        "role": role,
        "status": user.get("status", "active"),
    }
    if user.get("email"):
        result["email"] = user["email"]
    return result


def service_error(error: Exception) -> HTTPException:
    if isinstance(error, DatabaseNotConfigured):
        return HTTPException(status_code=503, detail="MongoDB is not configured")
    return HTTPException(status_code=503, detail=str(error))


def issue_user_token(user: dict, role: str = "user") -> TokenResponse:
    identifier = user.get("phone") or user.get("email", "")
    actual_role = user.get("role") or role
    user_with_role = dict(user)
    user_with_role["role"] = actual_role
    return TokenResponse(
        access_token=create_token(str(user["_id"]), identifier, actual_role),
        user=public_user(user_with_role),
    )


def save_otp(phone: str, purpose: str) -> str | None:
    db = get_database()
    otp = create_otp()
    dev_otp = send_otp_sms(phone, otp)
    db.otp_codes.update_many({"phone": phone, "purpose": purpose, "used": False}, {"$set": {"used": True}})
    db.otp_codes.insert_one({"phone": phone, "purpose": purpose, "otp_hash": hash_password(otp), "expires_at": otp_expiry(), "created_at": datetime.now(timezone.utc), "used": False})
    return dev_otp


def consume_otp(phone: str, otp: str, purpose: str) -> None:
    try:
        record = get_database().otp_codes.find_one({"phone": phone, "purpose": purpose, "used": False}, sort=[("created_at", -1)])
    except Exception as exc:
        raise service_error(exc) from exc
    try:
        valid = bool(record) and record["expires_at"] >= datetime.now(timezone.utc) and verify_password(otp, record["otp_hash"])
    except (TypeError, ValueError, KeyError):
        valid = False
    if not valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    get_database().otp_codes.update_one({"_id": record["_id"]}, {"$set": {"used": True, "used_at": datetime.now(timezone.utc)}})


@router.post("/request-otp", response_model=MessageResponse)
def request_otp(request: PhoneOtpRequest) -> MessageResponse:
    phone = normalize_phone(request.phone)
    try:
        db = get_database()
        user = db.users.find_one({"phone": phone})
        driver = db.drivers.find_one({"phone": phone}) if request.purpose == "login" else None
        if request.purpose == "login" and not user and not driver:
            raise HTTPException(status_code=404, detail="Account does not exist")
        if request.purpose == "reset" and not user:
            return MessageResponse(message="If the account exists, an OTP has been sent")
        if request.purpose == "signup" and (user or db.drivers.find_one({"phone": phone})):
            raise HTTPException(status_code=409, detail="An account already exists for this phone number")
        dev_otp = save_otp(phone, request.purpose)
        return MessageResponse(message="OTP sent successfully", dev_otp=dev_otp)
    except SmsNotConfigured as exc:
        raise HTTPException(status_code=503, detail="SMS provider is not configured. Enable OTP_DEV_MODE for local testing.") from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise service_error(exc) from exc


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(request: SignupRequest) -> TokenResponse:
    phone = normalize_phone(request.phone)
    try:
        consume_otp(phone, request.otp, "signup")
        user = {"name": request.name.strip(), "phone": phone, "status": "active", "created_at": datetime.now(timezone.utc)}
        result = get_database().users.insert_one(user)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="An account with this phone already exists") from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise service_error(exc) from exc
    user["_id"] = result.inserted_id
    return issue_user_token(user, role="user")


@router.post("/driver-signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def driver_signup(request: DriverSignupRequest) -> TokenResponse:
    phone = normalize_phone(request.phone)
    try:
        db = get_database()
        if db.users.find_one({"phone": phone}) or db.drivers.find_one({"phone": phone}):
            raise HTTPException(status_code=409, detail="An account already exists for this phone number")
        consume_otp(phone, request.otp, "signup")
        driver = {
            "driver_id": uuid4().hex,
            "name": request.name.strip(),
            "phone": phone,
            "status": "inactive",
            "latitude": request.latitude,
            "longitude": request.longitude,
            "available": False,
            "online": False,
            "completed_rides": 0,
            "vehicle_type": request.vehicle_type,
            "vehicle_model": request.vehicle_model.strip(),
            "vehicle_number": request.vehicle_number.strip().upper(),
            "license_number": request.license_number.strip().upper(),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        db.drivers.insert_one(driver)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="An account already exists for this phone number") from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise service_error(exc) from exc
    token = create_driver_token(driver["driver_id"], driver["name"])
    return TokenResponse(
        access_token=token,
        driver_access_token=token,
        user={"id": driver["driver_id"], "name": driver["name"], "phone": phone, "role": "driver", "status": driver["status"]},
    )


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest) -> TokenResponse:
    try:
        phone = normalize_phone(request.phone)
        consume_otp(phone, request.otp, "login")

        # If user explicitly requested driver login
        if request.role == "driver":
            driver = get_database().drivers.find_one({"phone": phone})
            if not driver:
                raise HTTPException(status_code=401, detail="No driver account found for this phone number")
            token = create_driver_token(driver["driver_id"], driver["name"])
            return TokenResponse(
                access_token=token,
                user={"id": driver["driver_id"], "name": driver["name"], "phone": phone, "role": "driver", "status": driver.get("status", "active")},
                driver_access_token=token,
            )

        # If user explicitly requested user login
        if request.role == "user":
            user = get_database().users.find_one({"phone": phone})
            if not user:
                raise HTTPException(status_code=401, detail="No user account found for this phone number")
            return issue_user_token(user, role="user")

        # Fallback if role is not explicitly provided: check users first, then drivers
        user = get_database().users.find_one({"phone": phone})
        if not user:
            driver = get_database().drivers.find_one({"phone": phone})
            if driver:
                token = create_driver_token(driver["driver_id"], driver["name"])
                return TokenResponse(
                    access_token=token,
                    user={"id": driver["driver_id"], "name": driver["name"], "phone": phone, "role": "driver", "status": driver.get("status", "active")},
                    driver_access_token=token,
                )
        if not user:
            raise HTTPException(status_code=401, detail="No account found for this phone number")
    except HTTPException:
        raise
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    except Exception as exc:
        raise service_error(exc) from exc
    return issue_user_token(user, role="user")


@router.post("/admin-login", response_model=TokenResponse, summary="Fast admin email/password login")
def admin_login(request: AdminLoginRequest) -> TokenResponse:
    try:
        email = request.email.strip().lower()
        admin = get_database().admins.find_one({"email": email})
        valid = bool(admin) and verify_password(request.password, admin.get("password_hash", ""))
    except (TypeError, ValueError):
        valid = False
        admin = None
    except Exception as exc:
        raise service_error(exc) from exc
    if not valid or not admin:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    return issue_user_token(admin, role="admin")


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(request: ForgotPasswordRequest) -> MessageResponse:
    return request_otp(PhoneOtpRequest(phone=request.phone, purpose="reset"))


@router.post("/verify-otp", response_model=MessageResponse)
def verify_otp(request: VerifyOtpRequest) -> MessageResponse:
    consume_otp(normalize_phone(request.phone), request.otp, request.purpose)
    return MessageResponse(message="OTP is valid")


@router.get("/me")
def current_user(
    account: dict = Depends(get_authenticated_account),
) -> dict:
    if account.get("role") == "driver":
        return {
            "id": account["driver_id"],
            "name": account.get("name", ""),
            "phone": account.get("phone"),
            "role": "driver",
            "status": account.get("status", "active"),
        }
    if account.get("role") == "admin":
        return {
            "id": str(account["_id"]),
            "name": account.get("name", ""),
            "email": account.get("email"),
            "role": "admin",
            "status": account.get("status", "active"),
        }
    return public_user(account)
