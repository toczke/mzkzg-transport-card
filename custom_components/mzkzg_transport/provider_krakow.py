"""Kraków provider via zbiorkom.live API + GTFS-RT vehicle positions."""

import aiohttp
from datetime import datetime, timedelta
import logging

from homeassistant.util import dt as dt_util

from .http_utils import fetch_with_retry

_LOGGER = logging.getLogger(__name__)

ZBIORKOM_API = "https://api.zbiorkom.live/4.8/krakow/stops/getDepartures"
KRAKOW_GPS_BUS = "https://gtfs.ztp.krakow.pl/VehiclePositions_A.pb"
KRAKOW_GPS_TRAM = "https://gtfs.ztp.krakow.pl/VehiclePositions_T.pb"


async def fetch(coord: "MzkzgTransportCoordinator") -> dict:
    """Fetch departures from zbiorkom.live Kraków API."""
    session = await coord._get_session()
    now = dt_util.now()

    url = f"{ZBIORKOM_API}?id={coord.stop_id}&limit=20"
    try:
        data = await fetch_with_retry(session, url)
    except Exception as err:
        _LOGGER.debug("Kraków zbiorkom fetch failed: %s", err)
        raise

    if not isinstance(data, list) or len(data) < 2:
        return _empty(coord, now)

    # Parse stop info
    stop_info = data[0]
    if not coord.stop_name and isinstance(stop_info, list) and len(stop_info) > 2:
        coord.stop_name = stop_info[2]

    # Parse departures
    raw_deps = data[1]
    if not isinstance(raw_deps, list):
        return _empty(coord, now)

    departures = []
    for d in raw_deps:
        if not isinstance(d, list) or len(d) < 8:
            continue

        headsign = d[1] or "—"
        line_info = d[2]
        route = str(line_info[0]) if isinstance(line_info, list) and line_info else "?"
        vehicle_code = d[5] if d[5] else None
        times = d[7]

        if not isinstance(times, list) or len(times) < 3:
            continue

        scheduled_ms = times[0]
        actual_ms = times[1]
        delay_info = times[2]

        if not isinstance(scheduled_ms, (int, float)):
            continue

        scheduled_dt = datetime.fromtimestamp(scheduled_ms / 1000, tz=now.tzinfo)

        if isinstance(actual_ms, (int, float)):
            estimated_dt = datetime.fromtimestamp(actual_ms / 1000, tz=now.tzinfo)
            is_realtime = True
        else:
            estimated_dt = scheduled_dt
            is_realtime = False

        # Delay in ms or "scheduled" string
        delay_seconds = 0
        if isinstance(delay_info, (int, float)):
            delay_seconds = int(delay_info / 1000)
        elif delay_info == "scheduled":
            is_realtime = False

        if estimated_dt < now - timedelta(minutes=1):
            continue

        # Vehicle type from line_info[4]: 0=tram, 3=bus
        vehicle_type = "tram" if isinstance(line_info, list) and len(line_info) > 4 and line_info[4] == 0 else "bus"

        departures.append({
            "route": route,
            "headsign": headsign,
            "estimated_time": estimated_dt.isoformat(),
            "theoretical_time": scheduled_dt.isoformat(),
            "delay_seconds": delay_seconds,
            "realtime": is_realtime,
            "vehicle_type": vehicle_type,
            "vehicle_code": vehicle_code.split("/")[-1] if vehicle_code and "/" in vehicle_code else vehicle_code,
            "provider": coord.provider,
        })

    # Enrich with GPS positions from GTFS-RT (vehicle_code or route_id fallback)
    await _enrich_krakow_positions(session, departures)

    departures.sort(key=lambda x: x.get("estimated_time") or "")
    return {
        "stop_id": coord.stop_id,
        "stop_name": coord.stop_name or f"Przystanek {coord.stop_id}",
        "provider": coord.provider,
        "departures": departures[:20],
        "last_update": now.isoformat(),
    }


def _empty(coord, now):
    return {
        "stop_id": coord.stop_id,
        "stop_name": coord.stop_name or f"Przystanek {coord.stop_id}",
        "provider": coord.provider,
        "departures": [],
        "last_update": now.isoformat(),
    }


async def _enrich_krakow_positions(session, departures):
    """Fetch GTFS-RT vehicle positions for Kraków and add vehicle_lat/lng with route_id fallback."""
    bus = await _fetch_krakow_gps(session, KRAKOW_GPS_BUS)
    tram = await _fetch_krakow_gps(session, KRAKOW_GPS_TRAM)
    positions = {**bus, **tram}
    if not positions:
        return

    # Build route_id → position list for fallback matching
    route_positions = {}
    for vid, entry in positions.items():
        rid = entry.get("route_id")
        if rid:
            route_positions.setdefault(rid, []).append(entry)

    for d in departures:
        vc = d.get("vehicle_code", "")
        p = None
        if vc and vc in positions:
            p = positions[vc]
        elif not vc:
            rid = d.get("route", "")
            candidates = route_positions.get(rid, [])
            if candidates:
                p = candidates[0]
                candidates.append(candidates.pop(0))
        if p is None:
            continue
        d["vehicle_lat"] = p["lat"]
        d["vehicle_lng"] = p["lng"]
        if p.get("bearing") is not None:
            d["vehicle_direction"] = p["bearing"]
        if p.get("speed") is not None:
            d["vehicle_speed"] = round(p["speed"] * 3.6)


async def _fetch_krakow_gps(session, url: str) -> dict:
    """Fetch and parse a single GTFS-RT VehiclePositions endpoint."""
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=15), ssl=False) as resp:
            if resp.status != 200:
                return {}
            raw = await resp.read()
        from google.transit import gtfs_realtime_pb2
        feed = gtfs_realtime_pb2.FeedMessage()
        feed.ParseFromString(raw)
        positions = {}
        for entity in feed.entity:
            if not entity.HasField("vehicle"):
                continue
            v = entity.vehicle
            vid = v.vehicle.id or v.vehicle.label or ""
            vid = vid.split("/")[-1] if "/" in vid else vid
            if not vid or not v.HasField("position"):
                continue
            entry = {
                "lat": v.position.latitude,
                "lng": v.position.longitude,
            }
            try:
                entry["bearing"] = v.position.bearing if v.position.HasField("bearing") else None
            except (ValueError, AttributeError):
                pass
            try:
                entry["speed"] = v.position.speed if v.position.HasField("speed") else None
            except (ValueError, AttributeError):
                pass
            if v.HasField("trip") and v.trip.route_id:
                entry["route_id"] = v.trip.route_id
            positions[vid] = entry
        return positions
    except Exception:
        return {}
