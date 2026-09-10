/**
 * Cross-fading image stack. Port of `setupImageFader()`.
 *
 * The original ran a `setInterval` and a 2s jQuery `fadeIn` every 5s, forever,
 * on every page that used it. Kept the timing; changed three things:
 *
 *  - the fade is a CSS transition rather than a JS-driven one
 *  - it pauses when the hero scrolls out of view, so an offscreen carousel isn't
 *    burning frames for the whole visit
 *  - it does nothing at all under prefers-reduced-motion, where an unprompted
 *    5-second loop is exactly what the setting is asking us not to do
 */

const HOLD_MS = 5000;
const FADE_MS = 2000;

function setupOne(root: HTMLElement) {
  const slides = Array.from(root.querySelectorAll<HTMLElement>("[data-fader-slide]"));
  if (slides.length <= 1) return;

  for (const slide of slides) {
    slide.style.transitionProperty = "opacity";
    slide.style.transitionDuration = `${FADE_MS}ms`;
  }

  let current = 0;
  let timer: number | undefined;

  const show = (next: number) => {
    slides[current]!.style.opacity = "0";
    slides[next]!.style.opacity = "1";
    current = next;
  };

  const start = () => {
    timer ??= window.setInterval(() => show((current + 1) % slides.length), HOLD_MS);
  };

  const stop = () => {
    if (timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };

  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  if (typeof IntersectionObserver === "undefined") {
    start();
    return;
  }

  new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) start();
        else stop();
      }
    },
    { threshold: 0 },
  ).observe(root);
}

export function setupImageFaders(): void {
  document.querySelectorAll<HTMLElement>("[data-image-fader]").forEach(setupOne);
}
