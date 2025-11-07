# DaggerForge Plugin Review - Issue Summary

## Executive Summary

This document provides a prioritized list of all issues found during the Obsidian plugin review.

**Total Issues Found**: 8 categories  
**Critical Issues**: 2  
**High Priority Issues**: 3  
**Medium Priority Issues**: 2  
**Low Priority Issues**: 1  

---

## 🔴 Critical Priority (Must Fix Before Submission)

### 1. CSS Custom Properties Missing Prefix
- **Severity**: Critical
- **Impact**: May cause conflicts with other plugins and core Obsidian
- **Files Affected**: `styles.css`
- **Instances**: 4 variables without proper prefix
- **Estimated Fix Time**: 5 minutes
- **Details**: Variables `--corner`, `--font`, `--color-border`, `--color-bg-inner` need `df-` prefix

### 2. Deprecated API Usage (rightSplit.expand)
- **Severity**: Critical
- **Impact**: May break in future Obsidian versions
- **Files Affected**: `src/ui/Sidebar.ts`
- **Instances**: 2 occurrences
- **Estimated Fix Time**: 2 minutes
- **Details**: Replace `workspace.rightSplit.expand()` with `workspace.revealLeaf(leaf)`

---

## 🟠 High Priority (Required by Guidelines)

### 3. UI Text Not in Sentence Case
- **Severity**: High
- **Impact**: Fails Obsidian style guidelines
- **Files Affected**: 
  - `src/main.ts` (13 instances)
  - `src/features/adversaries/creator/TextInputModal.ts` (7 instances)
  - `src/features/adversaries/editor/AdvEditorModal.ts` (3 instances)
  - `src/features/environments/creator/EnvModal.ts` (8 instances)
- **Total Instances**: 31
- **Estimated Fix Time**: 15 minutes
- **Details**: All UI-facing text must use sentence case (only capitalize first word and proper nouns)

### 4. Test/Debug Code in Production
- **Severity**: High
- **Impact**: Unprofessional, unnecessary code bloat
- **Files Affected**: `src/main.ts`
- **Instances**: 1 ribbon icon ("Add Hello Card")
- **Estimated Fix Time**: 1 minute
- **Details**: Remove test ribbon icon and associated canvas manipulation code (~30 lines)

---

## 🟡 Medium Priority (Best Practices)

### 5. Notice Messages Not in Sentence Case
- **Severity**: Medium
- **Impact**: Minor style inconsistency
- **Files Affected**: `src/ui/Sidebar.ts`
- **Instances**: 2 Notice messages
- **Estimated Fix Time**: 1 minute
- **Details**: 
  - "Opening Adversary Browser in sidebar..." → "Opening adversary browser in sidebar..."
  - "Opening Environment Browser in sidebar..." → "Opening environment browser in sidebar..."

### 6. Inconsistent Variable Naming
- **Severity**: Medium
- **Impact**: Code maintainability
- **Files Affected**: `styles.css`
- **Instances**: Mixed usage of prefixed/unprefixed variables throughout file
- **Estimated Fix Time**: Included in Critical Fix #1

---

## 🟢 Low Priority (Already Fixed or N/A)

### 7. Missing JSON Import Files
- **Severity**: Low (Appears Fixed)
- **Impact**: None currently
- **Files Affected**: None found
- **Status**: Review mentioned missing JSON imports, but they don't exist in current codebase
- **Action Required**: None - appears to have been refactored to use DataManager instead

### 8. Unused Status Bar Item
- **Severity**: Low (Actually Used)
- **Impact**: None
- **Files Affected**: `src/main.ts`
- **Status**: Review flagged this, but it's actually being used to display "DaggerForge Active"
- **Action Required**: None - working as intended

---

## Detailed Breakdown by File

### styles.css
- ❌ 2 CSS variables in `:root` missing prefix
- ❌ 4 variable references using wrong name
- **Total Changes**: 6

### src/main.ts  
- ❌ 13 UI text instances need sentence case
- ❌ 1 test ribbon icon to remove (~30 lines)
- **Total Changes**: 14

### src/ui/Sidebar.ts
- ❌ 2 `rightSplit.expand()` to replace with `revealLeaf()`
- ❌ 2 Notice messages need sentence case
- **Total Changes**: 4

### src/features/adversaries/creator/TextInputModal.ts
- ❌ 7 UI text instances need sentence case
- **Total Changes**: 7

### src/features/adversaries/editor/AdvEditorModal.ts
- ❌ 3 UI text instances need sentence case
- **Total Changes**: 3

### src/features/environments/creator/EnvModal.ts
- ❌ 8 UI text instances need sentence case
- **Total Changes**: 8

---

## Time Estimate

| Priority | Task | Time |
|----------|------|------|
| Critical | Fix CSS variables | 5 min |
| Critical | Replace rightSplit API | 2 min |
| High | Fix sentence case (all files) | 15 min |
| High | Remove test code | 1 min |
| Medium | Fix Notice messages | 1 min |
| **Total** | | **24 minutes** |

---

## Recommended Fix Order

1. **First** - Remove test ribbon icon (quick win)
2. **Second** - Fix CSS variables (prevents conflicts)
3. **Third** - Replace rightSplit API (API compatibility)
4. **Fourth** - Fix all sentence case issues (bulk find/replace)
5. **Fifth** - Test everything works

---

## Automated Fix Script (Optional)

If you're comfortable with regex, you can use these find/replace patterns in VS Code:

### CSS Variables (styles.css)
```
Find: --corner(?!:)
Replace: --df-corner

Find: --font(?!-)
Replace: --df-font

Find: --color-border
Replace: --df-color-border

Find: --color-bg-inner
Replace: --df-color-bg-inner
```

### Sentence Case (All .ts files)
*Note: Review each replacement manually to avoid false positives*

```
Find: "([A-Z][a-z]+) (([A-Z][a-z]+ ?)+)"
Replace: "$1 \L$2"
```

---

## Post-Fix Verification

After making all fixes:

1. ✅ Run `npm run build` - should complete without errors
2. ✅ Load plugin in Obsidian - should load without console errors
3. ✅ Open adversary browser - should open in sidebar correctly
4. ✅ Open environment browser - should open in sidebar correctly
5. ✅ Create adversary - all fields and buttons should work
6. ✅ Create environment - all fields and buttons should work
7. ✅ Check command palette - all commands should use sentence case
8. ✅ Check all modals - all text should use sentence case
9. ✅ Inspect CSS - no undefined variable warnings in console

---

*Document Generated: [Review Date]*
*Plugin Version: [Current Version]*
