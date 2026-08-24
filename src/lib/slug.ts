/**
 * Port of `sanitize_filename` from the Jekyll site's
 * `_plugins/data_page_generator.rb`.
 *
 * Contentful slugs are not URL-safe — they are raw editor input. The Jekyll
 * generator ran every slug through this before using it as a filename, so the
 * live URLs reflect the *sanitised* form, not the Contentful field. Reproducing
 * it exactly is what keeps existing URLs working.
 *
 * The case that makes this non-optional: one blog post's Contentful slug
 * contains the literal characters `%E2%80%93` (a pre-encoded en dash). Jekyll
 * stripped the percent signs and published
 * `..._e28093_...html`. Passing the raw slug to Astro instead makes it read `%`
 * as a URL escape, which both changes the URL and fails to match its own route.
 */

// Ruby's String#tr with these two arguments, character for character.
const TRANSLITERATE_FROM =
  "ÀÁÂÃÄÅàáâãäåĀāĂăĄąÇçĆćĈĉĊċČčÐðĎďĐđÈÉÊËèéêëĒēĔĕĖėĘęĚěĜĝĞğĠġĢģĤĥĦħÌÍÎÏìíîïĨĩĪīĬĭĮįİıĴĵĶķĸĹĺĻļĽľĿŀŁłÑñŃńŅņŇňŉŊŋÑñÒÓÔÕÖØòóôõöøŌōŎŏŐőŔŕŖŗŘřŚśŜŝŞşŠšſŢţŤťŦŧÙÚÛÜùúûüŨũŪūŬŭŮůŰűŲųŴŵÝýÿŶŷŸŹźŻżŽž";
const TRANSLITERATE_TO =
  "AAAAAAaaaaaaAaAaAaCcCcCcCcCcDdDdDdEEEEeeeeEeEeEeEeEeGgGgGgGgHhHhIIIIiiiiIiIiIiIiIiJjKkkLlLlLlLlLlNnNnNnNnnNnNnOOOOOOooooooOoOoOoRrRrRrSsSsSsSssTtTtTtUUUUuuuuUuUuUuUuUuUuWwYyyYyYZzZzZz";

const TRANSLITERATE = new Map<string, string>();
for (let i = 0; i < TRANSLITERATE_FROM.length; i++) {
  TRANSLITERATE.set(TRANSLITERATE_FROM[i]!, TRANSLITERATE_TO[i] ?? "");
}

/**
 * Sanitise a Contentful slug into the filename/URL segment the old site used.
 *
 * Steps, in the Ruby original's order:
 *   1. transliterate accented Latin characters to ASCII
 *   2. downcase
 *   3. trim surrounding whitespace
 *   4. spaces become hyphens
 *   5. drop everything that is not [A-Za-z0-9_], `.` or `-`
 *
 * Step 5 uses ASCII `\w`, matching Ruby's default.
 */
export function sanitizeSlug(input: string): string {
  let out = "";
  for (const char of input) {
    out += TRANSLITERATE.get(char) ?? char;
  }

  return out
    .toLowerCase()
    .trim()
    .replaceAll(" ", "-")
    .replace(/[^\w.-]/g, "");
}
