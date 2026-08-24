import { getCollection, type CollectionEntry } from "astro:content";
import { otherLocale, type Locale } from "./i18n";

/**
 * Collections backed by Contentful. The names double as URL sections, so
 * `methods` lives at /methods/<slug>.html.
 */
export type EntryCollection = "methods" | "blog" | "jobs";

/** Fields every Contentful collection shares (see contentfulBase in content.config.ts). */
interface CommonFields {
  locale: Locale;
  contentfulId: string;
  slug: string;
}

/**
 * `getStaticPaths` for a Contentful-backed section in one locale.
 *
 * Also resolves each entry's counterpart in the other locale. Translations are
 * paired by Contentful `sys.id`, not by slug — slugs are localised and usually
 * differ (`20-jahre-d-labs` vs `20-years-of-d-labs`) — which is what the old
 * `page_gen` config did with `ref: data['sys']['id']`. The counterpart drives
 * hreflang and the language switcher, and is null for the entries that were
 * never translated.
 *
 * Generic over the collection name so each route keeps its precise entry type;
 * the three schemas share CommonFields but TypeScript can't infer that through
 * a generic, hence the single narrow cast below.
 */
export async function entryPaths<C extends EntryCollection>(collection: C, locale: Locale) {
  const all = await getCollection(collection);
  const common = (entry: CollectionEntry<C>) => entry.data as unknown as CommonFields;

  const target = otherLocale(locale);
  const counterparts = new Map<string, string>();
  for (const entry of all) {
    const data = common(entry);
    if (data.locale === target) counterparts.set(data.contentfulId, data.slug);
  }

  return all
    .filter((entry) => common(entry).locale === locale)
    .map((entry) => ({
      params: { slug: common(entry).slug },
      props: {
        entry,
        counterpartSlug: counterparts.get(common(entry).contentfulId) ?? null,
      },
    }));
}
