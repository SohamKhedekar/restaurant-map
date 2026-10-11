import { allHotspots } from "./hotspots";

/**
 * Folds a string into a comparable form: lowercase, accents stripped, and all
 * punctuation reduced to single spaces. This is what lets "cafe central" match
 * "Café Central" and "bar a vin" match "Waxlight Bar à Vin".
 */
function normalize(value) {
    return (value ?? "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

/**
 * What people type instead of the official city name. Without these, "sf" and
 * "nyc" find nothing, which feels broken for the two most-searched cities.
 */
const ALIASES = {
    "New York": ["nyc", "new york city", "manhattan", "brooklyn", "queens", "bronx"],
    "San Francisco": ["sf", "san fran", "frisco", "bay area"],
    "Los Angeles": ["la", "l a", "hollywood", "socal"],
    "Washington": ["dc", "washington dc", "d c"],
    "New Orleans": ["nola"],
    "Philadelphia": ["philly"],
    "Las Vegas": ["vegas"],
    "Minneapolis": ["twin cities"],
    "St. Paul": ["saint paul", "twin cities"],
    "St. Louis": ["saint louis", "stl"],
    "St. Petersburg": ["saint petersburg", "st pete"],
    "Oklahoma City": ["okc"],
    "Kansas City": ["kc"],
    "Fort Worth": ["ft worth", "dfw"],
    "Dallas": ["dfw"],
    "Chicago": ["chi town", "chitown"],
    "Boise City": ["boise"],
};

// Normalised once at module load rather than on every keystroke.
const index = allHotspots.map(hotspot => ({
    hotspot,
    city: normalize(hotspot.city),
    name: normalize(hotspot.name),
    cuisine: normalize(hotspot.cuisine),
    neighborhood: normalize(hotspot.neighborhood),
    aliases: (ALIASES[hotspot.city] ?? []).map(normalize),
}));

/**
 * Below this length, a token may only match at the start of a field or of a
 * word within it. Otherwise "sf" finds Baker*sf*ield, which is noise that
 * crowds out nothing useful — short queries are almost always abbreviations
 * or the first letters of a name.
 */
const MIN_BURIED_MATCH_LEN = 3;

/** Higher is better. Field order encodes what people most often type. */
const FIELD_WEIGHTS = [
    ["city", 100, 80],
    ["name", 70, 55],
    ["cuisine", 45, 35],
    ["neighborhood", 30, 22],
];

function scoreField(haystack, needle, startsWithScore, containsScore) {
    if (!haystack) return 0;
    if (haystack.startsWith(needle)) return startsWithScore;
    // A word boundary beats a match buried mid-word: "york" should find
    // "New York", but "ork" should rank lower.
    if (haystack.includes(` ${needle}`)) return startsWithScore - 10;
    if (needle.length < MIN_BURIED_MATCH_LEN) return 0;
    if (haystack.includes(needle)) return containsScore;
    return 0;
}

/** Aliases are shorthand for a whole city, so only a prefix match counts. */
function scoreAliases(aliases, needle) {
    for (const alias of aliases) {
        if (alias === needle) return 110;
        if (alias.startsWith(needle)) return 95;
    }
    return 0;
}

function scoreEntry(entry, tokens) {
    let total = 0;
    for (const token of tokens) {
        let best = scoreAliases(entry.aliases, token);
        for (const [field, startsWith, contains] of FIELD_WEIGHTS) {
            best = Math.max(best, scoreField(entry[field], token, startsWith, contains));
        }
        // Every token must land somewhere, so "italian denver" does not match a
        // hotspot that satisfies only one of the two words.
        if (best === 0) return 0;
        total += best;
    }
    return total;
}

/**
 * Ranked hotspots for a query. A linear scan over 100 pre-normalised entries
 * is fast enough to run on every keystroke, so there is no index or debounce.
 */
export function searchHotspots(query, limit = 8) {
    const tokens = normalize(query).split(" ").filter(Boolean);
    if (!tokens.length) return [];

    const scored = [];
    for (const entry of index) {
        const score = scoreEntry(entry, tokens);
        if (score > 0) scored.push({ entry, score });
    }

    scored.sort(
        (a, b) => b.score - a.score || a.entry.hotspot.city.localeCompare(b.entry.hotspot.city)
    );
    return scored.slice(0, limit).map(s => s.entry.hotspot);
}
