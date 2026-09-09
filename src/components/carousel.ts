import EmblaCarousel, { type EmblaCarouselType } from "embla-carousel";

/**
 * Carousel behaviour. Replaces `setupCarousel()` and slick.
 *
 * Dots are generated here rather than written into the markup, because only the
 * browser knows how many slides Embla ended up with. They are real buttons in a
 * tablist so the carousel is operable from the keyboard — slick's dots were
 * anonymous and unreachable.
 */
function buildDots(embla: EmblaCarouselType, container: HTMLElement) {
  const count = embla.scrollSnapList().length;

  // A single slide needs no controls at all.
  if (count <= 1) {
    container.remove();
    return () => {};
  }

  container.replaceChildren();

  const buttons = Array.from({ length: count }, (_, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-label", `${i + 1}`);
    button.addEventListener("click", () => embla.scrollTo(i));
    container.appendChild(button);
    return button;
  });

  return () => {
    const selected = embla.selectedScrollSnap();
    buttons.forEach((button, i) => {
      button.setAttribute("aria-selected", String(i === selected));
    });
  };
}

function setupOne(root: HTMLElement) {
  const viewport = root.querySelector<HTMLElement>("[data-carousel-viewport]");
  if (!viewport) return;

  /*
   * Deep link: a slide may name a URL fragment, so /services/#spotlight-ki opens
   * the carousel on that topic instead of always on the first. Resolved before
   * construction and handed to Embla as `startIndex`, which positions the track
   * with no animation — the slide is simply where the carousel starts.
   *
   * Scrolling is not done here: the caller renders a real anchor element for
   * each fragment, so the browser lands on the section by itself. This only
   * chooses which slide is showing when it gets there.
   */
  const slides = Array.from(root.querySelectorAll<HTMLElement>("[data-carousel-track] > *"));
  const hash = decodeURIComponent(window.location.hash.slice(1));
  const deepLinked = hash ? slides.findIndex((s) => s.dataset.carouselHash === hash) : -1;

  const embla = EmblaCarousel(viewport, {
    loop: root.hasAttribute("data-loop"),
    align: "start",
    slidesToScroll: 1,
    startIndex: deepLinked > 0 ? deepLinked : 0,
  });

  const prev = root.querySelector<HTMLButtonElement>("[data-carousel-prev]");
  const next = root.querySelector<HTMLButtonElement>("[data-carousel-next]");
  const dotsContainer = root.querySelector<HTMLElement>("[data-carousel-dots]");
  const keepDisabledArrows = root.hasAttribute("data-keep-disabled-arrows");
  const autoHeight = root.hasAttribute("data-auto-height");

  prev?.addEventListener("click", () => embla.scrollPrev());
  next?.addEventListener("click", () => embla.scrollNext());

  const updateDots = dotsContainer ? buildDots(embla, dotsContainer) : () => {};

  const updateHeight = () => {
    if (!autoHeight) return;
    const selected = slides[embla.selectedScrollSnap()];
    if (selected) viewport.style.height = `${selected.offsetHeight}px`;
  };

  const update = () => {
    updateDots();
    /* Most carousels remove an unavailable end control. Media-strip carousels
     * retain it as disabled so the two controls keep stable positions over the
     * image and remain recognizable as a pair. */
    if (prev) {
      prev.hidden = !keepDisabledArrows && !embla.canScrollPrev();
      prev.disabled = keepDisabledArrows && !embla.canScrollPrev();
    }
    if (next) {
      next.hidden = !keepDisabledArrows && !embla.canScrollNext();
      next.disabled = keepDisabledArrows && !embla.canScrollNext();
    }
    updateHeight();
  };

  embla.on("select", update);
  embla.on("reInit", update);

  if (autoHeight && "ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(updateHeight);
    slides.forEach((slide) => resizeObserver.observe(slide));
    embla.on("destroy", () => resizeObserver.disconnect());
  }

  update();
}

export function setupCarousels(): void {
  document.querySelectorAll<HTMLElement>("[data-carousel]").forEach(setupOne);
}
