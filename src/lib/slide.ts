import { prefersReducedMotion } from "./spring";

/**
 * Reveal or hide an element by animating its height.
 *
 * Port of the `data-toggle-style="slide"` branch of `toggleButton()`, which
 * resolves to jQuery's `slideToggle(250)`. Two things use it: the home page's
 * client grid and the services page's mobile filter panel. Both snapped open
 * before this existed.
 *
 * The `hidden` class stays the source of truth for the closed state, so nothing
 * else has to know an animation is involved and `md:block` still wins on
 * desktop. It is removed before the height is measured, because `scrollHeight`
 * is 0 while an element is `display: none`.
 *
 * `ease-in-out` matches jQuery's `swing`, a cosine curve — see the note on the
 * header overlay's fade.
 */
export function slideToggle(el: HTMLElement, open: boolean, duration = 250): void {
  if (prefersReducedMotion()) {
    el.classList.toggle("hidden", !open);
    return;
  }

  // A second click mid-slide should retarget, not stack another animation.
  for (const animation of el.getAnimations()) animation.cancel();

  if (open) el.classList.remove("hidden");

  const from = open ? 0 : el.scrollHeight;
  const to = open ? el.scrollHeight : 0;

  const previousOverflow = el.style.overflow;
  el.style.overflow = "hidden";

  const animation = el.animate(
    { height: [`${from}px`, `${to}px`] },
    { duration, easing: "ease-in-out" },
  );

  animation.finished
    .then(() => {
      el.style.overflow = previousOverflow;
      if (!open) el.classList.add("hidden");
    })
    .catch(() => {
      /* Cancelled by a newer toggle, which owns the end state. */
    });
}
