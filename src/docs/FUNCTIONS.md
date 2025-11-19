# Functions & Features

## State Management

**State Isolation** - Edit mode and create mode maintain separate state objects. When exiting edit mode (with or without save), `plugin.savedInputStateEnv` is completely cleared to prevent contamination. When exiting create mode without saving, state is also cleared.

**Modal State Detection** - EnvironmentModal automatically detects edit vs create mode by checking if `savedInputStateEnv` contains environment-specific fields (impulse, potentialAdversaries). Edit mode loads into isolated `editModeState`, create mode uses plugin's saved state.

## Feature Management

**Feature Components** - Features include name, type (Action/Reaction/Passive), optional cost, description, bullet points, continuation text, and GM prompt questions. Dynamic add/remove for all sub-components.

**getFeatureValues()** - Collects feature data from UI elements and returns array of feature objects with text normalized and empty values filtered.

## Card Data Flow

**Create Flow** - User opens creator → enters all fields → submits → system saves to persistent storage and inserts rendered HTML to markdown/canvas → state preserved for next create.

**Edit Flow** - User clicks edit button → system extracts card data from rendered HTML → modal opens in edit mode with prefilled data → user modifies → system updates both markdown and persistent storage → state completely cleared on close.

**Search & Browse** - Both adversary and environment browsers load data from persistent storage, merge with built-in data, and allow instant insert without modal.

## Type System

**EnvironmentData** - name, tier (1-4), type (Event/Exploration/Social/Traversal), desc, impulse, difficulty, potentialAdversaries, source, features array.

**SavedFeatureState** - name, type, cost (optional), text, bullets (array), textAfter (optional), questions (array).

**FormInputs** - Dictionary of form field references: HTMLInputElement, HTMLTextAreaElement, HTMLSelectElement keyed by field name.

## Utility Functions

**extractCardData()** - Parses rendered adversary card HTML and returns structured data object for editing.

**environmentToHTML()** - Transforms environment data into formatted HTML with sections for features, impulses, difficulty, and adversaries.

**isMarkdownActive()** / **isCanvasActive()** - View type detection for routing output (markdown vs canvas).

**createCanvasCard()** - Inserts HTML as canvas node with position, width, height parameters.
