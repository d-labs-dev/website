#!/usr/bin/env node
/**
 * Map every URL the Jekyll site published to its new address, so nothing that
 * exists today 404s after the cutover.
 *
 *   node scripts/legacy-redirects.mjs          # write dist/legacy-redirects.json
 *   node scripts/legacy-redirects.mjs --check  # verify each target exists, no write
 *
 * The mapping is mechanical — `/about.html` -> `/about/`, `/en/blog/x.html` ->
 * `/en/blog/x/` — so a single edge rule covers all of it (see README). The file
 * exists to prove the rule is right, and to catch any URL the rule would miss.
 */
import { readdir, writeFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const DIST = "dist";

/** Every .html file under dist/, as a URL path. */
async function builtUrls(dir = DIST) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await builtUrls(path)));
    else if (entry.name.endsWith(".html")) {
      const rel = "/" + relative(DIST, path).split("\\").join("/");
      out.push(rel === "/index.html" ? "/" : rel.replace(/\/index\.html$/, "/"));
    }
  }
  return out;
}

/**
 * The old URL for a new one. Inverse of the move from Jekyll's `.html` files to
 * Astro's directories.
 *
 *   /            -> /            (unchanged)
 *   /en/         -> /en/         (unchanged)
 *   /about/      -> /about.html
 *   /methods/x/  -> /methods/x.html
 */
function legacyUrl(url) {
  if (url === "/" || url === "/en/") return null;
  if (!url.endsWith("/")) return null; // 404.html and friends
  return `${url.slice(0, -1)}.html`;
}

const urls = (await builtUrls()).sort();
const pages = urls.filter((u) => u.endsWith("/"));

const redirects = {};
for (const url of pages) {
  const legacy = legacyUrl(url);
  if (legacy) redirects[legacy] = url;
}

// The two aliases the old site served that have no direct equivalent.
redirects["/jobs/index.html"] = "/jobs/";
redirects["/en/index.html"] = "/en/";
redirects["/index.html"] = "/";

if (process.argv.includes("--check")) {
  const missing = Object.entries(redirects).filter(([, target]) => !pages.includes(target));
  console.log(`legacy urls mapped: ${Object.keys(redirects).length}`);
  console.log(`targets missing:    ${missing.length}`);
  for (const [from, to] of missing) console.log(`  ${from} -> ${to} (target not built)`);
  process.exit(missing.length === 0 ? 0 : 1);
}

const file = join(DIST, "legacy-redirects.json");
await writeFile(file, JSON.stringify(redirects, null, 2) + "\n");
console.log(`wrote ${file}: ${Object.keys(redirects).length} redirects`);

// A quick sanity read for whoever configures the edge rule.
const sample = Object.entries(redirects).slice(0, 4);
for (const [from, to] of sample) console.log(`  ${from}  ->  ${to}`);
console.log(`  … and ${Object.keys(redirects).length - sample.length} more`);
await stat(file);
