/**
 * Normalise the site's own links inside CMS copy.
 *
 * Editors have written hundreds of links into Contentful over the years in the
 * shape the Jekyll site used: absolute, with a host, and ending in `.html` —
 * `https://d-labs.com/methods/personas.html`. The site now serves
 * `/methods/personas/`.
 *
 * Rewriting them here rather than relying on the redirect means the rendered
 * HTML points at the canonical URL directly: no redirect hop for the visitor,
 * no lost link equity, and the links work in dev and on the preview bucket
 * where no edge rule exists. The content in Contentful is untouched — editors
 * can keep writing either form.
 */

/** Hosts that mean "this site". */
const OWN_HOSTS = new Set(["d-labs.com", "www.d-labs.com", "preview.d-labs.com"]);

/**
 * `/methods/personas.html` -> `/methods/personas/`
 * `https://d-labs.com/about.html#team` -> `/about/#team`
 * `/en/index.html` -> `/en/`
 *
 * Anything that is not one of our own `.html` URLs is returned unchanged —
 * external links, assets, mailto:, fragments.
 */
export function normalizeInternalUrl(href: string): string {
  if (!href) return href;

  let rest = href;

  // Strip our own origin, in any of the forms editors have used.
  const withHost = /^(?:(https?:)?\/\/)([^/]+)(\/.*)?$/i.exec(href);
  if (withHost) {
    const host = withHost[2]!.toLowerCase();
    if (!OWN_HOSTS.has(host)) return href; // genuinely external
    rest = withHost[3] ?? "/";
  } else if (!href.startsWith("/")) {
    return href; // relative, mailto:, tel:, #fragment — leave alone
  }

  const [pathAndQuery = "", fragment] = rest.split("#");
  const [path = "", query] = pathAndQuery.split("?");

  if (!path.endsWith(".html")) return href;

  const withoutExtension = path.slice(0, -".html".length);
  const directory =
    withoutExtension.endsWith("/index") || withoutExtension === "/index"
      ? `${withoutExtension.slice(0, -"index".length)}`
      : `${withoutExtension}/`;

  return (
    (directory || "/") + (query ? `?${query}` : "") + (fragment !== undefined ? `#${fragment}` : "")
  );
}

/** Rewrite every own-site `.html` href in a block of rendered HTML. */
export function normalizeInternalLinks(html: string): string {
  return html.replace(/href="([^"]+)"/g, (match, href: string) => {
    const next = normalizeInternalUrl(href);
    return next === href ? match : `href="${next}"`;
  });
}
