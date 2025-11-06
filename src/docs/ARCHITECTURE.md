# DaggerForge - Architecture Documentation

## Project Purpose

DaggerForge is an Obsidian plugin for TTRPGs that manages adversary and environment cards through creation, browsing, editing, and insertion into markdown notes.

## File Organization

```
src/
├── main.ts
├── docs/ [NEW]
│   └── FUNCTIONS_AND_TYPES.md
├── types/
│   ├── shared.ts
│   ├── adversary.ts
│   └── environment.ts
├── data/
│   ├── adversaries.ts
│   └── environments.ts
├── features/
│   ├── adversaries/
│   │   ├── components/
│   │   ├── creator/
│   │   └── editor/
│   └── environments/
│       ├── components/
│       └── creator/
├── ui/
│   └── Sidebar.ts
└── utils/
    ├── adversaryCounter.ts
    └── formHelpers.ts
```

## Core Patterns

### 1. Modal Pattern
- Extend Obsidian's Modal class
- Initialize form fields in onOpen()
- Collect values on button click
- Save state in onClose()

### 2. Feature Management
- Track features in array
- addFeature() creates new row
- getFeatureValues() collects data
- Dynamic add/remove buttons

### 3. Data Persistence
- In-memory: plugin.savedInputStateAdv/Env
- File-based: JSON blocks in markdown
- Load on view open, save on creation

### 4. Card Extraction
- Query DOM selectors
- Parse with regex for text content
- Extract data attributes
- Return typed objects

## Key Flows

### Create Adversary Flow
User clicks creator → Modal opens with form → Fills fields and features → Submits → Custom file updated → Card HTML generated → Inserted in editor → Browser refreshed

### Edit Card Flow
User clicks edit → CardDataHelpers extracts HTML → Modal opens with data → User modifies → New HTML generated → Card replaced in editor

### Browse & Insert
User opens browser → View loads built-in + custom data → User searches/filters → Clicks card → Converts to HTML → Inserts into note

## Type Hierarchy

CardData / EnvironmentData
├─ Basic info (name, tier, type, desc)
├─ Stats (hp, stress, difficulty, etc.)
└─ features: Feature[]
    ├─ name
    ├─ type (Action|Reaction|Passive)
    ├─ cost (optional)
    └─ desc

FormInputs = Map of input element references
FeatureElements = DOM references for one feature

## Extension Points

### Source Tagging
- core, custom, umbra ready in code
- Add new source: update badges, CSS, load logic

### New Card Types
- Create type file in types/
- Create data file in data/
- Create creator modal
- Create browser view
- Register in main.ts

## Development Notes

- Custom content saved to custom@Adversaries.md and custom@Environments.md
- Form state persists during editing session via plugin.savedInputStateAdv/Env
- Cards extracted via regex parsing of rendered HTML
- Views refresh on custom content creation
- All content tagged with source for filtering

