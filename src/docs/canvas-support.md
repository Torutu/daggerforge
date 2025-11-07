# Canvas Support Implementation

## Overview

DaggerForge now supports creating adversaries and environments directly on Obsidian Canvas pages! This feature allows you to use the plugin's card creation and browsing functionality while working in canvas mode.

---

## What Changed

### New Files

**`src/utils/canvasHelpers.ts`**
- Utility functions for canvas detection and manipulation
- Functions:
  - `isCanvasActive()` - Checks if the current active view is a canvas
  - `getActiveCanvas()` - Gets the canvas object from the active leaf
  - `createCanvasCard()` - Creates a card on the canvas with HTML content
  - `getAvailableCanvasPosition()` - Finds a position that doesn't overlap existing cards

### Modified Files

1. **`src/main.ts`**
   - Updated `openCreator()` to support canvas views
   - Removed commented-out test ribbon icon code
   - Now allows opening creator modals from canvas pages

2. **`src/features/adversaries/creator/TextInputModal.ts`**
   - Added canvas support in the insert button logic
   - Checks if on canvas and creates card accordingly
   - Falls back to markdown editor insertion if not on canvas

3. **`src/features/environments/creator/EnvModal.ts`**
   - Added canvas support in the insert button logic
   - Detects canvas and creates environment cards on canvas

4. **`src/features/adversaries/components/AdvSearch.ts`**
   - Updated `insertAdversaryIntoNote()` to support canvas
   - Adversary browser can now insert cards into canvas

5. **`src/features/environments/components/EnvSearch.ts`**
   - Updated environment card click handler to support canvas
   - Environment browser can now insert cards into canvas

---

## How to Use

### Creating New Adversaries/Environments on Canvas

1. **Open a canvas page** in Obsidian
2. **Open the creator modal** using either:
   - Ribbon icon → "Adversary creator" or "Environment creator"
   - Command palette → "Adversary creator" or "Environment creator"
3. **Fill in the form** as usual
4. **Click "Insert card"**
5. The card will appear on your canvas at an optimal position!

### Inserting from Browser

1. **Open a canvas page** in Obsidian
2. **Open the browser** using either:
   - Ribbon icon → "Adversary browser" or "Environment browser"
   - Or open it from the sidebar
3. **Click on any adversary or environment** in the browser
4. The card will be inserted into your active canvas!

### Features

- **Smart Positioning**: Cards are automatically placed in the viewport center
- **Overlap Prevention**: The plugin tries to avoid overlapping existing cards
- **Custom Sizing**: 
  - Adversary cards: 400px × 600px
  - Environment cards: 400px × 650px
- **Notifications**: Success/failure messages appear for each action

---

## Technical Details

### Canvas Detection

The plugin checks if the active leaf is a canvas using:
```typescript
const activeLeaf = app.workspace.activeLeaf;
if (activeLeaf?.view?.getViewType() === "canvas") {
    // Canvas-specific logic
}
```

### Card Creation

Canvas cards are created using Obsidian's canvas API:
```typescript
canvas.createTextNode({
    pos: { x: xPos, y: yPos },
    text: htmlContent,
    size: { width: 400, height: 600 }
});
canvas.requestSave?.();
```

### Position Calculation

The plugin:
1. Finds the center of the current viewport
2. Checks for overlapping cards
3. Offsets the position if needed (up to 20 attempts)
4. Falls back to viewport center if no free space found

---

## Compatibility

### Works With:
- ✅ Obsidian Canvas (core feature)
- ✅ All adversary types
- ✅ All environment types
- ✅ Custom adversaries and environments
- ✅ Multiple instances counter

### Note:
- Editing existing cards on canvas is not yet supported
- Canvas cards are static HTML (checkboxes work, but edit buttons don't)
- The plugin cannot modify existing canvas cards

---

## Future Enhancements

Potential improvements:
- [ ] Edit canvas cards in place
- [ ] Drag and drop from browser to canvas
- [ ] Canvas-specific card templates
- [ ] Better card sizing options
- [ ] Link cards on canvas
- [ ] Export canvas to encounter JSON

---

## User Experience Flow

### Creating Adversary on Canvas

```
User on Canvas
     ↓
Opens Creator Modal
     ↓
Fills Form
     ↓
Clicks "Insert card"
     ↓
Plugin detects canvas
     ↓
Calculates optimal position
     ↓
Creates canvas card node
     ↓
Shows success notification
```

### Browser Insertion

```
User on Canvas
     ↓
Opens Browser Sidebar
     ↓
Searches/Filters
     ↓
Clicks on Card
     ↓
Plugin detects canvas
     ↓
Generates HTML
     ↓
Creates canvas card node
     ↓
Shows success notification
```

---

## Error Handling

The plugin gracefully handles errors:

1. **Canvas not detected**: Falls back to markdown editor
2. **No active view**: Shows notice to user
3. **Card creation fails**: Shows error notice
4. **Position calculation fails**: Uses default viewport center

---

## Testing Checklist

- [x] Create adversary from modal on canvas
- [x] Create environment from modal on canvas
- [x] Insert adversary from browser to canvas
- [x] Insert environment from browser to canvas
- [x] Create adversary in markdown note (backward compatibility)
- [x] Create environment in markdown note (backward compatibility)
- [x] Insert from browser to markdown note (backward compatibility)
- [x] Position calculation doesn't overlap existing cards
- [x] Success/error notifications work correctly

---

## Code Quality

### Type Safety
- All functions are properly typed
- Uses TypeScript for canvas manipulation
- Handles `any` types appropriately for Obsidian API

### Error Prevention
- Checks for canvas existence before operations
- Validates positions before card creation
- Graceful fallbacks for all operations

### Maintainability
- Separated canvas logic into utility file
- Minimal changes to existing code
- Follows existing code patterns

---

*Implementation completed and tested successfully!*
