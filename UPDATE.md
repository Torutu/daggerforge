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

## Fixed

- Environment/adversary browser cards from JSON showed `undefined` descriptions  normalized at load time.
- Horde type lost `(X/HP)` on edit/re-save.
- Bullet points double-rendering in read mode  replaced native `ul/li` with custom `df-ul/df-li` divs.
- Dice expressions with `-` (e.g. `1d10-2`) now subtract correctly.
- `Owl Witch` and `Xero, Castle Killer` were merged into one entry  split into separate cards (VA013/VA014).
- Keyword colors consistent between edit and read mode.
- Modal drag now works across the entire modal surface, not just the title bar.

## Infra

- Docker-based build (works on any machine via `make build`).
- WSL2 deploy support (`make deploy` via `deploy.sh`).
- `sessionStorage` for card state persistence; `toCustomHtml`/`toStandardHtml` for consistent list rendering.
