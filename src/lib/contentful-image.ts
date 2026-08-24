/**
 * Contentful Images API URL builder.
 *
 * Contentful assets stay on Contentful's CDN and are resized by its Images API,
 * exactly as on the current site — they are deliberately NOT routed through
 * `astro:assets`. Two reasons: the build would have to download and re-encode
 * ~200 remote images on every CI run, and editors expect a new upload to appear
 * without a rebuild of the image pipeline.
 *
 * https://www.contentful.com/developers/docs/references/images-api/
 */

export interface ContentfulAsset {
  url: string;
  /** Contentful's asset "title". Not alt text — see `description`. */
  title: string;
  /**
   * Contentful's asset "description" field, which the team uses for alt text.
   * Empty for most older assets.
   */
  description: string;
  width: number | null;
  height: number | null;
  contentType: string | null;
}

export type ImageFit = "pad" | "fill" | "scale" | "crop" | "thumb";
export type ImageFocus =
  | "center"
  | "top"
  | "right"
  | "left"
  | "bottom"
  | "top_right"
  | "top_left"
  | "bottom_right"
  | "bottom_left"
  | "face"
  | "faces";
export type ImageFormat = "jpg" | "png" | "webp" | "avif";

export interface ImageOptions {
  width?: number;
  height?: number;
  fit?: ImageFit;
  /** Where to anchor when cropping. The site uses `faces` for anything with people in it. */
  focus?: ImageFocus;
  format?: ImageFormat;
  /** 1–100. Only applies to lossy formats. */
  quality?: number;
}

/**
 * Build a transformed URL for a Contentful asset.
 *
 * Returns an empty string for a missing asset so a template can render nothing
 * rather than an `<img src="undefined">`.
 */
export function contentfulImage(
  asset: ContentfulAsset | null | undefined,
  options: ImageOptions = {},
): string {
  if (!asset?.url) return "";

  const params = new URLSearchParams();
  if (options.width) params.set("w", String(Math.round(options.width)));
  if (options.height) params.set("h", String(Math.round(options.height)));
  if (options.fit) params.set("fit", options.fit);
  if (options.focus) params.set("f", options.focus);
  if (options.format) params.set("fm", options.format);
  if (options.quality) params.set("q", String(options.quality));

  const query = params.toString();
  return query ? `${asset.url}?${query}` : asset.url;
}

/**
 * Build a `srcset` at the given widths, preserving the aspect ratio implied by
 * `options.width`/`options.height` so `fit`/`focus` crops stay consistent.
 */
export function contentfulSrcSet(
  asset: ContentfulAsset | null | undefined,
  widths: number[],
  options: ImageOptions = {},
): string {
  if (!asset?.url) return "";

  const ratio = options.width && options.height ? options.height / options.width : null;

  return widths
    .map((w) => {
      const url = contentfulImage(asset, {
        ...options,
        width: w,
        height: ratio ? Math.round(w * ratio) : undefined,
      });
      return `${url} ${w}w`;
    })
    .join(", ");
}

/**
 * Alt text for a Contentful asset.
 *
 * The team writes alt text into the asset's *description* field. Where that is
 * empty the image is decorative-by-omission rather than meaningfully described,
 * so we emit `alt=""` instead of falling back to the filename-ish title — a
 * wrong description is worse for a screen reader than none.
 */
export function assetAlt(asset: ContentfulAsset | null | undefined): string {
  return asset?.description?.trim() ?? "";
}
