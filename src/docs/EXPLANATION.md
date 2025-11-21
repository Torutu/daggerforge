# Implementation Guide

## State Management

**State Isolation** - Create and edit modes maintain separate state. Edit mode uses isolated `editModeState`. Create mode uses `plugin.savedInputStateEnv`. Both clear completely on modal close to prevent contamination.

**Modal Detection** - Environment and adversary modals detect mode by checking saved state. Environment checks for impulse/potentialAdversaries fields. Isolation prevents data leakage between operations.

## Features

**Feature Components** - Contain name, type (Action/Reaction/Passive), cost (optional), text, bullets (array), textAfter (optional), and questions (array). Dynamically add/remove each component.

**getFeatureValues()** - Collects all feature UI data, filters empty values, returns normalized feature array.

## Data Flow

**Create** - Open creator → enter fields → submit → save to storage → render to markdown/canvas → persist state for next create.

**Edit** - Click edit → extract rendered card data → open modal with prefilled data → modify → update storage and markdown → clear state.

**Browse** - Load from persistent storage + built-in data → search/filter → instant insert without modal.

## Type Definitions

**EnvironmentData** - id, name, tier (1-4), type, desc, impulse, difficulty, potentialAdversaries, source, features[].

**SavedFeatureState** - name, type, cost?, text, bullets[], textAfter?, questions[].

**FormInputs** - Dictionary mapping field names to form element references.

## Utility Functions

**extractCardData()** - Parse rendered card HTML → return structured data for editing.

**environmentToHTML()** - Convert environment object → formatted HTML with features, impulses, difficulty.

**isMarkdownActive() / isCanvasActive()** - Detect current view type for output routing.

**createCanvasCard()** - Insert HTML as canvas node at specified position/dimensions.

**openDiceRoller()** - Modal for dice notation rolls ("3d6", "2d8+5").

**openEncounterCalculator()** - Calculate encounter difficulty from adversary tier and count.

---

## Architecture & Organization

### Barrel Export Pattern

Centralized export points reduce import complexity across the codebase.

**src/features/index.ts** - All feature modules: adversaries components/creators/editors, environments components/creators, encounters, dice roller, card editor utilities.

**src/ui/index.ts** - Sidebar functions and modal components.

**src/utils/index.ts** - Data filters, form helpers, adversary counter, canvas helpers.

### Import Organization Best Practices

1. **External Libraries First** - `import { Editor, Menu, Notice } from "obsidian";`
2. **Internal Modules by Feature/Layer** - Features, UI, Services, Types
3. **Types Last** - `import type { CardData } from "./types";`
4. **Barrel Exports** - Import from folder, not individual files

### When Adding New Files

1. Add to appropriate folder (features/ui/utils/services)
2. Export from that folder's index.ts
3. Import from the barrel file in other modules

Example:
```typescript
// src/utils/newUtil.ts
export function myFunction() { ... }

// Add to src/utils/index.ts
export * from './newUtil';

// Use anywhere
import { myFunction } from './utils';
```

### Project Structure

```
src/
├── features/          → import { ... } from "./features"
├── ui/               → import { ... } from "./ui"
├── utils/            → import { ... } from "./utils"
├── services/         → import { DataManager } from "./services/DataManager"
├── types/            → import type { ... } from "./types"
├── data/             → data files
├── main.ts           → Clean, organized imports
└── docs/             → API documentation
```
