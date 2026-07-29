# Roadmap — 1.6.0

## P0 — Security

- [ ] **Eliminate `ssl=False`** — 17 occurrences across all providers
  - Add per-provider SSL verification toggle (default: on)
  - Wrocław (`mapadlugoleka.klosok.eu`) — self-signed cert → document as opt-out
  - GZM (`gtfsrt.transportgzm.pl:5443`) — non-standard port + cert → document
  - Łódź (`trip_updates.bin`, `vehicle_positions.bin`) — HTTP → no SSL needed
  - All CDN/api6/mkuran feeds → verify SSL works, enable by default

## P1 — Performance & Reliability

- [ ] **GTFS download optimization**
  - Parallel GTFS downloads for multi-stop entries sharing the same provider
  - Cache warming on HA startup (background download for configured providers)
  - If-None-Match / If-Modified-Since for GTFS zip downloads (avoid re-downloading unchanged files)
- [ ] **Retry strategy unification** — all providers use same backoff (1s, 3s, 7s)
- [ ] **Memory** — prune unused GTFS cache entries more aggressively (currently per-day, could be LRU)
- [ ] **Coordinate validation** — reject lat/lng=0,0 (common sentinel value when GPS unavailable)

## P2 — New Providers

- [ ] **Bydgoszcz** — static GTFS available (`mkuran.pl/gtfs/bydgoszcz.zip`, 1194 stops) — no RT
- [ ] Research additional Polish cities with public GTFS/GTFS-RT feeds
  - Check `gtfs.kasznia.net`, `files.girlc.at/gtfs/`
  - Check additional `api.zbiorkom.live` cities (e.g., `api6-open/bielsko-biala`, `api6-open/gniezno`)

## P3 — Features

- [ ] **Generic GTFS `parent_station` groups** — auto-detect transfer hubs for any GTFS city with parent_station data
  - Currently: only Warszawa metro (38 groups) and Świnoujście (2 groups)
  - Extend config_flow to offer "Węzeł przesiadkowy" for all eligible cities
- [ ] **Route color mapping** — use GTFS `route_color` / `route_text_color` when available
- [ ] **Stop aliases / favorites** — allow custom naming and grouping of stops in config_flow
- [ ] **Card: route direction indicator** — show terminus direction (e.g., "→ Centrum") as a compact badge

## P4 — Testing

- [ ] **config_flow unit tests** — smoke tests for provider selection, stop loading, multi-stop
- [ ] **provider_krakow tests** — bus/tram GPS enrichment, route_id matching
- [ ] **GPS matching tests** — trip_id, route_id, vehicle_code fallbacks
- [ ] **Speed normalization tests** — verify km/h across all providers
- [ ] **Calendar resilience tests** — `any_weekday_match` edge cases
- [ ] **E2E Playwright tests** — fix CI pipeline, test card rendering with real HA

## P5 — Polish & Maintenance

- [ ] **i18n** — full English + Polish translations for all config flow steps
- [ ] **`strings.json` parity** — `lodz_mode`, `lodz_group` steps need English translations
- [ ] **`extra_state_attributes` migration** — deprecated in HA 2024.11, target for removal
- [ ] **`hacs.json` min version** — already bumped to 2025.1.0, verify compatibility
- [ ] **Code cleanup**
  - Remove `from __future__ import annotations` (Python 3.12+ no-op)
  - Split `provider_gtfsrt.py` (~1225 LOC) into smaller modules
  - Audit `except Exception: pass` patterns (0 remaining, verified RC2)

## P6 — Documentation

- [ ] Provider-specific setup guides (Łódź groups, Kraków bus vs tram, Poznań calendar)
- [ ] Troubleshooting section (common error messages, GTFS download failures)
- [ ] GIF/screencast of config flow walkthrough

---

## Won't Do (for now)

- Kraków tram GPS — vehicle ID systems incompatible (zbiorkom `RG912` ≠ ZTP `PA147`), no mapping API
- PKP/PLK vehicle positions — API doesn't expose GPS data
- ZKM Gdynia GPS — no vehicle position endpoint
- kiedyPrzyjedzie GPS — no vehicle position data in API
- Time4BUS GPS — no vehicle endpoint
- WKD GPS — RT feed contains no VehiclePositions
- Bydgoszcz RT — no public GTFS-RT feed (CDN 404, api6 empty, ZDMiKP doesn't publish)

---

**Priority order for 1.6.0**: P0 (SSL) → P2 (Bydgoszcz) → P3 (parent_station groups) → P4 (tests) → P1 (perf) → P5 (polish)
