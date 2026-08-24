# d-labs.com

The D‑LABS website: Astro, static output, content from Contentful, deployed to S3 behind
CloudFront. Replaces the Jekyll 3.9 / Ruby 2.7 site in the `website` repo.

The goal of the initial build is **design parity** with the old site — same 225 routes, same URLs,
same DE/EN split — on a stack that can actually be worked on. The cosmetic redesign lands after
parity, as a components-and-CSS change.

## Commands

| Command          | Does                                                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| `pnpm dev`       | Dev server on :4321. `pnpm astro dev --background` to detach, then `astro dev stop` / `status` / `logs`. |
| `pnpm build`     | Static build to `dist/`.                                                                                 |
| `pnpm preview`   | Serve `dist/` locally.                                                                                   |
| `pnpm typecheck` | `astro check`.                                                                                           |
| `pnpm format`    | Prettier over the repo.                                                                                  |

`/styleguide` renders every primitive on one page. It's `noindex` and unlinked. Check changes to the
design system there first.

## Environment

`.env` (gitignored), same variable names as the old repo so the CircleCI context carries over:

```
CONTENTFUL_SPACE_ID=…
CONTENTFUL_ACCESS_TOKEN=…
```

## Conventions

**No custom CSS classes.** Styling is Tailwind utilities in markup; anything reusable becomes an
Astro component. The two exceptions are element defaults in `src/styles/base.css` and the
`.prose` configuration in `global.css` — the latter styles HTML generated from Contentful markdown,
which can't carry classes.

**One utility per property.** Tailwind resolves competing utilities by their position in the
generated stylesheet, not by order in the `class` attribute. So `w-auto` in a shared string silently
beats `w-[5.5rem]` in a variant string, with no warning and no local override. When composing
classes in component frontmatter, make each group contribute at most one utility per CSS property.
`src/components/Button.astro` is the reference for this.

**Behaviour lives next to its markup.** `Foo.astro` imports `foo.ts` from a scoped `<script>`. No
global behaviour file, no framework, nothing hydrates.

### Porting reference: old atomic classes → Tailwind

The old site used a bespoke atomic system. When porting a template:

**Breakpoints.** The old system was desktop-first `max-width`; Tailwind is mobile-first `min-width`,
so conditions **invert** — the old `q-*` value becomes the base style and the old base becomes the
`sm:`/`md:`/`lg:` variant.

| Old          | Actual px | Tailwind                 |
| ------------ | --------- | ------------------------ |
| `q-sm` ≤30em | 480       | base (no default at 480) |
| `q-md` ≤40em | 640       | `sm:` — exact match      |
| `q-lg` ≤50em | 800       | `md:` (768)              |
| `q-xl` ≤70em | 1120      | `lg:` (1024)             |

e.g. `row q-md-col` → `flex flex-col sm:flex-row`.

Old media queries used `em`, which in a media query resolves against the browser's initial 16px —
_not_ the fluid root below — so those px values are exact.

**Spacing.** The old `sp-*` gap scale lands exactly on Tailwind's default spacing scale, so there are
no custom spacing tokens. Only the numbers differ:

| Old    | rem  | Tailwind |
| ------ | ---- | -------- |
| `sp-1` | 0.5  | `2`      |
| `sp-2` | 0.75 | `3`      |
| `sp-3` | 1    | `4`      |
| `sp-4` | 1.5  | `6`      |
| `sp-5` | 2    | `8`      |
| `sp-6` | 3    | `12`     |
| `sp-7` | 4    | `16`     |
| `sp-8` | 6    | `24`     |

**Layout.** `col` → `flex flex-col` · `row` → `flex` · `push` → `flex-auto` ·
`fill-parent` → `flex-1` · `non-interactive` → `pointer-events-none` · `no-shrink` → `shrink-0`.

**Containers.** `maxwidth-N` was a 5/10/15/20/30/40/50/60/80rem ladder, written here as arbitrary
values. The main content column is `maxwidth-7` → `max-w-[60rem]`.

**Type.** `xxs → text-2xs`, `xs → text-xs`, `sm → text-sm`, `md → text-base`, `lg → text-lg`,
`xl → text-xl`, `xxl → text-2xl`, `xxxl → text-3xl`.

## Things that look wrong but aren't

- **The root font-size is fluid.** `base.css` sets `font-size: calc(0.88em + 0.4vw)` above 30em,
  carried over from the old site, so every rem-based utility scales with the viewport. Breakpoints
  are unaffected. Deliberate for now; revisit with the redesign.
- **`text-black` is not `#000`.** `--color-black` is overridden to `#152935`; the design has no true
  black.
- **`font-bold` loads Roboto Medium (500).** There is no Roboto 700 in the design.
- **Markdown is rendered with `breaks: true`.** The old site ran kramdown with `hard_wrap: true`, so
  a single newline in a Contentful field is a `<br>`. Editors have written against that for years.
  See `src/lib/markdown.ts`.
- **TypeScript is pinned to 6.x.** TypeScript 7 is the native compiler and does not yet expose the
  programmatic API `astro check` needs, so 7.x silently disables type checking. Nothing else needs
  it — the build never type-checks. Unpin once
  [withastro/roadmap#1321](https://github.com/withastro/roadmap/discussions/1321) lands.
