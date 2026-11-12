from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from backend import auth_routes
from backend.admin_data import change_driver_status
from backend.dependencies import require_active_account
from backend.schemas import AccountStatusRequest, LoginRequest


class Collection:
    def __init__(self, record=None):
        self.record = record
        self.inserted = []

    def find_one(self, query):
        if self.record and all(
            self.record.get(key) == value
            for key, value in query.items()
            if not key.startswith("$")
        ):
            return self.record
        return None

    def update_one(self, query, update):
        self.record.update(update["$set"])
        return SimpleNamespace(matched_count=1)

    def insert_one(self, record):
        self.inserted.append(record)


@pytest.mark.parametrize("account_status", ["inactive", "blocked"])
def test_non_active_accounts_are_denied_by_protected_dependency(account_status):
    with pytest.raises(HTTPException) as error:
        require_active_account({"status": account_status})

    assert error.value.status_code == 403


def test_active_accounts_pass_protected_dependency():
    account = {"status": "active"}

    assert require_active_account(account) is account


@pytest.mark.parametrize("account_status", ["inactive", "blocked"])
def test_user_login_issues_session_with_current_status(monkeypatch, account_status):
    user = {
        "_id": "user-1",
        "name": "Test User",
        "phone": "+919888888888",
        "role": "user",
        "status": account_status,
    }
    users = Collection(user)
    monkeypatch.setattr(
        auth_routes, "get_database", lambda: SimpleNamespace(users=users)
    )
    monkeypatch.setattr(auth_routes, "consume_otp", lambda *_: None)
    monkeypatch.setattr(auth_routes, "create_token", lambda *_args, **_kwargs: "token")

    response = auth_routes.login(
        LoginRequest(phone=user["phone"], otp="123456")
    )

    assert response.access_token == "token"
    assert response.user.status == account_status


def test_driver_status_change_disables_online_access_and_is_audited(monkeypatch):
    driver = {
        "driver_id": "driver-1",
        "role": "driver",
        "status": "inactive",
        "online": False,
        "available": False,
    }
    drivers = Collection(driver)
    activity = Collection()
    monkeypatch.setattr(
        "backend.admin_data.get_database",
        lambda: SimpleNamespace(drivers=drivers, admin_activity=activity),
    )

    result = change_driver_status(
        "driver-1",
        AccountStatusRequest(status="active"),
        {"_id": "admin-1"},
    )

    assert result["status"] == "active"
    assert activity.inserted[0]["action"] == "driver.status_changed"
    assert activity.inserted[0]["details"] == {"from": "inactive", "to": "active"}


def test_blocking_driver_immediately_disables_availability(monkeypatch):
    driver = {
        "driver_id": "driver-2",
        "role": "driver",
        "status": "active",
        "online": True,
        "available": True,
    }
    drivers = Collection(driver)
    activity = Collection()
    monkeypatch.setattr(
        "backend.admin_data.get_database",
        lambda: SimpleNamespace(drivers=drivers, admin_activity=activity),
    )

    result = change_driver_status(
        "driver-2",
        AccountStatusRequest(status="blocked"),
        {"_id": "admin-1"},
    )

    assert result["status"] == "blocked"
    assert result["online"] is False
    assert result["available"] is False
