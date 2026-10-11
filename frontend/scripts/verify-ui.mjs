/**
 * Renders the built app in a real browser and asserts the things that lint and
 * build cannot see. Run via `npm run verify:ui`.
 *
 * This exists because `index.css` once shipped unimported: every design token
 * resolved to nothing, the page rendered as black text on a grey map, and
 * every other check passed. The assertions below are written against that
 * failure — computed styles, not source code.
 *
 * Screenshots land in screenshots/ for a human to glance at afterwards.
 */
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { chromium, devices } from "playwright";

const PORT = 4173;
const BASE = `http://localhost:${PORT}`;
const SHOTS = new URL("../screenshots/", import.meta.url).pathname;

// Somewhere with a known nearest hotspot, so the location flow is testable.
const SAN_FRANCISCO = { latitude: 37.7749, longitude: -122.4194 };
const EXPECTED_NEAREST = "San Francisco";

const failures = [];
const check = (ok, label, detail = "") => {
    if (ok) console.log(`  ok    ${label}`);
    else {
        console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
        failures.push(label);
    }
};

async function waitForServer(url, timeoutMs = 30000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            const res = await fetch(url);
            if (res.ok) return;
        } catch {
            // not up yet
        }
        await new Promise(r => setTimeout(r, 250));
    }
    throw new Error(`preview server did not start at ${url}`);
}

/** Parses "rgb(a)(...)" and reports whether it is fully transparent. */
function isTransparent(color) {
    if (!color || color === "transparent") return true;
    const match = color.match(/rgba?\(([^)]+)\)/);
    if (!match) return false;
    const parts = match[1].split(",").map(n => parseFloat(n));
    return parts.length === 4 && parts[3] === 0;
}

function luminance(color) {
    const match = color?.match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const [r, g, b] = match[1].split(",").map(n => parseFloat(n));
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

await mkdir(SHOTS, { recursive: true });

console.log("starting preview server…");
const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
    env: { ...process.env, NO_HTTPS: "1" },
    stdio: "ignore",
});

let browser;
try {
    await waitForServer(BASE);
    browser = await chromium.launch();

    const viewports = [
        { label: "desktop", options: { viewport: { width: 1280, height: 860 } } },
        { label: "phone", options: { ...devices["iPhone 13"] } },
    ];

    for (const { label, options } of viewports) {
        console.log(`\n${label}`);

        const context = await browser.newContext({
            ...options,
            geolocation: SAN_FRANCISCO,
            permissions: ["geolocation"],
            locale: "en-US",
        });
        const page = await context.newPage();

        const consoleErrors = [];
        page.on("console", msg => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
        page.on("pageerror", err => consoleErrors.push(String(err)));

        await page.goto(BASE, { waitUntil: "load" });

        // ── tokens actually reached the browser ────────────────────────────
        const accent = await page.evaluate(() =>
            getComputedStyle(document.documentElement).getPropertyValue("--accent").trim()
        );
        check(accent.length > 0, "design tokens are loaded", `--accent = "${accent}"`);

        // ── the map rendered ───────────────────────────────────────────────
        await page.waitForSelector(".pin-dot", { timeout: 15000 }).catch(() => {});
        const pins = await page.locator(".pin-dot").count();
        check(pins >= 50, "hotspot pins rendered", `found ${pins}`);

        // Tiles arrive over the network well after load, so poll rather than
        // sampling once.
        const countTiles = () => page.evaluate(() =>
            [...document.querySelectorAll(".leaflet-tile")].filter(t => t.complete && t.naturalWidth > 0).length
        );
        // Wait for the count to stop climbing, not merely to become non-zero:
        // a single loaded tile still means a mostly black map.
        let tilesLoaded = 0;
        let stableFor = 0;
        for (const deadline = Date.now() + 20000; Date.now() < deadline;) {
            const now = await countTiles();
            stableFor = now === tilesLoaded && now > 0 ? stableFor + 1 : 0;
            tilesLoaded = now;
            if (stableFor >= 3) break;
            await page.waitForTimeout(400);
        }
        // A viewport this size needs a dozen or more tiles to be covered.
        check(tilesLoaded >= 12, "basemap tiles loaded", `${tilesLoaded} tiles`);

        // ── geolocation resolved to the nearest hotspot ────────────────────
        const card = page.locator(".card-layer.open .card");
        const opened = await card.waitFor({ state: "visible", timeout: 15000 }).then(() => true).catch(() => false);
        check(opened, "card opened from geolocation");

        if (opened) {
            // innerText reflects text-transform: uppercase, so compare folded.
            const eyebrow = (await page.locator(".card-eyebrow").innerText())
                .replace(/\s+/g, " ").trim();
            check(
                eyebrow.toLowerCase().includes(EXPECTED_NEAREST.toLowerCase()),
                `nearest hotspot is ${EXPECTED_NEAREST}`,
                `card says "${eyebrow}"`
            );

            // ── the bug that started this: a card with no surface ──────────
            const styles = await card.evaluate(el => {
                const s = getComputedStyle(el);
                return { background: s.backgroundColor, color: s.color };
            });
            check(!isTransparent(styles.background), "card has a visible background", styles.background);

            const textLum = luminance(styles.color);
            check(textLum !== null && textLum > 0.5, "card text is light on dark", styles.color);

            // ── the whole card has to be on screen ────────────────────────
            const box = await card.boundingBox();
            const vp = page.viewportSize();
            check(
                box !== null && box.y >= -1 && box.y + box.height <= vp.height + 1,
                "card fits within the viewport",
                box ? `top ${Math.round(box.y)}, bottom ${Math.round(box.y + box.height)}, viewport ${vp.height}` : "no box"
            );

            const directionsVisible = await page.locator(".card-directions").isVisible();
            check(directionsVisible, "Directions button is visible");

            // ── the map must stay usable with the card open ────────────────
            const layerEvents = await page.locator(".card-layer").evaluate(el => getComputedStyle(el).pointerEvents);
            check(layerEvents === "none", "card layer does not block the map", `pointer-events: ${layerEvents}`);
        }

        // ── location control settled, never stuck ──────────────────────────
        const nearMe = (await page.locator(".near-me").innerText()).trim();
        check(nearMe !== "Locating…", "location button is not stuck", `reads "${nearMe}"`);

        // ── search returns ranked results ──────────────────────────────────
        await page.locator(".search-input").fill("nyc");
        const firstResult = await page.locator(".search-result-city").first().innerText().catch(() => "");
        check(firstResult === "New York", 'search "nyc" finds New York', `got "${firstResult}"`);
        await page.locator(".search-input").press("Escape");
        const searchClosed = await page.locator(".search.open").count();
        check(searchClosed === 0, "Escape closes the search");

        check(consoleErrors.length === 0, "no console errors", consoleErrors.slice(0, 2).join(" | "));

        // Web fonts reflow the card after load, so a screenshot taken before
        // they settle shows stale geometry.
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(400);
        await page.screenshot({ path: `${SHOTS}${label}.png`, fullPage: false });
        console.log(`  saved screenshots/${label}.png`);

        await context.close();
    }
} finally {
    await browser?.close();
    server.kill();
}

console.log("");
if (failures.length) {
    console.error(`${failures.length} check(s) failed:`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
}
console.log("all checks passed");
