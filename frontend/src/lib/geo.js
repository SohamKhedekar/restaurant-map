import { allHotspots } from "./hotspots";

const EARTH_RADIUS_KM = 6371;
const toRad = deg => (deg * Math.PI) / 180;

/** Great-circle distance in kilometres. */
export function haversineKm(a, b) {
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * The closest hotspot to a point, as `{ hotspot, km }`.
 *
 * A linear scan over 100 entries is well under a millisecond, so there is no
 * reason to build a spatial index.
 */
export function nearestHotspot(coords) {
    let best = null;
    for (const hotspot of allHotspots) {
        const km = haversineKm(coords, hotspot);
        if (!best || km < best.km) best = { hotspot, km };
    }
    return best;
}

export const kmToMiles = km => km * 0.621371;
