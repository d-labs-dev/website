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

## Running the Astro site

```bash
pnpm install
pnpm dev            # localhost:4321
```

| Command          | Does                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm dev`       | Dev server. `pnpm astro dev --background` to detach, then `astro dev stop` / `status` / `logs`. |
| `pnpm build`     | Static build to `dist/`.                                                                        |
| `pnpm preview`   | Serve `dist/` locally.                                                                          |
| `pnpm typecheck` | `astro check`.                                                                                  |
| `pnpm format`    | Prettier over the repo.                                                                         |

`/styleguide` renders every primitive on one page — check design-system changes there first. It is
`noindex` and unlinked.

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
4. Add a CloudFront redirect for `/jobs/` → `/jobs.html`. The Jekyll site has a `jobs/index.html`
   from 2022 (`ref: old_jobs`) serving the jobs page at both URLs. Reproducing it as a page collides
   with `jobs.astro` over the same route — and two URLs for one page is duplicate content anyway —
   so the alias belongs at the edge as a 301. It is the only URL the old build published that this
   one does not.

Until then CircleCI on this branch still builds the Jekyll site, which is intentional: the branch
changes nothing about what deploys.
