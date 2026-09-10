import { defineMdastPlugin, type MdastContent } from "satteri";

/**
 * Turn every newline inside a paragraph into a `<br>`, the way kramdown's
 * `hard_wrap: true` does.
 *
 * The current site runs kramdown with `hard_wrap`, and its content relies on it:
 * the imprint's address block, the accessibility statement's contact details and
 * a dozen places in the privacy policy are written as consecutive lines in one
 * paragraph and render as separate lines. Without this the legal pages come out
 * ~180-430px shorter than production, with addresses run together.
 *
 * Sätteri has no `breaks` feature and Astro exposes no `markdown.breaks`, so it
 * is an mdast plugin: split each text node on newlines and interleave `break`
 * nodes. The replacements contain no newlines, so the visitor does not recurse.
 *
 * Contentful bodies do not go through here — they are rendered by `marked`,
 * which is configured with `breaks: true` for the same reason. See lib/markdown.ts.
 */
export const hardBreaks = defineMdastPlugin({
  name: "hard-breaks",

  text(node, context) {
    if (!node.value.includes("\n")) return;

    const replacement: MdastContent[] = [];
    node.value.split("\n").forEach((part, index) => {
      if (index > 0) replacement.push({ type: "break" });
      if (part !== "") replacement.push({ type: "text", value: part });
    });

    context.replaceNode(node, replacement);
  },
});
