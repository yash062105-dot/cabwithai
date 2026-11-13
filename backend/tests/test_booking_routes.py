from types import SimpleNamespace

from backend.booking_routes import cab_options, driver_transactions


def test_cab_options_are_limited_to_available_driver_types(monkeypatch):
    class Drivers:
        def find(self, query):
            assert query == {
                "available": True,
                "$or": [{"status": "active"}, {"status": {"$exists": False}}],
            }
            return [
                {"vehicle_type": "Sedan"},
                {"vehicle_type": "Sedan"},
                {"vehicle_type": "Auto"},
                {"vehicle_type": "unknown"},
            ]

    monkeypatch.setattr(
        "backend.booking_routes.get_database",
        lambda: SimpleNamespace(drivers=Drivers()),
    )

    result = cab_options({})

    assert result == [
        {
            "type": "Sedan",
            "base_fare": 160,
            "fare_per_km": 16,
            "available_drivers": 2,
        },
        {
            "type": "Auto",
            "base_fare": 70,
            "fare_per_km": 9,
            "available_drivers": 1,
        },
    ]


def test_driver_transactions_only_returns_ride_earnings(monkeypatch):
    records = [
        {"driver_id": "driver-1", "type": "ride_payment", "amount": 250},
        {"driver_id": "driver-1", "type": "ride_earning", "amount": 250},
    ]

    class TransactionCursor(list):
        def sort(self, field, direction):
            assert field == "created_at"
            assert direction == -1
            return self

    class Transactions:
        def find(self, query):
            assert query == {"driver_id": "driver-1", "type": "ride_earning"}
            return TransactionCursor(
                record for record in records if record["type"] == query["type"]
            )

    monkeypatch.setattr(
        "backend.booking_routes.get_database",
        lambda: SimpleNamespace(transactions=Transactions()),
    )

    result = driver_transactions({"driver_id": "driver-1"})

    assert result == [records[1]]


def test_driver_booking_details_require_the_assigned_driver(monkeypatch):
    from backend.booking_routes import get_driver_booking

    booking = {"_id": "booking-1", "driver_id": "driver-1", "status": "accepted"}
    calls = []

    def find_booking(booking_id, user=None, driver=None):
        calls.append((booking_id, user, driver))
        assert driver == {"driver_id": "driver-1"}
        return booking.copy()

    class Drivers:
        def find_one(self, query, projection):
            assert query == {"driver_id": "driver-1"}
            assert projection["latitude"] == 1
            return {"latitude": 12.5, "longitude": 77.5}

    monkeypatch.setattr("backend.booking_routes.booking_for_user_or_driver", find_booking)
    monkeypatch.setattr(
        "backend.booking_routes.get_database",
        lambda: SimpleNamespace(drivers=Drivers()),
    )

    result = get_driver_booking("booking-1", {"driver_id": "driver-1"})

    assert calls == [("booking-1", None, {"driver_id": "driver-1"})]
    assert result["driver_location"] == {"latitude": 12.5, "longitude": 77.5}


def test_driver_can_start_accepted_booking_without_otp(monkeypatch):
    import asyncio

    from backend import booking_routes

    booking = {
        "_id": "booking-1",
        "user_id": "user-1",
        "driver_id": "driver-1",
        "status": "accepted",
        "updated_at": booking_routes.now(),
    }
    updates = []

    class Bookings:
        def update_one(self, query, update):
            updates.append((query, update))
            return SimpleNamespace(modified_count=1)

    class Assignments:
        def update_one(self, query, update):
            return SimpleNamespace(modified_count=1)

    monkeypatch.setattr(
        booking_routes,
        "booking_for_user_or_driver",
        lambda booking_id, user=None, driver=None: booking,
    )
    monkeypatch.setattr(
        booking_routes,
        "get_database",
        lambda: SimpleNamespace(bookings=Bookings(), assignments=Assignments()),
    )
    monkeypatch.setattr(
        booking_routes,
        "emit_booking_status",
        lambda *_args, **_kwargs: asyncio.sleep(0),
    )

    result = asyncio.run(
        booking_routes.start_booking("booking-1", {"driver_id": "driver-1"})
    )

    assert result["status"] == "in_progress"
    assert updates[0][1]["$set"]["status"] == "in_progress"


def test_admin_bookings_page_handles_empty_filters(monkeypatch):
    from backend.admin_data import page_bookings

    booking = {
        "_id": "booking-1",
        "status": "completed",
        "created_at": "2026-01-01T00:00:00Z",
    }

    class Bookings:
        def count_documents(self, query):
            assert query == {}
            return 1

        def find(self, query, projection=None):
            assert query == {}
            assert projection is None
            return SimpleNamespace(
                sort=lambda field, direction: SimpleNamespace(
                    skip=lambda _: SimpleNamespace(limit=lambda _: [booking])
                )
            )

    class Transactions:
        def find_one(self, query, projection=None):
            assert query["booking_id"] == "booking-1"
            return None

    monkeypatch.setattr(
        "backend.admin_data.get_database",
        lambda: SimpleNamespace(bookings=Bookings(), transactions=Transactions()),
    )

    result = page_bookings(
        page=1,
        page_size=25,
        status=None,
        search=None,
        user_id=None,
        driver_id=None,
        created_from=None,
        created_to=None,
        sort_order="desc",
    )

    assert result["total"] == 1
    assert result["items"][0]["_id"] == "booking-1"
    assert result["items"][0]["payment_status"] == "unpaid"