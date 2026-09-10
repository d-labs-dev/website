import { Marked, type Token, type Tokens } from "marked";
import { normalizeInternalLinks } from "./internal-links";

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

/**
 * Image captions.
 *
 * Contentful has no caption field and its markdown fields carry only the image
 * URL, so a caption is whatever the editor writes on the line *directly* after
 * an image — no blank line, no special syntax:
 *
 *   ![Kurzer Bildtext](url)
 *   Die sichtbare Bildunterschrift
 *
 * This is not a convention we invented; it is the one already in the copy. Every
 * one of the 22 images in the blog that has text on the following line is a
 * caption, and none is body prose. A blank line is the boundary: leave one and
 * the text is an ordinary paragraph again.
 *
 * The CommonMark title slot — `![Alt](url "Bildunterschrift")` — works too, for
 * anyone reaching for the standard idiom. It is not the form to teach, because
 * smart quotes break it outright and the image then renders as raw text.
 *
 * Either way the caption becomes a `<figcaption>` and the alt text is left
 * alone, so the two say different things: one describes the image for a screen
 * reader, the other is read by everyone. An image on its own renders exactly as
 * before.
 */

marked.use({
  renderer: {
    paragraph(this: { parser: { parseInline: (t: Token[]) => string } }, token: Tokens.Paragraph) {
      const inner = (token.tokens ?? []).filter((t) => t.type !== "space");
      const image = inner[0]?.type === "image" ? (inner[0] as Tokens.Image) : null;

      if (image) {
        // Leading <br>s are the newline the editor typed; the caption is
        // whatever follows them.
        let rest = inner.slice(1);
        while (rest[0]?.type === "br") rest = rest.slice(1);

        // The title is moved, not copied: left on the <img> it would also show
        // as a hover tooltip, saying the same thing twice to a mouse and nothing
        // at all to a finger.
        const title = image.title;
        image.title = null;

        if (rest.length > 0) {
          const body = this.parser.parseInline(rest);
          return `<figure>${this.parser.parseInline([image])}<figcaption>${body}</figcaption></figure>\n`;
        }
        if (title) {
          const body = this.parser.parseInline([
            { type: "text", raw: title, text: title } as Token,
          ]);
          return `<figure>${this.parser.parseInline([image])}<figcaption>${body}</figcaption></figure>\n`;
        }
        image.title = title;
      }

      return `<p>${this.parser.parseInline(token.tokens ?? [])}</p>\n`;
    },
  },
});

/**
 * Render a markdown string to an HTML string.
 *
 * Own-site `.html` links in the copy are rewritten to the current URL shape —
 * see lib/internal-links.ts. Editors have years of
 * `https://d-labs.com/methods/x.html` in Contentful and should not have to
 * revisit it.
 */
export function renderMarkdown(source: string | null | undefined): string {
  if (!source) return "";
  return normalizeInternalLinks(marked.parse(source, { async: false }));
}

/**
 * Render markdown that should not be wrapped in a block element — for short
 * single-line fields (a title, a list item) where a surrounding <p> would add
 * unwanted margin.
 */
export function renderMarkdownInline(source: string | null | undefined): string {
  if (!source) return "";
  return normalizeInternalLinks(marked.parseInline(source, { async: false }));
}
