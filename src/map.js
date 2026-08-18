import { escapeHtml, routeColor, parseVehiclePosition } from "./utils.js";

export class VehicleMap {
  constructor(card) { this.card = card; }
  preloadLeaflet() {
    if (!this.leafletLoading) {
      this.leafletLoading = new Promise((resolve) => {
        const l = document.createElement("link");
        l.rel = "stylesheet";
        l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        l.onload = () => {
          const s = document.createElement("script");
          s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          s.onload = resolve;
          document.head.appendChild(s);
        };
        document.head.appendChild(l);
      });
    }
    return this.leafletLoading;
  }

  buildVehicleMarker(bearing, color, route, vehicleType, info, isMobile) {
    const size = isMobile ? 32 : 40;
    const fontSize = isMobile ? 11 : 13;
    const half = size / 2;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 6}" viewBox="0 0 ${size} ${size + 6}">
      <circle cx="${half}" cy="${half}" r="${half - 3}" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <text x="${half}" y="${half}" text-anchor="middle" dominant-baseline="central" font-weight="700" font-size="${fontSize}" fill="#fff" font-family="system-ui,sans-serif">${escapeHtml(route)}</text>
      <path d="M${half},${size - 3} Q${half - 14},${size + 1} ${half - 7},${size - 1} L${half},${size + 6} L${half + 7},${size - 1} Q${half + 14},${size + 1} ${half},${size - 3} Z" fill="${color}" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>`;

    return { svg, size, arrowH: size + 7 };
  }

  buildPopupContent(d) {
    const delay = Math.round((d.delay_seconds || 0) / 60);
    const delayTag = delay > 0 ? `+${delay} min` : delay < 0 ? `${delay} min` : "o czasie";
    const delayClass = delay > 0 ? "zm-popup-delay" : delay < 0 ? "zm-popup-delay early" : "zm-popup-delay ontime";
    return `<div class="zm-popup"><div class="zm-popup-route">${escapeHtml(d.route)}</div>${d.headsign ? `<div class="zm-popup-headsign">→ ${escapeHtml(d.headsign)}</div>` : ""}${d.vehicle_code ? `<div class="zm-popup-meta">🚍 ${escapeHtml(d.vehicle_code)}</div>` : ""}<div class="zm-popup-delay-row"><span class="${delayClass}">${escapeHtml(delayTag)}</span></div></div>`;
  }

  showVehicleMap(lat, lng, info) {
    if (this.mapCtx) { this.mapCtx.destroy(); }

    const isMobile = window.innerWidth < 480;
    const w = Math.min(window.innerWidth * 0.92, 520);
    const h = Math.min(window.innerHeight * 0.65, 420);

    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:100000;display:flex;align-items:center;justify-content:center;";
    overlay.innerHTML = `<div style="position:relative;width:${w}px;height:${h}px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.3);"><button style="position:absolute;top:8px;right:8px;z-index:1001;background:rgba(0,0,0,0.6);border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;color:#fff;">✕</button><div id="vmap" style="width:${w}px;height:${h}px;"></div><div id="vmap-status" style="position:absolute;bottom:6px;left:10px;z-index:1001;font-size:10px;color:#999;background:rgba(255,255,255,0.8);padding:2px 6px;border-radius:4px">🔄 odświeżanie co 30s</div></div>`;
    document.body.appendChild(overlay);
    const closeMap = () => { if (this.mapCtx) this.mapCtx.destroy(); };
    overlay.querySelector("button").onclick = closeMap;
    overlay.onclick = (e) => { if (e.target === overlay) closeMap(); };

    const container = overlay.querySelector("#vmap");

    if (!document.getElementById("ztm-map-style")) {
      const s = document.createElement("style");
      s.id = "ztm-map-style";
      s.textContent = `.zm-arrow{position:relative;display:inline-block;transition:transform 0.8s ease}.zm-arrow svg{display:block}.zm-popup{font-family:system-ui,sans-serif;font-size:12px;line-height:1.3;min-width:120px}.zm-popup-route{font-size:22px;font-weight:800;line-height:1}.zm-popup-headsign{font-size:13px;color:#555}.zm-popup-meta{font-size:10px;color:#999;margin-top:2px}.zm-popup-delay-row{margin-top:4px;font-size:13px;font-weight:600}.zm-popup-delay{color:#e53935}.zm-popup-delay.ontime{color:#43a047}.zm-popup-delay.early{color:#1e88e5}}`;
      document.head.appendChild(s);
    }

    const ctx = {
      destroyed: false,
      map: null,
      interval: null,
      ro: null,
      markers: {},
      overlay: overlay,
      destroy: () => {
        ctx.destroyed = true;
        if (ctx.interval) clearInterval(ctx.interval);
        if (ctx.ro) ctx.ro.disconnect();
        if (ctx.map) { ctx.map.remove(); ctx.map = null; }
        if (ctx.overlay && ctx.overlay.parentNode) ctx.overlay.parentNode.removeChild(ctx.overlay);
        if (this.mapCtx === ctx) this.mapCtx = null;
      }
    };
    this.mapCtx = ctx;

    const color = routeColor(info.route, info.provider || "");

    const createMap = () => {
      requestAnimationFrame(() => {
        if (ctx.destroyed) return;
        const map = window.L.map(container, { zoomControl: true, attributionControl: false }).setView([lat, lng], 16);
        window.L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          maxZoom: 20, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>, &copy; CARTO', subdomains: "abcd",
        }).addTo(map);
        ctx.map = map;

        // Stop location marker
        window.L.circleMarker([lat, lng], { radius: 5, fillColor: color, fillOpacity: 0.5, color: "#fff", weight: 2 }).addTo(map);

        // Show all vehicles with GPS from this entity
        this.renderAllVehicleMarkers(ctx, info, isMobile);

        ctx.ro = new window.ResizeObserver(() => { if (ctx.map) ctx.map.invalidateSize(); });
        ctx.ro.observe(container);
        ctx.interval = setInterval(() => this.updateAllVehiclePositions(ctx), 30000);
      });
    };

    if (window.L) { createMap(); }
    else { (this.leafletLoading || this.preloadLeaflet()).then(createMap); }
  }

  renderAllVehicleMarkers(ctx, info, isMobile) {
    if (!this.card.hass) return;
    const state = this.card.hass.states[ctx.entityId];
    if (!state?.attributes?.departures) return;

    // Clear old markers
    ctx.markers.forEach(m => ctx.map.removeLayer(m));
    ctx.markers = [];

    let hasMain = false;
    const allDeps = state.attributes.departures || [];
    for (const d of allDeps) {
      const pos = parseVehiclePosition(d.vehicle_lat, d.vehicle_lng);
      if (!pos) continue;

      const isMain = d.vehicle_code && d.vehicle_code === ctx.vehicleCode;
      const color = routeColor(d.route, d._provider || d.provider || "");
      const bearing = d.vehicle_direction || d.direction || 0;
      
      
      if (isMain) hasMain = true;

      const r = d.route || "?";
      const b = bearing;
      const mk = this.buildVehicleMarker(b, color, r, d.vehicle_type || "bus", d, isMobile);
      const label = d.vehicle_code ? `<div style="position:absolute; top:-22px; left:50%; transform:translateX(-50%) rotate(-${b + 180}deg); background:rgba(0,0,0,0.75); color:#fff; padding:2px 5px; border-radius:3px; font-size:10px; font-weight:600; font-family:system-ui,sans-serif; white-space:nowrap; pointer-events:none;">${escapeHtml(d.vehicle_code)}</div>` : "";
      const mkHtml = `<div class="zm-arrow" style="transform:rotate(${b + 180}deg);opacity:${isMain ? 1 : 0.7}">${label}${mk.svg}</div>`;
      const icon = window.L.divIcon({
        className: "",
        html: mkHtml,
        iconSize: [mk.size, mk.arrowH],
        iconAnchor: [mk.size / 2, mk.arrowH],
      });
      const marker = window.L.marker([pos[0], pos[1]], { icon }).addTo(ctx.map);
      ctx.markers.push(marker);
    }

    // If no main marker (vehicle_code mismatch), still add a highlight for the closest position
    if (!hasMain && ctx.markers.length > 0) {
      // All markers are already shown; we just track them
    }
  }

  updateAllVehiclePositions(ctx) {
    if (ctx.destroyed || !ctx.entityId || !ctx.map || !this.card.hass) return;
    const state = this.card.hass.states[ctx.entityId];
    if (!state?.attributes?.departures) return;

    const allDeps = state.attributes.departures || [];
    // Clear and re-render all markers
    ctx.markers.forEach(m => ctx.map.removeLayer(m));
    ctx.markers = [];

    const isMobile = window.innerWidth < 480;
    for (const d of allDeps) {
      const pos = parseVehiclePosition(d.vehicle_lat, d.vehicle_lng);
      if (!pos) continue;
      const isMain = d.vehicle_code && d.vehicle_code === ctx.vehicleCode;
      const color = routeColor(d.route, d._provider || d.provider || "");
      const b = d.vehicle_direction || d.direction || 0;
      const r = d.route || "?";
      const mk = this.buildVehicleMarker(b, color, r, d.vehicle_type || "bus", d, isMobile);
      const label = d.vehicle_code ? `<div style="position:absolute; top:-22px; left:50%; transform:translateX(-50%) rotate(-${b + 180}deg); background:rgba(0,0,0,0.75); color:#fff; padding:2px 5px; border-radius:3px; font-size:10px; font-weight:600; font-family:system-ui,sans-serif; white-space:nowrap; pointer-events:none;">${escapeHtml(d.vehicle_code)}</div>` : "";
      const mkHtml = `<div class="zm-arrow" style="transform:rotate(${b + 180}deg);opacity:${isMain ? 1 : 0.7}">${label}${mk.svg}</div>`;
      const icon = window.L.divIcon({
        className: "", html: mkHtml,
        iconSize: [mk.size, mk.arrowH], iconAnchor: [mk.size / 2, mk.arrowH],
      });
      ctx.markers.push(window.L.marker([pos[0], pos[1]], { icon }).addTo(ctx.map));
    }
  }

  updateVehiclePosition(ctx) {
    if (ctx.destroyed || !ctx.entityId || !ctx.marker || !this.card.hass) return;
    const state = this.card.hass.states[ctx.entityId];
    if (!state?.attributes?.departures) return;
    for (const d of state.attributes.departures) {
      if (d.vehicle_code && d.vehicle_code === ctx.vehicleCode) {
        const position = parseVehiclePosition(d.vehicle_lat, d.vehicle_lng);
        if (!position) continue;
        const [newLat, newLng] = position;
        const curPos = ctx.marker.getLatLng();
        if (Math.abs(curPos.lat - newLat) < 0.00001 && Math.abs(curPos.lng - newLng) < 0.00001) {
          return;
        }
        ctx.marker.setLatLng([newLat, newLng]);
        
        const bearing = d.vehicle_direction || d.direction || 0;
        const color = routeColor(d.route, d._provider || d.provider || "");
        const vt = d.vehicle_type || "bus";
        const isMobile = window.innerWidth < 480;
        const mk = this.buildVehicleMarker(bearing, color, d.route, vt, d, isMobile);
        const label = d.vehicle_code ? `<div style="position:absolute; top:-22px; left:50%; transform:translateX(-50%) rotate(-${bearing + 180}deg); background:rgba(0,0,0,0.75); color:#fff; padding:2px 5px; border-radius:3px; font-size:10px; font-weight:600; font-family:system-ui,sans-serif; white-space:nowrap; pointer-events:none;">${escapeHtml(d.vehicle_code)}</div>` : "";
        const mkHtml = `<div class="zm-arrow" style="transform:rotate(${bearing + 180}deg)">${label}${mk.svg}</div>`;
        ctx.marker.setIcon(window.L.divIcon({
          className: "",
          html: mkHtml,
          iconSize: [mk.size, mk.arrowH],
          iconAnchor: [mk.size / 2, mk.arrowH],
        }));
        ctx.map.setView([newLat, newLng], ctx.map.getZoom(), { animate: true });
        break;
      }
    }
  }

}
