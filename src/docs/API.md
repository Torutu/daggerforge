# API Reference

## Core Components

**EnvironmentModal** - Modal for creating and editing environment cards. Handles form inputs for name, tier, type, description, impulses, difficulty, and features with full state isolation between create/edit modes.

**EnvSearch** - Environment browser with search and tier filtering. Displays built-in and custom environments with source badges and delete capability for custom entries.

**EnvToHTML** - Converts environment data objects to rendered HTML cards compatible with both markdown and canvas views.

**TextInputModal** - Modal for adversary card creation and editing with support for stats, weapons, HP/stress boxes, powers, and armor values.

**AdversaryView** - Adversary browser with search, filtering, and management of adversaries by tier or type. Handles custom adversary deletion and refresh.

**DataManager** - Service layer for persistent storage. Methods: `addAdversary()`, `addEnvironment()`, `getAdversaries()`, `getEnvironments()`, `deleteAdversary()`, `deleteEnvironment()`, `deleteDataFile()`.

## Form Utilities

**createInlineField** - Creates labeled form fields for single-row layouts with optional dropdown options and preset values from saved state.

**createShortTripleFields** - Creates three compact fields in a single row for tier, type, and similar grouped inputs.

**createField** - Generates textarea or input fields with labels, placeholders, and automatic value population from saved data.

## Canvas & Markdown Helpers

**isCanvasActive** - Detects if current view is an Obsidian canvas.

**isMarkdownActive** - Detects if current view is a markdown editor in edit mode.

**createCanvasCard** - Inserts HTML content as a new canvas node at specified position and dimensions.

**getAvailableCanvasPosition** - Calculates optimal coordinates for placing new canvas cards without overlap.

## Dice & Encounters

**openDiceRoller** - Modal interface for rolling dice in formats like "3d6", "2d8+5" with results display.

**openEncounterCalculator** - Battle calculator estimating encounter difficulty based on adversary count, tier, and player group size.

## Editor

**onEditClick** - Routes edit operations for adversaries and environments. Extracts card data from markdown, opens appropriate modal, handles updates.

**handleCardEditClick** - Entry point for edit button clicks on rendered cards. Validates editor state and delegates to onEditClick.
