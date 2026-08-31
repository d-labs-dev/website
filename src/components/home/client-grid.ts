/**
 * Expand/collapse the client logo grid.
 *
 * Replaces the generic `data-toggle` / `toggleButton()` helper from the old
 * scripts.js, which faded an arbitrary selector and swapped the button's hidden
 * children to change its label. Here the two labels are data attributes, so the
 * button says what it does without duplicate markup.
 */
import { slideToggle } from "@/lib/slide";

export function setupClientGrid(): void {
  const root = document.querySelector<HTMLElement>("[data-client-grid]");
  if (!root) return;

  const toggle = root.querySelector<HTMLElement>("[data-client-toggle]");
  const rest = root.querySelector<HTMLElement>("[data-client-rest]");
  if (!toggle || !rest) return;

  const label = toggle.querySelector<HTMLElement>("[data-client-label]") ?? toggle;
  const caret = toggle.querySelector<HTMLElement>("[data-client-caret]");
  const labelMore = toggle.dataset.labelMore ?? "";
  const labelLess = toggle.dataset.labelLess ?? "";

  rest.id ||= "client-rest";

  let expanded = false;

  toggle.addEventListener("click", () => {
    expanded = !expanded;
    slideToggle(rest, expanded);
    label.textContent = expanded ? labelLess : labelMore;
    caret?.classList.toggle("rotate-180", expanded);
    toggle.setAttribute("aria-expanded", String(expanded));
  });
}
