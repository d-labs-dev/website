/**
 * Filter and search over the method tiles. Port of `setupMethodFilter()`.
 *
 * Kept from the original: one active domain at a time, clicking the active one
 * clears it, search and filter combine, and the mobile filter panel collapses
 * after a choice.
 *
 * Changed: the filter buttons are real buttons with `aria-pressed`, the mobile
 * label reflects the choice as text rather than by cloning the button's innards,
 * search is debounced, and an empty result says so instead of leaving a blank
 * page. The original also read the query as a substring of `textContent`, which
 * this keeps — it is a small enough corpus that anything cleverer would be
 * surprising rather than helpful.
 */

const DEBOUNCE_MS = 120;

interface Tile {
  el: HTMLElement;
  domains: Set<string>;
  text: string;
}

export function setupMethodBrowser(): void {
  const root = document.querySelector<HTMLElement>("[data-method-browser]");
  if (!root) return;

  const tiles: Tile[] = Array.from(root.querySelectorAll<HTMLElement>("[data-method-tile]")).map(
    (el) => ({
      el,
      domains: new Set((el.dataset.domains ?? "").split("|").filter(Boolean)),
      text: Array.from(el.querySelectorAll("[data-search-text]"))
        .map((n) => n.textContent ?? "")
        .join(" ")
        .toLowerCase(),
    }),
  );

  const filters = Array.from(root.querySelectorAll<HTMLElement>("[data-filter]"));
  const emptyState = root.querySelector<HTMLElement>("[data-empty-state]");

  const searchToggle = root.querySelector<HTMLElement>("[data-search-toggle]");
  const searchField = root.querySelector<HTMLElement>("[data-search-field]");
  const searchInput = root.querySelector<HTMLInputElement>("[data-search-input]");

  const filterToggle = root.querySelector<HTMLElement>("[data-filter-toggle]");
  const filterPanel = root.querySelector<HTMLElement>("[data-filter-panel]");
  const filterLabel = root.querySelector<HTMLElement>("[data-filter-label]");
  const defaultFilterLabel = filterLabel?.textContent ?? "";

  /** Empty string means "all". */
  let activeDomain = "";
  let query = "";

  function apply() {
    let visible = 0;

    for (const tile of tiles) {
      const matchesDomain = activeDomain === "" || tile.domains.has(activeDomain);
      const matchesQuery = query === "" || tile.text.includes(query);
      const show = matchesDomain && matchesQuery;
      tile.el.classList.toggle("hidden", !show);
      if (show) visible++;
    }

    for (const filter of filters) {
      const active = (filter.dataset.filter ?? "") === activeDomain;
      filter.toggleAttribute("data-active", active);
      filter.setAttribute("aria-pressed", String(active));
    }

    if (filterLabel) {
      filterLabel.textContent = activeDomain === "" ? defaultFilterLabel : activeDomain;
    }

    emptyState?.classList.toggle("hidden", visible > 0);
  }

  filters.forEach((filter) => {
    filter.setAttribute("aria-pressed", String((filter.dataset.filter ?? "") === activeDomain));
    filter.addEventListener("click", () => {
      const value = filter.dataset.filter ?? "";
      // Clicking the active domain clears it, as before.
      activeDomain = value === activeDomain ? "" : value;
      apply();

      // On mobile the panel is a disclosure; collapse it once a choice is made.
      // 800px is the `md` breakpoint, where the panel stops being collapsible.
      if (filterPanel && window.innerWidth < 800) {
        filterPanel.classList.add("hidden");
        filterToggle?.setAttribute("aria-expanded", "false");
      }
    });
  });

  filterToggle?.addEventListener("click", () => {
    if (!filterPanel) return;
    const open = filterPanel.classList.toggle("hidden");
    filterToggle.setAttribute("aria-expanded", String(!open));
  });

  searchToggle?.addEventListener("click", () => {
    if (!searchField) return;
    searchField.classList.toggle("hidden");
    if (!searchField.classList.contains("hidden")) {
      searchInput?.focus();
    } else if (searchInput) {
      searchInput.value = "";
      query = "";
      apply();
    }
  });

  let debounce: number | undefined;
  searchInput?.addEventListener("input", (event) => {
    const value = (event.target as HTMLInputElement).value.toLowerCase().trim();
    window.clearTimeout(debounce);
    debounce = window.setTimeout(() => {
      query = value;
      apply();
    }, DEBOUNCE_MS);
  });

  // Escape clears the search rather than trapping the visitor in a filtered view.
  searchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      searchInput.value = "";
      query = "";
      apply();
    }
  });

  apply();
}
