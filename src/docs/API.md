# DaggerForge API Reference

## Overview
Complete API reference for DaggerForge components, organized by feature domain.

---

## Feature Modules

### Adversaries (`/features/adversaries`)

#### AdversaryView (AdvSearch.ts)
**Purpose:** Browser/search interface for adversaries  
**Location:** `features/adversaries/components/AdvSearch.ts`

**Key Methods:**
- `refresh()` - Reload adversary data and re-render results
- `loadAdversaryData()` - Load built-in + custom adversaries
- `deleteCustomAdversary(adversary)` - Delete by unique ID
- `insertAdversaryIntoNote(adversary)` - Insert into active note/canvas

**Events:**
- Listens to `active-leaf-change` to track last active markdown view

---

#### TextInputModal (AdvModal.ts)
**Purpose:** Create and edit adversary cards  
**Location:** `features/adversaries/creator/AdvModal.ts`

**Constructor:**
```typescript
new TextInputModal(
  plugin: DaggerForgePlugin,
  editor: Editor | null,
  cardElement?: HTMLElement,
  cardData?: Record<string, unknown>
)
```

**Modes:**
- **Create:** `editor` provided, no `cardElement` - saves new adversary
- **Edit:** `cardElement` + `cardData` provided - updates existing card

**Key Features:**
- Form state persistence (create mode only)
- Dynamic feature addition/removal
- Markdown and canvas insertion
- Edit mode with `onEditUpdate` callback

---

#### buildCardHTML (CardBuilder.ts)
**Purpose:** Generate adversary card HTML  
**Location:** `features/adversaries/creator/CardBuilder.ts`

**Signature:**
```typescript
buildCardHTML(
  values: Record<string, string>,
  features: Array<{ name, type, cost, desc }>
): string
```

**Returns:** Complete HTML section with stats, weapons, features

---

#### extractCardData (AdvCardScraper.ts)
**Purpose:** Parse rendered adversary card into data object  
**Location:** `features/adversaries/editor/AdvCardScraper.ts`

**Signature:**
```typescript
extractCardData(cardElement: HTMLElement): Record<string, unknown>
```

---

### Environments (`/features/environments`)

#### EnvironmentView (EnvSearch.ts)
**Purpose:** Browser/search interface for environments  
**Location:** `features/environments/components/EnvSearch.ts`

**Key Methods:**
- `refresh()` - Reload environment data
- `loadEnvironmentData()` - Load built-in + custom environments
- `deleteCustomEnvironment(env)` - Delete by unique ID
- `insertEnvironmentIntoNote(env)` - Insert into active note/canvas

---

#### environmentToHTML (EnvToHTML.ts)
**Purpose:** Convert environment data to HTML  
**Location:** `features/environments/components/EnvToHTML.ts`

**Signature:**
```typescript
environmentToHTML(env: EnvironmentData): string
```

**Features:**
- Markdown to HTML conversion (bold, italic, bullets)
- Feature rendering with cost/type/bullets
- Questions section for GM prompts

---

#### EnvironmentModal (EnvModal.ts)
**Purpose:** Create and edit environment cards  
**Location:** `features/environments/creator/EnvModal.ts`

**Constructor:**
```typescript
new EnvironmentModal(
  plugin: DaggerForgePlugin,
  editor: Editor | null,
  cardData?: EnvironmentData
)
```

**Dynamic Features:**
- Multiple bullet points per feature
- TextAfter continuation field
- GM prompt questions
- Feature removal

---

### Card Editing (`/features/card-editing`)

#### handleCardEditClick (CardEditor.ts)
**Purpose:** Global click handler for edit buttons  
**Location:** `features/card-editing/CardEditor.ts`

**Signature:**
```typescript
handleCardEditClick(
  evt: MouseEvent,
  app: App,
  plugin: DaggerForgePlugin
): Promise<void>
```

**Capabilities:**
- Detects canvas vs markdown context
- Routes to adversary vs environment editors
- Auto-switches markdown to source mode
- Updates DOM (canvas) or file content (markdown)

---

### Tools (`/features/tools`)

#### openDiceRoller (dice/diceRoller.ts)
**Purpose:** Floating dice rolling window  
**Location:** `features/tools/dice/diceRoller.ts`

**Signature:**
```typescript
openDiceRoller(plugin: DaggerForgePlugin): void
```

**Features:**
- Queue multiple dice expressions
- Roll history log
- Draggable window

---

#### rollDice (dice/dice.ts)
**Purpose:** Parse and evaluate dice notation  
**Location:** `features/tools/dice/dice.ts`

**Signature:**
```typescript
rollDice(expression: string): { total: number; details: string }
```

**Examples:**
- `"3d6"` → `{ total: 12, details: "[4, 3, 5]" }`
- `"2d8+5"` → `{ total: 16, details: "[6, 5, 5]" }`

---

#### openEncounterCalculator (encounters/encounterCalc.ts)
**Purpose:** Battle point calculator for encounter balancing  
**Location:** `features/tools/encounters/encounterCalc.ts`

**Features:**
- Base BP calculation from PC count
- Adjustment tracking (difficulty modifiers)
- Adversary cost spending
- Remaining BP display

---

### Data Management (`/features/data-management`)

#### ImportDataModal (ImportDataModal.ts)
**Purpose:** Import adversaries and environments from JSON  
**Location:** `features/data-management/ImportDataModal.ts`

**Expected Format:**
```json
{
  "version": "2.0",
  "adversaries": [...],
  "environments": [...]
}
```

**Features:**
- File validation
- Merge with existing data
- Auto-refresh browsers

---

#### DeleteConfirmModal (DeleteConfirmModal.ts)
**Purpose:** Confirm before deleting data file  
**Location:** `features/data-management/DeleteConfirmModal.ts`

**Constructor:**
```typescript
new DeleteConfirmModal(
  app: App,
  plugin: DaggerForgePlugin,
  onConfirm: () => Promise<void>
)
```

---

## Data Layer (`/data`)

### DataManager (DataManager.ts)
**Purpose:** Persistence service for user data  
**Location:** `data/DataManager.ts`

**Storage Location:** `.obsidian/plugins/daggerforge/data.json`

**Methods:**

#### Adversaries
- `addAdversary(adversary: AdvData): Promise<void>` - Add/update adversary
- `getAdversaries(): AdvData[]` - Get all adversaries
- `deleteAdversaryById(id: string): Promise<void>` - Delete by ID

#### Environments
- `addEnvironment(env: EnvironmentData): Promise<void>` - Add/update environment
- `getEnvironments(): EnvironmentData[]` - Get all environments
- `deleteEnvironmentById(id: string): Promise<void>` - Delete by ID

#### Data Management
- `load(): Promise<void>` - Load data from disk
- `importData(jsonString: string): Promise<void>` - Import from JSON
- `deleteDataFile(): Promise<void>` - Clear all data

**Auto-ID Assignment:**
- Adversaries: `CUA_timestamp_random` format
- Environments: `CUE_timestamp_random` format

---

## Utilities (`/utils`)

### Canvas Helpers (canvasHelpers.ts)

#### isCanvasActive
```typescript
isCanvasActive(app: App): boolean
```
Returns true if active view is a canvas.

#### isMarkdownActive
```typescript
isMarkdownActive(app: App): boolean
```
Returns true if active view is a markdown note.

#### getActiveCanvas
```typescript
getActiveCanvas(app: App): any | null
```
Returns the active canvas object with viewport, or null.

#### createCanvasCard
```typescript
createCanvasCard(
  app: App,
  htmlContent: string,
  options?: { width?, height?, x?, y? }
): boolean
```
Creates a text node on the canvas.

#### getAvailableCanvasPosition
```typescript
getAvailableCanvasPosition(app: App): { x: number; y: number }
```
Returns position for next card (center of viewport + offset).

---

### Form Helpers (formHelpers.ts)

#### createField
```typescript
createField(
  container: HTMLElement,
  inputs: FormInputs,
  label: string,
  key: string,
  type: "input" | "textarea",
  customClass?: string,
  savedValues?: Record<string, unknown>
): void
```

#### createInlineField
```typescript
createInlineField(
  container: HTMLElement,
  inputs: FormInputs,
  config: {
    label: string;
    key: string;
    type: "input" | "select";
    options?: string[];
    savedValues?: Record<string, unknown>;
    customClass?: string;
  }
): void
```

#### createShortTripleFields
```typescript
createShortTripleFields(
  container: HTMLElement,
  inputs: FormInputs,
  label1: string,
  key1: string,
  label2: string,
  key2: string,
  label3: string,
  key3: string,
  selectKey?: string,
  selectOptions?: string[],
  savedValues?: Record<string, unknown>
): void
```

---

### Search Engine (searchEngine.ts)

#### SearchEngine<T>
**Purpose:** Generic search and filter engine

**Methods:**
```typescript
setItems(items: T[]): void
setFilters(filters: Partial<SearchFilters>): void
getFilters(): SearchFilters
search(): T[]
getAvailableOptions(field: string): string[]
```

**Filters:**
- `query` - Text search
- `tier` - Filter by tier
- `source` - Filter by source
- `type` - Filter by type

---

### ID Generator (idGenerator.ts)

#### generateAdvUniqueId
```typescript
generateAdvUniqueId(): string
```
Returns ID like `CUA_1234567890_abc123def`

#### generateEnvUniqueId
```typescript
generateEnvUniqueId(): string
```
Returns ID like `CUE_1234567890_xyz789abc`

**Format:** `PREFIX_timestamp_random8chars`

---

### Plugin Operations (pluginOperations.ts)

#### openCreator
```typescript
openCreator(
  plugin: DaggerForgePlugin,
  type: "adversary" | "environment"
): void
```
Opens creator modal, handles canvas vs markdown context.

#### confirmDeleteDataFile
```typescript
confirmDeleteDataFile(plugin: DaggerForgePlugin): void
```
Shows confirmation modal before deleting data.json.

#### refreshBrowsers
```typescript
refreshBrowsers(plugin: DaggerForgePlugin): void
```
Refreshes all open adversary and environment browser views.

---

## Type Definitions (`/types`)

### AdvData (adversary.ts)
```typescript
interface AdvData {
  id: string;
  name: string;
  tier: string;
  type: string;
  desc: string;
  motives: string;
  difficulty: string;
  thresholdMajor: string;
  thresholdSevere: string;
  hp: string;
  stress: string;
  atk: string;
  weaponName: string;
  weaponRange: string;
  weaponDamage: string;
  xp: string;
  source: string;
  features: Array<{
    name: string;
    type: string;
    cost: string;
    desc: string;
  }>;
}
```

### EnvironmentData (environment.ts)
```typescript
interface EnvironmentData {
  id: string;
  name: string;
  tier: string;
  type: string;
  desc: string;
  impulse: string;
  difficulty: string;
  potentialAdversaries: string;
  source: string;
  features: Array<{
    name: string;
    type: string;
    cost?: string;
    text: string;
    bullets?: string[];
    textAfter?: string;
    questions?: string[];
  }>;
}
```

---

## Constants

### View Types
```typescript
ADVERSARY_VIEW_TYPE = "adversary-view"
ENVIRONMENT_VIEW_TYPE = "environment-view"
```

### Sources
- `"core"` - Built-in content
- `"sablewood"` - Sablewood expansion
- `"umbra"` - Umbra expansion
- `"void"` - Void expansion
- `"custom"` - User-created

---

## Usage Examples

### Create Adversary Programmatically
```typescript
const adversary: AdvData = {
  id: generateAdvUniqueId(),
  name: "Goblin Scout",
  tier: "1",
  type: "Minion",
  // ... other fields
  features: [
    { name: "Quick", type: "Passive", cost: "", desc: "..." }
  ]
};
await plugin.dataManager.addAdversary(adversary);
```

### Search Environments
```typescript
const searchEngine = new SearchEngine<EnvironmentData>();
searchEngine.setItems(environments);
searchEngine.setFilters({ tier: "2", type: "Traversal" });
const results = searchEngine.search();
```

### Insert Card to Canvas
```typescript
const html = buildCardHTML(values, features);
const pos = getAvailableCanvasPosition(app);
createCanvasCard(app, html, { x: pos.x, y: pos.y });
```
