# API Reference

## Core Components

**EnvironmentModal** - Creates and edits environment cards. Manages form state for name, tier, type, desc, impulse, difficulty, potentialAdversaries, and features with isolated create/edit modes.

**EnvironmentEditorModal** - Edits existing environment cards with full feature population. Loads all feature data including name, type, cost, description, bullets, textAfter, and questions.

**EnvSearch** - Environment browser with search and filtering. Displays core and custom environments with delete capability.

**EnvToHTML** - Converts environment objects to HTML cards for markdown and canvas rendering.

**AdversaryEditorModal** - Edits adversary cards with all stats, weapons, features, and properties pre-populated from existing data.

**AdvEditor** - Handles adversary card editing workflow including data extraction and HTML regeneration.

**TextInputModal** - Creates adversary cards with stats, weapons, features, and damage values.

**DataManager** - Persistence layer. Methods: `changeSetting()`, `addAdversary()`, `addEnvironment()`, `getAdversaries()`, `getEnvironments()`, `deleteAdversary()`, `deleteEnvironment()`.

## Form Utilities

**createInlineField** - Creates labeled form fields for single-row layouts with optional dropdowns and preset values.

**createField** - Generates textarea/input fields with labels and value population.

**createShortTripleFields** - Creates three compact fields in one row.

## Canvas & Markdown

**isCanvasActive**, **isMarkdownActive** - View detection.

**createCanvasCard** - Inserts HTML as new canvas node.

**getAvailableCanvasPosition** - Calculates placement coordinates to avoid overlap.

## Utilities

**openDiceRoller** - Dice rolling modal with notation support.

**openEncounterCalculator** - Battle difficulty calculator.

**onEditClick** - Routes edit operations for both card types.

**onCollapseClick** - Routes card collapse operations for both card types.