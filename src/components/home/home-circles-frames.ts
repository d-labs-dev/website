/**
 * Keyframes for the home page circle diagram.
 *
 * Extracted mechanically from the old `_includes/home-circles.html`, where each
 * animated element carried its own `data-keyframes` attribute. The values are
 * absolute SVG user-space coordinates, and for the label groups they are
 * absolute translations that replace the base `transform` rather than compose
 * with it — which is what the original did too.
 *
 * Index -1 is "above the section"; 0..4 are the five scroll steps.
 */

export interface Keyframe {
  cx?: number;
  cy?: number;
  r?: number;
  opacity?: number;
  translateX?: number;
  translateY?: number;
}

/** Element key -> scroll index -> target values. */
export const HOME_CIRCLE_FRAMES: Record<string, Record<string, Keyframe>> = {
  "06-ellipse-engineering": {
    "-1": { cx: 300, cy: 300, r: 50, opacity: 0 },
    "0": { cx: 300, cy: 300, r: 50, opacity: 0 },
    "1": { cx: 300, cy: 254, r: 50, opacity: 1 },
    "2": { cx: 306.5, cy: 305, r: 47.5, opacity: 1 },
    "3": { cx: 300, cy: 254, r: 50, opacity: 0 },
    "4": { cx: 381.5, cy: 330, r: 138.5, opacity: 1 },
  },
  "05-ellipse-design": {
    "-1": { cx: 300, cy: 300, r: 50, opacity: 0 },
    "0": { cx: 300, cy: 300, r: 50, opacity: 0 },
    "1": { cx: 251.5, cy: 289, r: 50, opacity: 1 },
    "2": { cx: 324.2, cy: 378.65, r: 79.5, opacity: 1 },
    "3": { cx: 251.5, cy: 289, r: 50, opacity: 0 },
    "4": { cx: 262.5, cy: 382, r: 87.5, opacity: 1 },
  },
  "04-ellipse-research": {
    "-1": { cx: 300, cy: 300, r: 50, opacity: 0 },
    "0": { cx: 300, cy: 300, r: 50, opacity: 0 },
    "1": { cx: 269.5, cy: 345, r: 50, opacity: 1 },
    "2": { cx: 184.6, cy: 384.9, r: 140.5, opacity: 1 },
    "3": { cx: 193.9, cy: 284.36, r: 39.5, opacity: 1 },
    "4": { cx: 240.5, cy: 292, r: 39.5, opacity: 1 },
  },
  "03-ellipse-business": {
    "-1": { cx: 300, cy: 300, r: 50, opacity: 0 },
    "0": { cx: 300, cy: 300, r: 50, opacity: 0 },
    "1": { cx: 348.5, cy: 289, r: 50, opacity: 1 },
    "2": { cx: 336.5, cy: 196, r: 111.5, opacity: 1 },
    "3": { cx: 206.5, cy: 221, r: 55.5, opacity: 1 },
    "4": { cx: 263.5, cy: 256, r: 36.5, opacity: 1 },
  },
  "02-ellipse-coaching": {
    "-1": { cx: 300, cy: 300, r: 50, opacity: 0 },
    "0": { cx: 300, cy: 300, r: 50, opacity: 0 },
    "1": { cx: 329.5, cy: 346, r: 50, opacity: 1 },
    "2": { cx: 329.5, cy: 346, r: 50, opacity: 0 },
    "3": { cx: 354.5, cy: 284, r: 161.5, opacity: 1 },
    "4": { cx: 329.5, cy: 346, r: 50, opacity: 0 },
  },
  "01-ellipse-blue": {
    "-1": { opacity: 0 },
    "0": { opacity: 1 },
    "1": { opacity: 0 },
    "2": { opacity: 0 },
    "3": { opacity: 0 },
    "4": { opacity: 0 },
  },
  "user-research": {
    "-1": { opacity: 0, translateX: 152.5, translateY: 410 },
    "0": { opacity: 0, translateX: 152.5, translateY: 410 },
    "1": { opacity: 1, translateX: 152.5, translateY: 410 },
    "2": { opacity: 1, translateX: 90, translateY: 455 },
    "3": { opacity: 1, translateX: 75, translateY: 340 },
    "4": { opacity: 1, translateX: 75, translateY: 288 },
  },
  coaching: {
    "-1": { opacity: 0, translateX: 340, translateY: 410 },
    "0": { opacity: 0, translateX: 340, translateY: 410 },
    "1": { opacity: 1, translateX: 340, translateY: 410 },
    "2": { opacity: 0, translateX: 340, translateY: 410 },
    "3": { opacity: 1, translateX: 310, translateY: 390 },
    "4": { opacity: 0, translateX: 340, translateY: 410 },
  },
  "digital-experience-design": {
    "-1": { opacity: 0, translateX: 100, translateY: 263 },
    "0": { opacity: 0, translateX: 100, translateY: 263 },
    "1": { opacity: 1, translateX: 100, translateY: 263 },
    "2": { opacity: 1, translateX: 360, translateY: 452 },
    "3": { opacity: 0, translateX: 100, translateY: 263 },
    "4": { opacity: 1, translateX: 130, translateY: 470 },
  },
  "software-engineering": {
    "-1": { opacity: 0, translateX: 255, translateY: 165 },
    "0": { opacity: 0, translateX: 255, translateY: 165 },
    "1": { opacity: 1, translateX: 255, translateY: 165 },
    "2": { opacity: 1, translateX: 272.24, translateY: 215 },
    "3": { opacity: 0, translateX: 255, translateY: 165 },
    "4": { opacity: 1, translateX: 390, translateY: 370 },
  },
  business: {
    "-1": { opacity: 0, translateX: 415, translateY: 263 },
    "0": { opacity: 0, translateX: 415, translateY: 263 },
    "1": { opacity: 1, translateX: 415, translateY: 263 },
    "2": { opacity: 1, translateX: 130, translateY: 119 },
    "3": { opacity: 1, translateX: 145, translateY: 120 },
    "4": { opacity: 1, translateX: 172.5, translateY: 175 },
  },
};
