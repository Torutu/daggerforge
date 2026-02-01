# DaggerForge Implementation Guide

## Architecture Overview

DaggerForge follows a **feature-based architecture** where related functionality is grouped by business domain rather than technical layer.

### Project Structure

```
src/
├── features/              # Business features (complete modules)
│   ├── adversaries/      # Adversary creation, editing, browsing
│   ├── environments/     # Environment creation, editing, browsing
│   ├── card-editing/     # Shared card editing logic
│   ├── data-management/  # Import, export, delete operations
│   └── tools/            # Dice roller, encounter calculator
│
├── data/                 # Data layer (persistence + static data)
│   ├── DataManager.ts    # Save/load user data
│   ├── adversaries.ts    # Built-in adversary data
│   └── environments.ts   # Built-in environment data
│
├── utils/                # Pure utility functions
│   ├── canvasHelpers.ts  # Canvas operations
│   ├── formHelpers.ts    # Form creation utilities
│   ├── searchEngine.ts   # Generic search/filter
│   └── idGenerator.ts    # Unique ID generation
│
├── types/                # TypeScript definitions
│   ├── adversary.ts      # Adversary types
│   ├── environment.ts    # Environment types
│   └── shared.ts         # Shared types
│
└── main.ts               # Plugin entry point
```

---

## Core Concepts

### 1. Feature Modules

Each feature is **self-contained** with its own components, logic, and UI.

**Example: Adversaries Feature**

```
features/adversaries/
├── components/           # UI components
│   └── AdvSearch.ts     # Browser view
├── creator/             # Creation logic
│   ├── AdvModal.ts      # Creator modal
│   └── CardBuilder.ts   # HTML generation
├── editor/              # Editing logic
│   └── AdvCardScraper.ts # Extract card data
└── index.ts             # Barrel export
```

**Benefits:**

- Easy to find related code
- Clear boundaries between features
- Can be extracted or reused independently

---

### 2. State Management

#### Create vs Edit Modes

**Create Mode:**

- Uses `plugin.savedInputStateAdv` or `plugin.savedInputStateEnv`
- Persists form state between modal opens
- Cleared only when form is submited

**Edit Mode:**

- Uses isolated `editData` variable
- Loads data from card element
- Never persists to plugin state
- Cleared on modal close or submited

**Example:**

```typescript
constructor(plugin, editor, cardElement?, cardData?) {
  this.isEditMode = !!cardElement;

  if (this.isEditMode) {
    this.editData = cardData;  // Isolated state
  }
}

onOpen() {
  const saved = this.isEditMode
    ? this.editData                    // Edit: use card data
    : plugin.savedInputStateAdv;       // Create: use saved state
}

onClose() {
  if (this.isEditMode) return;  // Edit: don't save

  // Create: save current state
  plugin.savedInputStateAdv = this.readFormValues();
}
```

---

### 3. Data Flow

#### Creating a Card

```
1. User opens creator modal
   ↓
2. Form loads saved state (if exists)
   ↓
3. User fills in fields
   ↓
4. User clicks "Insert card"
   ↓
5. Data is assembled into AdvData/EnvironmentData
   ↓
6. Saved to DataManager
   ↓
7. HTML generated from data
   ↓
8. Inserted into markdown or canvas
   ↓
9. Form state saved for next create
   ↓
10. Browser views refreshed
```

#### Editing a Card

```
1. User clicks edit button on card
   ↓
2. Card HTML parsed into data object
   ↓
3. Modal opens with data pre-filled
   ↓
4. User modifies fields
   ↓
5. User clicks "Update card"
   ↓
6. New HTML generated
   ↓
7. Old card replaced (DOM or markdown)
   ↓
8. Data saved to DataManager
   ↓
9. Modal closes (no state saved)
   ↓
10. Browser views refreshed
```

#### Browsing and Inserting

```
1. User opens browser sidebar
   ↓
2. DataManager loads saved data
   ↓
3. Built-in data loaded from /data folder
   ↓
4. Combined and displayed in list
   ↓
5. User searches/filters
   ↓
6. User clicks card
   ↓
7. HTML generated
   ↓
8. Inserted into active note/canvas
```

---

### 4. Canvas vs Markdown Handling

The plugin detects the active view type and adapts behavior:

**Markdown:**

- Insert as HTML text using `editor.replaceSelection()`
- Edit by finding and replacing text range
- Cards are static HTML in source

**Canvas:**

- Insert as `createTextNode()` on canvas object
- Edit by mutating DOM directly
- Cards are live DOM elements

**Detection:**

```typescript
if (isCanvasActive(app)) {
	const pos = getAvailableCanvasPosition(app);
	createCanvasCard(app, html, { x: pos.x, y: pos.y });
} else if (isMarkdownActive(app) && editor) {
	editor.replaceSelection(html + "\n");
}
```

---

### 5. ID Management

Every card gets a unique ID for tracking and editing.

**Format:**

- Adversaries: `CUA_timestamp_random8`
- Environments: `CUE_timestamp_random8`

**Example:** `CUA_1738425600000_7k3m9p2x`

**Purpose:**

- Identify cards when editing
- Prevent collisions when sharing data
- Track custom content vs built-in

**Generation:**

```typescript
function generateAdvUniqueId(): string {
	const timestamp = Date.now();
	const randomPart = Array.from(
		{ length: 8 },
		() =>
			"abcdefghijklmnopqrstuvwxyz0123456789"[
				Math.floor(Math.random() * 36)
			],
	).join("");

	return `CUA_${timestamp}_${randomPart}`;
}
```

---

### 6. Search and Filter Engine

Generic, reusable search engine for any data type.

**Usage:**

```typescript
const searchEngine = new SearchEngine<AdvData>();

// Set data
searchEngine.setItems(adversaries);

// Apply filters
searchEngine.setFilters({
	query: "goblin",
	tier: "1",
	source: "custom",
});

// Get results
const results = searchEngine.search();
```

**Search Fields:**

- `query` - Searches name, desc, type
- `tier` - Exact match on tier
- `source` - Exact match on source
- `type` - Exact match on type

---

### 7. Form Helpers

Standardized form creation for consistency.

**createField** - Full-width fields:

```typescript
createField(container, inputs, "Description", "desc", "textarea");
```

**createInlineField** - Single-row fields:

```typescript
createInlineField(row, inputs, {
	label: "Tier",
	key: "tier",
	type: "select",
	options: ["1", "2", "3", "4"],
});
```

**createShortTripleFields** - Three compact fields:

```typescript
createShortTripleFields(
	container,
	inputs,
	"HP",
	"hp",
	"Stress",
	"stress",
	"ATK",
	"atk",
);
```

---

### 8. Barrel Exports

Each folder exports through an `index.ts` file.

**Purpose:**

- Single import point per module
- Easy refactoring (move files, update index once)
- Clean import statements

**Example:**

```typescript
// features/adversaries/index.ts
export * from "./components/AdvSearch";
export * from "./creator/AdvModal";
export * from "./creator/CardBuilder";
export * from "./editor/AdvCardScraper";

// Usage anywhere
import {
	TextInputModal,
	buildCardHTML,
	extractCardData,
} from "../features/adversaries";
```

---

## Key Implementation Patterns

### Pattern 1: Modal Lifecycle

```typescript
class MyModal extends Modal {
	onOpen() {
		// Build UI
		// Load saved state
		// Register event listeners
	}

	onClose() {
		// Save state (if create mode)
		// Clean up event listeners (automatic)
		// Clear DOM (automatic)
	}
}
```

### Pattern 2: View Refresh

```typescript
interface RefreshableView {
	refresh(): void | Promise<void>;
}

function refreshBrowsers(plugin: DaggerForgePlugin) {
	const leaves = app.workspace.getLeavesOfType(VIEW_TYPE);
	leaves.forEach((leaf) => {
		const view = leaf.view;
		if (typeof view.refresh === "function") {
			view.refresh();
		}
	});
}
```

### Pattern 3: Data Validation

```typescript
function validateImportData(data: any): boolean {
	if (typeof data !== "object" || data === null) {
		return false;
	}

	const hasAdversaries = Array.isArray(data.adversaries);
	const hasEnvironments = Array.isArray(data.environments);

	return hasAdversaries || hasEnvironments;
}
```

### Pattern 4: Error Handling

```typescript
try {
	await plugin.dataManager.addAdversary(data);
	new Notice(`Saved: ${data.name}`);
} catch (error) {
	console.error("Error saving:", error);
	new Notice("Failed to save. Check console.");
}
```

---

## Testing Strategy

### Unit Tests

Test pure functions in isolation:

- `idGenerator.ts` - ID format validation
- `searchEngine.ts` - Filter logic
- `dice.ts` - Dice roll parsing

### Integration Tests

Test feature workflows:

- Create adversary → save → verify in browser
- Import data → verify merge
- Edit card → verify update

### Mock Strategy

Mock Obsidian API:

```typescript
// tests/__mocks__/obsidian.ts
export class Notice {
	constructor(message: string) {
		console.log("Notice:", message);
	}
}
```

---

## Common Tasks

### Adding a New Feature Type

1. Create folder in `/features`
2. Add components, creator, editor subfolders
3. Create `index.ts` barrel export
4. Export from `/features/index.ts`
5. Add to plugin menu/commands

### Adding a New Data Field

1. Update type definition in `/types`
2. Add field to form in modal
3. Update HTML generation
4. Update data extraction (scraper)
5. Update validation

### Adding a New Filter

1. Update SearchEngine filter types
2. Add UI control in search view
3. Wire onChange handler
4. Test with various data

---

## Performance Considerations

### Lazy Loading

Built-in data is loaded once on plugin init, not on every modal open.

### Debouncing

Search input debounced to avoid excessive re-renders.

### DOM Efficiency

- Use DocumentFragment for batch DOM operations
- Avoid layout thrashing (read then write)
- Reuse elements where possible

### Memory Management

- Clear event listeners in `onClose()`
- Don't store large objects on plugin instance
- Use Obsidian's `registerEvent()` for auto-cleanup

---

## Debugging Tips

### Common Issues

**"Card not found in markdown"**

- Check if ID attribute matches
- Verify section structure hasn't changed
- Confirm in source mode, not preview

**"Data not persisting"**

- Check `DataManager.load()` actually assigns to `this.data`
- Verify `save()` is being called
- Look at `.obsidian/plugins/daggerforge/data.json`

**"Browser not refreshing"**

- Ensure view type string matches constant
- Check if `refresh()` method exists on view
- Verify `refreshBrowsers()` is being called

---

## Best Practices

### Code Organization

✅ Group by feature, not file type  
✅ Keep utils pure (no side effects)  
✅ Use barrel exports  
✅ One component per file

### State Management

✅ Isolate edit mode state  
✅ Clear state on close  
✅ Don't store on plugin instance

### Error Handling

✅ Try-catch around async operations  
✅ Log errors to console  
✅ Show user-friendly notices

### TypeScript

✅ Avoid `any` type  
✅ Use interfaces for data structures  
✅ Export types for reuse

### Performance

✅ Debounce user input  
✅ Batch DOM operations  
✅ Register events properly

---

## Migration Guide

### From Old Structure to New

**Import changes:**

```typescript
// OLD
import { ImportDataModal } from "../ui";
import { CardEditor } from "../features";

// NEW
import { ImportDataModal } from "../features/data-management";
import { handleCardEditClick } from "../features/card-editing";
```

**Folder moves:**

- `ui/` → `features/data-management/`
- `features/CardEditor.ts` → `features/card-editing/CardEditor.ts`
- `features/extra/` → `features/tools/`

---

## Further Reading

- **Obsidian Plugin Guidelines:** `/docs/OBSIDIAN_PLUGIN_GUIDELINES.md`
- **API Reference:** `/docs/API.md`
- **Project Structure:** `/docs/STRUCTURE.md`
