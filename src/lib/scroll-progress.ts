/**
 * Scroll position tracking for the pinned, multi-screen sections on the home,
 * services and approach pages.
 *
 * Replaces `setupScrollSpy()` from the old scripts.js, minus its
 * `data-keyframes` attribute language: each animated section now imports this
 * and says in TypeScript what it wants to happen, rather than encoding it in a
 * mini-DSL that a single global interpreter reads.
 *
 * ## What the index means
 *
 * A section declares a series of *markers* — empty, sized elements laid out down
 * the page. As you scroll, exactly one is "active": whichever marker's centre is
 * nearest the viewport's centre. The active index drives everything else.
 *
 *   -1            above the section; the first marker has not been reached
 *   0 … count-1   that marker is active
 *   count         below the section; every marker is behind you
 *
 * The out-of-range values matter: they are what lets a section animate its first
 * screen *in* and its last screen *out*, rather than snapping.
 *
 * The measurement is deliberately the same as the original's, because it decides
 * the exact scroll offsets at which things move.
 */

export interface ScrollTracker {
  /** Current active index. */
  readonly index: number;
  /** Number of markers. */
  readonly count: number;
  /** Re-measure marker positions. Called automatically on resize. */
  refresh(): void;
  /** Detach all listeners. */
  destroy(): void;
}

interface Marker {
  index: number;
  /** Offset from the top of the document, not the viewport. */
  top: number;
  height: number;
}

export interface TrackOptions {
  /** The section. Markers are looked up within it. */
  root: HTMLElement;
  /**
   * Marker selector, relative to `root`.
   * Defaults to the same attribute the old markup used.
   */
  markerSelector?: string;
  /** Called whenever the active index changes — not on every scroll event. */
  onChange: (index: number, previous: number) => void;
}

/** Document-space top of an element. */
function documentTop(el: HTMLElement): number {
  return el.getBoundingClientRect().top + window.scrollY;
}

export function trackScroll(options: TrackOptions): ScrollTracker {
  const { root, markerSelector = "[data-keyframe-marker]", onChange } = options;

  let markers: Marker[] = [];
  let index = -1;
  let frame = 0;

  function measure() {
    markers = Array.from(root.querySelectorAll<HTMLElement>(markerSelector)).map((el, i) => ({
      index: i,
      top: documentTop(el),
      height: el.getBoundingClientRect().height,
    }));
  }

  /**
   * Pick the active marker.
   *
   * Mirrors the original: markers still below the fold are ignored; markers
   * entirely above the viewport push the index past the end; of whatever
   * remains, the one whose centre is nearest the viewport centre wins.
   *
   * (The original seeded its "nearest" comparison with 9999 rather than
   * infinity, so a marker further than 9999px from the viewport centre could
   * never become active. That only bites on absurdly tall markers, and treating
   * it as unbounded is what the code clearly meant.)
   */
  function computeIndex(): number {
    if (markers.length === 0) return -1;

    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    const viewportCentre = scrollY + viewportHeight / 2;
    const last = markers.length - 1;

    let result = -1;
    let nearest = Number.POSITIVE_INFINITY;

    for (const marker of markers) {
      if (scrollY + viewportHeight < marker.top) continue; // still below the fold

      if (scrollY > marker.top + marker.height) {
        // Entirely above the viewport. Only claims the index if nothing nearer
        // has been found yet, so an in-view marker further down still wins.
        if (result === -1) result = last + 1;
        continue;
      }

      const distance = Math.abs(viewportCentre - (marker.top + marker.height / 2));
      if (distance < nearest) {
        nearest = distance;
        result = marker.index;
      }
    }

    return result;
  }

  function update() {
    const next = computeIndex();
    if (next === index) return;

    const previous = index;
    index = next;
    onChange(index, previous);
  }

  /** Coalesce scroll events to one update per frame. */
  function onScroll() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      update();
    });
  }

  function onResize() {
    measure();
    update();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });

  /**
   * Marker offsets shift when anything above them changes height — a webfont
   * landing, an image getting its intrinsic size, a CMS body of unknown length.
   * The original only re-measured on resize and could sit on stale offsets.
   */
  const observer =
    typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => onResize());
  observer?.observe(document.documentElement);

  measure();
  update();

  return {
    get index() {
      return index;
    },
    get count() {
      return markers.length;
    },
    refresh: onResize,
    destroy() {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      observer?.disconnect();
      if (frame) cancelAnimationFrame(frame);
    },
  };
}

/**
 * Scroll a marker to the position the old prev/next buttons used: its centre
 * placed 30% down the viewport when moving up, 70% when moving down, so the
 * incoming screen reads as arriving from that direction.
 */
export function scrollToMarker(
  root: HTMLElement,
  markerIndex: number,
  direction: "up" | "down",
  markerSelector = "[data-keyframe-marker]",
): void {
  const markers = Array.from(root.querySelectorAll<HTMLElement>(markerSelector));
  const marker = markers[markerIndex];
  if (!marker) return;

  const top = documentTop(marker);
  const height = marker.getBoundingClientRect().height;
  const bias = direction === "up" ? 0.3 : 0.7;

  window.scrollTo({ top: top + height / 2 - window.innerHeight * bias, behavior: "smooth" });
}
