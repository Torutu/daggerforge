# DaggerForge Obsidian Plugin Review Audit

## Overview
This document lists all violations found during the review of the DaggerForge plugin against Obsidian's plugin guidelines and API documentation.

---

## 🚨 Critical Issues

### 1. CSS Custom Properties - Missing Prefixes
**Location**: `styles.css` (root variables)

**Issue**: Custom CSS properties in `:root` are not properly prefixed with plugin-specific namespace.

**Current Code**:
```css
:root {
    --corner: 10px;  /* ❌ */
    --font: "Myriad Pro";  /* ❌ */
}
```

**Required Fix**:
```css
:root {
    --df-corner: 10px;  /* ✓ */
    --df-font: "Myriad Pro";  /* ✓ */
}
```

**Impact**: May conflict with other plugins or Obsidian core styles.

---

### 2. Inconsistent CSS Variable References
**Location**: `styles.css` (multiple locations)

**Issues Found**:
- Line 46: `.df-pseudo-cut-corners.inner::before` uses `--color-bg-inner` → should be `--df-color-bg-inner`
- Line 122: `.df-stress-tickboxes` uses `--color-border` → should be `--df-color-border`
- Line 154: `.df-card-inner .df-stats` uses `--color-border` (2x) → should be `--df-color-border`
- Line 162: `.df-stats .df-experience-line` uses `--color-border` → should be `--df-color-border`

**Required Action**: Find and replace all instances:
- `--color-border` → `--df-color-border`
- `--color-bg-inner` → `--df-color-bg-inner`

**Impact**: Broken styling due to undefined variables.

---

## ⚠️ UI Text - Sentence Case Violations

Obsidian requires all UI text to use sentence case (capitalize only first word and proper nouns).

### main.ts
**Location**: Lines 68-106 (Menu items and commands)

| Current (Wrong) | Required (Correct) |
|----------------|-------------------|
| "DaggerForge Menu" | "DaggerForge menu" |
| "Adversary Browser" | "Adversary browser" |
| "Environment Browser" | "Environment browser" |
| "Adversary Creator" | "Adversary creator" |
| "Environment Creator" | "Environment creator" |
| "Encounter Calculator" | "Encounter calculator" |
| "Import Data" | "Import data" |
| "Delete Data File" | "Delete data file" |
| `Load Tier ${tier} Adversaries` | `Load tier ${tier} adversaries` |
| "Import Data from JSON File" | "Import data from JSON file" |

### TextInputModal.ts
**Location**: Various lines throughout the file

| Current (Wrong) | Required (Correct) |
|----------------|-------------------|
| "Create Adversary" | "Create adversary" |
| "Edit Adversary" | "Edit adversary" |
| "Basic Information" | "Basic information" |
| "Statistics" | "Statistics" (OK - single word) |
| "Weapon" | "Weapon" (OK - single word) |
| "Features" | "Features" (OK - single word) |
| "+ Add Feature" | "+ Add feature" |
| "Insert Card" | "Insert card" |
| "Update Card" | "Update card" |

### AdvEditorModal.ts
**Location**: Lines throughout the file

| Current (Wrong) | Required (Correct) |
|----------------|-------------------|
| "Edit Adversary" | "Edit adversary" |
| "Add Feature" | "Add feature" |
| "Update Card" | "Update card" |

### EnvModal.ts
**Location**: Various lines throughout the file

| Current (Wrong) | Required (Correct) |
|----------------|-------------------|
| "Create Environment" | "Create environment" |
| "Basic Information" | "Basic information" |
| "Gameplay" | "Gameplay" (OK - single word) |
| "Difficulty & Adversaries" | "Difficulty & adversaries" |
| "Features" | "Features" (OK - single word) |
| "+ Add Feature" | "+ Add feature" |
| "Insert Environment" | "Insert environment" |
| "Remove Feature" | "Remove feature" |
| "GM Prompt Question:" | "GM prompt question:" |

---

## 🗑️ Code to Remove

### 1. Test Ribbon Icon
**Location**: `main.ts`, lines ~128-155

**Code to Remove**:
```typescript
this.addRibbonIcon("plus", "Add Hello Card", async () => {
    let canvasLeaves = this.app.workspace.getLeavesOfType("canvas");
    // ... entire test ribbon icon code ...
});
```

**Reason**: This appears to be test/debug code and should not be in production.

---

## ✅ Things That Are Correct

### 1. Status Bar Item
**Location**: `main.ts`, line 36
```typescript
this.addStatusBarItem().setText("DaggerForge Active");
```
**Status**: ✓ OK - This is actually being used, not just a placeholder.

### 2. Command Registration
**Status**: ✓ OK - All ribbon actions have corresponding commands registered.

### 3. CSS Class Naming
**Status**: ✓ OK - Most classes are properly prefixed with `df-` to avoid conflicts.

### 4. Obsidian Variable Usage
**Status**: ✓ OK - Using Obsidian's theming variables like `--background-primary`, `--text-normal`, etc. is correct and encouraged.

---

## 📋 Missing Information

The review mentioned these issues, but we need to verify:

### 1. Missing JSON Files
**Mentioned in Review**: 
```
import adversariesTier1 from '../../adversaries/Adversaries-Tier-1.json';
I'm not seeing these files in your repo, please include them so I can review them.
```

**Status**: Need to check if these files exist or if imports have been removed/updated.

### 2. workspace.rightSplit.expand() Usage
**Mentioned in Review**: Should use `revealLeaf()` instead

**Status**: ❌ FOUND in `src/ui/Sidebar.ts` (2 occurrences)
- Line 15: In `adversariesSidebar()` function
- Line 26: In `openEnvironmentSidebar()` function

**Required Fix**: Replace with `plugin.app.workspace.revealLeaf(leaf)`

---

## 🔧 Quick Fix Checklist

- [ ] Update CSS `:root` variables with `df-` prefix
- [ ] Find/replace all CSS variable references
- [ ] Convert all UI text to sentence case in `main.ts`
- [ ] Convert all UI text to sentence case in `TextInputModal.ts`
- [ ] Convert all UI text to sentence case in `AdvEditorModal.ts`
- [ ] Convert all UI text to sentence case in `EnvModal.ts`
- [ ] Remove test ribbon icon ("Add Hello Card")
- [ ] Replace `workspace.rightSplit.expand()` with `revealLeaf()` in Sidebar.ts (2 places)
- [ ] Verify JSON import statements (appears to be already fixed)

---

## 📚 References

- [Obsidian Plugin Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- [Obsidian API Documentation](https://docs.obsidian.md/Home)
- [CSS Best Practices](https://docs.obsidian.md/Plugins/User+interface/HTML+elements#Styling)

---

*Last Updated: [Generated on review]*
