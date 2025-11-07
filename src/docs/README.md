# DaggerForge Documentation

This folder contains all documentation and guides for maintaining and developing the DaggerForge Obsidian plugin.

---

## 📄 Documents Overview

### [obsidian-review-audit.md](./obsidian-review-audit.md)
**Purpose**: Comprehensive audit report of all issues found during the Obsidian plugin review.

**Contains**:
- Detailed list of all violations
- Critical issues with exact locations
- UI text that needs fixing
- CSS problems and solutions
- Code that needs to be removed
- Things that are already correct
- Quick fix checklist

**When to use**: Reference this when fixing issues found in the review.

---

### [issue-summary.md](./issue-summary.md)
**Purpose**: Executive summary with prioritized list of all issues.

**Contains**:
- Issues organized by priority (Critical, High, Medium, Low)
- Time estimates for each fix
- Breakdown by affected file
- Recommended fix order
- Automated fix scripts
- Post-fix verification steps

**When to use**: Get a quick overview of what needs to be fixed and in what order.

---

### [fixes-guide.md](./fixes-guide.md)
**Purpose**: Step-by-step instructions for implementing all required fixes.

**Contains**:
- Exact code changes needed
- Before/after code examples
- Line numbers for each change
- Find/replace patterns
- Testing checklist
- Verification scripts

**When to use**: Follow this guide when actually making the code changes.

---

### [compliance-checklist.md](./compliance-checklist.md)
**Purpose**: Ongoing reference for maintaining Obsidian plugin standards.

**Contains**:
- Pre-submission checklist
- CSS best practices
- UI text guidelines
- API usage examples
- File structure recommendations
- Testing checklist
- Resources and links

**When to use**: 
- Before submitting plugin updates
- When adding new features
- During code reviews
- As a learning reference

---

### [canvas-support.md](./canvas-support.md)
**Purpose**: Documentation for the canvas support feature.

**Contains**:
- Feature overview
- How to use canvas support
- Technical implementation details
- Code examples
- User experience flows
- Error handling
- Testing checklist

**When to use**:
- Learning how to use canvas features
- Understanding the canvas implementation
- Debugging canvas-related issues
- Extending canvas functionality

---

## 🚀 Quick Start

### If you're fixing the review issues:

1. Read **issue-summary.md** first to understand priorities
2. Follow **fixes-guide.md** for step-by-step instructions
3. Reference **obsidian-review-audit.md** for detailed context
4. Use **compliance-checklist.md** to verify you've fixed everything

### If you're adding new features:

1. Use **compliance-checklist.md** to ensure new code follows guidelines
2. Pay special attention to:
   - CSS class naming (use `df-` prefix)
   - UI text (use sentence case)
   - API usage (no deprecated methods)

---

## 📊 Issue Statistics

**Total Issues Found**: 8 categories
- 🔴 Critical: 2
- 🟠 High: 2
- 🟡 Medium: 2
- 🟢 Low/Fixed: 2

**Estimated Fix Time**: ~24 minutes

**Files Affected**: 6 files
- `styles.css`
- `src/main.ts`
- `src/ui/Sidebar.ts`
- `src/features/adversaries/creator/TextInputModal.ts`
- `src/features/adversaries/editor/AdvEditorModal.ts`
- `src/features/environments/creator/EnvModal.ts`

---

## 🎯 Most Common Issues

1. **UI Text Not in Sentence Case** (31 instances)
   - ❌ "Create Adversary"
   - ✅ "Create adversary"

2. **CSS Variables Without Prefix** (6 instances)
   - ❌ `--corner`
   - ✅ `--df-corner`

3. **Deprecated API Usage** (2 instances)
   - ❌ `workspace.rightSplit.expand()`
   - ✅ `workspace.revealLeaf(leaf)`

---

## 🔄 Document Maintenance

### When to update these docs:

- **After fixing issues**: Update the audit to mark items as complete
- **After Obsidian API changes**: Update compliance checklist with new guidelines
- **After adding new features**: Update checklist with new patterns to follow
- **Before each release**: Review compliance checklist

### Document versions:
- Initial creation: Based on plugin review feedback
- Last updated: [Date of last modification]

---

## 📚 External Resources

- [Obsidian Plugin Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- [Obsidian API Documentation](https://docs.obsidian.md/Home)
- [Plugin Submission Process](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin)
- [Community Plugins Forum](https://forum.obsidian.md/c/plugin-ideas/12)

---

## ❓ Questions?

If you're unsure about any guideline or fix:

1. Check the **compliance-checklist.md** for examples
2. Reference **fixes-guide.md** for exact code patterns
3. Consult the [Obsidian API Docs](https://docs.obsidian.md/Home)
4. Ask in the Obsidian Discord/Forum

---

*These documents were generated based on the official Obsidian plugin review feedback and guidelines.*
