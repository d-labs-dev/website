# D‑LABS Website

**This branch holds two sites.** The Jekyll site that is currently live, and the Astro rewrite that
will replace it. They coexist until cutover so the branch stays reviewable and `master` keeps
building and deploying exactly as before.

|            | Lives in                                                             | Status                                             |
| ---------- | -------------------------------------------------------------------- | -------------------------------------------------- |
| **Astro**  | repo root — `src/`, `content/`, `astro.config.mjs`                   | In progress. See [`docs/astro.md`](docs/astro.md). |
| **Jekyll** | `_config.yml`, `_layouts/`, `_includes/`, `_data/`, `assets/`, `en/` | Live. Untouched by this branch.                    |

The rewrite exists because the Jekyll stack is a dead end: Jekyll is pinned at 3.9 (jekyll-assets
never supported 4), which pins Ruby to 2.7 and bundler to 2.4.22, and routing plus i18n are three
custom Ruby Liquid plugins. The goal of the first pass is **design parity** — same URLs, same
content, same DE/EN split — on a stack that can be worked on. The cosmetic redesign lands after
parity.

## What's implemented

**All pages are ported.** 240 routes build; 224 of the 225 URLs the old build published exist here
with identical filenames (the exception is `/jobs/`, see the cutover checklist). Not yet verified
against production beyond spot checks — see _Still to do_.

| Page                              | DE  | EN  | Notes                                                                             |
| --------------------------------- | :-: | :-: | --------------------------------------------------------------------------------- |
| Home                              | ✅  | ✅  | Angled hero, circle diagram, 4 cross-fading screens, clients, blog + jobs teasers |
| About                             | ✅  | ✅  | Office cards with photos                                                          |
| Approach                          | ✅  | ✅  | Scroll-driven diagram, 7 captions, 3 project case studies                         |
| Services                          | ✅  | ✅  | Scroll-driven scroller + method browser (filter and search over 56 methods)       |
| Jobs                              | ✅  | ✅  | Photo hero, openings list, quote + benefits sliders                               |
| Blog index                        | ✅  | ✅  | Feature + tile grid                                                               |
| Partners                          | ✅  | ✅  |                                                                                   |
| Imprint / Privacy / Accessibility | ✅  | ✅  | Markdown collection                                                               |
| 404                               | ✅  |  —  | German only, as today                                                             |
| Method pages                      | 56  | 56  | From Contentful                                                                   |
| Blog posts                        | 52  | 47  | 5 have no English translation, as today                                           |
| Job postings                      |  3  |  3  | From Contentful                                                                   |

Header, footer, language switcher, cookie-free analytics story and click-to-load map are all in.
`/styleguide` shows every primitive; `/styleguide/scroll` is a lab for the scroll engine.

### Still to do

Phase 5 of the migration plan — parity verification — is mostly outstanding:

- [x] Route diff against the old build (scripted, 224/225)
- [x] hreflang integrity (464/464 resolve)
- [x] `<head>` / SEO parity — 0 tags present on live but absent here
- [x] Link check — 6613 links, 0 broken anchors, 4 broken internal links that are broken on
      production too (Contentful copy pointing at deleted methods, listed below)
- [x] Whitespace spot-check on the inline-adjacency cases
- [x] Heading-structure comparison — identical on services, blog and about
- [~] Visual diff — done at 500 / 768 / 1100 / 1440 for the main pages. Chrome enforces a ~500px
  minimum window width, so a true 375px check needs a real device or Playwright
- [ ] Lighthouse + axe. A static a11y scan found no regressions: the pages without an `h1`
      (approach, services, jobs, blog) have none on production either

Broken links in Contentful copy — content fixes, not code, and 404 on production today:
`/methods/qualitative_befragung.html`, `/methods/qualifying_coaches.html`,
`/en/methods/qualitative_survey.html`, `/en/methods/qualifying_coaches.html`. They appear in the
"Methoden im Fokus: Shadowing" post and in the approach page copy.

Then Phase 6, the cutover, is the checklist at the bottom of this file.

Open questions for the team:

- `search_placeholder` is missing from `content/pages/en/services.yml`, so the English method search
  box has no placeholder. That gap exists on production too — fill it or keep it?
- The approach page's contact block has no `our_locations`, so the link to the offices is omitted
  there. Production renders an empty heading and a stray arrow instead.

## Running the Astro site

```bash
pnpm install
pnpm dev            # localhost:4321
```

| Command            | Does                                                                                                                                                            |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`         | Dev server. `pnpm astro dev --background` to detach, then `astro dev stop` / `status` / `logs`.                                                                 |
| `pnpm build`       | Static build to `dist/`.                                                                                                                                        |
| `pnpm preview`     | Serve `dist/` locally.                                                                                                                                          |
| `pnpm typecheck`   | `astro check`.                                                                                                                                                  |
| `pnpm check:links` | Crawl `dist/` and request every internal link; non-zero exit if any is not 200. Pass a URL to check a running server: `pnpm check:links http://localhost:4321`. |
| `pnpm verify`      | `build` then `check:links`. Run this before handing anything over.                                                                                              |
| `pnpm format`      | Prettier over the repo.                                                                                                                                         |

`/styleguide` renders every primitive on one page — check design-system changes there first. It is
`noindex` and unlinked.

function`and serving 404 for pages the production build has. Changes to`astro.config.mjs` also

> need a restart. `pnpm verify` tests the real build and is the source of truth.

> **If a page 404s in `pnpm dev`, restart the dev server.** Astro 7 fails to register newly added
> route files, logging `Failed to update routes via HMR` and serving 404 for pages the production
> build has. Changes to `astro.config.mjs` also need a restart. `pnpm verify` tests the real build
> and is the source of truth.

## URLs

Astro's own shape: `/about/`, `/methods/personas/`, `/en/blog/microcopy/` — each emitted as
`<route>/index.html`, every link written with the trailing slash so nothing takes a redirect hop.

The Jekyll site served `/about.html`. Those URLs are kept alive rather than shaping the new site
around them:

- **Links in CMS copy are rewritten at render time.** Years of
  `https://d-labs.com/methods/x.html` in Contentful become `/methods/x/` in the output, so they
  point at the canonical URL with no redirect and work on preview too. Editors can keep writing
  either form. See `src/lib/internal-links.ts`.
- **Inbound links need one edge rule.** `pnpm redirects` writes `dist/legacy-redirects.json`,
  the full old → new map (240 entries, every URL the old build published bar `/404.html`). The
  mapping is mechanical, so a single CloudFront Function covers all of it:

  ```
  if (uri.endsWith(".html")) return 301 to uri.slice(0, -5) + "/"
  ```

  The JSON exists to prove that rule is right and to catch anything it would miss. Adding it is a
  cutover step; until then old links 404 on the preview bucket, which is expected.

Read [`docs/astro.md`](docs/astro.md) before porting a page. It carries the old-atomic-class →
Tailwind mapping and a list of things that look wrong but aren't.

## Running the Jekyll site

```bash
env $(cat .env | xargs) bundle exec jekyll contentful   # pull Contentful into _data/
docker compose up                                       # http://127.0.0.1:4000/
```

## Environment

Both sites read the same `.env` (gitignored), so one file serves both:

```
CONTENTFUL_SPACE_ID=…
CONTENTFUL_ACCESS_TOKEN=…
```

## Cutover, when parity is signed off

1. Delete the Jekyll site: `_config.yml`, `Gemfile*`, `_layouts/`, `_includes/`, `_plugins/`,
   `_data/`, `assets/`, `en/`, the root `*.html` / `*.md` pages, `jobs/`, `Dockerfile`,
   `docker-compose.yml`.
2. Point `.circleci/config.yml` at Node: `cimg/node:24`, `pnpm build`, and `dist/` instead of
   `_site/`. Everything else — the branch-conditional S3 sync, the CloudFront invalidation,
   `preview.d-labs.com` for non-master — stays as it is.
3. Move `assets/app-live-release.apk` (46 MB) to S3 directly rather than carrying it over.
4. Add the CloudFront Function that 301s `*.html` to its trailing-slash form (see **URLs** above).
   That one rule covers all 240 legacy URLs, including the 2022 `/jobs/` alias.

Until then CircleCI on this branch still builds the Jekyll site, which is intentional: the branch
changes nothing about what deploys.
