# Functions & Features Documentation

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

## Utilities

**extractCardData()** - Parse rendered card HTML → return structured data for editing.

**environmentToHTML()** - Convert environment object → formatted HTML with features, impulses, difficulty.

**isMarkdownActive() / isCanvasActive()** - Detect current view type for output routing.

**createCanvasCard()** - Insert HTML as canvas node at specified position/dimensions.

**openDiceRoller()** - Modal for dice notation rolls ("3d6", "2d8+5").

**openEncounterCalculator()** - Calculate encounter difficulty from adversary tier and count.
