# How Tests Work (Simple Explanation)

## The Basics

Tests check if your code works correctly. Think of it like checking your homework.

---

## The Building Blocks

### `describe()` - The Container

Groups related tests together. Like a folder for tests.

```typescript
describe('My Math Tests', () => {
    // All math tests go here
});
```

**Think of it as:** "I'm going to test Math stuff"

---

### `it()` - One Single Test

One specific thing you want to check.

```typescript
it('adds two numbers', () => {
    // Test goes here
});
```

**Think of it as:** "It should add two numbers correctly"

---

### `expect()` - What You're Checking

You say what you expect to happen.

```typescript
expect(result).toBe(5);
```

**Think of it as:** "I expect the result to be 5"

---

## Common Expect Functions

### `.toBe(value)` - Exact Match

Checks if two things are exactly the same.

```typescript
expect(2 + 3).toBe(5);  // Is 2+3 equal to 5? YES
```

**Like asking:** "Is this EXACTLY that?"

---

### `.toHaveLength(number)` - Count Items

Checks how many items are in a list.

```typescript
expect([1, 2, 3]).toHaveLength(3);  // Does the list have 3 items? YES
```

**Like asking:** "How many are there?"

---

### `.toMatch(pattern)` - Starts With / Contains

Checks if text matches a pattern.

```typescript
expect(id).toMatch(/^CUA_/);  // Does id start with "CUA_"? 
```

**Like asking:** "Does it start with CUA_?"

---

### `.not.toBe(value)` - Should Be Different

Checks that two things are NOT the same.

```typescript
expect(id1).not.toBe(id2);  // Are id1 and id2 different? 
```

**Like asking:** "Are these two things different?"

---

## A Complete Example

```typescript
describe('Adding numbers', () => {
    it('adds 2 + 3', () => {
        const result = 2 + 3;
        expect(result).toBe(5);
    });
});
```

**In plain English:**

1. "I'm testing adding numbers"
2. "It should add 2 + 3"
3. "I expect the result to be 5"

---

## When Tests Run

1. Do the math/action
2. Check if it matches what you expect
3. If it matches → **PASS** ✓
4. If it doesn't match → **FAIL** ✗

---

## Our Pattern

We use `afterAll()` to print all results at the end:

```typescript
const testResults = [];  // Box to store results

function logResult(name, expected, actual, passed) {
    testResults.push(`Test: ${name}`);
    testResults.push(`  Expected: ${expected}`);
    testResults.push(`  Actual: ${actual}`);
    testResults.push(`  Result: ${passed ? 'PASS' : 'FAIL'}`);
}

afterAll(() => {
    console.log(testResults.join('\n'));  // Print everything at the end
});
```

**In plain English:**

1. Save each test result in a box
2. When all tests finish, print everything from the box

---

## Summary

- `describe()` = Group of tests
- `it()` = One test
- `expect()` = What should happen
- `.toBe()` = Should be exactly this
- `.toHaveLength()` = Should have this many
- `.toMatch()` = Should match this pattern
- `.not.toBe()` = Should NOT be this
- `afterAll()` = Do this after all tests finish

**That's it!**
