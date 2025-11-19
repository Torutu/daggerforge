# DaggerForge API Reference

## Features

### Adversaries
- **AdvSearch** - Renders the adversary browser view with search/filter capabilities
- **AdvList** - Displays a paginated list of adversaries
- **AdvCounter** - Counter component for tracking adversary statistics
- **CardBuilder** - Generates HTML markup for adversary cards
- **FeatureManager** - Manages adversary feature creation and modification
- **TextInputModal** - Modal dialog for creating/editing adversary cards
- **AdvEditor** - Core editor for adversary card data
- **AdvEditorModal** - Modal wrapper for the adversary editor
- **CardDataHelpers** - Utility functions for extracting and processing adversary card data

### Environments
- **EnvSearch** - Renders the environment browser view with search/filter capabilities
- **EnvToHTML** - Converts environment data objects to HTML markup
- **EnvModal** - Modal dialog for creating/editing environment cards

### Encounters
- **encounterCalc** - Battle calculator for encounter difficulty and resource management

### Dice
- **dice** - Core dice rolling logic and probability calculations
- **diceRoller** - Modal interface for the dice rolling tool

### Card Editor
- **cardEditor** - Handles inline editing of adversary and environment cards in markdown

## Services

### DataManager
- `load()` - Loads data from vault storage
- `addAdversary(data)` - Saves a new/updated adversary
- `addEnvironment(data)` - Saves a new/updated environment
- `deleteDataFile()` - Removes all stored data
- `getAdversaries()` - Retrieves all stored adversaries
- `getEnvironments()` - Retrieves all stored environments

## UI Components

### Sidebar
- **adversariesSidebar** - Opens the adversary browser sidebar
- **openEnvironmentSidebar** - Opens the environment browser sidebar

### Modals
- **DeleteConfirmModal** - Confirmation dialog for destructive actions
- **ImportDataModal** - Modal for importing JSON data files

## Types

### Adversary
- `name` - Adversary name
- `tier` - Challenge tier (1-5)
- `type` - Adversary category
- `powers` - Array of powers/abilities
- `source` - Data origin (builtin/custom)

### Environment
- `name` - Environment name
- `tier` - Challenge tier (1-5)
- `type` - Environment type
- `desc` - Short description
- `impulse` - GM impulse/objective
- `difficulty` - Challenge difficulty
- `potentialAdversaries` - Comma-separated list
- `features` - Array of environment features

### Shared
- `CardData` - Common card interface

## Utilities

- **dataFilters** - Search and filtering functions
- **formHelpers** - Form validation and input processing
- **adversaryCounter** - Adversary counting and grouping logic
- **canvasHelpers** - Canvas rendering utilities
