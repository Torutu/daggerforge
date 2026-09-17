# CLAUDE.md

# Error Log
Before debugging any issue, check [`error_log.md`](error_log.md) for known problems and their fixes.

---

# No Node.js globals in plugin code

Obsidian plugins run in a browser environment - **`process`, `Buffer`, `__dirname`, `__filename`, and other Node.js globals do not exist at runtime.**

- Any library that references `process` (e.g. React, React DOM) will crash with `ReferenceError: process is not defined` unless esbuild replaces those references at build time.
- `esbuild.config.mjs` must define `process`, `process.env`, and `process.env.NODE_ENV` in the `define` block so they are replaced statically at compile time - **not** polyfilled at runtime via a banner.
- Never rely on a runtime banner/polyfill for Node.js globals - use `define` instead.
- If adding a new dependency, check first whether it references Node.js globals (`process`, `global`, `Buffer`). If it does, add the appropriate `define` entries before shipping.

---

# CSS Naming Rules
- **Never** use bare HTML element selectors (`p`, `ul`, `input`, `select`, `textarea`, `button`, etc.) in `styles.css`.
- **Always** use `df-` prefixed classes. If one doesn't exist for the element you're styling, create it.
- The only exception is `.is-mobile` - this is an Obsidian-injected body class and cannot be renamed.

---

# No innerHTML, outerHTML, or insertAdjacentHTML - ever

**`.innerHTML` (read or write), `.outerHTML`, and `insertAdjacentHTML` are completely forbidden anywhere in this codebase.** This is absolute - no exceptions, no "it's already sanitized/escaped so this one is fine." If a change would introduce any of these, it is wrong; rewrite it with the DOM API instead.

- **Build elements**: `createEl()`, `createDiv()`, `createSpan()` - see the dedicated rule below; `document.createElement()` is never used either.
- **Clear an element's contents**: `el.empty()`.
- **Parse an HTML *string* into DOM nodes** (e.g. rendering stored card HTML into a live embed, or loading a rich-text editor's saved content): `new DOMParser().parseFromString(html, "text/html")`, then move/inspect the resulting nodes. Never assign the string to `.innerHTML`.
- **Serialize DOM nodes back into an HTML *string*** (the opposite direction): `new XMLSerializer().serializeToString(node)` per node - not the `.innerHTML` getter. XMLSerializer stamps `xmlns="http://www.w3.org/1999/xhtml"` onto whichever node is the root of each call (an XML-serialization artifact, not part of the actual markup) - strip it.
- Shared helpers for both directions already exist in `src/utils/richContentTransform.ts` - reuse them instead of reimplementing: `parseFragment` (parse + sanitize an untrusted HTML string), `serializeChildren` (element → string), `appendHtml` (parse + sanitize + append into a live container - the replacement for `insertAdjacentHTML`).

Good:
```ts
const el = containerEl.createEl('div', { cls: 'book' });
el.createEl('span', { text: name });
el.empty(); // clear it later
appendHtml(el, storedCardHtml); // insert an HTML string safely
```

Bad:
```ts
el.innerHTML = `<div class="book"><span>${name}</span></div>`; // NEVER
el.insertAdjacentHTML('beforeend', html); // NEVER
const copy = el.outerHTML; // NEVER
const text = el.innerHTML; // NEVER - even as a read, use serializeChildren(el)
```

---

# `document.createElement()` never exists - use createEl()/createDiv()/createSpan()

**`document.createElement()` is completely forbidden anywhere in this codebase, production or test code, no exceptions.** Every element, anywhere, is built with Obsidian's `createEl()`, `createDiv()`, and `createSpan()` helpers instead - called on the element that will be the new node's parent, which creates *and appends* it in one step.

- `parent.createEl(tag, { cls, text, attr })` - creates `tag`, applies classes/text/attributes, appends it to `parent`, and returns it.
- `parent.createDiv({ cls, text })` / `parent.createSpan({ cls, text })` - shorthands for `createEl('div', ...)` / `createEl('span', ...)`.
- A factory function that builds one piece of UI for its caller to place should take the intended **parent** as a parameter and call `parent.createEl(...)` directly, rather than returning a detached node for the caller to append later.
- **No natural parent at hand?** `createEl` always needs *some* element to call it on - it doesn't matter which, since the result can be repositioned or detached immediately afterward:
  - Need the result at a specific position (e.g. spliced between sibling text nodes, or swapped in via `.replaceWith()`)? Create it on any real element - even the node's own eventual sibling's parent - then move it into place with `Node.before()`/`.after()`/`.replaceWith()`. See `diceBadges.ts`'s `buildDiceButton`, `keywordBadges.ts`'s keyword-span builder, and `richContentTransform.ts`'s `rewrapElements`.
  - Need a genuinely detached, possibly never-attached element (an off-screen `<canvas>` scratch buffer, a detached test fixture)? Create it via `document.body.createEl(...)` and call `.remove()` on it immediately - the detach happens synchronously, before anything is ever painted, so it's never visible. See `SheetGuides.tsx`'s portrait downscaler.
- jsdom (used by test files that opt into `@jest-environment jsdom`) doesn't implement these Obsidian-only extensions natively - `src/tests/obsidianDomPolyfill.ts` polyfills them globally via `setupFilesAfterEnv`, so this works identically in tests and in the real plugin. The polyfill itself builds each element via `new DOMParser().parseFromString(...)` (the same pattern already used in `richContentTransform.ts` to turn a markup string into real DOM) rather than the imperative element-creation API - `document.createElement()` has zero occurrences anywhere in this codebase's source, including the polyfill that implements `createEl` for tests.

Good:
```ts
const card = parent.createDiv({ cls: 'book' });
card.createEl('span', { text: name, cls: 'book__title' });
```

Bad:
```ts
const card = document.createElement('div'); // NEVER, anywhere, for any reason
card.className = 'book';
parent.appendChild(card);
```

---

# Versioning
Version format: `milestone.big-features.hotfixes` (e.g. `2.1.10`)
- **milestone** - major redesigns or platform shifts
- **big-features** - new user-facing features
- **hotfixes** - bug fixes and small tweaks

After any change, ask the user whether the version should be bumped and which segment.
Version is set in `manifest.json` and `versions.json`.

---

# Obsidian Plugin Development Rules

This project follows the architecture, philosophy, and development patterns commonly used in the Obsidian ecosystem.

Always prioritize compatibility, maintainability, simplicity, and predictable behavior.

---

# Core Philosophy

- Follow Obsidian's plugin ecosystem conventions.
- Prefer simple and maintainable implementations.
- Avoid overengineering.
- Reuse existing utilities and abstractions before creating new ones.
- Never duplicate logic.
- Keep plugin behavior predictable and lightweight.
- Respect the user's vault, settings, and performance.
- Do not invent APIs, Obsidian methods, or undocumented behaviors.
- If unsure about an API, verify it from official Obsidian documentation or typings.
- Prefer extending existing plugin architecture instead of bypassing it.

---

# Obsidian Plugin Standards

## Plugin Principles

- Plugins must feel native to Obsidian.
- UI should match Obsidian's design language.
- Minimize intrusive behavior.
- Avoid unnecessary popups, notices, or modal spam.
- Avoid blocking the UI thread.
- Prefer gradual enhancement over aggressive automation.
- Never modify user files unexpectedly.

---

# Technology Stack

- TypeScript only.
- Use Obsidian API directly.
- Use React only if the plugin truly benefits from it.
- Avoid large dependencies whenever possible.
- Keep bundle size small.

---

# Project Structure

src/
├── main.ts
├── manifest.json
├── styles.css
├── settings/
├── views/
├── modals/
├── commands/
├── editors/
├── services/
├── utils/
├── types/
├── constants/
└── components/

---

# Naming Conventions

## Files

- Components: `PascalCase.ts`
- Views: `SomethingView.ts`
- Modals: `SomethingModal.ts`
- Services: `somethingService.ts`
- Utilities: `something.ts`
- Types: `something.types.ts`

Examples:

- `TaskView.ts`
- `SettingsModal.ts`
- `vaultService.ts`
- `parseFrontmatter.ts`

---

# TypeScript Rules

## Typing

- Never use `any` unless absolutely unavoidable.
- Prefer explicit types.
- Use interfaces for structured data.
- Avoid unsafe casting.

Good:
```ts
interface PluginSettings {
  enabled: boolean;
  apiKey: string;
}
```

Bad:
```ts
const settings: any = {};
```

---

## Safety

- Handle undefined values safely.
- Obsidian vault data should always be treated as potentially missing or malformed.
- Validate frontmatter before using it.
- Never assume files exist.

---

# Obsidian API Usage

## General Rules

- Use official Obsidian APIs only.
- Avoid undocumented internals unless absolutely necessary.
- If using undocumented internals:
  - isolate them
  - document why
  - add safeguards

---

## Vault Operations

- Never overwrite files without clear intent.
- Avoid destructive operations.
- Batch expensive vault operations carefully.
- Debounce filesystem-heavy actions when possible.

Good:
```ts
await app.vault.modify(file, updatedContent);
```

Bad:
```ts
// Repeated writes on every keystroke
```

---

# Performance Rules

## Performance

- Obsidian runs inside Electron.
- Poor plugin performance affects the entire app.
- Avoid excessive DOM manipulation.
- Avoid unnecessary re-renders.
- Avoid scanning the entire vault repeatedly.
- Cache expensive computations carefully.
- Dispose event listeners properly.

---

## Event Cleanup

Always clean up registered events and intervals.

Good:
```ts
this.registerEvent(
  app.workspace.on("file-open", handleFileOpen)
);
```

Bad:
```ts
app.workspace.on("file-open", handleFileOpen);
```

---

# React Rules (If React Is Used)

- Use functional components only.
- Keep components small and composable.
- Separate logic from UI.
- Avoid excessive global state.
- Reuse components before creating new ones.

---

# UI / UX Standards

## Obsidian UI Consistency

- Follow native Obsidian spacing and patterns.
- Respect dark/light themes.
- Use Obsidian CSS variables.
- Avoid hardcoded colors.
- Avoid custom styling when native styling works.

Good:
```css
color: var(--text-normal);
background-color: var(--background-primary);
```

Bad:
```css
color: #ffffff;
background-color: #000000;
```

---

# Settings Management

## Plugin Settings

- All user-configurable behavior must live in settings.
- Provide sensible defaults.
- Validate settings before saving.
- Keep settings UI simple.

Good:
```ts
await this.saveSettings();
```

---

# Commands

## Command Design

- Commands should do one clear thing.
- Use descriptive names.
- Avoid overly destructive commands.
- Commands should work predictably.

Good:
```ts
name: "Insert current date"
```

Bad:
```ts
name: "Do magic"
```

---

# Modals & Views

## Modals

- Keep modals focused and lightweight.
- Avoid deeply nested modal flows.
- Always clean up listeners on close.

---

## Custom Views

- Views should initialize quickly.
- Dispose resources properly.
- Separate rendering logic from data logic.

---

# Code Reuse Rules

Before creating:

- a utility
- a component
- a hook
- a service
- a parser
- a formatter

Always search the project for an existing implementation first.

If similar logic already exists:
- extend it
- generalize it
- reuse it

Do not create duplicate logic.

---

# Clean Code Rules

- Functions should do one thing.
- Prefer small focused modules.
- Prefer composition over monolithic classes.
- Avoid deep nesting.
- Prefer early returns.
- Remove dead code immediately.
- Remove unused imports.
- Avoid massive files.

---

# Comments

- Prefer self-explanatory code.
- Use comments only for intent or non-obvious behavior.
- Avoid redundant comments.

Bad:
```ts
// Increment counter
counter++;
```

Good:
```ts
// Prevent duplicate vault refresh events
```

---

# Error Handling

- Fail gracefully.
- Never silently swallow errors.
- Provide meaningful notices only when useful to the user.
- Log technical details responsibly.

Good:
```ts
console.error("Failed to parse frontmatter", error);
```

---

# Logging

- Avoid noisy console logs.
- Remove debug logs before release.
- Use structured logging when useful.

---

# Security & Safety

- Never execute arbitrary user content unsafely.
- Sanitize external input.
- Treat vault content as untrusted input.
- Never expose secrets in logs or settings.

---

# Architecture Principles

- Keep concerns separated.
- UI should not contain vault business logic.
- Services should handle data operations.
- Utilities should remain pure when possible.
- Avoid tight coupling between modules.

---

# AI Assistant Rules

When generating code:

- Follow existing project structure strictly.
- Reuse existing patterns before introducing new ones.
- Do not hallucinate Obsidian APIs.
- Keep implementations lightweight.
- Prefer maintainable solutions over clever ones.
- Avoid unnecessary abstractions.
- Do not introduce duplicate helpers or components.
- Match existing naming conventions.
- Prefer incremental changes over large rewrites.

---

# Definition of Done

Code is complete only if:

- It follows Obsidian conventions.
- It avoids duplicated logic.
- It is typed properly.
- It cleans up events/resources correctly.
- It respects vault safety.
- It contains zero `.innerHTML`, `.outerHTML`, or `insertAdjacentHTML` usage (see the dedicated rule above - no exceptions).
- It contains zero `document.createElement()` calls - every element is built with `createEl()`/`createDiv()`/`createSpan()` (see the dedicated rule above - no exceptions).
- It works in both light and dark themes.
- It is maintainable and scalable.
- It introduces minimal complexity.
- It is production-ready.
