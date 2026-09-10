import { trackScroll } from "@/lib/scroll-progress";
import { createSpring, applyOpacity, prefersReducedMotion } from "@/lib/spring";
import { setupApproachDiagram } from "./approach-diagram";

/**
 * The approach page's pinned section: seven captions cross-fading over the
 * diagram, which reveals a further part of itself at each step.
 *
 * One tracker drives both. A leading spacer marker means caption `i` is active
 * at index `i + 1`.
 */
export function setupApproach(): void {
  const root = document.querySelector<HTMLElement>("[data-approach-scroll]");
  if (!root) return;

  const screens = Array.from(root.querySelectorAll<HTMLElement>("[data-approach-screen]"));
  const indicators = Array.from(root.querySelectorAll<HTMLElement>("[data-approach-indicator]"));

  const reduced = prefersReducedMotion();
  const applyDiagram = setupApproachDiagram(root);

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

    applyDiagram(index);
  }

  const tracker = trackScroll({ root, onChange: (index) => render(index) });
  render(tracker.index, true);
}

/**
 * The intro circle: it expands once, 1.5 seconds after load or as soon as the
 * visitor moves the pointer or scrolls — whichever comes first. Port of
 * `approachAnimation()`, which used the same three triggers.
 *
 * Under reduced motion it starts grown, so the page does not open with a
 * transform animation nobody asked for.
 */
export function setupApproachCircle(): void {
  const circle = document.querySelector<HTMLElement>("[data-approach-circle]");
  if (!circle) return;

  const grow = () => {
    window.clearTimeout(timer);
    document.removeEventListener("mousemove", grow);
    window.removeEventListener("scroll", grow);
    circle.setAttribute("data-grown", "");
  };

  if (prefersReducedMotion()) {
    circle.style.transition = "none";
    grow();
    return;
  }

  const timer = window.setTimeout(grow, 1500);
  document.addEventListener("mousemove", grow, { once: true, passive: true });
  window.addEventListener("scroll", grow, { once: true, passive: true });
}
