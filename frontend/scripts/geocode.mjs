/**
 * One-time data tool: resolve each hotspot's real coordinates and neighborhood
 * via Nominatim (OpenStreetMap), which is free and needs no API key.
 *
 *   node scripts/geocode.mjs [--dry]
 *
 * Nominatim's usage policy requires an identifying User-Agent and at most one
 * request per second, so this is deliberately slow. It is run by hand when the
 * data changes, never at build or runtime.
 *
 * A result is only accepted if it lands within MAX_KM of the city center —
 * Nominatim will happily return a same-named restaurant in another state.
 * Rejected and missing lookups keep the city coordinate and are marked
 * `precision: "city"` so the UI can tell the difference.
 */
import { readFile, writeFile } from "node:fs/promises";

const DATA = new URL("../src/data/hotspots.json", import.meta.url);
const UA = "hottest-spot-in-town/1.0 (https://github.com/SohamKhedekar/restaurant-map)";
const MAX_KM = 40;
const DELAY_MS = 1100;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function haversineKm(a, b) {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const la1 = (a.lat * Math.PI) / 180;
    const la2 = (b.lat * Math.PI) / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

async function query(q) {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "5");
    url.searchParams.set("countrycodes", "us");

    const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "en" } });
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    return res.json();
}

/** OSM puts the useful local name under one of several keys depending on the city. */
function neighborhoodOf(address = {}) {
    return (
        address.neighbourhood ||
        address.quarter ||
        address.suburb ||
        address.city_district ||
        address.borough ||
        null
    );
}

const hotspots = JSON.parse(await readFile(DATA, "utf8"));
const dry = process.argv.includes("--dry");
const report = [];

for (const [i, h] of hotspots.entries()) {
    const center = { lat: h.lat, lng: h.lng };
    // Most specific query first; fall back to a looser one before giving up.
    const attempts = [`${h.name}, ${h.city}, United States`, `${h.name}, ${h.city}`];

    let hit = null;
    for (const q of attempts) {
        let results = [];
        try {
            results = await query(q);
        } catch (err) {
            report.push({ city: h.city, status: "error", detail: err.message });
            await sleep(DELAY_MS);
            continue;
        }
        await sleep(DELAY_MS);

        // Nominatim orders by relevance; take the first that is plausibly in-city.
        hit = results
            .map(r => ({ r, km: haversineKm(center, { lat: +r.lat, lng: +r.lon }) }))
            .filter(x => x.km <= MAX_KM)
            .sort((a, b) => a.km - b.km)[0];
        if (hit) break;
    }

    if (!hit) {
        h.precision = "city";
        h.neighborhood = h.neighborhood ?? null;
        report.push({ city: h.city, name: h.name, status: "unresolved" });
    } else {
        const { r, km } = hit;
        h.lat = +(+r.lat).toFixed(6);
        h.lng = +(+r.lon).toFixed(6);
        h.neighborhood = neighborhoodOf(r.address);
        h.precision = "exact";
        report.push({
            city: h.city, name: h.name, status: "ok",
            movedKm: +km.toFixed(1), neighborhood: h.neighborhood, osm: r.display_name?.slice(0, 60),
        });
    }

    process.stderr.write(`\r${i + 1}/${hotspots.length} ${h.city.padEnd(18)}`);
}

process.stderr.write("\n");

const ok = report.filter(r => r.status === "ok");
console.log(`resolved : ${ok.length}/${hotspots.length}`);
console.log(`unresolved: ${report.filter(r => r.status === "unresolved").length}`);
console.log(`errors    : ${report.filter(r => r.status === "error").length}`);

if (!dry) {
    await writeFile(DATA, JSON.stringify(hotspots, null, 2) + "\n");
    console.log("wrote src/data/hotspots.json");
}
await writeFile(new URL("./geocode-report.json", import.meta.url), JSON.stringify(report, null, 2) + "\n");
console.log("wrote scripts/geocode-report.json");
