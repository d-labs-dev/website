import { createSpringGroup, svgTransform, prefersReducedMotion } from "@/lib/spring";
import { APPROACH_FRAMES, GATES, type ApproachKeyframe } from "./approach-frames";

/**
 * Drives the approach diagram from the scroll index.
 *
 * Nine groups animate opacity only. The outermost also pans and zooms, but only
 * where its media query matches — on a wide screen the whole diagram fits and
 * moving it would just push it off-frame, so there the transform is removed
 * rather than animated. That gate was `data-only-animate-if-matches` in the
 * original.
 *
 * Returns an `apply(index)` for the page's scroll tracker, rather than
 * registering its own: the diagram is a layer of that section.
 */

type Frames = Record<string, ApproachKeyframe>;

function frameAt(frames: Frames, index: number): ApproachKeyframe | null {
  const keys = Object.keys(frames)
    .map(Number)
    .sort((a, b) => b - a);
  for (const key of keys) {
    if (index >= key) return frames[String(key)]!;
  }
  return null;
}

export function setupApproachDiagram(root: ParentNode = document): (index: number) => void {
  const reduced = prefersReducedMotion();

  const animated = Array.from(root.querySelectorAll("[data-anim]"))
    .map((el) => {
      const key = el.getAttribute("data-anim");
      const frames = key ? APPROACH_FRAMES[key] : undefined;
      if (!key || !frames) return null;

      const gate = GATES[key];
      const query = gate && window.matchMedia ? window.matchMedia(gate) : null;

      const first = frameAt(frames, -1) ?? {};
      const initial: Record<string, number> = {};
      for (const name of Object.keys(first) as (keyof ApproachKeyframe)[]) {
        initial[name] = first[name] ?? 0;
      }

      const springs = createSpringGroup(initial, (values) => {
        const { translateX, translateY, scale, ...rest } = values;

        for (const [name, value] of Object.entries(rest)) {
          el.setAttribute(name, String(value));
        }

        if (translateX === undefined && translateY === undefined && scale === undefined) return;

        // Outside the gate, drop the transform entirely rather than freeze it at
        // a half-applied value.
        if (query && !query.matches) {
          el.removeAttribute("transform");
          return;
        }

        el.setAttribute("transform", svgTransform({ translateX, translateY, scale }));
      });

      return { el, frames, springs, query };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  /** Re-apply on viewport change, so crossing the gate takes effect immediately. */
  let lastIndex = -1;
  const apply = (index: number) => {
    lastIndex = index;
    for (const item of animated) {
      const frame = frameAt(item.frames, index);
      if (!frame) continue;
      if (reduced) item.springs.set(frame as Record<string, number>);
      else item.springs.to(frame as Record<string, number>);
    }
  };

  for (const item of animated) {
    item.query?.addEventListener("change", () => apply(lastIndex));
  }

  return apply;
}
