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

  const embla = EmblaCarousel(viewport, {
    loop: root.hasAttribute("data-loop"),
    align: "start",
    slidesToScroll: 1,
  });

  const prev = root.querySelector<HTMLButtonElement>("[data-carousel-prev]");
  const next = root.querySelector<HTMLButtonElement>("[data-carousel-next]");
  const dotsContainer = root.querySelector<HTMLElement>("[data-carousel-dots]");

  prev?.addEventListener("click", () => embla.scrollPrev());
  next?.addEventListener("click", () => embla.scrollNext());

  const updateDots = dotsContainer ? buildDots(embla, dotsContainer) : () => {};

  const update = () => {
    updateDots();
    // Without loop, the ends are dead — say so rather than leaving a button
    // that silently does nothing.
    if (prev) prev.disabled = !embla.canScrollPrev();
    if (next) next.disabled = !embla.canScrollNext();
  };

  embla.on("select", update);
  embla.on("reInit", update);
  update();
}

export function setupCarousels(): void {
  document.querySelectorAll<HTMLElement>("[data-carousel]").forEach(setupOne);
}
