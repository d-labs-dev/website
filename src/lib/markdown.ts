import { Marked } from "marked";

/**
 * Renderer for markdown that arrives as a *string* from Contentful (method,
 * blogPost and jobPosting bodies). Markdown that lives in files goes through
 * Astro's own pipeline instead.
 *
 * `breaks: true` matters for fidelity: the Jekyll site configured kramdown with
 * `hard_wrap: true`, so a single newline in a Contentful field became a <br>.
 * Editors have been writing against that behaviour for years — leaving it off
 * silently reflows every multi-line field across ~104 method and blog pages.
 */
const marked = new Marked({
  gfm: true,
  breaks: true,
});

/** Render a markdown string to an HTML string. */
export function renderMarkdown(source: string | null | undefined): string {
  if (!source) return "";
  return marked.parse(source, { async: false });
}

/**
 * Render markdown that should not be wrapped in a block element — for short
 * single-line fields (a title, a list item) where a surrounding <p> would add
 * unwanted margin.
 */
export function renderMarkdownInline(source: string | null | undefined): string {
  if (!source) return "";
  return marked.parseInline(source, { async: false });
}
