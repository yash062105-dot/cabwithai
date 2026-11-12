from backend.allocation import rank_drivers


def test_allocation_is_separate_weighted_ranking():
    drivers = [
        {"driver_id": "near", "latitude": 40.750, "longitude": -73.990, "available": True, "workload": 5, "acceptance_rate": 0.9},
        {"driver_id": "far", "latitude": 40.850, "longitude": -73.900, "available": True, "workload": 0, "acceptance_rate": 0.5},
        {"driver_id": "offline", "latitude": 40.751, "longitude": -73.991, "available": False, "workload": 0, "acceptance_rate": 1.0},
    ]
    result = rank_drivers(drivers, 40.751, -73.991, lambda *_: 60.0)
    assert [item.driver_id for item in result] == ["near", "far"]
    assert all(item.predicted_eta_seconds == 60.0 for item in result)

