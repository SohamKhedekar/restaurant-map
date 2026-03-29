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

## Known gaps

- London, Tokyo, Mumbai have map pins but no restaurant data in `staticRestaurants.json`
- `backend/utils/responseFormat.js` is empty
- Backend IP in `WorldMap.jsx` is hardcoded to `192.168.1.156:3001` (update if IP changes)

## Stack

- Frontend: React 19, Vite, react-leaflet, leaflet
- Backend: Express 5, cors
- Git remote: `git@github.com:SohamKhedekar/restaurant-map.git`
