/**
 * Keyframes for the approach diagram.
 *
 * Extracted mechanically from `_includes/approach-image.html`, where each
 * animated group carried its own `data-keyframes` attribute. Nine groups fade
 * parts of the diagram in and out; the outermost pans and zooms.
 *
 * That pan/zoom is gated to narrow viewports — see GATES. On a wide screen the
 * whole diagram fits, so only the opacities change; on a phone it walks across
 * the diagram a section at a time.
 *
 * Index -1 is "above the section"; 0..7 are the eight scroll steps.
 */

export interface ApproachKeyframe {
  opacity?: number;
  translateX?: number;
  translateY?: number;
  scale?: number;
}

/** Group key -> scroll index -> target values. */
export const APPROACH_FRAMES: Record<string, Record<string, ApproachKeyframe>> = {
  diagram: {
    "-1": { translateX: 0, translateY: 0, scale: 1 },
    "0": { translateX: 0, translateY: 0, scale: 1 },
    "1": { translateX: 0, translateY: 0, scale: 1 },
    "2": { translateX: 0, translateY: -900, scale: 2 },
    "3": { translateX: -400, translateY: -700, scale: 2 },
    "4": { translateX: -800, translateY: -500, scale: 2 },
    "5": { translateX: -1200, translateY: -300, scale: 2 },
    "6": { translateX: 0, translateY: 0, scale: 1 },
    "7": { translateX: 0, translateY: 0, scale: 1 },
  },
  "05-solution": {
    "-1": { opacity: 0 },
    "0": { opacity: 0 },
    "1": { opacity: 1 },
    "2": { opacity: 0.2 },
    "3": { opacity: 0.2 },
    "4": { opacity: 0.2 },
    "5": { opacity: 1 },
    "6": { opacity: 1 },
    "7": { opacity: 1 },
  },
  "04-implementation": {
    "-1": { opacity: 0 },
    "0": { opacity: 0 },
    "1": { opacity: 1 },
    "2": { opacity: 0.2 },
    "3": { opacity: 0.2 },
    "4": { opacity: 0.2 },
    "5": { opacity: 1 },
    "6": { opacity: 0.2 },
    "7": { opacity: 0.2 },
  },
  "03-concept-design": {
    "-1": { opacity: 0 },
    "0": { opacity: 0 },
    "1": { opacity: 1 },
    "2": { opacity: 0.2 },
    "3": { opacity: 0.2 },
    "4": { opacity: 1 },
    "5": { opacity: 0.2 },
    "6": { opacity: 0.2 },
    "7": { opacity: 0.2 },
  },
  "02-synthesis": {
    "-1": { opacity: 0 },
    "0": { opacity: 0 },
    "1": { opacity: 1 },
    "2": { opacity: 0.2 },
    "3": { opacity: 1 },
    "4": { opacity: 0.2 },
    "5": { opacity: 0.2 },
    "6": { opacity: 0.2 },
    "7": { opacity: 0.2 },
  },
  "01-comprehensive-view": {
    "-1": { opacity: 0 },
    "0": { opacity: 0 },
    "1": { opacity: 1 },
    "2": { opacity: 1 },
    "3": { opacity: 0.2 },
    "4": { opacity: 0.2 },
    "5": { opacity: 0.2 },
    "6": { opacity: 0.2 },
    "7": { opacity: 0.2 },
  },
  "00-competence-fields": {
    "-1": { opacity: 0 },
    "0": { opacity: 0 },
    "1": { opacity: 1 },
    "2": { opacity: 1 },
    "3": { opacity: 0.2 },
    "4": { opacity: 0.2 },
    "5": { opacity: 0.2 },
    "6": { opacity: 0.2 },
    "7": { opacity: 0.2 },
  },
  "00-start": {
    "-1": { opacity: 0 },
    "0": { opacity: 0 },
    "1": { opacity: 1 },
    "2": { opacity: 1 },
    "3": { opacity: 0.2 },
    "4": { opacity: 0.2 },
    "5": { opacity: 0.2 },
    "6": { opacity: 0.2 },
    "7": { opacity: 0.2 },
  },
  "06-business-innovation": {
    "-1": { opacity: 0 },
    "0": { opacity: 0 },
    "1": { opacity: 1 },
    "2": { opacity: 0 },
    "3": { opacity: 0 },
    "4": { opacity: 0 },
    "5": { opacity: 0 },
    "6": { opacity: 0 },
    "7": { opacity: 1 },
  },
  "07-qualification": {
    "-1": { opacity: 0 },
    "0": { opacity: 0 },
    "1": { opacity: 1 },
    "2": { opacity: 0 },
    "3": { opacity: 0 },
    "4": { opacity: 0 },
    "5": { opacity: 0 },
    "6": { opacity: 1 },
    "7": { opacity: 0.2 },
  },
};

/** Group key -> media query that must match for its animation to apply. */
export const GATES: Record<string, string> = {
  diagram: "(max-width: 40em)",
};
