/**
 * Header behaviour: the scroll flip and the mobile menu.
 *
 * Replaces `headerScroll()` and the header's use of the generic
 * `toggleButton()` helper from the old scripts.js.
 */

/**
 * Distance scrolled before the header switches out of its "over the hero"
 * state, as a fraction of the viewport height. From the original.
 */
const FLIP_AT = 0.8;

/**
 * Hysteresis, in px. The original used the same trick: flipping on at
 * `threshold` but off only below `threshold - 30` stops the header
 * oscillating when a scroll comes to rest right on the boundary.
 */
const HYSTERESIS = 30;

function setupScrollFlip(header: HTMLElement, mobileNav: HTMLElement | null) {
  const targets = [header, mobileNav].filter((el): el is HTMLElement => el !== null);

  const onScroll = () => {
    const threshold = window.innerHeight * FLIP_AT;

    if (window.scrollY < threshold - HYSTERESIS) {
      targets.forEach((el) => el.removeAttribute("data-scrolled"));
    } else if (window.scrollY > threshold) {
      targets.forEach((el) => el.setAttribute("data-scrolled", ""));
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();
}

function setupMobileMenu(mobileNav: HTMLElement) {
  const openButtons = document.querySelectorAll<HTMLElement>("[data-menu-open]");
  const closeButtons = mobileNav.querySelectorAll<HTMLElement>("[data-menu-close]");

  const setOpen = (open: boolean) => {
    mobileNav.toggleAttribute("data-open", open);
    openButtons.forEach((b) => b.setAttribute("aria-expanded", String(open)));
    // Stop the page behind the overlay from scrolling.
    document.documentElement.style.overflow = open ? "hidden" : "";

    if (open) {
      // Focusable straight away. It was not while `*` had `transition-property:
      // all` — `visibility` is inherited, so these links sat at
      // `visibility: hidden` for the first half of a transition and a hidden
      // element cannot take focus. Fixed in base.css, not here.
      mobileNav.querySelector<HTMLElement>("a")?.focus();
    } else {
      openButtons[0]?.focus();
    }
  };

  openButtons.forEach((b) => b.addEventListener("click", () => setOpen(true)));
  closeButtons.forEach((b) => b.addEventListener("click", () => setOpen(false)));

  // The overlay has no visible affordance for Escape otherwise.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileNav.hasAttribute("data-open")) {
      setOpen(false);
    }
  });

  // Reopening on a wider viewport would leave the overlay stuck over the
  // desktop nav.
  window.addEventListener(
    "resize",
    () => {
      if (window.innerWidth >= 800 && mobileNav.hasAttribute("data-open")) {
        setOpen(false);
      }
    },
    { passive: true },
  );
}

export function setupHeader() {
  const header = document.querySelector<HTMLElement>("[data-site-header]");
  if (!header) return;

  const mobileNav = document.querySelector<HTMLElement>("[data-mobile-nav]");

  setupScrollFlip(header, mobileNav);
  if (mobileNav) setupMobileMenu(mobileNav);
}
