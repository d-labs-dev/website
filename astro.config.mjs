// @ts-check
import { defineConfig, envField } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://d-labs.com",
  output: "static",

  // The current site is Jekyll, so every URL carries a .html extension:
  // /about.html, /methods/adjektiv-assoziation.html, /en/blog/foo.html.
  // Astro's default 'directory' format would emit /about/ instead and break
  // every inbound link — including the absolute d-labs.com/methods/... links
  // that editors have written inside Contentful bodies.
  build: {
    format: "file",
  },
  trailingSlash: "never",

  // Astro 7 defaults this to 'jsx', which strips whitespace between adjacent
  // inline elements (`<span>a</span><em>b</em>` -> "ab"). Several places in the
  // design depend on that space surviving — the footnote marker on the jobs
  // page, the tel/<br>/mailto runs in Locations. Keep HTML whitespace rules.
  compressHTML: true,

  // Yields `/about` for German and `/en/about` for English, matching the
  // current site's URLs exactly. Replaces the locale_link_tag.rb and
  // language_switcher_tag.rb Liquid plugins.
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
    },
  },

  integrations: [sitemap({ i18n: { defaultLocale: "de", locales: { de: "de-DE", en: "en-US" } } })],

  vite: {
    plugins: [tailwindcss()],
  },
});
