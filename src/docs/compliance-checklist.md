# Obsidian Plugin Development - Compliance Checklist

This checklist helps ensure your DaggerForge plugin follows Obsidian's guidelines and best practices.

---

## 📋 Pre-Submission Checklist

### Plugin Naming
- [ ] Plugin name does NOT include "Obsidian" (reserved for official products)
- [ ] Plugin ID is unique and descriptive
- [ ] README does not claim to be an official Obsidian product

### CSS and Styling
- [ ] All custom CSS properties use plugin-specific prefix (`--df-`)
- [ ] All CSS classes use plugin-specific prefix (`df-`)
- [ ] No overwrites of core Obsidian classes without additional specificity
- [ ] Styles use Obsidian's theme variables where appropriate
  - `--background-primary`
  - `--background-secondary`
  - `--text-normal`
  - `--text-muted`
  - `--interactive-accent`
  - `--background-modifier-border`

### UI Text and UX
- [ ] All user-facing text uses sentence case
  - ✅ "Create adversary" 
  - ❌ "Create Adversary"
- [ ] All command names use sentence case
- [ ] All menu items use sentence case
- [ ] All button labels use sentence case
- [ ] Modal titles use sentence case
- [ ] Notice messages use sentence case

### API Usage
- [ ] Using current Obsidian API (no deprecated methods)
- [ ] NOT using `workspace.rightSplit.expand()` (use `revealLeaf()` instead)
- [ ] Properly registering views with `registerView()`
- [ ] Using `app.workspace.revealLeaf()` for showing views

### Code Quality
- [ ] No test/debug code in production
- [ ] No console.logs in production (or minimal, meaningful ones)
- [ ] No unused status bar items
- [ ] All ribbon icons have corresponding commands
- [ ] Commands are properly registered with unique IDs

### File Management
- [ ] Styles are in `styles.css` (Obsidian loads automatically)
- [ ] No manual stylesheet loading in code
- [ ] All required assets are included in repo
- [ ] No broken imports

### Documentation
- [ ] README includes:
  - [ ] Clear description of plugin functionality
  - [ ] Installation instructions
  - [ ] Usage examples
  - [ ] Screenshots/demos (if applicable)
- [ ] CHANGELOG is up to date
- [ ] manifest.json contains accurate information

---

## 🎨 CSS Best Practices

### ✅ Good Examples

```css
/* Custom properties with prefix */
:root {
    --df-corner: 10px;
    --df-color-primary: #000;
}

/* Classes with prefix */
.df-card-outer { }
.df-modal-content { }

/* Using Obsidian theme variables */
.df-input {
    background: var(--background-primary);
    color: var(--text-normal);
}
```

### ❌ Bad Examples

```css
/* Missing prefix - will conflict! */
:root {
    --corner: 10px;
    --primary-color: #000;
}

/* No prefix - will conflict! */
.card-outer { }
.modal { }

/* Overwriting core styles */
.modal-title {
    font-size: 2em; /* Don't do this! */
}
```

---

## 💬 UI Text Guidelines

### ✅ Correct Sentence Case

- "Create adversary"
- "Open browser"
- "Import data from JSON file"
- "Delete data file"
- "Load tier 1 adversaries"
- "Add feature"

### ❌ Incorrect Title Case

- "Create Adversary"
- "Open Browser"
- "Import Data From JSON File"
- "Delete Data File"
- "Load Tier 1 Adversaries"
- "Add Feature"

### Exceptions (Proper Nouns)

- "DaggerHeart menu" (DaggerHeart is proper noun)
- "Import JSON file" (JSON is acronym)

---

## 🔧 API Usage Examples

### ✅ Opening Views in Sidebar (Correct)

```typescript
export async function openSidebar(plugin: Plugin) {
    const leaf = plugin.app.workspace.getRightLeaf(false);
    await leaf.setViewState({
        type: MY_VIEW_TYPE,
        active: true,
    });
    plugin.app.workspace.revealLeaf(leaf); // ✅ Correct
}
```

### ❌ Opening Views in Sidebar (Incorrect)

```typescript
export async function openSidebar(plugin: Plugin) {
    const leaf = plugin.app.workspace.getRightLeaf(false);
    await leaf.setViewState({
        type: MY_VIEW_TYPE,
        active: true,
    });
    plugin.app.workspace.rightSplit.expand(); // ❌ Deprecated!
}
```

---

## 📦 File Structure Best Practices

```
your-plugin/
├── src/
│   ├── main.ts              # Main plugin file
│   ├── types/               # TypeScript types
│   ├── features/            # Feature modules
│   ├── ui/                  # UI components
│   ├── services/            # Services (data, API, etc)
│   └── utils/               # Utility functions
├── styles.css               # Plugin styles (auto-loaded)
├── manifest.json            # Plugin manifest
├── package.json             # Dependencies
├── README.md                # Documentation
└── CHANGELOG.md             # Version history
```

### ✅ Do Include
- All source files
- All assets (images, icons)
- Documentation
- License file

### ❌ Don't Include
- `node_modules/`
- `.git/`
- Build artifacts (unless specified)
- Personal test files
- Sensitive data

---

## 🚀 Command Registration

### ✅ Good Practice

```typescript
// Register both ribbon and command
this.addRibbonIcon("dice", "Open calculator", () => {
    this.openCalculator();
});

this.addCommand({
    id: "open-calculator",
    name: "Open calculator",  // Sentence case!
    callback: () => this.openCalculator()
});
```

### ❌ Bad Practice

```typescript
// Only ribbon - users may hide ribbon!
this.addRibbonIcon("dice", "Open Calculator", () => {  // Also wrong case
    this.openCalculator();
});
// No command registered!
```

---

## 🧪 Testing Checklist

Before submitting:

### Functionality
- [ ] All features work as expected
- [ ] No console errors on load
- [ ] All commands execute correctly
- [ ] All views render properly
- [ ] Modal dialogs open and close correctly

### UI/UX
- [ ] All text is properly capitalized (sentence case)
- [ ] Styles don't conflict with Obsidian core
- [ ] Styles work with both light and dark themes
- [ ] Responsive design (if applicable)

### Compatibility
- [ ] Works with latest Obsidian version
- [ ] Works with minimum supported Obsidian version
- [ ] No deprecated API usage
- [ ] No browser-specific code (electron compatibility)

### Performance
- [ ] No memory leaks
- [ ] Efficient data handling
- [ ] No blocking operations on main thread
- [ ] Proper cleanup in `onunload()`

---

## 📖 Resources

- [Obsidian Plugin Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- [Obsidian API Docs](https://docs.obsidian.md/Home)
- [Plugin Developer Docs](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [CSS Variables Reference](https://docs.obsidian.md/Reference/CSS+variables/CSS+variables)
- [Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin)

---

## ✨ Optional Best Practices

### Recommended
- [ ] Use TypeScript strict mode
- [ ] Include type definitions for all functions
- [ ] Add JSDoc comments for public APIs
- [ ] Use meaningful variable names
- [ ] Keep functions small and focused
- [ ] Handle errors gracefully
- [ ] Provide user feedback (Notices)
- [ ] Support mobile (if feasible)

### Advanced
- [ ] Add settings tab for user configuration
- [ ] Implement state persistence
- [ ] Add keyboard shortcuts
- [ ] Provide data import/export
- [ ] Include examples/templates
- [ ] Add automated tests

---

*Use this checklist before every release to ensure compliance with Obsidian guidelines.*
