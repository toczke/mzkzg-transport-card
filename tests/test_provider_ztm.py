"""Tests for ZTM Gdańsk provider — dedup and GPS position enrichment."""

from datetime import datetime, timezone

from mzkzg_transport.provider_ztm import _deduplicate, _enrich_with_positions


def test_dedup_removes_exact_duplicates():
    deps = [
        {"route": "2", "headsign": "Jelitkowo", "theoretical_time": "2026-07-27T08:30:00", "realtime": True},
        {"route": "2", "headsign": "Jelitkowo", "theoretical_time": "2026-07-27T08:30:00", "realtime": False},
    ]
    result = _deduplicate(deps)
    assert len(result) == 1
    assert result[0]["realtime"] == True


def test_dedup_prefers_rt():
    deps = [
        {"route": "2", "headsign": "Jelitkowo", "theoretical_time": "2026-07-27T08:30:00", "realtime": False},
        {"route": "2", "headsign": "Jelitkowo", "theoretical_time": "2026-07-27T08:30:00", "realtime": True},
    ]
    result = _deduplicate(deps)
    assert len(result) == 1
    assert result[0]["realtime"] == True


def test_dedup_keeps_different_times():
    deps = [
        {"route": "2", "headsign": "Jelitkowo", "theoretical_time": "2026-07-27T08:30:00", "realtime": True},
        {"route": "2", "headsign": "Jelitkowo", "theoretical_time": "2026-07-27T08:35:00", "realtime": False},
    ]
    result = _deduplicate(deps)
    assert len(result) == 2


def test_dedup_matches_empty_headsign():
    """Schedule entry with empty headsign matches RT with same route+time."""
    deps = [
        {"route": "2", "headsign": "Jelitkowo", "theoretical_time": "2026-07-27T08:30:00", "realtime": True},
        {"route": "2", "headsign": "", "theoretical_time": "2026-07-27T08:30:00", "realtime": False},
    ]
    result = _deduplicate(deps)
    assert len(result) == 1


def test_dedup_keeps_different_routes():
    deps = [
        {"route": "2", "headsign": "Jelitkowo", "theoretical_time": "2026-07-27T08:30:00", "realtime": True},
        {"route": "5", "headsign": "Zaspa", "theoretical_time": "2026-07-27T08:30:00", "realtime": False},
    ]
    result = _deduplicate(deps)
    assert len(result) == 2


def test_enrich_with_positions_matches_by_vehicle_code():
    deps = [
        {"route": "2", "vehicle_code": "1234", "realtime": True},
        {"route": "5", "vehicle_code": "5678", "realtime": True},
        {"route": "2", "vehicle_code": "", "realtime": False},
    ]
    positions = {
        "1234": {"lat": 54.35, "lng": 18.65, "speed": 25, "direction": 180, "generated": "2026-07-27T08:30:00Z"},
        "5678": {"lat": 54.36, "lng": 18.66, "speed": 0, "direction": 0, "generated": "2026-07-27T08:30:00Z"},
    }
    _enrich_with_positions(deps, positions)
    assert deps[0].get("vehicle_lat") == 54.35
    assert deps[0].get("vehicle_lng") == 18.65
    assert deps[0].get("vehicle_speed") == 25
    assert deps[0].get("vehicle_direction") == 180
    assert deps[1].get("vehicle_lat") == 54.36
    assert deps[2].get("vehicle_lat") is None


def test_enrich_with_positions_ignores_missing_codes():
    deps = [{"route": "2", "vehicle_code": "9999", "realtime": True}]
    positions = {"1234": {"lat": 54.35, "lng": 18.65}}
    _enrich_with_positions(deps, positions)
    assert deps[0].get("vehicle_lat") is None


def test_enrich_with_positions_empty_inputs():
    deps = []
    positions = {"1234": {"lat": 54.35, "lng": 18.65}}
    _enrich_with_positions(deps, positions)
    assert deps == []

    deps2 = [{"route": "2", "vehicle_code": None, "realtime": False}]
    positions2 = {}
    _enrich_with_positions(deps2, positions2)
    assert deps2[0].get("vehicle_lat") is None
