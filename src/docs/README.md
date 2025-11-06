# DaggerForge Documentation

Welcome to the DaggerForge documentation folder. This folder contains comprehensive guides for understanding the plugin architecture, all functions and types, and quick reference material for development.

## Documentation Files

### 1. **FUNCTIONS_AND_TYPES.md** - Comprehensive API Reference
Complete documentation of every function, type, and class in the project.

**Contents:**
- Core Plugin Architecture (main.ts)
- Type Definitions (all types with descriptions)
- Data Management (loading and storing data)
- Adversary Features (all adversary-related functions)
- Environment Features (all environment-related functions)
- UI Components (sidebar management)
- Utilities (helper functions)
- Data Flow Summary
- CSS Class Reference

**Use when:** You need detailed information about a specific function, type, or component behavior.

---

### 2. **ARCHITECTURE.md** - High-Level Design Documentation
Overview of the plugin's architecture, patterns, and design decisions.

**Contents:**
- Project Purpose
- File Organization (folder structure)
- Core Concepts (card system, dual state pattern, data extraction)
- Key Features (5 main features explained)
- Data Types Hierarchy
- Plugin Lifecycle
- Important Patterns (5 core patterns)
- Extensions & Future Possibilities
- Common Tasks (how to add features)
- Development Notes

**Use when:** You need to understand how the plugin works conceptually, or before adding new features.

---

### 3. **QUICK_REFERENCE.md** - Developer Cheat Sheet
Quick lookup tables and common tasks for rapid development.

**Contents:**
- Types Quick Lookup (quick type definitions)
- Functions Quick Lookup (table of functions)
- Classes Quick Lookup (table of classes)
- Common Tasks (step-by-step procedures)
- Key Files by Feature (where to edit for each feature)
- File Edit Checklist (what to consider when modifying)
- CSS Classes Reference (all CSS classes used)
- Debug Checklist
- Performance Tips

**Use when:** You're actively developing and need quick answers or reminders.

---

## Getting Started

### If you're new to the codebase:
1. Start with **ARCHITECTURE.md** to understand the big picture
2. Read about your specific feature in **FUNCTIONS_AND_TYPES.md**
3. Keep **QUICK_REFERENCE.md** open while coding

### If you're adding a new feature:
1. Check **Common Tasks** in ARCHITECTURE.md
2. Reference **FUNCTIONS_AND_TYPES.md** for similar features
3. Use **Quick Lookup** tables in QUICK_REFERENCE.md

### If you're fixing a bug:
1. Locate the relevant file in **QUICK_REFERENCE.md** → "Key Files by Feature"
2. Look up the function in **FUNCTIONS_AND_TYPES.md**
3. Use **Debug Checklist** in QUICK_REFERENCE.md

---

## Key Concepts Quick Summary

### The Two Main Systems

**1. Adversary System**
- Create game enemies/NPCs
- Browse and insert from library
- Edit existing adversary cards
- Support for multiple copies

**2. Environment System**
- Create game locations/scenarios
- Browse and insert from library
- Each environment can have multiple features
- Includes GM prompts

### Data Persists in Two Ways

1. **Files** (permanent)
   - `custom@Adversaries.md` - User-created adversaries
   - `custom@Environments.md` - User-created environments
   - Stored as JSON blocks

2. **Memory** (session)
   - Form state preserved while modal is open
   - Clears when modal closes
   - Survives form interactions

### The Three Core Flows

1. **Create**: Modal opens → User fills form → File saved → Card inserted → Browser updates

2. **Edit**: Card clicked → Data extracted → Modal opens → User edits → Card replaced

3. **Insert**: Browser opens → Searches/filters data → Card selected → HTML generated → Inserted

---

## File Locations

All TypeScript source files are in `src/`:

```
src/
├── main.ts                          # Plugin entry point
├── types/                           # Type definitions
│   ├── shared.ts                   # Shared types
│   ├── adversary.ts                # Adversary types
│   └── environment.ts              # Environment types
├── data/                           # Data loading
│   ├── adversaries.ts              # Load adversary JSON
│   └── environments.ts             # Load environment JSON
├── features/
│   ├── adversaries/                # All adversary features
│   │   ├── components/             # Views and UI
│   │   ├── creator/                # Creation modals
│   │   └── editor/                 # Editing functionality
│   └── environments/               # All environment features
│       ├── components/             # Views and UI
│       └── creator/                # Creation modals
├── ui/                             # UI components
│   └── Sidebar.ts                  # Sidebar management
├── utils/                          # Utility functions
│   ├── adversaryCounter.ts         # Count management
│   └── formHelpers.ts              # Form creation helpers
└── docs/                           # This documentation
    ├── README.md                   # This file
    ├── FUNCTIONS_AND_TYPES.md      # API reference
    ├── ARCHITECTURE.md             # Design overview
    └── QUICK_REFERENCE.md          # Cheat sheet
```

---

## Development Workflow

### Adding a New Field to Adversary Cards

1. Update `CardData` type in `types/adversary.ts`
2. Add form input in `TextInputModal.onOpen()`
3. Add extraction in `CardDataHelpers.extractCardData()`
4. Add to HTML in `CardBuilder.buildCardHTML()`
5. Update CSS in `styles.css` if needed

See full guide in ARCHITECTURE.md → "Common Tasks"

### Creating a New Content Type

1. Create new type file in `types/`
2. Create new data file in `data/`
3. Create creator modal in `features/{type}/creator/`
4. Create browser view in `features/{type}/components/`
5. Export from feature index
6. Register in `main.ts`

### Adding New Filter to Browser

Edit the relevant view file:
- `AdvSearch.ts` for adversary filters
- `EnvSearch.ts` for environment filters

Add new filter input and update rendering logic.

---

## Important Notes

### Regex Extraction
The plugin uses regex to extract data from rendered HTML cards. When modifying card HTML structure in `CardBuilder.ts`, ensure corresponding regex patterns in `CardDataHelpers.ts` still match.

### Form State Persistence
Each modal saves its form state in `onClose()`:
- `plugin.savedInputStateAdv` for adversaries
- `plugin.savedInputStateEnv` for environments

This allows users to close/reopen modals and find their previous input.

### Custom Content Files
- Stored as markdown with JSON blocks
- Each entry has a header and JSON code block
- Parsed on view open, not stored in memory
- Always backed up in the markdown file

### CSS Classes
All CSS classes follow naming convention: `df-{component}` where `df` = DaggerForge.
This prevents conflicts with other plugins.

---

## Troubleshooting

### Modal not opening?
- Check if editor is in source mode (`getMode() === "source"`)
- Verify active note exists
- Check console for errors in TextInputModal.onOpen()

### Custom adversaries not showing?
- Verify `custom@Adversaries.md` exists in vault root
- Check JSON formatting (must be valid JSON in code blocks)
- Reload plugin (Obsidian settings → Reload)

### Edited card not updating?
- Ensure you're in source edit mode
- Check that `extractCardData()` is properly parsing the card
- Verify new HTML is valid before replacement

### Browser not refreshing?
- Call `view.refresh()` after saving custom content
- Verify view is actually open (check workspace leaves)

---

## Quick Links

- **Problem?** → Check QUICK_REFERENCE.md → Debug Checklist
- **New feature?** → Check ARCHITECTURE.md → Common Tasks
- **Function details?** → Check FUNCTIONS_AND_TYPES.md
- **CSS class?** → Check QUICK_REFERENCE.md → CSS Classes Reference
- **File to edit?** → Check QUICK_REFERENCE.md → Key Files by Feature

---

## Contributing

When contributing to DaggerForge:

1. ✅ Update type definitions if changing data structures
2. ✅ Update this documentation if adding new functions
3. ✅ Follow existing code style (TypeScript, Obsidian patterns)
4. ✅ Test with empty and populated data
5. ✅ Check form persistence works
6. ✅ Verify custom content saves correctly

---

**Last Updated:** 2025
**Plugin:** DaggerForge
**Platform:** Obsidian Plugin

