/**
 * Validates src/data/hotspots.json. Run via `npm run check:data`.
 * Exits non-zero on any error so it can gate a build or CI step.
 */
import { readFile } from "node:fs/promises";

const REQUIRED = ["city", "name", "cuisine", "description", "lat", "lng", "precision"];
const OPTIONAL = ["neighborhood"];
// Continental US + AK/HI, with slack. Catches swapped lat/lng and dropped signs.
const BOUNDS = { lat: [18, 72], lng: [-180, -66] };

const errors = [];
const warnings = [];
const fail = m => errors.push(m);
const warn = m => warnings.push(m);

const raw = await readFile(new URL("../src/data/hotspots.json", import.meta.url), "utf8");

let data;
try {
    data = JSON.parse(raw);
} catch (err) {
    console.error(`hotspots.json is not valid JSON: ${err.message}`);
    process.exit(1);
}

if (!Array.isArray(data)) {
    console.error("hotspots.json must be an array");
    process.exit(1);
}

const seenCity = new Map();

data.forEach((h, i) => {
    const at = `[${i}] ${h?.city ?? "?"}`;

    for (const key of REQUIRED) {
        if (h[key] === undefined || h[key] === null || h[key] === "") fail(`${at}: missing "${key}"`);
    }

    for (const key of Object.keys(h)) {
        if (!REQUIRED.includes(key) && !OPTIONAL.includes(key)) warn(`${at}: unexpected key "${key}"`);
    }

    if (typeof h.city === "string") {
        const k = h.city.toLowerCase();
        if (seenCity.has(k)) fail(`${at}: duplicate city (also at index ${seenCity.get(k)})`);
        else seenCity.set(k, i);
    }

    if (typeof h.lat !== "number" || Number.isNaN(h.lat)) fail(`${at}: lat is not a number`);
    else if (h.lat < BOUNDS.lat[0] || h.lat > BOUNDS.lat[1]) fail(`${at}: lat ${h.lat} out of range`);

    if (typeof h.lng !== "number" || Number.isNaN(h.lng)) fail(`${at}: lng is not a number`);
    else if (h.lng < BOUNDS.lng[0] || h.lng > BOUNDS.lng[1]) fail(`${at}: lng ${h.lng} out of range`);

    if (h.precision !== "exact" && h.precision !== "city") {
        fail(`${at}: precision must be "exact" or "city", got ${JSON.stringify(h.precision)}`);
    }

    if (typeof h.description === "string" && h.description.length > 260) {
        warn(`${at}: description is ${h.description.length} chars — long for a card`);
    }

    if (h.neighborhood !== undefined && h.neighborhood !== null && typeof h.neighborhood !== "string") {
        fail(`${at}: neighborhood must be a string or null`);
    }
});

// Two hotspots at the same point means a pin is hidden behind another.
const byPoint = new Map();
for (const h of data) {
    const k = `${h.lat},${h.lng}`;
    if (byPoint.has(k)) fail(`${h.city} shares exact coordinates with ${byPoint.get(k)}`);
    else byPoint.set(k, h.city);
}

const exact = data.filter(h => h.precision === "exact").length;
const nbhd = data.filter(h => h.neighborhood).length;

console.log(`hotspots: ${data.length}`);
console.log(`precise coordinates: ${exact}/${data.length}`);
console.log(`neighborhoods: ${nbhd}/${data.length}`);
console.log(`cuisines: ${new Set(data.map(h => h.cuisine)).size} distinct`);

for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);

if (errors.length) {
    console.error(`\n${errors.length} error(s)`);
    process.exit(1);
}
console.log(warnings.length ? `\nok, with ${warnings.length} warning(s)` : "\nok");
