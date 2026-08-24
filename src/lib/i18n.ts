import { getEntry } from "astro:content";

/**
 * Replaces the three Ruby Liquid plugins: locale_link_tag.rb (building a link to
 * a page in the current locale), language_switcher_tag.rb (finding the current
 * page's counterpart in the other locale) and the routing half of
 * data_page_generator.rb.
 */

export const LOCALES = ["de", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "de";

/** Sections whose pages come from Contentful. */
export type Section = "methods" | "blog" | "jobs";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Narrow `Astro.currentLocale`, which is `string | undefined`.
 * Astro leaves it undefined for the default locale's unprefixed routes.
 */
export function resolveLocale(currentLocale: string | undefined): Locale {
  return isLocale(currentLocale) ? currentLocale : DEFAULT_LOCALE;
}

export function otherLocale(locale: Locale): Locale {
  return locale === "de" ? "en" : "de";
}

/** `""` for German (served from the root), `"/en"` for English. */
export function localePrefix(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "" : `/${locale}`;
}

/**
 * URL of a top-level page.
 *
 * The current site is Jekyll, so these carry a .html extension — /about.html,
 * /en/services.html. The home page is the one exception: `/` and `/en/`.
 */
export function pageUrl(ref: string, locale: Locale): string {
  const prefix = localePrefix(locale);
  if (ref === "index" || ref === "home" || ref === "") {
    return prefix === "" ? "/" : `${prefix}/`;
  }
  return `${prefix}/${ref}.html`;
}

/** URL of a Contentful-backed entry page, e.g. /en/methods/adjektiv-assoziation.html */
export function entryUrl(section: Section, slug: string, locale: Locale): string {
  return `${localePrefix(locale)}/${section}/${slug}.html`;
}

/** Language names for the switcher's `title`, matching the old plugin. */
export const LOCALE_NAMES: Record<Locale, string> = {
  de: "Deutsche Version",
  en: "English version",
};

/**
 * Page copy for one locale, from `content/pages/<locale>/<name>.yml`.
 *
 * Throws when a page file is missing, rather than rendering a page full of
 * `undefined` — a missing translation should fail the build, not ship.
 */
export async function getPageCopy(name: string, locale: Locale) {
  const entry = await getEntry("pages", `${locale}/${name}`);
  if (!entry) {
    throw new Error(
      `Missing page copy: content/pages/${locale}/${name}.yml. ` +
        `Every page needs a file per locale (${LOCALES.join(", ")}).`,
    );
  }
  return entry.data as Record<string, any>;
}

/**
 * Language-switcher target for an entry page.
 *
 * The old plugin looked for the same `ref` in the other locale and fell back to
 * that locale's home page when there was no translation. That fallback is
 * load-bearing here: 5 of the 50 blog posts have no English version, so the
 * switcher on those must not link to a page that was never built.
 */
export function switcherUrl(options: {
  locale: Locale;
  /** Section, when the current page is a Contentful entry page. */
  section?: Section;
  /** Slug of the counterpart entry, if one exists in the other locale. */
  counterpartSlug?: string | null;
  /** Page ref, when the current page is a top-level page. */
  ref?: string;
}): string {
  const target = otherLocale(options.locale);

  if (options.section) {
    return options.counterpartSlug
      ? entryUrl(options.section, options.counterpartSlug, target)
      : pageUrl("index", target);
  }

  return options.ref ? pageUrl(options.ref, target) : pageUrl("index", target);
}
