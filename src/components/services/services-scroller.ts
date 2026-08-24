import { trackScroll, scrollToMarker } from "@/lib/scroll-progress";
import { createSpring, createSpringGroup, cssTransform, prefersReducedMotion } from "@/lib/spring";

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

  /** The lead label and the indicator row fade in once the section is reached. */
  const chromeSpring = createSpring(0, (value) => {
    if (lead) lead.style.opacity = String(value);
    for (const indicator of indicators) {
      for (const part of indicator.querySelectorAll<HTMLElement>(
        "[data-scroller-dot], [data-scroller-label]",
      )) {
        part.style.opacity = String(value);
      }
    }
    if (homeDot) homeDot.style.opacity = String(1 - value);
  });

  function render(index: number, immediate = false) {
    // Clamp: before the section behaves like index 0, past it like the last slide.
    const slide = Math.max(0, Math.min(index, slideCount));

    const translateX = slide <= 1 ? 0 : -((slide - 1) * 100);
    const chrome = index >= 1 ? 1 : 0;

    if (reduced || immediate) {
      trackSpring.set({ translateX });
      chromeSpring.set(chrome);
    } else {
      trackSpring.to({ translateX });
      chromeSpring.to(chrome);
    }

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
