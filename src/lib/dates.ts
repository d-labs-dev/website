/**
 * Blog post date formatting.
 *
 * The old templates used Liquid's `date: "%d. %m. %Y"`, which is zero-padded and
 * numeric in both locales — "17. 12. 2018". Reproduced literally rather than
 * localised, so German and English keep rendering the same string, and so the
 * blog index and the post page cannot drift apart.
 *
 * UTC throughout: Contentful stores these as dates, and formatting in the
 * builder's local timezone would shift a post published near midnight by a day
 * depending on where the build ran.
 */
export function formatPostDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}. ${month}. ${date.getUTCFullYear()}`;
}

/** ISO date for a `<time datetime>` attribute. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
