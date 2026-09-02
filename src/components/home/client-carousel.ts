/**
 * Behaviour for the client logo carousel.
 *
 * Separate from the generic `carousel.ts` on purpose: that one is a
 * one-slide-per-view carousel with dots, built for the quote and benefits
 * sliders. This one shows several slides at once, loops, drives itself, and has
 * a play/pause control instead of dots — sharing the code would mean two sets
 * of options fighting over one component.
 */
import EmblaCarousel from "embla-carousel";
import Autoplay from "embla-carousel-autoplay";

/** Long enough to read a logo, short enough that the row is visibly moving. */
const AUTOPLAY_DELAY = 3000;

export function setupClientCarousel(): void {
  const root = document.querySelector<HTMLElement>("[data-client-carousel]");
  if (!root) return;

  const viewport = root.querySelector<HTMLElement>("[data-carousel-viewport]");
  if (!viewport) return;

  // Someone who has asked for less motion gets the carousel stopped, not
  // absent: the arrows and the play button still work, so no logo is out of
  // reach — it just never moves on its own.
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const embla = EmblaCarousel(viewport, { loop: true, align: "start", slidesToScroll: 1 }, [
    Autoplay({
      delay: AUTOPLAY_DELAY,
      playOnInit: !reducedMotion,
      // The arrows are a nudge, not a takeover — someone paging forward has not
      // asked the carousel to stop for good. The pause button is the way to
      // stop it, and `stopOnFocusIn` (on by default) still holds it still for
      // anyone tabbing through.
      stopOnInteraction: false,
      stopOnMouseEnter: false,
    }),
  ]);

  /*
   * How many logos an arrow moves: a full view, so every click lands on a fresh
   * set. Stepping one at a time would repaint five of the same six logos and
   * take six clicks to get past them.
   *
   * Measured rather than configured, because the count is a CSS decision — the
   * slide's flex-basis steps 2 → 3 → 4 → 6 across the breakpoints — and reading
   * it back keeps one source of truth and survives a resize with no listener.
   */
  const slidesPerView = () => {
    const slide = root.querySelector<HTMLElement>(".client-slide");
    if (!slide?.offsetWidth) return 1;
    return Math.max(1, Math.round(viewport.clientWidth / slide.offsetWidth));
  };

  /*
   * Paging is `scrollTo`, not repeated `scrollNext` calls: each of those
   * retargets from the current index, so firing six in a row still moves one.
   *
   * It also cannot be `slidesToScroll: 6` in the options above, which would set
   * the snap positions themselves — and autoplay advances by calling
   * `scrollNext()`, so the ambient drift would start lurching a whole page every
   * few seconds instead of easing one logo along.
   */
  const page = (direction: 1 | -1) => {
    const snaps = embla.scrollSnapList().length;
    const target = embla.selectedScrollSnap() + direction * slidesPerView();
    // Wrap by hand — the track loops, so an index past either end is a real
    // destination, and a negative one has to come back round rather than clamp.
    embla.scrollTo(((target % snaps) + snaps) % snaps);
  };

  root.querySelector("[data-carousel-prev]")?.addEventListener("click", () => page(-1));
  root.querySelector("[data-carousel-next]")?.addEventListener("click", () => page(1));

  const autoplay = embla.plugins().autoplay;
  const toggle = root.querySelector<HTMLButtonElement>("[data-client-toggle]");
  if (!autoplay || !toggle) return;

  const labelPause = toggle.dataset.labelPause ?? "";
  const labelPlay = toggle.dataset.labelPlay ?? "";

  const render = (playing: boolean) => {
    toggle.classList.toggle("is-playing", playing);
    toggle.setAttribute("aria-label", playing ? labelPause : labelPlay);
  };

  toggle.addEventListener("click", () => {
    if (autoplay.isPlaying()) autoplay.stop();
    else autoplay.play();
  });

  /*
   * Driven by Embla's own events rather than by the click handler, because the
   * click is not the only thing that starts and stops it: focus entering the
   * carousel stops it, and a backgrounded tab stops it and resumes it again.
   *
   * The state comes from *which* event fired, not from `isPlaying()`. The
   * plugin emits both events before it updates its own flag — `startAutoplay`
   * does `if (!autoplayActive) emit("autoplay:play")` and only then sets it —
   * so calling `isPlaying()` inside these handlers reports the state we are
   * leaving, and the button ends up showing exactly the wrong icon.
   */
  embla.on("autoplay:play", () => render(true)).on("autoplay:stop", () => render(false));

  toggle.hidden = false;
  // Outside a handler, so here `isPlaying()` is the honest current state.
  render(autoplay.isPlaying());
}
