/**
 * Catches the two stylesheet faults that build and lint both pass silently.
 * Run via `npm run check:styles`.
 *
 *   1. A .css file that nothing imports. Vite only bundles what is reachable
 *      from the entry, so an orphaned stylesheet is dead code that still looks
 *      correct in the editor. index.css sat unimported and every design token
 *      in it resolved to nothing.
 *   2. A var(--token) with no matching definition, which CSS resolves to the
 *      empty string rather than erroring — a transparent background and black
 *      inherited text instead of a visible failure.
 */
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const SRC = new URL("../src/", import.meta.url).pathname;

async function walk(dir) {
    const out = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) out.push(...(await walk(full)));
        else out.push(full);
    }
    return out;
}

const files = await walk(SRC);
const cssFiles = files.filter(f => f.endsWith(".css"));
const codeFiles = files.filter(f => /\.(jsx?|tsx?)$/.test(f));

const errors = [];

// ── 1. every stylesheet is imported somewhere ──────────────────────────────
const codeSources = await Promise.all(codeFiles.map(f => readFile(f, "utf8")));
const allCode = codeSources.join("\n");

for (const css of cssFiles) {
    const base = css.split("/").pop();
    // Matches `import "./index.css"` and `import "../styles/map.css"`.
    if (!new RegExp(`import\\s+["'][^"']*${base.replace(".", "\\.")}["']`).test(allCode)) {
        errors.push(`${relative(SRC, css)} is never imported — Vite will not bundle it`);
    }
}

// ── 2. every var(--token) has a definition ─────────────────────────────────
const cssSources = await Promise.all(cssFiles.map(f => readFile(f, "utf8")));
const defined = new Set();
const used = new Map(); // token -> first file that uses it

cssSources.forEach((source, i) => {
    for (const m of source.matchAll(/(--[\w-]+)\s*:/g)) defined.add(m[1]);
    for (const m of source.matchAll(/var\(\s*(--[\w-]+)/g)) {
        if (!used.has(m[1])) used.set(m[1], relative(SRC, cssFiles[i]));
    }
});

for (const [token, where] of used) {
    if (!defined.has(token)) errors.push(`${where}: var(${token}) is never defined`);
}

console.log(`stylesheets: ${cssFiles.length}`);
console.log(`custom properties: ${defined.size} defined, ${used.size} used`);

for (const e of errors) console.error(`ERROR ${e}`);
if (errors.length) {
    console.error(`\n${errors.length} error(s)`);
    process.exit(1);
}
console.log("\nok");
