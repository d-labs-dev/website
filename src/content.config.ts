import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { contentfulLoader, toAsset, linkedTitle, LOCALES } from "@/loaders/contentful";

/**
 * Field ids below are the real Contentful ids, which are camelCase
 * (`heroImage`, `firstParagraph`, `jobPosting`). The committed
 * _data/contentful/*.yaml in the old repo shows them snake_cased because
 * jekyll-contentful-data-import rewrote them on the way in — mapping from that
 * dump silently yields `undefined` for every one of them.
 *
 * Required fields are therefore read *without* a `?? ""` fallback: if a field id
 * is wrong or a translation is missing, Zod fails the build and names the field
 * rather than shipping an empty page.
 *
 * Not localized in Contentful, so identical across locales: blogPost.date,
 * heroImage, author, category, person.*, jobPosting (the PDF asset), and the
 * domain links (though domain.title itself is localized).
 *
 * No schema uses the `image()` helper: local images are imported directly by the
 * components that render them, and Contentful images are remote URLs served by
 * its Images API.
 */

const localeSchema = z.enum(LOCALES);

/** A normalised Contentful asset (see toAsset in the loader). */
const assetSchema = z.object({
  url: z.string(),
  title: z.string(),
  description: z.string(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  contentType: z.string().nullable(),
});

const personSchema = z.object({
  name: z.string(),
  /** Job title. Optional in Contentful. */
  title: z.string(),
  image: assetSchema.nullable(),
});

const contentfulBase = {
  locale: localeSchema,
  /** Contentful sys.id — identical across locales, so it pairs translations. */
  contentfulId: z.string(),
  slug: z.string().min(1),
};

// ---------------------------------------------------------------------------
// Contentful collections
// ---------------------------------------------------------------------------

const methods = defineCollection({
  loader: contentfulLoader({
    contentType: "method",
    map: (entry) => ({
      contentfulId: entry.sys.id as string,
      slug: entry.fields.slug as string | undefined,
      title: entry.fields.title,
      description: entry.fields.description,
      body: entry.fields.body,
      heroImage: toAsset(entry.fields.heroImage),
      // Domain titles double as the services page's filter values.
      domains: ((entry.fields.domains ?? []) as unknown[])
        .map(linkedTitle)
        .filter((d): d is string => Boolean(d)),
    }),
  }),
  schema: z.object({
    ...contentfulBase,
    title: z.string(),
    description: z.string(),
    body: z.string(),
    heroImage: assetSchema.nullable(),
    domains: z.array(z.string()),
  }),
});

const blog = defineCollection({
  loader: contentfulLoader({
    contentType: "blogPost",
    map: (entry) => ({
      contentfulId: entry.sys.id as string,
      slug: entry.fields.slug as string | undefined,
      title: entry.fields.title,
      description: entry.fields.description,
      body: entry.fields.body,
      date: entry.fields.date,
      heroImage: toAsset(entry.fields.heroImage),
      category: linkedTitle(entry.fields.category),
      author: entry.fields.author
        ? {
            name: entry.fields.author.fields?.name ?? "",
            title: entry.fields.author.fields?.title ?? "",
            image: toAsset(entry.fields.author.fields?.image),
          }
        : null,
    }),
  }),
  schema: z.object({
    ...contentfulBase,
    title: z.string(),
    description: z.string(),
    body: z.string(),
    date: z.coerce.date(),
    heroImage: assetSchema.nullable(),
    category: z.string().nullable(),
    author: personSchema.nullable(),
  }),
});

const jobs = defineCollection({
  loader: contentfulLoader({
    contentType: "jobPosting",
    map: (entry) => ({
      contentfulId: entry.sys.id as string,
      slug: entry.fields.slug as string | undefined,
      // The only non-required localized field on this type, so it can genuinely
      // be absent in English.
      title: entry.fields.title ?? "",
      location: entry.fields.location,
      heroImage: toAsset(entry.fields.heroImage),
      firstHeadline: entry.fields.firstHeadline,
      firstParagraph: entry.fields.firstParagraph,
      secondHeadline: entry.fields.secondHeadline,
      secondParagraph: entry.fields.secondParagraph,
      thirdHeadline: entry.fields.thirdHeadline,
      thirdParagraph: entry.fields.thirdParagraph,
      profile: entry.fields.profile,
      tasks: entry.fields.tasks,
      /** The downloadable PDF of the posting. Optional in Contentful. */
      posting: toAsset(entry.fields.jobPosting),
    }),
  }),
  schema: z.object({
    ...contentfulBase,
    title: z.string(),
    location: z.string(),
    heroImage: assetSchema.nullable(),
    // firstHeadline and thirdHeadline exist in Contentful but the current job
    // template never renders them. Kept so the data is available.
    firstHeadline: z.string(),
    firstParagraph: z.string(),
    secondHeadline: z.string(),
    secondParagraph: z.string(),
    thirdHeadline: z.string(),
    thirdParagraph: z.string(),
    profile: z.string(),
    tasks: z.string(),
    posting: assetSchema.nullable(),
  }),
});

// ---------------------------------------------------------------------------
// Page copy — one file per locale under content/pages/<locale>/
// ---------------------------------------------------------------------------

const contactSchema = z.object({
  title: z.string(),
  name: z.string(),
  position: z.string(),
  email: z.string(),
  tel: z.string().optional(),
  mobile: z.string().optional(),
  cta_text: z.string().optional(),
  /**
   * Optional: the approach page's contact block has no `our_locations`, so
   * production renders an empty heading there with a stray arrow after it. The
   * link is omitted entirely instead.
   */
  our_locations: z.string().optional(),
  avatar_img: z.string(),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.yml", base: "./content/pages" }),
  // z.looseObject keeps unknown keys, replacing Zod 3's deprecated
  // .passthrough(). Page files carry a lot of copy that only their own page
  // uses; those keys are validated by the page components that read them.
  schema: z.looseObject({
    // blog
    cta_learn_more: z.string().optional(),
    back_button_text: z.string().optional(),
    by_author: z.string().optional(),

    // services
    services_title: z.string().optional(),
    // Absent from the English file — the current site renders the English
    // methods search box with no placeholder.
    search_placeholder: z.string().optional(),

    // jobs
    back_button_label: z.string().optional(),
    learn_more: z.string().optional(),
    you_are_missing: z.string().optional(),
    profile_heading: z.string().optional(),
    tasks_heading: z.string().optional(),
    download_button_label: z.string().optional(),
    apply_now_target: z.string().optional(),
    apply_now_aria_label: z.string().optional(),
    apply_now_button_label: z.string().optional(),
    circle_apply_now_button_label: z.string().optional(),
    inclusivity_aria_label: z.string().optional(),
    contact: contactSchema.optional(),
  }),
});

/**
 * Office locations. One entry, id "offices". Not localized: the addresses are
 * identical in both languages, so duplicating them per locale would only invite
 * drift. The translated labels are in content/shared/<locale>/locations.yml.
 */
const offices = defineCollection({
  loader: glob({ pattern: "offices.yml", base: "./content" }),
  schema: z.object({
    offices: z.array(
      z.object({
        name: z.string(),
        /** Marks the head office. */
        is_main: z.boolean().optional(),
        /** Path under src/assets/images/, resolved by the component that shows it. */
        image: z.string(),
        street: z.string(),
        zip: z.string(),
        city: z.string(),
        tel: z.string(),
        email: z.string(),
      }),
    ),
  }),
});

/**
 * Client logos. Not localized. `first` shows by default, `rest` when expanded.
 */
const clients = defineCollection({
  loader: glob({ pattern: "clients.yml", base: "./content/clients" }),
  schema: z.object({
    first: z.array(z.object({ name: z.string(), logo: z.string() })),
    rest: z.array(z.object({ name: z.string(), logo: z.string() })),
  }),
});

/**
 * Partner organisations. Not localized, for the same reason as offices.
 */
const partners = defineCollection({
  loader: glob({ pattern: "partners.yml", base: "./content/partners" }),
  schema: z.object({
    partners: z.array(
      z.object({
        name: z.string(),
        /** Path under src/assets/images/. */
        logo: z.string(),
        link: z.string().url(),
        /**
         * Per-logo padding, because the artwork has wildly different amounts of
         * built-in whitespace. Replaces a {% case %} on the partner name in the
         * old template.
         */
        padding: z.string().optional(),
      }),
    ),
  }),
});

/**
 * Imprint, privacy policy and accessibility statement — long prose that is
 * edited as markdown rather than held in Contentful, as on the current site.
 *
 * The `title` is new: production has no per-page title, so jekyll-seo-tag
 * emitted a bare "D‑LABS GmbH" for all three. Each page's H1 is a better one.
 */
const legal = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/legal" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

/**
 * Copy that appears on every page (header nav, footer links). Kept separate from
 * `pages` so a page file never has to restate the nav.
 */
const shared = defineCollection({
  loader: glob({ pattern: "**/*.yml", base: "./content/shared" }),
  schema: z.record(z.string(), z.string()),
});

export const collections = {
  methods,
  blog,
  jobs,
  pages,
  shared,
  legal,
  offices,
  partners,
  clients,
};
