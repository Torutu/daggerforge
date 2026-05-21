# DaggerForge Card Styles — Reuse Guide

How to embed adversary and environment cards on any website. Drop in the CSS,
copy the HTML template, fill in your data.

---

## Quick start

1. Copy the contents of the `<style>` block below into your stylesheet (or a
   separate `daggerforge-cards.css` file).
2. Use the HTML templates further down to render cards.
3. The cards are self-contained — no JavaScript required for display.
   Interactive features (HP/stress tick tracking, wide toggle) need a small
   script that is covered at the bottom.

---

## CSS

Paste this into your stylesheet. The `--df-*` variables at the top are the
only things you need to change if you want to retheme the cards.

```css
/* ── Variables ─────────────────────────────────────────────────────────── */

:root {
  --df-corner: 4px;               /* size of the cut-corner bevel */
  --df-color-primary:   #000;
  --df-color-bg-outer:  #bfa980;  /* tan border colour */
  --df-color-bg-inner:  #f5f0e9;  /* cream card background */
  --df-color-border:    #bfa980;

  /* Source badge accent colours */
  --df-color-void:       #784d99;
  --df-color-umbra:      #464ca5;
  --df-color-sablewood:  #14805f;
  --df-color-incredible: #3c00c7;
}


/* ── Adversary card shell ───────────────────────────────────────────────── */
/* The cut-corner effect is done with clip-path on a ::before pseudo-element */

.df-pseudo-cut-corners {
  position: relative;
  clip-path: none;
}

.df-pseudo-cut-corners::before {
  content: "";
  position: absolute;
  z-index: -1;
  top: 0; left: 0;
  width: 100%; height: 100%;
  clip-path: polygon(
    var(--df-corner) 0%,
    calc(100% - var(--df-corner)) 0%,
    100% var(--df-corner),
    100% calc(100% - var(--df-corner)),
    calc(100% - var(--df-corner)) 100%,
    var(--df-corner) 100%,
    0% calc(100% - var(--df-corner)),
    0% var(--df-corner)
  );
}

/* Outer shell — tan border + drop shadow */
.df-pseudo-cut-corners.outer {
  filter: drop-shadow(0.2em 0.2em 0.4em rgba(0,0,0,0.5));
  padding: 1.4px;
  max-width: 400px;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
}
.df-pseudo-cut-corners.outer::before { background-color: var(--df-color-bg-outer); }

/* Inner shell — cream background */
.df-pseudo-cut-corners.inner {
  padding: 5px;
  box-sizing: border-box;
}
.df-pseudo-cut-corners.inner::before { background-color: var(--df-color-bg-inner); }

/* Wide mode — removes the 400 px cap so the card stretches full-width */
.df-card--wide.df-pseudo-cut-corners.outer,
.df-card--wide.df-env-card-outer {
  max-width: 100%;
}


/* ── Adversary card internals ───────────────────────────────────────────── */

.df-card-inner {
  font-weight: 1000;
  color: var(--df-color-primary);
}
.df-card-inner * { font-family: inherit; color: inherit; }

.df-card-inner h2 {
  font-size: 1.3em;
  font-weight: 700;
  margin: 0;
}

.df-card-inner .df-subtitle,
.df-card-inner .df-section,
.df-card-inner .df-feature-title { font-weight: bold; }

.df-card-inner .df-desc {
  font-weight: 500;
  font-style: italic;
  font-size: 0.8em;
}

.df-card-inner .df-motives { font-weight: 700; }

.df-card-inner .df-motives-desc,
.df-card-inner .df-feature-desc {
  font-weight: 500;
  font-size: small;
}

.df-card-inner .df-stats {
  margin: 2px 0;
  padding-left: 5px;
  font-weight: 600;
  background-color: #fff;
  font-size: 0.9em;
  border-top: 2px solid #c2af89;
  border-bottom: 2px solid #c2af89;
}

.df-card-inner .df-stat { font-weight: 400; }

.df-stats .df-experience-line {
  border-top: 1px dotted black;
  margin-top: 1px;
  padding-top: 1px;
  background-color: #fff;
  margin-left: -5px;
  padding-left: 5px;
}

.df-card-inner .df-feature { margin-bottom: 2px; }


/* ── HP / Stress tick section ───────────────────────────────────────────── */

/* Collapsed by default; add class "df-expanded" to the outer section to show */
.df-hp-stress-section {
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.2s ease;
}
.df-card-outer.df-expanded .df-hp-stress-section {
  max-height: 2000px;
}

.df-adv-collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 13px;
  margin: 0 auto 3px;
  padding: 0;
  border: 1px solid var(--df-color-border, #bfa980);
  border-radius: 0 0 6px 6px;
  background: var(--df-color-bg-outer, #bfa980);
  color: var(--df-color-bg-inner, #f5f0e9);
  cursor: pointer;
  opacity: 0.75;
  transition: opacity 0.15s;
}
.df-adv-collapse-btn:hover { opacity: 1; }
.df-adv-collapse-btn svg {
  pointer-events: none;
  transition: transform 0.2s ease;
}
.df-card-outer:not(.df-expanded) .df-adv-collapse-btn svg {
  transform: rotate(180deg);
}

.df-hp-tickboxes {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
}

.df-stress-tickboxes {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  border-bottom: 1px solid var(--df-color-border);
}

.df-hp-stress {
  font-weight: 700;
  font-size: 0.9em;
  margin-right: 5px;
}

.df-stress-tickboxes .df-stress-tickbox,
.df-hp-tickboxes .df-hp-tickbox {
  width: 23px;
  height: 14px;
  cursor: pointer;
  border-radius: 4px;
  margin-right: 4px;
  border: 1px solid #ccc;
  background-color: white;
  appearance: none;
}

.df-hp-tickboxes .df-hp-tickbox:checked,
.df-stress-tickboxes .df-stress-tickbox:checked {
  background-color: rgb(41,41,41);
  border-color: rgb(41,41,41);
}


/* ── Source badges ──────────────────────────────────────────────────────── */

.df-source-badge-core,
.df-source-badge-custom,
.df-source-badge-void,
.df-source-badge-umbra,
.df-source-badge-sablewood,
.df-source-badge-incredible {
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75em;
  font-weight: bold;
  text-transform: capitalize;
}
.df-source-badge-core       { color: #fff; background-color: #7e7e7e; }
.df-source-badge-custom     { color: #3d3d3d; background-color: #d3d3d3; }
.df-source-badge-void       { color: #fff; background-color: var(--df-color-void); }
.df-source-badge-umbra      { color: #fff; background-color: var(--df-color-umbra); }
.df-source-badge-sablewood  { color: #fff; background-color: var(--df-color-sablewood); }
.df-source-badge-incredible { color: #fff; background-color: var(--df-color-incredible); }


/* ── Feature list items (df-ul / df-ol / df-li) ────────────────────────── */
/* These replace native <ul>/<ol>/<li> to avoid browser stylesheet conflicts */

.df-ul,
.df-ol {
  display: flex;
  flex-direction: column;
  gap: 0.1em;
  margin: 0.25rem 0 0.25rem 0.4rem;
  padding: 0;
}

.df-li {
  display: flex;
  align-items: baseline;
  gap: 0.35em;
  font-size: 0.82em;
  line-height: 1.45;
}
.df-li > p { margin: 0; padding: 0; }

.df-ul .df-li::before {
  content: "";
  display: inline-block;
  width: 4px; height: 4px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
  opacity: 0.6;
  align-self: center;
  margin-top: 1px;
}

.df-ol { counter-reset: df-list-counter; }
.df-ol .df-li::before {
  counter-increment: df-list-counter;
  content: counter(df-list-counter) ".";
  flex-shrink: 0;
  min-width: 1.1em;
  opacity: 0.6;
  font-weight: 700;
}

.df-env-feat-richcontent p,
.df-card-inner .df-feature-desc p { margin: 0 0 0.15rem 0; }


/* ── Environment card ───────────────────────────────────────────────────── */

.df-env-card-outer {
  max-width: 400px;
  margin: 1em auto;
  padding: 1em;
  border: 1px solid #8d8d91;
  border-radius: 8px;
  background: #edecec;
  color: #221e20;
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
  position: relative;
}

.df-env-name {
  font-weight: 700;
  font-size: 1.3rem;
  margin-bottom: 0.5em;
}

.df-env-feat-tier-type {
  font-weight: 700;
  font-size: 1rem;
}

.df-env-desc { font-style: italic; }

.df-env-card-inner p {
  margin: 0.1em 0;
  font-size: 0.9rem;
  line-height: 1.25;
}

.df-env-card-diff-pot {
  border-top: solid 1px #221e20;
  border-bottom: solid 1px #221e20;
  padding: 1px 20px 3px 10px;
  background-color: #ffffff;
}

.df-bold-title { font-weight: 700; font-size: 0.9rem; }

.df-features-section h3 {
  font-weight: 700;
  font-size: 1.1rem;
  margin: 3px 0;
  text-transform: uppercase;
}

.df-env-feat-name-type {
  font-weight: 700;
  font-size: 0.9rem;
  font-style: italic;
  margin-bottom: 0.3em;
  line-height: 1.25;
}

.df-env-feat-richcontent { font-style: normal; }

.df-env-questions {
  font-weight: 500;
  font-size: 0.9rem;
  font-style: italic;
  margin-top: 0.5em;
}
```

---

## Adversary card HTML

Replace the placeholder values with your data. Generate one
`df-hp-tickbox`/`df-stress-tickbox` input per HP/Stress point.
Generate one HP+Stress block per adversary if tracking multiple at once.

```html
<section class="df-card-outer df-pseudo-cut-corners outer">
  <div class="df-card-inner df-pseudo-cut-corners inner">

    <!-- Collapse toggle for the HP/Stress section -->
    <button class="df-adv-collapse-btn" aria-label="Toggle HP and Stress">
      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11"
           viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m18 15-6-6-6 6"/>
      </svg>
    </button>

    <!-- HP and Stress tick boxes (repeat this block per adversary copy) -->
    <div class="df-hp-stress-section">
      <div class="df-hp-tickboxes">
        <span class="df-hp-stress">HP</span>
        <!-- one checkbox per HP point -->
        <input type="checkbox" class="df-hp-tickbox" />
        <input type="checkbox" class="df-hp-tickbox" />
        <input type="checkbox" class="df-hp-tickbox" />
        <span class="df-adversary-count">1</span>
      </div>
      <div class="df-stress-tickboxes">
        <span class="df-hp-stress">Stress</span>
        <!-- one checkbox per Stress point -->
        <input type="checkbox" class="df-stress-tickbox" />
        <input type="checkbox" class="df-stress-tickbox" />
      </div>
    </div>

    <h2>Goblin Skirmisher</h2>
    <div class="df-subtitle">
      Tier 1 Minion
      <span class="df-source-badge-core">core</span>
    </div>

    <div class="df-desc">A quick, cowardly ambusher that fights in packs.</div>

    <div class="df-motives">
      Motives &amp; Tactics:
      <span class="df-motives-desc">Overwhelm, retreat when outnumbered.</span>
    </div>

    <div class="df-stats">
      Difficulty: <span class="df-stat">10 |</span>
      Thresholds: <span class="df-stat">4/8 |</span>
      HP: <span class="df-stat">3 |</span>
      Stress: <span class="df-stat">1</span>
      <br>
      ATK: <span class="df-stat">+2 |</span>
      Shortsword: <span class="df-stat">Melee | 1d6+1</span>
      <br>
      <div class="df-experience-line">
        Experience: <span class="df-stat">1</span>
      </div>
    </div>

    <div class="df-section">FEATURES</div>

    <div class="df-feature">
      <span class="df-feature-title">Pack Tactics - Passive:</span>
      <div class="df-feature-desc">
        +2 to attack rolls when an ally is adjacent to the target.
      </div>
    </div>

    <div class="df-feature">
      <span class="df-feature-title">Flee! - Reaction: 1</span>
      <div class="df-feature-desc">
        When reduced to 1 HP, move up to speed without triggering reactions.
      </div>
    </div>

  </div>
</section>
```

### Wide version

Add `df-card--wide` to the outer section to remove the 400 px cap:

```html
<section class="df-card-outer df-pseudo-cut-corners outer df-card--wide">
  ...
</section>
```

---

## Environment card HTML

```html
<section class="df-env-card-outer">
  <div class="df-env-card-inner">

    <div class="df-env-name">The Ashen Wastes</div>
    <div class="df-env-feat-tier-type">
      Tier 2 Wilderness
      <span class="df-source-badge-core">core</span>
    </div>

    <p class="df-env-desc">
      A scorched expanse of cracked earth and smouldering ruins, choked with
      acrid smoke.
    </p>

    <p><strong>Impulse:</strong> Consume, reduce to cinders.</p>

    <div class="df-env-card-diff-pot">
      <p><span class="df-bold-title">Difficulty</span>: 14</p>
      <p><span class="df-bold-title">Potential Adversaries</span>:
        Ash Wraith, Cinder Hound, Ember Golem
      </p>
    </div>

    <div class="df-features-section">
      <h3>Features</h3>

      <div class="df-feature">
        <div class="df-env-feat-name-type">
          <span class="df-env-feat-name">Choking Smoke</span>
          - <span class="df-env-feat-type">Hazard:</span>
        </div>
        <div class="df-env-feat-richcontent">
          At the start of each round, players without a face covering mark 1
          Stress.
        </div>
      </div>

      <div class="df-feature">
        <div class="df-env-feat-name-type">
          <span class="df-env-feat-name">Unstable Ground</span>
          - <span class="df-env-feat-type">Terrain:</span>
        </div>
        <div class="df-env-feat-richcontent">
          Moving more than 3 spaces requires a DC 12 Agility roll or fall prone.
        </div>
        <!-- Optional: clarifying questions for the GM -->
        <div class="df-env-questions">
          Where does the smoke seem thickest? What remnants hint at what burned here?
        </div>
      </div>

    </div>
  </div>
</section>
```

---

## Rich text in feature descriptions

Feature descriptions support bold, italic, headings, and lists. Use
`df-ul` / `df-ol` / `df-li` instead of native `<ul>`/`<ol>`/`<li>` to
avoid conflicts with browser or framework default stylesheets.

```html
<div class="df-feature-desc">
  Deals damage and applies one of the following:
  <div class="df-ul">
    <div class="df-li">Knocked prone (no save)</div>
    <div class="df-li">Disarmed until end of next turn</div>
  </div>
</div>
```

---

## Interactive HP / Stress collapse (optional JS)

The HP/Stress section is hidden by default via `max-height: 0`. Add this
small script to wire up the toggle button.

```js
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".df-adv-collapse-btn");
  if (!btn) return;
  const card = btn.closest(".df-card-outer");
  if (card) card.classList.toggle("df-expanded");
});
```

---

## Source badge reference

| Class                        | Used for          | Colour      |
|------------------------------|-------------------|-------------|
| `df-source-badge-core`       | Core book content | Grey        |
| `df-source-badge-custom`     | Homebrew          | Light grey  |
| `df-source-badge-void`       | Void sourcebook   | Purple      |
| `df-source-badge-umbra`      | Umbra sourcebook  | Dark blue   |
| `df-source-badge-sablewood`  | Sablewood         | Green       |
| `df-source-badge-incredible` | Incredible        | Deep violet |

---

## Theming

Override any `--df-*` variable on `:root` or a parent element.

```css
/* Dark theme example */
.dark-theme {
  --df-color-bg-outer: #4a3f35;
  --df-color-bg-inner: #2a2420;
  --df-color-primary:  #e8ddd0;
  --df-color-border:   #4a3f35;
}
```

Apply `class="dark-theme"` to any ancestor element (or `body`) and both
card types will pick it up.
