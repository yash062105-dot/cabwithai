"""SMS OTP boundary. A real provider can replace this function later."""

from __future__ import annotations

import os


class SmsNotConfigured(RuntimeError):
    pass


def send_otp_sms(phone: str, otp: str) -> str | None:
    if os.getenv("OTP_DEV_MODE", "false").lower() == "true":
        print(f"Development OTP for {phone}: {otp}")
        return otp
    raise SmsNotConfigured("SMS provider is not configured")
