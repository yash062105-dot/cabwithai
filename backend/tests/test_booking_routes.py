from types import SimpleNamespace

from backend.booking_routes import cab_options, driver_transactions


def test_cab_options_are_limited_to_available_driver_types(monkeypatch):
    class Drivers:
        def find(self, query):
            assert query == {
                "available": True,
                "role": "driver",
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