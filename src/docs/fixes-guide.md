# DaggerForge Code Fixes Guide

## Critical Fixes Required

This document provides step-by-step instructions for fixing all issues found in the Obsidian plugin review.

---

## Fix 1: CSS Custom Properties Prefixing

### Files to Update:
- `styles.css`

### Changes Required:

#### Step 1: Update `:root` variables
Find:
```css
:root {
    --corner: 10px;
    --font: "Myriad Pro";
    --df-color-primary: #000;
    --df-color-bg-outer: #cab996;
    --df-color-bg-inner: #f5f1e8;
    --df-color-border: #c2af88;
}
```

Replace with:
```css
:root {
    --df-corner: 10px;
    --df-font: "Myriad Pro";
    --df-color-primary: #000;
    --df-color-bg-outer: #cab996;
    --df-color-bg-inner: #f5f1e8;
    --df-color-border: #c2af88;
}
```

#### Step 2: Find and Replace Variable References

Use your editor's find/replace functionality (Ctrl+H or Cmd+H):

1. Find: `--color-bg-inner`  
   Replace with: `--df-color-bg-inner`

2. Find: `--color-border`  
   Replace with: `--df-color-border`

3. Find: `--corner` (but NOT `--df-corner`)  
   Replace with: `--df-corner`

4. Find: `--font` (but NOT in `--df-font-`)  
   Replace with: `--df-font`

---

## Fix 2: Replace workspace.rightSplit.expand()

### Files to Update:
- `src/ui/Sidebar.ts`

### Current Code (Lines 6-15):
```typescript
export async function adversariesSidebar(plugin: ObsidianPlugin) {
    new Notice("Opening Adversary Browser in sidebar...");
    const leaf = plugin.app.workspace.getRightLeaf(true);
    if (leaf) {
        await leaf.setViewState({
            type: ADVERSARY_VIEW_TYPE,
            active: true,
        });
    }
    plugin.app.workspace.rightSplit.expand();  // ❌ Remove this
}
```

### Fixed Code:
```typescript
export async function adversariesSidebar(plugin: ObsidianPlugin) {
    new Notice("Opening adversary browser in sidebar...");  // ✓ Also fix sentence case
    const leaf = plugin.app.workspace.getRightLeaf(true);
    if (leaf) {
        await leaf.setViewState({
            type: ADVERSARY_VIEW_TYPE,
            active: true,
        });
        plugin.app.workspace.revealLeaf(leaf);  // ✓ Use revealLeaf instead
    }
}
```

### Current Code (Lines 17-26):
```typescript
export async function openEnvironmentSidebar(plugin: ObsidianPlugin) {
    new Notice("Opening Environment Browser in sidebar...");
    const leaf = plugin.app.workspace.getRightLeaf(true);
    if (leaf) {
        await leaf.setViewState({
            type: ENVIRONMENT_VIEW_TYPE,
            active: true,
        });
    }
    plugin.app.workspace.rightSplit.expand();  // ❌ Remove this
}
```

### Fixed Code:
```typescript
export async function openEnvironmentSidebar(plugin: ObsidianPlugin) {
    new Notice("Opening environment browser in sidebar...");  // ✓ Also fix sentence case
    const leaf = plugin.app.workspace.getRightLeaf(true);
    if (leaf) {
        await leaf.setViewState({
            type: ENVIRONMENT_VIEW_TYPE,
            active: true,
        });
        plugin.app.workspace.revealLeaf(leaf);  // ✓ Use revealLeaf instead
    }
}
```

---

## Fix 3: Remove Test Ribbon Icon

### File to Update:
- `src/main.ts`

### Code to Remove (Lines ~128-155):
```typescript
this.addRibbonIcon("plus", "Add Hello Card", async () => {
    let canvasLeaves = this.app.workspace.getLeavesOfType("canvas");
    let file: TFile;
    let canvasView: any;

    // Create or open canvas
    if (!canvasLeaves.length) {
        file = await this.app.vault.create(
            "TestCanvas.canvas",
            JSON.stringify({ nodes: {}, edges: {} }, null, 2)
        );
        const leaf = this.app.workspace.getLeaf(true);
        await leaf.openFile(file);
        canvasLeaves = this.app.workspace.getLeavesOfType("canvas");
    } else {
        file = (canvasLeaves[0].view as any).file;
    }

    // Get the canvas view
    canvasView = canvasLeaves[0].view as any;
    const canvas = canvasView.canvas;

    // Create a new text card node
    canvas.createTextNode({
        pos: { x: 100, y: 100 },
        text: "Hello from plugin!",
        size: { width: 200, height: 100 }
    });

    // Save updated canvas JSON
    canvas.requestSave?.();

    new Notice("Added 'hello' card to canvas.");
});
```

**Action**: Delete this entire block of code.

---

## Fix 4: UI Text to Sentence Case

### File: `src/main.ts`

Find and replace these strings:

| Line Area | Find | Replace |
|-----------|------|---------|
| Menu items | `"DaggerForge Menu"` | `"DaggerForge menu"` |
| Menu items | `"Adversary Browser"` | `"Adversary browser"` |
| Menu items | `"Environment Browser"` | `"Environment browser"` |
| Menu items | `"Adversary Creator"` | `"Adversary creator"` |
| Menu items | `"Environment Creator"` | `"Environment creator"` |
| Menu items | `"Encounter Calculator"` | `"Encounter calculator"` |
| Menu items | `"Import Data"` | `"Import data"` |
| Menu items | `"Delete Data File"` | `"Delete data file"` |
| Commands | `` `Load Tier ${tier} Adversaries` `` | `` `Load tier ${tier} adversaries` `` |
| Commands | `"Adversary Creator"` | `"Adversary creator"` |
| Commands | `"Environment Creator"` | `"Environment creator"` |
| Commands | `"Import Data from JSON File"` | `"Import data from JSON file"` |
| Commands | `"Delete Data File"` | `"Delete data file"` |

### File: `src/features/adversaries/creator/TextInputModal.ts`

| Find | Replace |
|------|---------|
| `"Create Adversary"` | `"Create adversary"` |
| `"Edit Adversary"` | `"Edit adversary"` |
| `"Basic Information"` | `"Basic information"` |
| `"+ Add Feature"` | `"+ Add feature"` |
| `"Insert Card"` | `"Insert card"` |
| `"Update Card"` | `"Update card"` |

### File: `src/features/adversaries/editor/AdvEditorModal.ts`

| Find | Replace |
|------|---------|
| `"Edit Adversary"` | `"Edit adversary"` |
| `"Add Feature"` | `"Add feature"` |
| `"Update Card"` | `"Update card"` |

### File: `src/features/environments/creator/EnvModal.ts`

| Find | Replace |
|------|---------|
| `"Create Environment"` | `"Create environment"` |
| `"Basic Information"` | `"Basic information"` |
| `"Difficulty & Adversaries"` | `"Difficulty & adversaries"` |
| `"+ Add Feature"` | `"+ Add feature"` |
| `"Insert Environment"` | `"Insert environment"` |
| `"Remove Feature"` | `"Remove feature"` |
| `"GM Prompt Question:"` | `"GM prompt question:"` |

---

## Testing Checklist

After making all changes, verify:

- [ ] Plugin loads without errors
- [ ] Adversary browser opens correctly in sidebar
- [ ] Environment browser opens correctly in sidebar
- [ ] All CSS styles render correctly
- [ ] No console errors about undefined CSS variables
- [ ] All modal dialogs display with correct text
- [ ] All commands appear with correct capitalization in command palette
- [ ] Ribbon menu displays with correct capitalization

---

## Verification Script

Run this in your browser console while Obsidian is open to check for undefined CSS variables:

```javascript
// Check for undefined CSS variables
const root = document.documentElement;
const style = getComputedStyle(root);
const vars = ['--df-corner', '--df-font', '--df-color-primary', '--df-color-bg-outer', 
              '--df-color-bg-inner', '--df-color-border'];

vars.forEach(v => {
    const value = style.getPropertyValue(v);
    console.log(`${v}: ${value || 'UNDEFINED'}`);
});
```

---

*Created: [Generated during review]*
*Last Updated: [Same as creation]*
