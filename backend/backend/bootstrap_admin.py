"""Create the first admin user from environment variables."""

from __future__ import annotations

import os
from datetime import datetime, timezone

from dotenv import load_dotenv

from .mongodb import get_database
from .security import hash_password

load_dotenv()


def main() -> None:
    email = os.getenv("ADMIN_EMAIL", "").strip().lower()
    phone = os.getenv("ADMIN_PHONE", "").strip()
    password = os.getenv("ADMIN_PASSWORD", "")
    name = os.getenv("ADMIN_NAME", "Administrator").strip()
    if not phone and (not email or len(password) < 8):
        raise SystemExit("Set ADMIN_PHONE, or set the legacy ADMIN_EMAIL and ADMIN_PASSWORD")
    user = {
        "name": name,
        "phone": phone or None,
        "role": "admin",
        "status": "active",
        "created_at": datetime.now(timezone.utc),
    }
    if email:
        user["email"] = email
    if password:
        user["password_hash"] = hash_password(password)
    db = get_database()
    existing = db.users.find_one({"email": email}) if email else db.users.find_one({"phone": phone})
    if existing:
        changes = {"name": name, "role": "admin", "status": "active"}
        if phone:
            changes["phone"] = phone
        if password:
            changes["password_hash"] = user["password_hash"]
        db.users.update_one({"_id": existing["_id"]}, {"$set": changes})
        print(f"Admin account updated: {phone or email}")
    else:
        db.users.insert_one(user)
        print(f"Admin account created: {phone or email}")


if __name__ == "__main__":
    main()
