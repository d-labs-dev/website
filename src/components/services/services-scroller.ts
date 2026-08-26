import { trackScroll, scrollToMarker } from "@/lib/scroll-progress";
import { createSpringGroup, cssTransform, prefersReducedMotion } from "@/lib/spring";

/**
 * Entrance timings, from `setupServicesAnimation()` in the old scripts.js. The
 * five field dots start stacked on the blue "all" dot and fly out to their
 * places, then the labels appear, then the eyebrow.
 */
const ENTRANCE = { fly: 250, labels: 750, lead: 1250 } as const;

/**
 * The entrance runs once on load, and the dots stay as rings until the visitor
 * scrolls — at which point they collapse to small filled dots and the active one
 * becomes a ring again. Reproducing that is why this is not simply driven off
 * the scroll index.
 */
function playEntrance(
  indicators: HTMLElement[],
  homeDot: HTMLElement | null,
  lead: HTMLElement | null,
  reduced: boolean,
) {
  const dots = indicators
    .map((i) => i.querySelector<HTMLElement>("[data-scroller-dot]"))
    .filter((d): d is HTMLElement => d !== null);
  const labels = indicators
    .map((i) => i.querySelector<HTMLElement>("[data-scroller-label]"))
    .filter((l): l is HTMLElement => l !== null);

  const settle = () => {
    for (const dot of dots) {
      dot.style.translate = "";
      dot.style.opacity = "1";
      dot.toggleAttribute("data-ring", true);
    }
    for (const label of labels) label.style.opacity = "1";
    if (lead) lead.style.opacity = "1";
    if (homeDot) homeDot.style.opacity = "0";
  };

  if (reduced || !homeDot) {
    settle();
    return dots;
  }

  // Stack the dots on the blue one, as rings, before releasing them.
  const home = homeDot.getBoundingClientRect();
  for (const dot of dots) {
    const box = dot.getBoundingClientRect();
    dot.style.translate = `${Math.round(home.x - box.x)}px ${Math.round(home.y - box.y)}px`;
    dot.toggleAttribute("data-ring", true);
  }
  homeDot.style.opacity = "1";

  window.setTimeout(() => {
    for (const dot of dots) {
      dot.style.translate = "0 0";
      dot.style.opacity = "1";
    }
    homeDot.style.opacity = "0";
  }, ENTRANCE.fly);

  window.setTimeout(() => {
    for (const label of labels) label.style.opacity = "1";
  }, ENTRANCE.labels);

  window.setTimeout(() => {
    if (lead) lead.style.opacity = "1";
  }, ENTRANCE.lead);

  return dots;
}

/**
 * The competence-field scroller.
 *
 * Replaces the old `data-style-keyframes="0:translateX=0 1:translateX=0
 * 2:translateX=-100 …"` on the track, plus the `data-class-on-range` on each
 * indicator. Same motion, stated in one place instead of spread across
 * attributes.
 *
 * There is a leading spacer marker, so slide `i` is active at index `i + 1`.
 * Index 0 is the "arrived, nothing selected yet" state where only the blue home
 * dot shows.
 */
export function setupServicesScroller(): void {
  const root = document.querySelector<HTMLElement>("[data-services-scroller]");
  if (!root) return;

  const track = root.querySelector<HTMLElement>("[data-scroller-track]");
  const indicators = Array.from(root.querySelectorAll<HTMLElement>("[data-scroller-indicator]"));
  const homeDot = root.querySelector<HTMLElement>("[data-scroller-home-dot]");
  const lead = root.querySelector<HTMLElement>("[data-scroller-lead]");
  const prev = root.querySelector<HTMLButtonElement>("[data-scroller-prev]");
  const next = root.querySelector<HTMLButtonElement>("[data-scroller-next]");

  const slideCount = indicators.length;
  if (!track || slideCount === 0) return;

  const reduced = prefersReducedMotion();

  /** Track offset, as a percentage of one slide's width. */
  const trackSpring = createSpringGroup({ translateX: 0 }, (values) => {
    track.style.transform = cssTransform(values);
  });

  const dots = playEntrance(indicators, homeDot, lead, reduced);

  /**
   * The first scroll ends the entrance: the rings collapse to small filled dots
   * and from then on only the active field is a ring.
   */
  let entranceOver = false;
  const endEntrance = () => {
    if (entranceOver) return;
    entranceOver = true;
    for (const dot of dots) dot.removeAttribute("data-ring");
    window.removeEventListener("scroll", endEntrance);
  };
  window.addEventListener("scroll", endEntrance, { passive: true, once: false });

  function render(index: number, immediate = false) {
    // Clamp: before the section behaves like index 0, past it like the last slide.
    const slide = Math.max(0, Math.min(index, slideCount));

    const translateX = slide <= 1 ? 0 : -((slide - 1) * 100);

    if (reduced || immediate) trackSpring.set({ translateX });
    else trackSpring.to({ translateX });

    indicators.forEach((indicator, i) => {
      const active = index === i + 1;
      indicator.toggleAttribute("data-active", active);
      indicator.setAttribute("aria-current", active ? "true" : "false");
      const label = indicator.querySelector<HTMLElement>("[data-scroller-label]");
      if (label) label.style.fontWeight = active ? "bold" : "";
    });

    if (prev) prev.disabled = index <= 1;
    if (next) next.disabled = index >= slideCount;
  }

  const tracker = trackScroll({ root, onChange: (index) => render(index) });
  render(tracker.index, true);

  const goTo = (target: number) => {
    const clamped = Math.max(1, Math.min(target, slideCount));
    scrollToMarker(root, clamped, clamped < tracker.index ? "up" : "down");
  };

  prev?.addEventListener("click", () => goTo(tracker.index - 1));
  next?.addEventListener("click", () => goTo(tracker.index + 1));

  indicators.forEach((indicator, i) => {
    indicator.addEventListener("click", () => goTo(i + 1));
  });
}
