import { trackScroll, scrollToMarker } from "@/lib/scroll-progress";
import {
  createSpring,
  createSpringGroup,
  applyOpacity,
  svgTransform,
  prefersReducedMotion,
} from "@/lib/spring";

/**
 * Reference implementation of an animated section.
 *
 * This is the shape each real section (home hero, services scroller, approach
 * diagram) should take: one module, beside its own .astro file, that reads the
 * active index and says plainly what should happen. No shared interpreter, no
 * attribute language — and deleting the section deletes its behaviour with it.
 */
export function setupScrollLab(): void {
  const root = document.querySelector<HTMLElement>("[data-scroll-lab]");
  if (!root) return;

  const panels = Array.from(root.querySelectorAll<HTMLElement>("[data-panel]"));
  const indicators = Array.from(root.querySelectorAll<HTMLElement>("[data-indicator]"));
  const svgGroup = root.querySelector<SVGGElement>("[data-svg-group]");

  const readoutIndex = document.querySelector<HTMLElement>("[data-readout-index]");
  const readoutCount = document.querySelector<HTMLElement>("[data-readout-count]");
  const readoutNote = document.querySelector<HTMLElement>("[data-readout-note]");

  const reduced = prefersReducedMotion();

  /**
   * One opacity spring per panel. There is a leading spacer marker, so panel `i`
   * belongs to index `i + 1` — the same offset the old `data-keyframes` strings
   * encoded as `0:opacity=0  i+1:opacity=1  i+2:opacity=0`.
   */
  const panelSprings = panels.map((panel) =>
    createSpring(0, (value) => applyOpacity(panel, value)),
  );

  /** Spring group driving the SVG group's transform attribute, as one unit. */
  const diagram = svgGroup
    ? createSpringGroup({ translateX: 0, translateY: 0, scale: 1 }, (values) => {
        svgGroup.setAttribute("transform", svgTransform(values));
      })
    : null;

  /**
   * `immediate` skips the springs and writes the values straight out. Used for
   * the very first render: a spring whose target already equals its current
   * value never emits an update, so animating the initial state would leave the
   * transform attribute and pointer-events unset until the first real change.
   */
  function render(index: number, immediate = false) {
    panels.forEach((panel, i) => {
      const target = index === i + 1 ? 1 : 0;
      if (reduced || immediate) {
        panelSprings[i]!.set(target);
      } else {
        panelSprings[i]!.to(target);
      }
    });

    indicators.forEach((indicator, i) => {
      indicator.toggleAttribute("data-active", index === i + 1);
      indicator.setAttribute("aria-current", index === i + 1 ? "true" : "false");
    });

    if (diagram) {
      // Slide and shrink as the section advances, then settle back at the end.
      const step = Math.max(0, Math.min(index, panels.length));
      const values = {
        translateX: step * 40,
        translateY: step === 0 ? 0 : -20,
        scale: step === 0 ? 1 : 0.75,
      };
      if (reduced || immediate) diagram.set(values);
      else diagram.to(values);
    }

    if (readoutIndex) readoutIndex.textContent = String(index);
    if (readoutNote) {
      readoutNote.textContent =
        index < 0
          ? "before the section"
          : index > panels.length
            ? "past the section"
            : `panel ${index} active`;
    }
  }

  // Not `onChange: render` — the tracker passes (index, previous), and that
  // second argument would land in `immediate`, making every transition snap
  // instead of spring.
  const tracker = trackScroll({ root, onChange: (index) => render(index) });

  if (readoutCount) readoutCount.textContent = String(tracker.count);
  render(tracker.index, true);

  // Clicking an indicator jumps to that screen, as the old prev/next buttons did.
  indicators.forEach((indicator, i) => {
    indicator.addEventListener("click", () => {
      const direction = tracker.index > i + 1 ? "up" : "down";
      scrollToMarker(root, i + 1, direction);
    });
  });
}
