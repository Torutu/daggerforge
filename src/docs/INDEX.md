# DaggerForge Documentation Index

## 📚 All Documentation Files

Your DaggerForge documentation is now organized in the `docs/` folder with 4 comprehensive guides:

### 1. **README.md** ⭐ Start Here
An overview of all documentation with quick navigation guides.
- What each doc contains
- Getting started guides
- Key concepts summary
- Development workflow
- Troubleshooting guide

### 2. **FUNCTIONS_AND_TYPES.md** 🔍 Complete Reference
Detailed documentation of every function, type, and class.
- Core Plugin Architecture
- All Type Definitions (organized by file)
- Data Management Functions
- Adversary System (components, creator, editor)
- Environment System (components, creator)
- UI Components
- Utility Functions
- Data Flow Diagrams
- CSS Classes

**Lines:** ~1000+ | **Best for:** Looking up specific implementations

### 3. **ARCHITECTURE.md** 🏗️ Design Overview
High-level architecture and design patterns.
- Project Purpose & Structure
- Core Concepts (card system, state patterns, extraction)
- Key Features Explained
- Type Hierarchy
- Plugin Lifecycle
- Important Patterns (5 core patterns with examples)
- Extensions & Future Features
- Development Notes

**Lines:** ~300 | **Best for:** Understanding the big picture

### 4. **QUICK_REFERENCE.md** ⚡ Cheat Sheet
Quick lookup tables and common tasks.
- Types Quick Lookup (organized tables)
- Functions Quick Lookup (organized tables)
- Classes Quick Lookup
- Common Tasks (step-by-step procedures)
- Key Files by Feature (where to edit)
- File Edit Checklist
- CSS Classes Reference (quick table)
- Debug Checklist
- Performance Tips

**Lines:** ~400 | **Best for:** Active development

---

## 🗂️ Documentation Structure

```
docs/
├── README.md                    # Start here - Overview & navigation
├── FUNCTIONS_AND_TYPES.md       # Complete API reference
├── ARCHITECTURE.md              # Design patterns & concepts
├── QUICK_REFERENCE.md           # Quick lookup tables
└── INDEX.md                     # This file
```

---

## 🎯 How to Use These Docs

### For Different Scenarios:

**🆕 New to the codebase?**
1. Read README.md (overview)
2. Read ARCHITECTURE.md (how it works)
3. Skim FUNCTIONS_AND_TYPES.md (see what exists)
4. Bookmark QUICK_REFERENCE.md (for coding)

**➕ Adding a new feature?**
1. Check ARCHITECTURE.md → "Common Tasks"
2. Look up similar functions in FUNCTIONS_AND_TYPES.md
3. Use QUICK_REFERENCE.md → "Key Files by Feature"
4. Reference the type definitions

**🐛 Debugging an issue?**
1. Use QUICK_REFERENCE.md → "Debug Checklist"
2. Find the file in QUICK_REFERENCE.md → "Key Files by Feature"
3. Look up the function in FUNCTIONS_AND_TYPES.md
4. Check console logs and error messages

**⚡ Quick question while coding?**
1. Use QUICK_REFERENCE.md → Quick Lookup tables
2. Use QUICK_REFERENCE.md → CSS Classes Reference
3. Use QUICK_REFERENCE.md → Common Tasks

**📖 Understanding a specific function?**
1. Search FUNCTIONS_AND_TYPES.md for function name
2. Read description and parameters
3. Look at related functions
4. Check the pattern in ARCHITECTURE.md

---

## 📋 Complete File Index

### Project Files (src/)

```
main.ts (370 lines)
├── DaggerForgePlugin class
├── Plugin lifecycle (onload, onunload)
├── Creator opening logic
├── Card edit handling
└── Event listeners

types/
├── shared.ts (10 lines) - FormInputs, Feature
├── adversary.ts (35 lines) - CardData, FeatureElements
└── environment.ts (30 lines) - EnvironmentData, EnvironmentFeature

data/
├── adversaries.ts (15 lines) - ADVERSARIES constant, loadAdversaryTier()
└── environments.ts (15 lines) - ENVIRONMENTS constant

features/
├── adversaries/
│   ├── index.ts (10 lines) - exports
│   ├── components/
│   │   ├── AdvCounter.ts (25 lines) - count management
│   │   ├── AdvList.ts (80 lines) - tier loading
│   │   └── AdvSearch.ts (350 lines) - browser view
│   ├── creator/
│   │   ├── CardBuilder.ts (100 lines) - HTML generation
│   │   ├── FeatureManager.ts (45 lines) - feature CRUD
│   │   └── TextInputModal.ts (200 lines) - creator modal
│   └── editor/
│       ├── AdvEditorModal.ts (140 lines) - edit modal
│       └── CardDataHelpers.ts (50 lines) - data extraction
│
└── environments/
    ├── index.ts (5 lines) - exports
    ├── components/
    │   ├── EnvSearch.ts (280 lines) - browser view
    │   └── EnvToHTML.ts (50 lines) - HTML conversion
    └── creator/
        └── EnvModal.ts (220 lines) - creator modal

ui/
└── Sidebar.ts (25 lines) - sidebar management

utils/
├── adversaryCounter.ts (30 lines) - count state
└── formHelpers.ts (120 lines) - form creation

docs/ [NEW]
├── README.md - Navigation & overview
├── FUNCTIONS_AND_TYPES.md - Complete API reference
├── ARCHITECTURE.md - Design overview
├── QUICK_REFERENCE.md - Quick lookups
└── INDEX.md - This file
```

---

## 🔍 Function Count by File

| File | Functions | Purpose |
|------|-----------|---------|
| main.ts | 6 | Plugin lifecycle |
| CardBuilder.ts | 1 | Card HTML |
| FeatureManager.ts | 2 | Feature management |
| TextInputModal.ts | 2 | Adversary creation |
| AdvSearch.ts | 10 | Browser view |
| AdvList.ts | 2 | Tier loading |
| AdvCounter.ts | 5 | Count management |
| CardDataHelpers.ts | 1 | Data extraction |
| AdvEditorModal.ts | 1 | Editor modal |
| EnvSearch.ts | 2 | Environment browser |
| EnvToHTML.ts | 1 | HTML conversion |
| EnvModal.ts | 2 | Environment creation |
| formHelpers.ts | 3 | Form helpers |
| Sidebar.ts | 2 | Sidebar management |
| adversaryCounter.ts | 5 | Count state |

**Total Functions:** ~50+

---

## 📊 Documentation Statistics

| Document | Lines | Sections | Tables | Code Examples |
|----------|-------|----------|--------|---------------|
| README.md | ~200 | 10 | 1 | Yes |
| FUNCTIONS_AND_TYPES.md | ~1000+ | 20+ | 2 | Yes |
| ARCHITECTURE.md | ~300 | 10 | 3 | Yes |
| QUICK_REFERENCE.md | ~400 | 12 | 10+ | No |
| Total | ~1900+ | 50+ | 15+ | Multiple |

---

## 🎓 Learning Path

### Beginner Level (1-2 hours)
1. ✅ Read README.md
2. ✅ Read ARCHITECTURE.md
3. ✅ Skim FUNCTIONS_AND_TYPES.md (Overview sections)
4. ✅ Explore one complete feature (Adversary creation)

### Intermediate Level (2-3 hours)
1. ✅ Deep read FUNCTIONS_AND_TYPES.md (2-3 sections)
2. ✅ Trace through complete data flow (README.md → Common Tasks)
3. ✅ Review QUICK_REFERENCE.md patterns
4. ✅ Explore related files in the codebase

### Advanced Level (3-5 hours)
1. ✅ Complete FUNCTIONS_AND_TYPES.md
2. ✅ Study all patterns in ARCHITECTURE.md
3. ✅ Review all type hierarchies
4. ✅ Plan an extension based on framework points
5. ✅ Review existing code alongside docs

---

## 🚀 Quick Start Checklist

Setting up to work with DaggerForge:

- [ ] Read README.md (10 min)
- [ ] Bookmark QUICK_REFERENCE.md
- [ ] Open FUNCTIONS_AND_TYPES.md in split view
- [ ] Understand the folder structure (README.md has it)
- [ ] Locate project files in `src/`
- [ ] Understand CardData and EnvironmentData types
- [ ] Review the plugin lifecycle in main.ts
- [ ] Identify where to make your changes

---

## 🔗 Navigation Quick Links

### By Component:

**Adversary System**
- Created in: `TextInputModal` (creator/TextInputModal.ts)
- Edited in: `AdversaryEditorModal` (editor/AdvEditorModal.ts)
- Browsed in: `AdversaryView` (components/AdvSearch.ts)
- Extracted from: `extractCardData()` (editor/CardDataHelpers.ts)
- Generated as: `buildCardHTML()` (creator/CardBuilder.ts)

**Environment System**
- Created in: `EnvironmentModal` (creator/EnvModal.ts)
- Browsed in: `EnvironmentView` (components/EnvSearch.ts)
- Converted to: `environmentToHTML()` (components/EnvToHTML.ts)
- Saved via: `buildCustomEnvironment()` (components/EnvSearch.ts)

**Core System**
- Plugin logic: `main.ts`
- Type definitions: `types/` folder
- Data loading: `data/` folder
- Utilities: `utils/` folder

---

## 📝 Documentation Maintenance

**Last Updated:** November 2025

**Coverage:**
- ✅ All functions documented
- ✅ All types documented
- ✅ All classes documented
- ✅ Core patterns documented
- ✅ Common tasks documented
- ✅ File structure documented

**If you add new code:**
1. Add function to FUNCTIONS_AND_TYPES.md
2. Add to type lookup in QUICK_REFERENCE.md if needed
3. Update ARCHITECTURE.md if pattern is new
4. Update this INDEX.md

---

## ❓ FAQ

**Q: Which doc should I read first?**
A: README.md always. Then based on your task, pick the specific doc.

**Q: Can I search across all docs?**
A: Use your editor's search (Ctrl+Shift+F in VS Code) to search in folder.

**Q: How do I find a specific function?**
A: Use QUICK_REFERENCE.md → Functions Quick Lookup (table sorted by file)

**Q: How do I understand a pattern?**
A: Read ARCHITECTURE.md → Important Patterns section (5 core patterns explained)

**Q: Where are the code examples?**
A: FUNCTIONS_AND_TYPES.md has TypeScript type definitions. ARCHITECTURE.md has flow examples.

**Q: What if docs are outdated?**
A: Check FUNCTIONS_AND_TYPES.md. Most detailed source. Cross-reference with actual code.

---

## 💡 Pro Tips

1. **Use Find (Ctrl+F)** in docs to search for function/type names
2. **Open two docs side-by-side** - QUICK_REFERENCE.md + main code file
3. **Start with README.md** - it has the best navigation
4. **Print QUICK_REFERENCE.md** - great cheat sheet to tape to monitor
5. **Bookmark the docs folder** - you'll reference it constantly
6. **Keep INDEX.md open** - quick navigation to any section

---

**Happy coding with DaggerForge! 🎉**

For questions or to update docs, refer to the "Documentation Maintenance" section above.

