# DaggerForge 2.7.0

## New

- **Per-section sheet settings** — each customizable section of the character sheet now has a tiny cog wheel in its corner (invisible until hovered, so the printed-sheet look is untouched). Settings travel inside character share codes.
  - **Damage & Health**: optional fourth **Massive Damage** block ("Mark 4 HP") whose threshold is calculated automatically as double the Severe threshold; set **Max HP** and **Max Stress** (1–12) — slots up to the max render with solid borders, the rest stay dashed.
  - **Hope**: set **Max Hope** (1–24) — up to six per strip; going past six adds extra strips, and diamonds beyond the max on a partial strip are greyed out and locked.
  - **Experience**: increase the number of rows beyond the printed five (up to 20).
  - **Gold**: switch to **custom currencies** — rename the section (e.g. "Credits") and track any number of named currencies with numeric amounts, instead of the handfuls/bags/chest icons.
- Guided creation now also sets Max HP from the chosen class's HP.
- **Characters tab in the Content Browser** — browse saved characters next to adversaries and environments, with a search box; click a card to insert that character's live sheet into the focused note or canvas. Each card is color-coded by class (border + class badge).
- **Layout toggle on embedded sheets** — a small icon button (next to Save/Load) cycles the embed between auto, full-width, and compact layouts, per copy. On desktop, embeds also keep the full sheet layout longer before collapsing to the stacked mobile arrangement.
- **Equipment, items & consumables**
  - The sheet's **Add cards** picker gains **Equipment** and **Items** tabs: browse all SRD weapons, armor, and combat wheelchairs (with tier filter and search) and set them as Primary/Secondary weapon or equip armor with full stats in one click; browse SRD items and consumables (plus your custom items) and add them straight to the character's inventory.
  - **Items tab in the Content Browser** — search and filter all SRD gear and your custom items by kind; click one to insert it as a card into the focused note or canvas.
  - **Item embeds** — inserted items are small live cards backed by an id block (` ```daggerforge-item` `), styled like adversary cards; editing the record updates every embed.
  - **Item creator** — the Content Creator gains an **Item** option (also the "Item creator" command) with guidance for every field: per-kind hints and example stat lines (weapon/armor/wheelchair/item/consumable), tier and rarity pickers, then one click creates the item and inserts its card.
- **Guided creation polish**
  - New **Experiences** step: two suggestion inputs (with example placeholders) that land on the sheet as +2 Experiences.
  - Clicking a class/subclass/ancestry/community/domain card now opens a stable detail panel above the grid (full description + a Choose button) instead of awkwardly expanding the card in place — readable on both desktop and mobile.
- Feature names inside card text (e.g. **Heart of a Poet:**) are now bolded automatically on sheet cards, wizard descriptions, and item cards.

---

# DaggerForge 2.6.0

## New

- **Live adversary & environment embeds** — inserting from the browser or creator now places a small id-referencing code block (` ```daggerforge-adversary`` / ```daggerforge-environment` `) instead of a frozen HTML blob. The block renders the full interactive card (HP/stress ticks, collapse, wide toggle, countdowns, dice badges) in notes and canvas, and always reflects the stored record — editing the adversary updates every embed of it.
  - Each inserted embed carries its own `instance:` token, so five copies of the same goblin each track their own HP. The battle counter becomes `count: N` on the block (N tick rows in one card).
  - Editing inside an embed opens the normal editor prefilled from data — no more scraping HTML out of the note. Editing a bundled SRD card saves a custom copy and automatically repoints that embed (works in notes and canvas files).
  - Old pasted HTML cards keep working exactly as before.
- **"Insert into where?" picker for character sheets** — the sheet's Insert button and command open a fuzzy picker: the last-focused note/canvas first (Enter = old behavior), then other open tabs, then every note and canvas in the vault — including closed `.canvas` files, which gain a properly positioned new card node. Adversary/environment inserts from the browser and creator keep the one-click behavior (straight into the focused note or canvas), and now also work in reading mode by appending to the note.

---

# DaggerForge 2.5.0

## New

- **Character sheets in notes and canvas** — a new "Insert" button on the character sheet (and the "Insert character sheet into note or canvas" command) places a small code block that renders the full live sheet inside any note or canvas card. Edits made in an embed auto-save to the stored character, so the sheet view and every embed stay in sync. If the character is missing (e.g. its code hasn't been imported in this vault yet), the embed shows a placeholder and fills in automatically once it's imported.
- **Card gallery** — a new "Add cards" panel in the character sheet lets players browse all SRD ancestries, communities, and domain cards (with each domain's signature color and icon), filter by domain/level/type, search, and add cards to their character.
- **Heritage & Domain Cards sections** — the sheet now has card sections below Notes: ancestry/community cards, and domain cards organized into Loadout (max 5) and Vault with one-click swapping. Cards travel inside character share codes.
- **Guided character creation** — the "New" button now offers Blank character or Guided creation: pick a class, subclass, ancestry, community, and two level-1 domain cards, and the sheet is filled from SRD data (evasion, suggested traits, class/subclass features, hope feature, suggested weapons and armor with full stats, damage thresholds, starting inventory, 2 Hope, 1 handful of gold). Every step is skippable and everything stays editable before saving.

## Attribution

- Contains material from the Daggerheart System Reference Document, © Critical Role LLC, used under the Darrington Press Community Gaming License. Domain icon art and SRD data sourced from the author's own dhtools project.

---

# DaggerForge 2.4.0

## New

- **Character Sheet** — full Daggerheart character sheet inside Obsidian, traced 1:1 from the official fillable PDF (same sections, slot counts, and art). Open it from the ribbon menu or the "Open character sheet" command.
  - Fill in name/pronouns/heritage/class, the six traits, evasion/armor, HP/stress/hope tracks, experience, gold, active weapons, active armor, and inventory — plus a Notes section for campaign details not on the printed sheet.
  - Save multiple characters and switch between them from the toolbar dropdown.
  - **Copy code** saves the character and puts a compact shareable code on the clipboard; a GM pastes it with **Import code** to get an identical character. Re-importing an updated code refreshes the same character instead of duplicating it.
  - Fully themed for light and dark mode using Obsidian's native CSS variables.

## Infra

- Character data model and code codec (`src/types/character.ts`, `src/features/characters/characterCode.ts`) are pure TypeScript with zero Obsidian dependency. Mirrored as a standalone `character-codec/` package (with its own README) so the same encode/decode logic can be dropped into an external website.

---

# DaggerForge 2.3.0

## New

- **Loop countdown reset button** — countdown clocks whose name or content contains "loop" now show a reset (↩) button. Tapping it resets the clock to 0. For dice-based loop clocks, it also restores the roll button so you can re-roll the max.

## Fixed

- Mobile: dice roller and battle calculator close (×) button now registers on first tap. Previously `makeDraggable` was swallowing the touch event because Obsidian's close button is a `div`, not a `button`.
- Mobile: battle calculator "Adjust" and "Spend" button grids now stack to a single column — no more horizontal scroll.
- Mobile: inline dice buttons no longer spawn inside countdown badges or the roll button.
- Inline dice buttons no longer appear inside `.df-env-countdown-badge` or `.df-env-countdown-dice-roll` elements.
- Card insertion (browser + creator) now works on first tap after plugin load. Previously mobile required one failed attempt to seed the target leaf.
- Card insertion now accepts Live Preview mode (getMode = "live") as a valid edit target, not just Source mode.
- Submit button in creator/editor modals is now always blue, flashes white on press.

---

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
