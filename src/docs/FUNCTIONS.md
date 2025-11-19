# DaggerForge API Reference

## Adversaries

### TextInputModal

Modal for creating or editing adversary cards. Manages form inputs and feature state. **Issue:** Edit mode shares state with create mode. Edit state should be isolated and cleared on cancel.

### AdvEditorModal

Handles editing existing adversary cards with prefilled data. Loads card data into form fields for updates.

### CardBuilder

Generates HTML for adversary cards from form values and features array. Includes HP/stress tickboxes, stats, weapons, and features.

### AdvEditor

Event listener that triggers edit modal when edit button clicked on card. Extracts card data and opens editor.

### AdvList

Displays list of adversaries with search and filtering capabilities.

### AdvCounter

Tracks and displays count of adversaries by type/tier.

### AdvSearch

Search functionality for finding adversaries by name or properties.

### FeatureManager

Adds/removes feature fields dynamically. `getFeatureValues()` collects feature data from UI elements.

### CardDataHelpers

`extractCardData()` parses card HTML and returns object with all card properties.

## Environments

### EnvModal

Modal for creating/editing environment cards. Builds environment data and generates HTML output.

### EnvSearch

Search and filter environments by name or properties.

### EnvToHTML

Converts environment data object to rendered HTML card markup.

## Card Management

### cardEditor

`onEditClick()` - Routes edit requests by card type (adv/env). Finds card in markdown, opens appropriate modal, handles save/update.

`handleCardEditClick()` - Entry point for edit button clicks. Validates edit mode, delegates to `onEditClick()`.

## Features

### DiceRoller

`diceRoller()` - Rolls dice with format "XdY" and returns total.

### DiceModifier

`dice()` - Manages dice roll calculations.

### EncounterCalc

Calculates encounter difficulty based on adversaries and player count.

## Utils

### formHelpers

`createField()` - Creates labeled input/textarea field with optional saved values.

`createInlineField()` - Creates compact field for single-row layouts.

`createShortTripleFields()` - Creates three inline fields with labels and optional dropdown.

### canvasHelpers

`isCanvasActive()` - Checks if current view is Obsidian canvas.

`isMarkdownActive()` - Checks if current view is markdown editor.

`createCanvasCard()` - Inserts card HTML as new canvas node.

`getAvailableCanvasPosition()` - Calculates position for new canvas cards.

### dataFilters

Filtering logic for adversaries and environments.

### adversaryCounter

Counts adversaries by type/tier for tracking.

## Services

### DataManager

`addAdversary()` - Saves adversary to persistent storage.

`addEnvironment()` - Saves environment to persistent storage.

## Types

### CardData

Adversary card structure with name, tier, type, stats, weapon, features, etc.

### FeatureElements

UI element references for a feature row: nameEl, typeEl, costEl, descEl.

### FormInputs

Dictionary mapping field keys to HTMLInputElement/TextAreaElement/SelectElement references.
