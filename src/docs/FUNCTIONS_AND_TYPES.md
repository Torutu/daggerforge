# DaggerForge - Functions and Types Documentation

## Table of Contents
1. [Core Plugin Architecture](#core-plugin-architecture)
2. [Type Definitions](#type-definitions)
3. [Data Management](#data-management)
4. [Adversary Features](#adversary-features)
5. [Environment Features](#environment-features)
6. [UI Components](#ui-components)
7. [Utilities](#utilities)

---

## Core Plugin Architecture

### `main.ts` - DaggerForgePlugin

**Class: DaggerForgePlugin**
- Main plugin class that extends Obsidian's Plugin interface
- Manages core plugin lifecycle and event handling
- Coordinates between different features and views

#### Key Methods:

**`onload(): Promise<void>`**
- Initializes the plugin when Obsidian loads
- Registers adversary and environment views
- Sets up ribbon icons and menu
- Registers slash commands for tier-specific adversary loading
- Creates UI for adversary/environment creators

**`openCreator(type: "adversary" | "environment"): Promise<void>`**
- Opens the appropriate creator modal based on type
- Validates that user is in edit mode before opening
- Handles both adversary and environment creation flows

**`loadContentToMarkdown(contentType: string): Promise<void>`**
- Loads predefined content blocks into the active markdown note
- Currently supports tier-based adversary content

**`getAdversaryTierContent(tier: string): Promise<string>`**
- Retrieves markdown content for a specific adversary tier
- Returns formatted markdown string

**`insertEnvironment(editor: Editor, result: any): void`**
- Inserts converted environment HTML into the editor
- Takes environment data and converts it to HTML format

**`handleCardEditClick(evt: MouseEvent): void`**
- Event handler for edit button clicks on adversary cards
- Extracts card data and opens the editor modal
- Handles card replacement with updated data

#### Properties:

- `savedInputStateAdv: Record<string, any>` - Stores user input state for adversary creator
- `savedInputStateEnv: Record<string, any>` - Stores user input state for environment creator
- `isEditListenerAdded: boolean` - Tracks if edit event listener is registered

---

## Type Definitions

### `types/shared.ts`

**Type: FormInputs**
```typescript
Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
```
- Maps form field keys to their HTML elements
- Used throughout the application for form management

**Type: Feature**
```typescript
{
  name: string;      // Feature name (e.g., "Ambush")
  type: string;      // Action | Reaction | Passive
  cost: string;      // Cost to activate (e.g., "Mark a Stress")
  desc: string;      // Feature description text
}
```
- Represents a single feature on an adversary or environment card

---

### `types/adversary.ts`

**Type: CardData**
- Complete data structure for adversary cards
- Contains all fields needed to render and manage an adversary

```typescript
{
  name: string;              // Adversary name
  tier: string;              // 1-4 tier level
  type: string;              // Adversary type (Bruiser, Leader, etc.)
  desc: string;              // Short description
  motives: string;           // Motives and tactics
  difficulty: string;        // Difficulty rating
  thresholdMajor: string;    // Major threshold value
  thresholdSevere: string;   // Severe threshold value
  hp: string;                // Hit points count
  stress: string;            // Stress points count
  atk: string;               // Attack modifier
  weaponName: string;        // Weapon name
  weaponRange: string;       // Melee | Very Close | Close | Far | Very Far
  weaponDamage: string;      // Damage dice or value
  xp: string;                // Experience points
  count?: string;            // Number of this adversary type
  features: Feature[];       // Array of features
}
```

**Type: FeatureElements**
- References to DOM elements for a single feature input
```typescript
{
  nameEl: HTMLInputElement;
  typeEl: HTMLSelectElement;
  costEl: HTMLSelectElement;
  descEl: HTMLTextAreaElement;
}
```

**Type: SavedFeatureState**
- Serializable state of a feature for persistence
```typescript
{
  featureName: string;
  featureType: string;
  featureCost: string;
  featureDesc: string;
}
```

---

### `types/environment.ts`

**Type: EnvironmentData**
- Complete data structure for environment cards

```typescript
{
  name: string;              // Environment name
  tier: number;              // 1-4 tier level
  type: string;              // Event | Exploration | Social | Traversal
  desc: string;              // Environment description
  impulse: string;           // Environmental impulses
  difficulty: string;        // Difficulty rating
  potentialAdversaries: string; // Suggested adversaries
  source: string;            // core | custom | umbra
  features: EnvironmentFeature[];
}
```

**Type: EnvironmentFeature**
- Feature within an environment card

```typescript
{
  name: string;
  type: string;              // Action | Reaction | Passive
  text: string;              // Main feature text
  cost?: string;             // Optional cost
  bullets: string[];         // Bullet points
  questions: string[];       // GM prompt questions
}
```

**Type: FeatureElements (Environment)**
- DOM element references for environment features
```typescript
{
  nameEl: HTMLInputElement;
  typeEl: HTMLSelectElement;
  costEl?: HTMLSelectElement;
  textEl: HTMLTextAreaElement;
  bulletEls: HTMLTextAreaElement[];
  questionEls: HTMLTextAreaElement[];
}
```

**Type: SavedFeatureState (Environment)**
- Serializable environment feature state
```typescript
{
  name: string;
  type: string;
  cost?: string;
  text: string;
  bullets: string[];
  questions: string[];
}
```

---

## Data Management

### `data/adversaries.ts`

**Constant: ADVERSARIES**
- Object containing adversary data for all tiers
```typescript
{
  tier1: AdversaryData[],
  tier2: AdversaryData[],
  tier3: AdversaryData[],
  tier4: AdversaryData[]
}
```
- Loads JSON data from adversary tier files

**Function: loadAdversaryTier(tier: string, editor: Editor): Promise<void>`**
- Loads all adversaries from a specific tier into the editor
- Converts JSON data to HTML cards
- Shows notification with count of loaded adversaries

**Type: AdversaryData**
- Inferred type from imported JSON files
- Represents a single adversary entry with all properties

---

### `data/environments.ts`

**Constant: ENVIRONMENTS**
- Object containing environment data for all tiers
```typescript
{
  tier1: EnvironmentData[],
  tier2: EnvironmentData[],
  tier3: EnvironmentData[],
  tier4: EnvironmentData[]
}
```

**Type: EnvironmentData (in environments.ts)**
- Inferred from imported JSON files
- Represents a single environment entry

---

## Adversary Features

### `features/adversaries/index.ts`
- Main export file for all adversary-related components and functions
- Re-exports from: AdvList, AdvSearch, AdvCounter, CardBuilder, FeatureManager, TextInputModal, AdvEditor, AdvEditorModal, CardDataHelpers

---

### `features/adversaries/components/AdvCounter.ts`

**Function: incrementAdversaryCount(amount?: number = 1): void**
- Increases the adversary count by specified amount
- Used when user wants multiple copies of same adversary

**Function: decrementAdversaryCount(amount?: number = 1): void**
- Decreases adversary count by specified amount
- Prevents count from going below 1

**Function: getAdversaryCount(): number**
- Returns current adversary count
- Default value is 1

**Function: resetAdversaryCount(): void**
- Resets count to 0
- Called when clearing form

---

### `features/adversaries/components/AdvList.ts`

**Function: loadAdversaryTier(tier: string, editor: Editor): Promise<void>`**
- Loads all adversaries from a specific tier
- Converts each adversary to HTML card format
- Inserts HTML into editor
- Shows success notification with count

**Function: buildCardHTML(values: Record<string, string>, features: Feature[]): string**
- Generates HTML for a single adversary card
- Creates tickboxes for HP and Stress
- Formats features section
- Returns complete card HTML string

---

### `features/adversaries/components/AdvSearch.ts`

**Constant: ADVERSARY_VIEW_TYPE**
- String identifier: "adversary-view"
- Used to register and access the adversary sidebar view

**Class: AdversaryView extends ItemView**
- Sidebar view for browsing and inserting adversaries
- Manages search, filtering, and display of adversary cards

#### Methods:

**`getViewType(): string`**
- Returns "adversary-view"

**`getDisplayText(): string`**
- Returns "Adversary Browser"

**`getIcon(): string`**
- Returns "venetian-mask" for the sidebar icon

**`onOpen(): Promise<void>`**
- Initializes the view when opened
- Sets up search, tier filter, counter controls
- Loads adversary data from JSON and custom files

**`refresh(): Promise<void>`**
- Refreshes the view by reloading all data
- Called after custom adversary is created

**`loadAdversaryData(): Promise<void>`**
- Loads built-in adversaries from JSON
- Loads custom adversaries from custom@Adversaries.md file
- Combines and displays all adversaries
- Handles tier conversion (string to number)

**`loadCustomAdversaries(): Promise<Adversary[]>`**
- Reads custom@Adversaries.md file
- Parses JSON blocks from markdown
- Returns array of custom adversary objects
- Marks each as custom source

**`renderResults(adversaries: Adversary[]): void`**
- Clears and renders filtered adversary list
- Creates clickable cards for each adversary

**`createCounterControls(container: HTMLElement): HTMLElement`**
- Creates +/- buttons for adversary count
- Updates display as count changes

**`createSearchInput(container: HTMLElement): HTMLInputElement`**
- Creates search box for filtering adversaries
- Filters by name, type, and source in real-time

**`createTierDropdown(container: HTMLElement): HTMLSelectElement`**
- Creates dropdown to filter by tier (1-4) or "All"
- Updates results on selection change

**`createAdversaryCard(adversary: Adversary): HTMLElement`**
- Creates a clickable card element for an adversary
- Displays tier, type, name, description
- Adds source badge (Core, Custom, Umbra)

**`insertAdversaryIntoNote(adversary: Adversary): void`**
- Inserts selected adversary into active markdown note
- Generates markdown/HTML for the adversary card
- Uses adversary count for multiple copies

**`generateAdversaryMarkdown(adversary: Adversary): string`**
- Converts adversary data to HTML card format
- Creates multiple tickbox sets if count > 1
- Formats all adversary stats and features

**`generateFeaturesHTML(features: AdversaryFeature[]): string`**
- Converts feature array to formatted HTML
- Creates div for each feature with name, type, cost, description

**`generateMultipleTickboxes(adversary: Adversary, count: number): string`**
- Generates multiple HP/Stress tickbox sets
- One set per adversary copy
- Numbers each set

**`generateTickboxes(count: string, prefix: string): string`**
- Creates individual checkbox inputs
- Returns HTML string of checkboxes

**Interface: Adversary**
- Represents a single adversary with all properties
- Includes optional source and isCustom fields
- Extends from JSON data structure

**Interface: AdversaryFeature**
- Single feature on an adversary
- Contains name, type, cost, and description

---

### `features/adversaries/creator/CardBuilder.ts`

**Function: buildCardHTML(values: Record<string, string>, features: Feature[]): string**
- Creates complete HTML for an adversary card
- Accepts form values and features array
- Generates HP and Stress tickboxes (including multiple copies)
- Formats all stats and feature sections
- Returns ready-to-insert HTML string

---

### `features/adversaries/creator/FeatureManager.ts`

**Function: addFeature(featureContainer: HTMLElement, features: FeatureElements[], setValueIfSaved, savedFeature?): void**
- Adds a new feature input row to the form
- Creates name, type, cost, and description fields
- Adds remove button
- Registers feature in features array
- Optionally pre-fills from saved state

**Function: getFeatureValues(features: FeatureElements[]): Feature[]**
- Collects values from all feature input elements
- Returns array of Feature objects with trimmed values
- Filters out empty features

---

### `features/adversaries/creator/TextInputModal.ts`

**Function: buildCustomAdversary(app: any, values: any, features: any[]): Promise<Adversary | null>`**
- Saves a custom adversary to custom@Adversaries.md file
- Creates file if it doesn't exist
- Appends adversary as JSON block with header
- Shows notification on success or error
- Returns the created adversary object

**Class: TextInputModal extends Modal**
- Modal for creating or editing adversaries

#### Properties:

- `inputs: FormInputs` - Map of form field references
- `insertBtn: HTMLButtonElement` - Button to insert/update card
- `addFeatureBtn: HTMLButtonElement` - Button to add new feature
- `featureContainer: HTMLElement` - Container for feature inputs
- `cardElement?: HTMLElement` - Reference to card being edited (if edit mode)
- `features: FeatureElements[]` - Array of feature input references
- `plugin: DaggerForgePlugin` - Plugin reference
- `savedInputStateAdv: Record<string, any>` - Form state persistence
- `editor: Editor` - Obsidian editor reference
- `isEditMode: boolean` - Whether modal is in edit vs create mode

#### Methods:

**`onOpen(): void`**
- Initializes the modal with all form fields
- Populates fields from saved state if available
- Sets up feature management UI
- Attaches event handlers to buttons

**`insertBtn.onclick: () => void`**
- Collects all form values
- Gets feature values
- Saves custom adversary to file
- Generates card HTML
- Inserts or updates card in editor
- Refreshes AdversaryView
- Clears form and closes modal

**`onClose(): void`**
- Saves form state to plugin for persistence
- Stores feature data in structured format

---

### `features/adversaries/editor/AdvEditor.ts`
- Currently commented out
- Was intended for adversary editing functionality
- Now replaced by AdvEditorModal

---

### `features/adversaries/editor/AdvEditorModal.ts`

**Class: AdversaryEditorModal extends Modal**
- Modal for editing existing adversary cards

#### Properties:

- `inputs: FormInputs` - Form field references
- `cardElement: HTMLElement` - Card being edited
- `cardData: Record<string, any>` - Extracted card data
- `features: FeatureElements[]` - Feature input references
- `editor: Editor` - Obsidian editor

#### Methods:

**`onOpen(): void`**
- Creates form with all fields pre-filled from cardData
- Sets up feature editing UI
- Pre-fills all features from existing card

**`insertBtn.onclick: () => void`**
- Collects updated form values
- Gets updated features
- Generates new card HTML
- Calls onSubmit callback with new HTML

**`onClose(): void`**
- Clears content element

---

### `features/adversaries/editor/CardDataHelpers.ts`

**Function: extractCardData(cardElement: HTMLElement): CardData**
- Extracts all data from a rendered adversary card element
- Parses HTML to recover original values
- Uses regex patterns to match specific fields
- Counts adversary instances from tickbox containers
- Extracts features from card DOM

#### Logic:

- Extracts name from `<h2>` tag
- Gets tier from subtitle regex pattern
- Extracts type from data attribute or subtitle
- Gets description from `.df-desc` class
- Retrieves motives from `.df-motives-desc` class
- Parses stats section for all numeric/text values
- Extracts weapon information from multiple sources
- Gets feature data from `.df-feature` elements
- Calculates count from number of HP tickbox containers

---

## Environment Features

### `features/environments/index.ts`
- Main export file for environment components
- Re-exports: EnvSearch, EnvToHTML, EnvModal

---

### `features/environments/components/EnvSearch.ts`

**Function: buildCustomEnvironment(app: any, values: any, features: any[]): Promise<EnvironmentData | null>`**
- Saves custom environment to custom@Environments.md file
- Creates file if it doesn't exist
- Appends environment as JSON block
- Shows success/error notification
- Returns created environment object

**Constant: ENVIRONMENT_VIEW_TYPE**
- String identifier: "environment-view"
- Used for registering environment sidebar view

**Class: EnvironmentView extends ItemView**
- Sidebar view for browsing environments

#### Properties:

- `environments: any[]` - Loaded environments
- `lastActiveMarkdown: MarkdownView | null` - Track active note
- `resultsDiv: HTMLElement | null` - Results display area
- `searchInput: HTMLInputElement | null` - Search box reference

#### Methods:

**`getViewType(): string`**
- Returns "environment-view"

**`getDisplayText(): string`**
- Returns "Environment Browser"

**`getIcon(): string`**
- Returns "mountain" icon

**`onOpen(): Promise<void>`**
- Sets up search input and results display
- Creates tier filter buttons
- Loads environment data

**`refresh(): Promise<void>`**
- Reloads all environment data
- Re-renders results

**`loadEnvironmentData(): Promise<void>`**
- Loads built-in environments from JSON tiers
- Loads custom environments from file
- Combines all environments
- Filters based on search input if present
- Re-renders results

**`loadCustomEnvironments(): Promise<EnvironmentData[]>`**
- Reads custom@Environments.md file
- Parses JSON blocks
- Returns array of custom environments

**`createTierButtons(container: HTMLElement, input: HTMLInputElement): void`**
- Creates clickable tier filter buttons (ALL, 1, 2, 3, 4)
- Filters results on click

**`setupSearchInput(input: HTMLInputElement): void`**
- Attaches search event listener
- Filters by name, type, or source

**`renderResults(filtered: any[]): void`**
- Clears and displays environment cards
- Shows "no results" message if empty

**`createEnvironmentCard(env: any): HTMLElement`**
- Creates clickable card for an environment
- Displays tier, type, name, description
- Adds source badge
- Handles click to insert environment

---

### `features/environments/components/EnvToHTML.ts`

**Function: environmentToHTML(env: EnvironmentData): string**
- Converts environment data object to HTML
- Formats features with bullets and questions
- Generates complete card HTML
- Returns string ready for insertion into markdown

#### Structure:

- Outer wrapper with df-env-card-outer class
- Name as large heading
- Tier and type subtitle
- Description paragraph
- Impulse section
- Difficulty and Potential Adversaries in special container
- Features section with formatted feature entries

---

### `features/environments/creator/EnvModal.ts`

**Class: EnvironmentModal extends Modal**
- Modal for creating environments

#### Properties:

- `plugin: DaggerForgePlugin` - Plugin reference
- `editor: Editor` - Obsidian editor
- `inputs: FormInputs` - Form field references
- `features: FeatureElements[]` - Feature input references
- `featureContainer: HTMLElement` - Features wrapper
- `onSubmit: (result: EnvironmentData) => void` - Callback on submit

#### Methods:

**`onOpen(): void`**
- Creates form with environment fields
- Sets up name, tier, type, description inputs
- Creates impulse, difficulty, potential adversaries fields
- Initializes feature management
- Loads saved state if available

**`addFeature(savedFeature?: SavedFeatureState): void`**
- Adds feature input row to form
- Creates name, type, cost, description fields
- Adds single question textarea
- Includes remove button

**`getFeatureValues(): EnvironmentData["features"]`**
- Collects all feature inputs
- Returns array of EnvironmentFeature objects
- Filters out empty entries

**`insertBtn.onclick: () => void`**
- Collects all form values
- Saves environment to custom file
- Converts to HTML
- Inserts into editor
- Resets form
- Refreshes EnvironmentView if open

**`onClose(): void`**
- Saves form state to plugin for persistence

---

## UI Components

### `ui/Sidebar.ts`

**Function: adversariesSidebar(plugin: ObsidianPlugin): Promise<void>`**
- Opens adversary browser in right sidebar
- Creates leaf with ADVERSARY_VIEW_TYPE
- Expands right split panel
- Shows notification to user

**Function: openEnvironmentSidebar(plugin: ObsidianPlugin): Promise<void>`**
- Opens environment browser in right sidebar
- Creates leaf with ENVIRONMENT_VIEW_TYPE
- Expands right split panel
- Shows notification to user

---

## Utilities

### `utils/adversaryCounter.ts`

**Variable: adversaryCount**
- Module-level variable tracking current count
- Starts at 1

**Function: getAdversaryCount(): number**
- Returns current count value
- Used for generating multiple adversary copies

**Function: incrementAdversaryCount(): void**
- Increases count by 1

**Function: decrementAdversaryCount(): void**
- Decreases count by 1
- Never goes below 1

**Function: setAdversaryCount(count: number): void**
- Sets count to specific value
- Only accepts positive numbers

**Function: resetAdversaryCount(): void**
- Resets count to 1

---

### `utils/formHelpers.ts`

**Function: createField(parent, inputs, label, key, type?, customClass?, savedValues?): HTMLElement**
- Creates single input or textarea field
- Adds label
- Registers in inputs map
- Pre-fills from saved values if available
- Returns created element

**Parameters:**

- `parent: HTMLElement` - Container for field
- `inputs: FormInputs` - Field map reference
- `label: string` - Field label text
- `key: string` - Field key in inputs map
- `type: "input" | "textarea"` - HTML element type
- `customClass?: string` - Optional CSS class
- `savedValues?: Record<string, string>` - Previous values to restore

**Function: createShortTripleFields(parent, inputs, label1, key1, label2, key2, label3, key3, dropdownFieldKey?, dropdownOptions?, savedValues?): void**
- Creates three inline fields in a row
- One can be a dropdown
- Used for grouped related fields (e.g., HP, Stress, ATK)

**Parameters:**

- `parent: HTMLElement` - Container
- `inputs: FormInputs` - Field map
- `label1-3: string` - Field labels
- `key1-3: string` - Field keys
- `dropdownFieldKey?: string` - Which field should be dropdown
- `dropdownOptions?: string[]` - Options for dropdown
- `savedValues?: Record<string, string>` - Previous values

**Function: createInlineField(parent, inputs, config): HTMLElement**
- Creates a single field with label
- Supports input or select (dropdown)
- More flexible than createField

**Parameters:**

- `parent: HTMLElement` - Container
- `inputs: FormInputs` - Field map
- `config` - Configuration object:
  - `label: string` - Field label
  - `key: string` - Field key
  - `type?: "input" | "select"` - Field type
  - `options?: string[]` - Dropdown options
  - `savedValues?: Record<string, string>` - Previous values
  - `customClass?: string` - CSS class

**Returns:** HTMLElement (either input or select)

---

## Data Flow Summary

### Creating an Adversary:
1. User clicks "Adversary Creator" menu item
2. `TextInputModal` opens with form
3. User fills fields and adds features
4. On submit: values collected → custom adversary saved to file → card HTML generated → inserted into editor → form reset → AdversaryView refreshed

### Editing an Adversary:
1. User clicks edit button on card
2. Card data extracted via `extractCardData()`
3. `AdversaryEditorModal` opens with data pre-filled
4. User modifies fields
5. On submit: new HTML generated → original card replaced → editor updated

### Inserting from Browser:
1. User opens Adversary/Environment Browser from menu
2. Browser view loads and displays cards
3. User searches/filters results
4. Clicks on card → converted to HTML → inserted into active editor
5. Browser view refreshes to show custom additions

---

## CSS Class Reference

### Adversary Classes:
- `df-card-outer` - Outer card container
- `df-card-inner` - Inner content area
- `df-hp-tickboxes` - HP tickbox container
- `df-stress-tickboxes` - Stress tickbox container
- `df-feature` - Individual feature
- `df-pseudo-cut-corners` - Cut corner effect
- `df-source-core` / `df-source-custom` / `df-source-umbra` - Source indicators
- `df-edit-button` - Edit button
- `df-adversary-card` - Sidebar card

### Environment Classes:
- `df-env-card-outer` - Outer container
- `df-env-card-inner` - Inner content
- `df-env-name` - Environment name heading
- `df-env-feature` - Feature section
- `df-env-bullet` - Bullet point
- `df-env-questions` - GM questions

### Form Classes:
- `df-form-row` - Horizontal field row
- `df-inline-field` - Inline field wrapper
- `df-input-field` - Input element
- `df-feature-container` - Features wrapper
- `df-feature-block` - Individual feature block
