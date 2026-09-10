import type { Loader, LoaderContext } from "astro/loaders";
import { createClient, type ContentfulClientApi } from "contentful";
import { CONTENTFUL_SPACE_ID, CONTENTFUL_ACCESS_TOKEN } from "astro:env/server";
import type { ContentfulAsset } from "@/lib/contentful-image";
import { sanitizeSlug } from "@/lib/slug";

/**
 * Custom Astro content loader for Contentful.
 *
 * Replaces the `jekyll-contentful-data-import` pre-build step: instead of
 * dumping the whole space into _data/contentful/{de,en}.yaml and committing it,
 * each collection fetches what it needs at build time. Astro persists the
 * result in `.astro/`, so `pnpm dev` is instant after the first run and CI
 * fetches once per build.
 *
 * Entries are keyed `${locale}/${slug}` so one collection holds both locales and
 * a route can select its own with a cheap filter.
 */

export const LOCALES = ["de", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** The default locale in the Contentful space; never filtered for missing slugs. */
const DEFAULT_LOCALE: Locale = "de";

let client: ContentfulClientApi<undefined> | null = null;

function getClient(): ContentfulClientApi<undefined> {
  client ??= createClient({
    space: CONTENTFUL_SPACE_ID,
    accessToken: CONTENTFUL_ACCESS_TOKEN,
  });
  return client;
}

/** Contentful's page size cap. */
const PAGE_SIZE = 100;

/**
 * Fetch every entry of a content type for one locale, following pagination.
 *
 * `include: 2` resolves linked entries and assets two levels deep, which covers
 * blogPost -> author (person) -> image and method -> domains.
 *
 * `order: "sys.createdAt"` is load-bearing. The CDA's default order is
 * `-sys.updatedAt`, which reshuffles every time an editor saves an entry; the
 * old Jekyll importer dumped entries in creation order, and the live method
 * list still renders in that order. Verified: the first six titles under
 * `sys.createdAt` match _data/contentful/de.yaml and d-labs.com exactly, while
 * the default order does not.
 */
async function fetchAll(contentType: string, locale: Locale): Promise<Record<string, any>[]> {
  const out: Record<string, any>[] = [];
  let skip = 0;

  for (;;) {
    const res = await getClient().getEntries({
      content_type: contentType,
      locale,
      include: 2,
      limit: PAGE_SIZE,
      skip,
      order: ["sys.createdAt"],
    });

    out.push(...(res.items as unknown as Record<string, any>[]));

    skip += PAGE_SIZE;
    if (skip >= res.total) break;
  }

  return out;
}

/** Normalise a resolved Contentful asset, or null when the link is unresolved. */
export function toAsset(raw: any): ContentfulAsset | null {
  const file = raw?.fields?.file;
  if (!file?.url) return null;

  return {
    // Contentful returns protocol-relative URLs (//images.ctfassets.net/...).
    url: file.url.startsWith("//") ? `https:${file.url}` : file.url,
    title: raw.fields.title ?? "",
    description: raw.fields.description ?? "",
    width: file.details?.image?.width ?? null,
    height: file.details?.image?.height ?? null,
    contentType: file.contentType ?? null,
  };
}

/** Read a linked entry's single text field (domain.title, category.title, ...). */
export function linkedTitle(raw: any): string | null {
  return raw?.fields?.title ?? null;
}

interface ContentfulLoaderOptions<T> {
  /** Contentful content type id, e.g. "blogPost". */
  contentType: string;
  /**
   * Map a raw Contentful entry to the shape the collection schema expects.
   * Return `null` to skip the entry entirely.
   */
  map: (entry: Record<string, any>, locale: Locale) => T | null;
  /**
   * Require a non-empty `slug` on non-default locales.
   *
   * This reproduces the old Jekyll `page_gen` config, which set `filter: slug`
   * on every English collection. Contentful returns an entry for `en` even when
   * nothing has been translated, so without this the build invents English
   * routes for untranslated content: 5 of the 50 blog posts have no English
   * slug, and the current site has 45 English blog pages, not 50.
   */
  requireSlugOnSecondaryLocales?: boolean;
}

export function contentfulLoader<T extends { slug?: string }>(
  options: ContentfulLoaderOptions<T>,
): Loader {
  const { contentType, map, requireSlugOnSecondaryLocales = true } = options;

  return {
    name: `contentful:${contentType}`,

    async load({ store, logger, parseData, generateDigest }: LoaderContext) {
      store.clear();

      const stats: Record<string, { stored: number; skipped: number }> = {};

      for (const locale of LOCALES) {
        stats[locale] = { stored: 0, skipped: 0 };
        const entries = await fetchAll(contentType, locale);
        let order = 0;

        for (const entry of entries) {
          const mapped = map(entry, locale);
          if (!mapped) {
            stats[locale].skipped++;
            continue;
          }

          // Contentful slugs are raw editor input; the old Jekyll generator
          // sanitised them before using them as filenames, so the live URLs
          // reflect the sanitised form. See lib/slug.ts.
          const slug = mapped.slug ? sanitizeSlug(mapped.slug) : "";
          if (!slug) {
            stats[locale].skipped++;
            continue;
          }

          if (requireSlugOnSecondaryLocales && locale !== DEFAULT_LOCALE) {
            // A fallback-filled slug is identical to the default locale's, which
            // means this entry was never translated.
            const rawSlug = entry.fields?.slug;
            if (typeof rawSlug !== "string" || rawSlug.trim() === "") {
              stats[locale].skipped++;
              continue;
            }
          }

          const id = `${locale}/${slug}`;
          // `order` carries Contentful's creation order through to the pages.
          // getCollection() returns entries sorted by id (i.e. alphabetically by
          // slug), so anything that lists entries has to sort on this instead.
          const data = await parseData({ id, data: { ...mapped, slug, locale, order: order++ } });
          store.set({ id, data, digest: generateDigest(data) });
          stats[locale].stored++;
        }
      }

      const total = Object.values(stats).reduce((n, s) => n + s.stored, 0);
      const breakdown = LOCALES.map((l) => {
        const { stored, skipped } = stats[l];
        return skipped ? `${l} ${stored} (+${skipped} untranslated)` : `${l} ${stored}`;
      }).join(", ");

      logger.info(`${total} entries — ${breakdown}`);
    },
  };
}
