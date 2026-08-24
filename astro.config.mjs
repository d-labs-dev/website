// @ts-check
import { defineConfig, envField, fontProviders } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

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

  // The current site is Jekyll, so every URL carries a .html extension:
  // /about.html, /methods/adjektiv-assoziation.html, /en/blog/foo.html.
  // Astro's default 'directory' format would emit /about/ instead and break
  // every inbound link — including the absolute d-labs.com/methods/... links
  // that editors have written inside Contentful bodies.
  //
  // "preserve" rather than "file": with "file", an index page inside a
  // subdirectory is flattened, so src/pages/en/index.astro emitted en.html and
  // /en/ — the English home page — 404'd. "preserve" mirrors src/pages exactly,
  // which is what Jekyll did.
  build: {
    format: "preserve",
  },
  trailingSlash: "never",

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
      // Cloud console. Optional: without it the map renders a disabled
      // placeholder rather than breaking the build.
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

  integrations: [sitemap({ i18n: { defaultLocale: "de", locales: { de: "de-DE", en: "en-US" } } })],

  vite: {
    plugins: [tailwindcss()],
  },
});
