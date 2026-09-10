// @ts-check
import { defineConfig, envField, fontProviders } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import { satteri } from "@astrojs/markdown-satteri";
import { hardBreaks } from "./src/lib/hard-breaks.ts";

const FONTS = "./src/assets/fonts";
/** @type {[string, ...string[]]} */
const ROBOTO_REGULAR = [`${FONTS}/roboto-latin-400.woff2`, `${FONTS}/roboto-latin-400.woff`];
/** @type {[string, ...string[]]} */
const ROBOTO_ITALIC = [
  `${FONTS}/roboto-latin-400italic.woff2`,
  `${FONTS}/roboto-latin-400italic.woff`,
];
/** @type {[string, ...string[]]} */
const ROBOTO_MEDIUM = [`${FONTS}/roboto-latin-500.woff2`, `${FONTS}/roboto-latin-500.woff`];
/** @type {[string, ...string[]]} */
const ROBOTO_MEDIUM_ITALIC = [
  `${FONTS}/roboto-latin-500italic.woff2`,
  `${FONTS}/roboto-latin-500italic.woff`,
];
/** @type {[string, ...string[]]} */
const LETTER_GOTHIC = [`${FONTS}/LetterGothicTextWeb.woff`];
/** @type {[string, ...string[]]} */
const LETTER_GOTHIC_BOLD = [`${FONTS}/LetterGothicTextWeb-Bold.woff`];

// https://astro.build/config
export default defineConfig({
  site: "https://d-labs.com",
  output: "static",

  // Astro's own URL shape: /about/ and /methods/personas/, each emitted as
  // <route>/index.html. The Jekyll site served /about.html, and the old
  // .html URLs are kept alive by redirects rather than by shaping the new site
  // around them — see redirects.json in the build output and the cutover notes
  // in README.md.
  build: {
    format: "directory",
  },
  // Every URL ends in a slash, and internal links are written that way, so
  // visitors never take a redirect hop to reach the canonical form.
  trailingSlash: "always",

  // Astro 7 defaults this to 'jsx', which strips whitespace between adjacent
  // inline elements (`<span>a</span><em>b</em>` -> "ab"). Several places in the
  // design depend on that space surviving — the footnote marker on the jobs
  // page, the tel/<br>/mailto runs in Locations. Keep HTML whitespace rules.
  compressHTML: true,

  // German is served unprefixed and English under /en/, which with
  // build.format: "file" above yields /about.html and /en/about.html —
  // the current site's URLs. Replaces locale_link_tag.rb and
  // language_switcher_tag.rb.
  i18n: {
    locales: ["de", "en"],
    defaultLocale: "de",
    routing: {
      prefixDefaultLocale: false,
    },
  },

  env: {
    schema: {
      CONTENTFUL_SPACE_ID: envField.string({
        context: "server",
        access: "secret",
      }),
      // Named to match the existing repo and CircleCI context so the CI
      // variables carry over unchanged.
      CONTENTFUL_ACCESS_TOKEN: envField.string({
        context: "server",
        access: "secret",
      }),
      // Ships in the page, so it must be HTTP-referrer restricted in the Google
      // Cloud console — which also means the map only renders on an allowed
      // host, not on localhost or the S3 preview hostname. Optional so a build
      // without it warns and leaves the map empty rather than failing.
      PUBLIC_GOOGLE_MAPS_API_KEY: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
    },
  },

  /**
   * Self-hosted fonts, declared through Astro's font API so it generates the
   * @font-face rules, fallback metrics and preload hints rather than us
   * hand-writing them.
   *
   * On the weights, because it is genuinely confusing otherwise: this design has
   * no Roboto Bold. Its "bold" is the Roboto *Medium* cut
   * (roboto-latin-500.woff2 — internal name "Roboto Medium", usWeightClass 500).
   * The old site declared that file at `font-weight: bold` and nothing at 500,
   * which made `font-bold` correct but `font-medium` silently fall back to
   * Regular.
   *
   * Here the Medium file is registered at both 500 and 700. `font-medium` and
   * `font-bold` then both resolve to a real declared face, so neither triggers
   * synthetic bolding, and the rendering matches production. Swap in a genuine
   * roboto-latin-700 later and only the 700 entry changes.
   *
   * Letter Gothic's bold is a real 700 (usWeightClass 700), so it needs none of
   * this.
   */
  /*
   * Pinned: dev on Astro's default port, `preview` next door so the two can run
   * side by side. `strictPort` lives in the Vite config below — Astro's own
   * server options do not have it, and without it a clash silently moves to the
   * next free port, which is how this session ended up with four orphaned dev
   * servers on 4321-4324 and links pointing at whichever one was newest.
   */
  server: ({ command }) => ({ port: command === "dev" ? 4321 : 4322 }),

  fonts: [
    {
      provider: fontProviders.local(),
      name: "Letter Gothic",
      cssVariable: "--font-letter-gothic",
      fallbacks: ["sans-serif"],
      options: {
        variants: [
          { src: LETTER_GOTHIC, weight: "400", style: "normal" },
          { src: LETTER_GOTHIC_BOLD, weight: "700", style: "normal" },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Roboto",
      cssVariable: "--font-roboto",
      fallbacks: ["sans-serif"],
      options: {
        variants: [
          { src: ROBOTO_REGULAR, weight: "400", style: "normal" },
          { src: ROBOTO_ITALIC, weight: "400", style: "italic" },
          { src: ROBOTO_MEDIUM, weight: "500", style: "normal" },
          { src: ROBOTO_MEDIUM_ITALIC, weight: "500", style: "italic" },
          // Same files again: this design's bold is the Medium cut.
          { src: ROBOTO_MEDIUM, weight: "700", style: "normal" },
          { src: ROBOTO_MEDIUM_ITALIC, weight: "700", style: "italic" },
        ],
      },
    },
  ],

  /*
   * kramdown's `hard_wrap` in one plugin — see src/lib/hard-breaks.ts for why the
   * legal pages need it.
   */
  markdown: {
    processor: satteri({ mdastPlugins: [hardBreaks] }),
  },

  integrations: [sitemap({ i18n: { defaultLocale: "de", locales: { de: "de-DE", en: "en-US" } } })],

  vite: {
    plugins: [tailwindcss()],
    server: { strictPort: true },
    preview: { strictPort: true },
  },
});
