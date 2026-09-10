import { createSpringGroup, svgTransform, prefersReducedMotion } from "@/lib/spring";
import { HOME_CIRCLE_FRAMES, type Keyframe } from "./home-circles-frames";

type Frames = Record<string, Keyframe>;

/**
 * Drives the home page circle diagram from the scroll index.
 *
 * Each animated element gets one spring group over whatever attributes its
 * keyframes mention. Circles animate `cx`/`cy`/`r`/`opacity` as SVG attributes;
 * the label groups animate `opacity` plus an absolute `transform` translation.
 *
 * `apply` is exported rather than self-registering, because the diagram is
 * driven by the home page's own scroll tracker — it is one visual layer of that
 * section, not an independent widget.
 */

type Springs = ReturnType<typeof createSpringGroup<string>>;

interface Animated {
  el: Element;
  frames: Frames;
  springs: Springs;
}

/**
 * Pick the frame that applies at `index`: the highest keyframe at or below it.
 * This is the original's "first valid target value" rule, which is what makes
 * the diagram hold its last pose once you scroll past the section rather than
 * snapping back.
 */
function frameAt(frames: Frames, index: number): Keyframe | null {
  const keys = Object.keys(frames)
    .map(Number)
    .sort((a, b) => b - a);
  for (const key of keys) {
    if (index >= key) return frames[String(key)]!;
  }
  return null;
}

function applyValues(el: Element, values: Record<string, number>) {
  const { translateX, translateY, ...attrs } = values;

  for (const [name, value] of Object.entries(attrs)) {
    el.setAttribute(name, String(value));
  }

  if (translateX !== undefined || translateY !== undefined) {
    // Absolute, replacing the element's base transform — as in the original.
    el.setAttribute("transform", svgTransform({ translateX, translateY }));
  }
}

export function setupHomeCircles(root: ParentNode = document): (index: number) => void {
  const animated: Animated[] = [];

  for (const el of root.querySelectorAll("[data-anim]")) {
    const key = el.getAttribute("data-anim");
    const frames = key ? HOME_CIRCLE_FRAMES[key] : undefined;
    if (!frames) continue;

    // Seed each spring from the element's own starting attributes.
    const first = frameAt(frames, -1) ?? {};
    const initial: Record<string, number> = {};
    for (const name of Object.keys(first) as (keyof Keyframe)[]) {
      initial[name] = first[name] ?? 0;
    }

    const springs = createSpringGroup(initial, (values) => applyValues(el, values));
    animated.push({ el, frames, springs });
  }

  const reduced = prefersReducedMotion();

  return function apply(index: number) {
    for (const item of animated) {
      const frame = frameAt(item.frames, index);
      if (!frame) continue;
      if (reduced) item.springs.set(frame as Record<string, number>);
      else item.springs.to(frame as Record<string, number>);
    }
  };
}
