# DaggerForge - Quick Reference Guide

## Types Quick Lookup

### Shared Types
```typescript
FormInputs = Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
Feature = { name, type, cost, desc }
```

### Adversary Types
```typescript
CardData = {
  name, tier, type, desc, motives,
  difficulty, thresholdMajor, thresholdSevere,
  hp, stress, atk, weaponName, weaponRange, weaponDamage,
  xp, count?, features: Feature[]
}
```

### Environment Types
```typescript
EnvironmentData = {
  name, tier: number, type, desc, impulse,
  difficulty, potentialAdversaries, source,
  features: EnvironmentFeature[]
}

EnvironmentFeature = {
  name, type, text, cost?, bullets[], questions[]
}
```

---

## Functions Quick Lookup

### Adversary Features

| Function | File | Purpose |
|----------|------|---------|
| `buildCardHTML()` | CardBuilder.ts | Generate adversary card HTML |
| `addFeature()` | FeatureManager.ts | Add feature input row to form |
| `getFeatureValues()` | FeatureManager.ts | Extract feature data from inputs |
| `extractCardData()` | CardDataHelpers.ts | Parse adversary data from rendered card |
| `loadAdversaryTier()` | AdvList.ts | Load all adversaries from tier into editor |
| `loadAdversaryData()` | AdvSearch.ts | Load built-in + custom adversaries into view |
| `loadCustomAdversaries()` | AdvSearch.ts | Read and parse custom@Adversaries.md |
| `buildCustomAdversary()` | TextInputModal.ts | Save new adversary to custom file |
| `generateAdversaryMarkdown()` | AdvSearch.ts | Convert adversary to card HTML |

### Environment Features

| Function | File | Purpose |
|----------|------|---------|
| `environmentToHTML()` | EnvToHTML.ts | Convert environment data to HTML |
| `buildCustomEnvironment()` | EnvSearch.ts | Save new environment to custom file |
| `loadEnvironmentData()` | EnvSearch.ts | Load built-in + custom environments |
| `loadCustomEnvironments()` | EnvSearch.ts | Read and parse custom@Environments.md |

### Counter Management

| Function | File | Purpose |
|----------|------|---------|
| `getAdversaryCount()` | adversaryCounter.ts | Get current count value |
| `incrementAdversaryCount()` | adversaryCounter.ts | Add 1 to count |
| `decrementAdversaryCount()` | adversaryCounter.ts | Subtract 1 from count (min 1) |
| `resetAdversaryCount()` | adversaryCounter.ts | Reset to 1 |

### Form Helpers

| Function | File | Purpose |
|----------|------|---------|
| `createField()` | formHelpers.ts | Create single input/textarea field |
| `createInlineField()` | formHelpers.ts | Create labeled input/select field |
| `createShortTripleFields()` | formHelpers.ts | Create 3 inline fields (one can be dropdown) |

### UI Management

| Function | File | Purpose |
|----------|------|---------|
| `adversariesSidebar()` | Sidebar.ts | Open adversary browser in sidebar |
| `openEnvironmentSidebar()` | Sidebar.ts | Open environment browser in sidebar |

---

## Classes Quick Lookup

| Class | File | Purpose |
|-------|------|---------|
| `DaggerForgePlugin` | main.ts | Main plugin class |
| `AdversaryView` | AdvSearch.ts | Sidebar view for adversary browser |
| `EnvironmentView` | EnvSearch.ts | Sidebar view for environment browser |
| `TextInputModal` | TextInputModal.ts | Modal for creating/editing adversaries |
| `AdversaryEditorModal` | AdvEditorModal.ts | Modal for editing adversary cards |
| `EnvironmentModal` | EnvModal.ts | Modal for creating environments |

---

## Common Tasks

### Create New Adversary
1. User clicks "Adversary Creator"
2. `TextInputModal.onOpen()` creates form
3. User fills: name, tier, type, desc, motives, stats, weapon, features
4. Click "Insert Card"
5. `buildCustomAdversary()` saves to file
6. `buildCardHTML()` generates card
7. Card inserted to editor
8. `AdversaryView.refresh()` updates browser

### Edit Existing Card
1. User clicks edit button on card
2. `extractCardData()` parses card HTML
3. `AdversaryEditorModal` opens with data
4. User modifies fields
5. `buildCardHTML()` generates new card
6. `card.replaceWith()` replaces old card

### Insert from Browser
1. User opens browser (menu or command)
2. View loads data: built-in + custom
3. User searches/filters/selects
4. Click card
5. `generateAdversaryMarkdown()` converts to HTML
6. Editor inserts HTML

### Create Multiple Copies
1. Use counter in browser view
2. Increment counter (default = 1)
3. Click adversary
4. HTML generated with multiple HP/Stress rows
5. Inserted into editor

---

## Key Files by Feature

### To modify how adversary cards display:
- `CardBuilder.ts` - HTML structure
- `styles.css` - Styling

### To add new fields to adversary:
- `types/adversary.ts` - Add to CardData
- `TextInputModal.ts` - Add input field
- `CardDataHelpers.ts` - Add extraction regex
- `CardBuilder.ts` - Add to HTML output

### To add new custom content source:
- Load in data manager
- Tag with source
- Update CSS class
- Update badge colors in view

### To modify browser filtering:
- `AdvSearch.ts` - createSearchInput() or createTierDropdown()
- `EnvSearch.ts` - setupSearchInput() or createTierButtons()

### To modify form persistence:
- `TextInputModal.onClose()` - Save state
- `TextInputModal.onOpen()` - Restore state
- Same for `EnvironmentModal`

---

## File Edit Checklist

When modifying a file, consider:

- [ ] Import necessary types
- [ ] Update related type definitions
- [ ] Handle form state persistence
- [ ] Add console.log for debugging
- [ ] Check regex patterns for parsing
- [ ] Update CSS classes if needed
- [ ] Test with empty data
- [ ] Test with existing data
- [ ] Verify persistence across saves

---

## CSS Classes Reference

### Card Structure
- `df-card-outer` - Main card container
- `df-card-inner` - Inner content wrapper
- `df-pseudo-cut-corners` - Cut corner styling
- `df-edit-button` - Edit button element

### Stats Section
- `df-stats` - Stats container
- `df-stat` - Individual stat value
- `df-hp-tickboxes` - HP checkbox row
- `df-stress-tickboxes` - Stress checkbox row
- `df-hp-tickbox` - Individual HP checkbox
- `df-stress-tickbox` - Individual stress checkbox

### Features
- `df-feature` - Feature container
- `df-feature-title` - Feature name + type
- `df-feature-desc` - Feature description
- `df-section` - Section heading (e.g., "FEATURES")

### Browser/Sidebar
- `df-adversary-card` - Browser card
- `df-env-card` - Environment browser card
- `df-tier-text` - Tier/type display
- `df-source-badge-core` - Source badge styling

### Forms
- `df-form-row` - Horizontal row of fields
- `df-inline-field` - Single labeled field
- `df-input-field` - Input element
- `df-feature-block` - Feature input wrapper
- `df-feature-row` - Feature row (name, type, cost)
- `df-input-feature-name` - Feature name input
- `df-field-feature-type` - Feature type dropdown
- `df-input-feature-cost` - Feature cost dropdown

---

## Debug Checklist

- [ ] Check DevTools console for errors
- [ ] Verify `custom@Adversaries.md` file exists
- [ ] Check JSON formatting in custom file
- [ ] Use `extractCardData()` to inspect card DOM
- [ ] Log form values before save
- [ ] Verify event listeners attached
- [ ] Check CSS classes applied to elements
- [ ] Test form state restoration
- [ ] Verify file read/write permissions

---

## Performance Tips

- Load data lazily on view open, not in onload()
- Use querySelector over querySelectorAll when possible
- Filter in-memory data rather than re-querying
- Cache view references to avoid repeated lookups
- Consider pagination for 100+ items

---

