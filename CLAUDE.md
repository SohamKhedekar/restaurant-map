# Restaurant Map

A full-stack restaurant map app. React + Vite frontend, Node.js/Express backend.

## Running locally

**Backend** (port 3001):
```bash
cd backend
node server.js
```

**Frontend** (port 5173):
```bash
cd frontend
npm run dev          # desktop only (localhost)
npm run dev -- --host  # expose to local network (required for phone access)
```

Open `http://localhost:5173` on desktop, or `http://192.168.1.156:5173` on phone (same WiFi).

## Architecture

- `frontend/public/cities.json` — city pin locations (name, lat, lng) for the map markers
- `backend/data/staticRestaurants.json` — restaurant content (city, name, description, lat, lng)
- Cities are matched by name string between the two files — they must match exactly (case-insensitive)

## Behavior

- **Desktop:** hover a city pin → fetches restaurant from backend → shows Leaflet `<Popup>`
- **Mobile:** tap a city pin → fetches restaurant from backend → shows `<BottomSheet>`
- Mobile detection via `useIsMobile` hook (`ontouchstart` / `maxTouchPoints`)

## API

`GET /api/restaurants?city=Paris` — returns `{ success, data }` or `{ success: false, message }`

## Project vision — "Hottest Spot in Town"

Show the single top-rated/trending restaurant per city as a pin on a world map. Click/tap reveals details via tooltip (desktop) or bottom sheet (mobile). Mobile experience is the priority.

## Roadmap

1. **Data** — Populate 100 most populous US cities into `cities.json` and `staticRestaurants.json` (name, one-line description, lat/lng per restaurant)
2. **Geolocation** — Auto-detect user location on page load, zoom map to ~50-mile radius
3. **UI** — Dark mode map, black nav header with left-aligned "hottest spot in town" title, consistent typography

## Development approach

- Present step-by-step plan and get approval before implementing each feature
- Smaller, testable commits with clear communication about what changed and how to test

## Known gaps

- London, Tokyo, Mumbai have map pins but no restaurant data in `staticRestaurants.json`
- `backend/utils/responseFormat.js` is empty
- Frontend uses a Vite proxy (`/api` → `http://localhost:3001`) to avoid mixed content issues with HTTPS dev server

## Stack

- Frontend: React 19, Vite, react-leaflet, leaflet
- Backend: Express 5, cors
- Git remote: `git@github.com:SohamKhedekar/restaurant-map.git`
