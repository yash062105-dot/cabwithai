"""Create the first admin user from environment variables (writes to admins collection)."""

from __future__ import annotations

import os
from datetime import datetime, timezone

from dotenv import load_dotenv

from .mongodb import get_database
from .security import hash_password

load_dotenv()


def main() -> None:
    email = os.getenv("ADMIN_EMAIL", "").strip().lower()
    password = os.getenv("ADMIN_PASSWORD", "")
    name = os.getenv("ADMIN_NAME", "Administrator").strip()

    if not email or len(password) < 8:
        raise SystemExit("Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars) to bootstrap an admin account.")

    db = get_database()
    existing = db.admins.find_one({"email": email})

    if existing:
        changes: dict = {"name": name, "status": "active"}
        if password:
            changes["password_hash"] = hash_password(password)
        db.admins.update_one({"_id": existing["_id"]}, {"$set": changes})
        print(f"Admin account updated: {email}")
    else:
        admin = {
            "name": name,
            "email": email,
            "password_hash": hash_password(password),
            "status": "active",
            "created_at": datetime.now(timezone.utc),
        }
        db.admins.insert_one(admin)
        print(f"Admin account created: {email}")


main()
