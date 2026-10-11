# Restaurant Map

A static restaurant map app. React + Vite, no backend — data ships with the bundle.

## Running locally

```bash
cd frontend
npm run dev            # desktop only (localhost)
npm run dev -- --host  # expose to local network (required for phone access)
```

Open `https://localhost:5173` on desktop, or `https://<LAN-IP>:5173` on phone (same WiFi).
Get the IP with `ipconfig getifaddr en0`; Vite also prints it as the Network URL.

The dev server is HTTPS (`@vitejs/plugin-basic-ssl`) because geolocation needs a
secure context, and a bare `http://192.168.x.x` origin is not one. The certificate
is self-signed, so phones show a warning that has to be accepted once.

## Architecture

- `frontend/src/data/hotspots.json` — the single data file: one entry per city
  (`city`, `name`, `cuisine`, `neighborhood`, `description`, `lat`, `lng`, `precision`)
  - `neighborhood` is `null` where OpenStreetMap had none (57 of 100 have one)
  - `precision` is `"exact"` when the coordinates are the restaurant itself, `"city"`
    when they fall back to the city center. 57/100 are exact — the other 43 are not
    in OpenStreetMap under those names, which is the ceiling for free geocoding.
    The UI must not imply pinpoint accuracy for `"city"` entries.
- `frontend/src/lib/hotspots.js` — `allHotspots`, `getHotspotByCity()` and
  `directionsUrl()`, backed by a `Map` built at module load
  - `directionsUrl()` searches Google Maps by *name + city*, not coordinates, so it
    resolves to the venue's real listing and stays correct for `"city"`-precision
    entries. No per-entry URL is stored, so there is nothing to rot.
- The data is imported into the bundle (not fetched), so there is no loading state and
  no request per pin. Updating data means a rebuild + redeploy.

## Behavior

- **On load:** a cached fix (≤12h, `localStorage`) is read *during the first render*, so
  the map opens already centred on the nearest hotspot instead of flashing the world view
  and correcting itself. A fresh fix arrives via callback and flies the map, but only if
  the automatic jump has not already happened — a late fix must not yank the map away
  from wherever the user has since panned.
- Auto-fly is skipped beyond 250 km, so someone in Europe gets the world view rather than
  being thrown to Boston. The "near me" button still works on request.
- Nearest is plain great-circle distance, which is occasionally surprising: Brooklyn
  resolves to Jersey City (9 km) over New York (11 km). Fixing that properly needs
  population weighting or a reverse-geocode, neither of which seemed worth it yet.
- **Desktop:** hover a city pin → shows Leaflet `<Popup>` (phase 4 moves this to click + card)
- **Mobile:** tap a city pin → opens `<BottomSheet>`
- Both read from the in-memory data, so there is no network request on interaction.
- Mobile detection via `useIsMobile` hook (`ontouchstart` / `maxTouchPoints`)

## Project vision — "Hottest Spot in Town"

Show the single top-rated/trending restaurant per city as a pin on a world map. Click/tap reveals details via tooltip (desktop) or bottom sheet (mobile). Mobile experience is the priority.

## Roadmap

Done: 100 US cities populated; dark map; black nav header; basic geolocation flyTo.

In progress — a phased redesign toward a clean, modern, mobile-first UX:

0. **Static architecture** — one data file, backend deleted, free static hosting ✅
1. **Data model** — cuisine + neighborhood + real coordinates + validator ✅
2. **Location** — nearest-hotspot geolocation ✅
3. **Search** — client-side ranked city search; full-screen overlay on mobile,
   dropdown on desktop
4. **One card** — collapse the hover-popup/bottom-sheet split into a single
   `HotspotCard` (sheet on coarse pointers, floating panel on fine ones); fix the
   dead slide-up animation, `100dvh`, safe-area insets, 44px touch targets,
   tap-highlight; custom pins with an active state
5. **Ship** — title/og/theme-color meta, favicon, then deploy to Cloudflare Pages

Deployment target is Cloudflare Pages (free, push-to-deploy). Nothing is deployed yet —
local web + phone testing comes first.

## Data tooling

```bash
cd frontend
npm run check:data   # validate hotspots.json — exits non-zero on error
npm run geocode      # one-time Nominatim pass; rewrites coords + neighborhoods
```

`check:data` catches missing/unknown keys, duplicate cities, out-of-range or swapped
coordinates, a bad `precision` value, and two hotspots sharing a point (which would
hide one pin behind another). Run it after any edit to the data.

`geocode` is a **manual** tool, never part of the build. Nominatim allows one request
per second and requires an identifying User-Agent, so a full run takes ~3 minutes. It
only accepts a result within 40 km of the city center, because Nominatim will happily
return a same-named restaurant in another state; everything else keeps the city
coordinate. Output lands in `scripts/geocode-report.json` for review.

## Development approach

- Present step-by-step plan and get approval before implementing each feature
- Smaller, testable commits with clear communication about what changed and how to test

## Known gaps

- `useIsMobile` sniffs touch support once at render, so a touchscreen laptop gets the
  mobile path and loses hover, and it never re-evaluates on resize/orientation change.
  Phase 4 replaces it with `matchMedia("(pointer: coarse)")` plus a change listener.
- `.sheet` toggles `display: none` → `block` in the same frame as the panel's transform,
  so the slide-up transition never plays. Fixed in phase 4.
- `#root { height: 100vh }` is taller than the visible viewport on iOS Safari; needs `100dvh`.
- The bottom sheet has no safe-area inset, so its padding runs under the home indicator.
- `src/index.css` still carries Vite boilerplate that fights the palette.
- React 19's `react-hooks/set-state-in-effect` lint rule rejects synchronous `setState`
  inside an effect. Responses from external systems (geolocation, fetch) must update
  state from their own callbacks, and anything knowable at first render belongs in a
  `useState` initialiser. `useGeolocation` is built that way deliberately.
- Only the 100 most populous US cities are covered — no international hotspots.

## Stack

- React 19, Vite 7, react-leaflet 5, leaflet 1.9 — no backend, no runtime dependencies
  beyond the map tile service
- **Tiles: Esri Dark Gray Canvas** (`server.arcgisonline.com`), free and keyless, loaded as
  two layers (Base for geometry, Reference for labels). CARTO's basemaps were dropped in
  Oct 2026 because they now require an API key and silently serve an "API KEY REQUIRED"
  watermark tile rather than returning an error — if the map ever looks wrong, check a
  raw tile URL with `curl` and actually open the PNG before debugging the app code.
- Git remote: `git@github.com:SohamKhedekar/restaurant-map.git`
