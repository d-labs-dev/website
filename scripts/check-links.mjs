#!/usr/bin/env node
/**
 * Crawl every page and request every internal link, reporting anything that is
 * not a 200. Catches what a build cannot: a link whose target exists as a file
 * but not at the URL it is linked by, and vice versa.
 *
 *   node scripts/check-links.mjs                       # against dist/, self-served
 *   node scripts/check-links.mjs http://localhost:4321 # against a running server
 *
 * Exits non-zero if anything is broken, so it can gate CI.
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const DIST = "dist";
const CONCURRENCY = 16;

/**
 * Links that are broken on production today, so a red run means a *new* break
 * rather than this backlog. Every one is Contentful copy or approach page text
 * pointing at a method page that no longer exists — a content edit, not a code
 * change. Each was verified 404 on d-labs.com.
 *
 * See docs/content-backlog.md for the list with the pages that link them.
 */
const KNOWN_BROKEN = new Set([
  "/en/methods/business_process_modeling/",
  "/en/methods/online_training_creativity_techniques/",
  "/en/methods/online_training_home_office/",
  "/en/methods/online_training_micorosoft-365_teams/",
  "/en/methods/online_training_user_research/",
  "/en/methods/online_training_visualization_training/",
  "/en/methods/qualifying_coaches/",
  "/en/methods/qualitative_survey/",
  "/en/methods/user_research/",
  "/en/methods/visualization_training/",
  "/en/services-and-methods/qualitative_survey/",
  "/journal/fehlerquellen_im_user_research_-_teil_1/",
  "/journal/von_interviews__fokusgruppen_und_co-creation_-_welche_methode_ist_die_richtige_/",
  "/journal/wer_sind_lead_user_/",
  "/leistungen-und-methoden/qualitative_befragung/",
  "/methods/business_process_modelling_mit_greifbarem_material/",
  "/methods/online_schulung_home_office/",
  "/methods/online_schulung_kreativitatstechniken/",
  "/methods/online_schulung_microsoft_365_teams/",
  "/methods/online_schulung_use_research/",
  "/methods/online_schulung_visualisierungstraining/",
  "/methods/qualifying_coaches/",
  "/methods/qualitative_befragung/",
  "/methods/quantitative_umfragen/",
  "/methods/scrum/",
  "/methods/user_research/",
  "/methods/visualisierungstraining/",
]);

const TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".xml": "application/xml",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
};

/** Serve dist/ the way S3 behind CloudFront does: directories get index.html. */
async function serveDist() {
  const server = createServer(async (req, res) => {
    let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (path.endsWith("/")) path += "index.html";
    const file = join(DIST, normalize(path).replace(/^(\.\.[/\\])+/, ""));
    try {
      const info = await stat(file);
      if (info.isDirectory()) throw new Error("directory");
      res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
      res.end(await readFile(file));
    } catch {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
    }
  });
  await new Promise((resolve) => server.listen(0, resolve));
  return { server, origin: `http://localhost:${server.address().port}` };
}

const HREF = /<a\b[^>]*\bhref="([^"]+)"/gi;
const SRC = /<(?:img|script|source)\b[^>]*\bsrc="([^"]+)"/gi;
const LINK_HREF = /<link\b[^>]*\bhref="([^"]+)"/gi;

/** Which links this checker is responsible for: same-origin, not mailto/tel/etc. */
function isInternal(href) {
  if (!href) return false;
  if (/^(mailto:|tel:|javascript:|data:|#)/i.test(href)) return false;
  if (/^https?:\/\//i.test(href)) return false;
  // Protocol-relative (`//images.ctfassets.net/...`) is another host, not us.
  // Contentful writes these into markdown bodies and they resolve fine over
  // https; treating them as local paths reports every CMS image as a 404.
  if (href.startsWith("//")) return false;
  return true;
}

function extract(html, pattern) {
  const out = new Set();
  for (const [, href] of html.matchAll(pattern)) out.add(href);
  return out;
}

async function main() {
  const target = process.argv[2];
  const hosted = target ? { origin: target.replace(/\/$/, ""), server: null } : await serveDist();
  const { origin, server } = hosted;

  /** page URL -> the links found on it, so failures name a source. */
  const sources = new Map();
  const status = new Map();
  const queue = ["/"];
  const seen = new Set(["/"]);
  let pagesChecked = 0;

  const check = async (url) => {
    if (status.has(url)) return status.get(url);
    let res;
    try {
      res = await fetch(origin + url, { redirect: "manual" });
    } catch (error) {
      status.set(url, `ERR ${error.message}`);
      return status.get(url);
    }
    status.set(url, res.status);
    return res.status;
  };

  while (queue.length > 0) {
    const batch = queue.splice(0, CONCURRENCY);
    await Promise.all(
      batch.map(async (page) => {
        const code = await check(page);
        if (code !== 200) return;

        const res = await fetch(origin + page);
        const type = res.headers.get("content-type") ?? "";
        if (!type.includes("text/html")) return;
        pagesChecked++;

        const html = await res.text();
        const links = [
          ...extract(html, HREF),
          ...extract(html, SRC),
          ...extract(html, LINK_HREF),
        ].filter(isInternal);

        for (const raw of links) {
          const url = new URL(raw, origin + page).pathname;
          if (!sources.has(url)) sources.set(url, page);
          // Only crawl onward through page links, not assets.
          const isPage = url.endsWith("/") || url.endsWith(".html");
          if (!seen.has(url)) {
            seen.add(url);
            if (isPage) queue.push(url);
            else await check(url);
          }
        }
      }),
    );
  }

  const failures = [...status.entries()].filter(([, code]) => code !== 200);
  const known = failures.filter(([url]) => KNOWN_BROKEN.has(url));
  const broken = failures.filter(([url]) => !KNOWN_BROKEN.has(url));

  console.log(`origin:        ${origin}`);
  console.log(`pages crawled: ${pagesChecked}`);
  console.log(`urls checked:  ${status.size}`);
  console.log(`broken:        ${broken.length}`);
  console.log(`known broken:  ${known.length} (content, broken on production too)`);

  if (broken.length > 0) {
    console.log("");
    for (const [url, code] of broken.sort()) {
      console.log(`  ${String(code).padEnd(6)} ${url}`);
      console.log(`         linked from ${sources.get(url) ?? "(entry point)"}`);
    }
  }

  server?.close();
  process.exit(broken.length === 0 ? 0 : 1);
}

await main();
