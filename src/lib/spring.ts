import { Spring } from "wobble";

/**
 * Spring helpers for the scroll-driven sections.
 *
 * Replaces `createKeyframeListener()` from the old scripts.js. That function
 * parsed a `data-keyframes` attribute, built one spring per animated property,
 * and stitched the transform back together on every frame. The physics were
 * fine; the attribute language was the problem. This keeps the physics and
 * drops the language.
 */

/**
 * The original passed only `damping: 15`, leaving wobble's stiffness (100) and
 * mass (1) at their defaults. Reproduced exactly — this is what gives the
 * animations their particular weight, and it is easy to "improve" by accident.
 */
export const SPRING_CONFIG = { damping: 15 } as const;

export interface SpringHandle {
  /** Animate towards a new value. */
  to(value: number): void;
  /** Jump to a value with no animation. */
  set(value: number): void;
  readonly value: number;
  stop(): void;
}

export function createSpring(
  initial: number,
  onUpdate: (value: number) => void,
  config: Partial<{ stiffness: number; damping: number; mass: number }> = {},
): SpringHandle {
  const spring = new Spring({
    ...SPRING_CONFIG,
    ...config,
    fromValue: initial,
    toValue: initial,
  });

  spring.onUpdate((s) => onUpdate(s.currentValue));

  return {
    to(value) {
      spring.updateConfig({ toValue: value });
      spring.start();
    },
    set(value) {
      spring.updateConfig({ fromValue: value, toValue: value });
      spring.stop();
      onUpdate(value);
    },
    get value() {
      return spring.currentValue;
    },
    stop() {
      spring.stop();
    },
  };
}

/**
 * Several named springs that report together.
 *
 * A transform needs all of its components on every frame — animating translateX
 * alone would drop the concurrent scale — so `onUpdate` receives the whole set
 * whenever any member moves. This is what the original achieved by keeping its
 * springs in a shared `attrSprings` object and rebuilding the transform string
 * inside each spring's own update callback.
 */
export interface SpringGroupHandle<K extends string> {
  to(values: Partial<Record<K, number>>): void;
  set(values: Partial<Record<K, number>>): void;
  readonly values: Record<K, number>;
  stop(): void;
}

export function createSpringGroup<K extends string>(
  initial: Record<K, number>,
  onUpdate: (values: Record<K, number>) => void,
  config: Partial<{ stiffness: number; damping: number; mass: number }> = {},
): SpringGroupHandle<K> {
  const keys = Object.keys(initial) as K[];
  const current = { ...initial };
  const springs = {} as Record<K, Spring>;

  for (const key of keys) {
    const spring = new Spring({
      ...SPRING_CONFIG,
      ...config,
      fromValue: initial[key],
      toValue: initial[key],
    });
    spring.onUpdate((s) => {
      current[key] = s.currentValue;
      onUpdate(current);
    });
    springs[key] = spring;
  }

  return {
    to(values) {
      for (const key of keys) {
        const target = values[key];
        if (target === undefined) continue;
        springs[key].updateConfig({ toValue: target });
        springs[key].start();
      }
    },
    set(values) {
      for (const key of keys) {
        const target = values[key];
        if (target === undefined) continue;
        springs[key].updateConfig({ fromValue: target, toValue: target });
        springs[key].stop();
        current[key] = target;
      }
      onUpdate(current);
    },
    get values() {
      return current;
    },
    stop() {
      for (const key of keys) springs[key].stop();
    },
  };
}

export interface TransformValues {
  translateX?: number;
  translateY?: number;
  scale?: number;
}

/**
 * Transform string for a CSS `style` property, where translation is a
 * percentage of the element's own size.
 */
export function cssTransform(values: TransformValues): string {
  const parts: string[] = [];

  if (values.translateX !== undefined || values.translateY !== undefined) {
    parts.push(`translate3d(${values.translateX ?? 0}%, ${values.translateY ?? 0}%, 0)`);
  }
  if (values.scale !== undefined) {
    parts.push(`scale(${values.scale})`);
  }

  return parts.join(" ");
}

/**
 * Transform string for an SVG `transform` *attribute*, where translation is in
 * unitless user-space units. The approach diagram animates SVG groups this way.
 */
export function svgTransform(values: TransformValues): string {
  const parts: string[] = [];

  if (values.translateX !== undefined || values.translateY !== undefined) {
    parts.push(`translate(${values.translateX ?? 0} ${values.translateY ?? 0})`);
  }
  if (values.scale !== undefined) {
    parts.push(`scale(${values.scale})`);
  }

  return parts.join(" ");
}

/**
 * Opacity threshold below which an element stops receiving pointer events.
 *
 * These sections stack full-screen panels on top of each other and cross-fade
 * between them, so without this the invisible ones still swallow clicks. Carried
 * over from `applyCss()` in the original, including the exact 0.2 cutoff.
 */
export const POINTER_EVENTS_OPACITY_THRESHOLD = 0.2;

/**
 * Set opacity, and stop a faded-out element from intercepting clicks.
 *
 * `auto`, not `""`. These panels sit inside a `pointer-events-none` wrapper — the
 * old `non-interactive` — so clearing the inline style hands control back to that
 * class and the panel stays inert even at full opacity. The original writes
 * `pointerEvents: "initial"` for exactly this reason, and without it nothing
 * inside the visible screen could be clicked: the home page's "Mehr zum Projekt"
 * buttons and the approach page's captions were all dead.
 */
export function applyOpacity(el: HTMLElement, opacity: number): void {
  el.style.opacity = String(opacity);
  el.style.pointerEvents = opacity < POINTER_EVENTS_OPACITY_THRESHOLD ? "none" : "auto";
}

/**
 * True when the visitor has asked for reduced motion. Callers should skip the
 * springs and apply target values directly — the original had no such check.
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}
