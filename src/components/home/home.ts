import { trackScroll, scrollToMarker } from "@/lib/scroll-progress";
import { createSpring, applyOpacity, prefersReducedMotion } from "@/lib/spring";
import { setupHomeCircles } from "./home-circles";

/**
 * The home page's pinned section: four screens cross-fading over the circle
 * diagram, with an indicator rail.
 *
 * One scroll tracker drives both layers. There is a leading spacer marker, so
 * screen `i` is active at index `i + 1` — the same offset the old
 * `data-keyframes="0:opacity=0 i+1:opacity=1 i+2:opacity=0"` encoded.
 */
export function setupHome(): void {
  const root = document.querySelector<HTMLElement>("[data-home-scroll]");
  if (!root) return;

  const screens = Array.from(root.querySelectorAll<HTMLElement>("[data-home-screen]"));
  const indicators = Array.from(root.querySelectorAll<HTMLElement>("[data-home-indicator]"));

  const reduced = prefersReducedMotion();

  /** The circle diagram reads the same index; it is a layer, not a widget. */
  const applyCircles = setupHomeCircles(root);

  const screenSprings = screens.map((screen) =>
    createSpring(0, (value) => applyOpacity(screen, value)),
  );

  function render(index: number, immediate = false) {
    screens.forEach((_, i) => {
      const target = index === i + 1 ? 1 : 0;
      if (reduced || immediate) screenSprings[i]!.set(target);
      else screenSprings[i]!.to(target);
    });

    indicators.forEach((indicator, i) => {
      const active = index === i + 1;
      indicator.toggleAttribute("data-active", active);
      indicator.setAttribute("aria-current", active ? "true" : "false");
    });

    applyCircles(index);
  }

  const tracker = trackScroll({ root, onChange: (index) => render(index) });
  render(tracker.index, true);

  indicators.forEach((indicator, i) => {
    indicator.addEventListener("click", () => {
      scrollToMarker(root, i + 1, tracker.index > i + 1 ? "up" : "down");
    });
  });
}
