import hotspots from "../data/hotspots.json";

/**
 * Hotspot shape:
 *   city, name, cuisine, description, lat, lng
 *   neighborhood — string, or null when OpenStreetMap had none
 *   precision    — "exact" when the coordinates are the restaurant itself,
 *                  "city" when they fall back to the city center
 */
export const allHotspots = hotspots;

const byCity = new Map(hotspots.map(h => [h.city.toLowerCase(), h]));

/** Look up a single hotspot by city name, case-insensitively. */
export function getHotspotByCity(city) {
    if (!city) return null;
    return byCity.get(city.trim().toLowerCase()) ?? null;
}

/**
 * A directions link for a hotspot.
 *
 * Deliberately searches by name + city rather than by coordinates: the search
 * resolves to the venue's own map entry (with hours, reviews and a correct
 * marker label) and stays right for the 43 hotspots whose coordinates are only
 * city-accurate. It also means there is no per-entry URL in the data to rot.
 * The universal Google Maps URL opens the native app on iOS and Android.
 */
export function directionsUrl({ name, city }) {
    const query = encodeURIComponent(`${name}, ${city}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
