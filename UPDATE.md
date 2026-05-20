# DaggerForge 2.2.4

## Fixed

- HP and Stress tick marks now persist across reading/edit mode switches and across Obsidian restarts. Previously they reset whenever you switched modes or reopened Obsidian.

---

# DaggerForge 2.2.3

## Fixed

- Mobile: creator and editor forms now lay out correctly on small screens. Fields stack to a single column, inputs are tap-friendly, and the submit button spans full width.
- Mobile: select dropdowns and text inputs in the adversary and environment forms no longer had a dark background override that broke the desktop light theme.
- Mobile: environment textarea fields were capped at 400px wide on desktop. They now expand to fill the available width.
- HP and Stress collapse animation now uses the CSS grid row trick instead of `max-height`, giving a smooth fade-in at natural height without an arbitrary magic number.

---

# DaggerForge 2.2.0

## New

- **Unified Content Browser**  single tabbed side panel (Adversaries / Environments) replaces two separate panels. One ribbon button, instant tab switching, no re-fetch.
- **Content Creator chooser**  one entry point opens a picker for Adversary or Environment creator.
- **React integration**  browser panel is now powered by React (hooks, state, effects). Foundation for future interactive UI.
- **Horde adversary field**  "Members per HP" input appears when Type = Horde; saves as `Horde (5/HP)` format automatically.
- **Adversary HP/Stress collapse**  small toggle button on each card hides/shows the tick section. Collapsed by default. State persists across edit/view mode switches.
- **HP & Stress tick sync**  checkbox states survive mode switches via `sessionStorage`.
- **Settings page**  keyword highlight toggle and dice result duration slider under Obsidian Settings → DaggerForge.
- **Keyword highlighting**  `hope`, `fear`, `hp`, `stress` auto-colored in rendered cards (toggleable).
- **Dice improvements**  subtraction support (`1d10-2`), colored modifiers (green/red), configurable tooltip duration.
- **Rich text feature editor**  description fields replaced with a Tiptap rich text editor (bold, italic, headings, lists).
- **Dice & Battle Calculator**  now proper Obsidian modals (work on mobile), draggable, fully restyled with Lucide icons.
- **Browser filters**  unified filter bar with pill buttons, counter controls, clear button.
- **Faceted filter counts**  each filter option shows how many cards match. Counts are cross-filtered: selecting a type updates the source counts to reflect only matching cards, and vice versa. Counts update when cards are created, edited, or deleted.
- **Always-visible filter options**  all tiers, sources, and types are always listed even when no cards match. Zero-count options are dimmed rather than hidden.
- **Wide card toggle**  each rendered card has a toggle button (edit mode only) to switch between compact and full-width layout. State persists across reading and edit mode switches.
- **Sticky submit button**  the Insert/Update button in the creator and editor stays fixed at the bottom of the form while scrolling.

## Fixed

- Environment/adversary browser cards from JSON showed `undefined` descriptions  normalized at load time.
- Horde type lost `(X/HP)` on edit/re-save.
- Bullet points double-rendering in read mode  replaced native `ul/li` with custom `df-ul/df-li` divs.
- Dice expressions with `-` (e.g. `1d10-2`) now subtract correctly.
- `Owl Witch` and `Xero, Castle Killer` were merged into one entry  split into separate cards (VA013/VA014).
- Keyword colors consistent between edit and read mode.
- Modal drag now works across the entire modal surface, not just the title bar.
- Browser panel no longer requires reopening after creating or editing a card. Filter state and search text are preserved on refresh.
- Edit button on cards is now hidden in reading view where it has no effect.
- Obsidian native "Edit this block" button no longer overlaps card controls.
- Wide card option removed from the creator and filter bar (toggle is on the card itself now).
- Clicking the delete button on a browser card no longer also triggered card insertion.

## Infra

- Docker-based build (works on any machine via `make build`).
- WSL2 deploy support (`make deploy` via `deploy.sh`).
- `sessionStorage` for card state persistence; `toCustomHtml`/`toStandardHtml` for consistent list rendering.
- Jest config updated to handle `.tsx` files so all test suites run correctly.
- Browser refresh test suite added (6 cases) covering the unified view type and regression guards.
