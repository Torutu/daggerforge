# Error Log

Known issues encountered during development, their root cause, and fix. Check here before debugging a recurring problem.

---

## [2026-05-19] `process is not defined` — Plugin fails to load on Android

**Symptom:** Obsidian mobile shows "Failed to load plugin: daggerforge". Chrome DevTools console shows:
```
ReferenceError: process is not defined
  at node_modules/react-dom/client.js
```

**Root cause:** React DOM references `process.env.NODE_ENV` at runtime. `process` is a Node.js/Electron global — it exists on desktop but not in Android's WebView.

**Fix:** Add `define` to `esbuild.config.mjs` so esbuild inlines the value at build time:
```js
define: {
    "process.env.NODE_ENV": prod ? '"production"' : '"development"',
},
```

**File:** `esbuild.config.mjs`

---

## [2026-05-19] `make deploy` skips Android — `deploy-android.sh` never called

**Symptom:** `make deploy` only deploys to Windows vault, Android device gets nothing.

**Root cause:** Makefile was refactored to call `deploy.sh` only. `deploy-android.sh` was never wired into it.

**Fix:** Append to end of `deploy.sh`:
```bash
bash "$(dirname "$0")/deploy-android.sh"
```

**File:** `deploy.sh`

---

## [2026-05-19] ADB device detection fails in WSL — `\r` in output

**Symptom:** `deploy-android.sh` prints "No Android device connected" even when `adb.exe devices` shows a device.

**Root cause:** `adb.exe` is a Windows binary. Its output uses `\r\n` line endings. `grep -q "device$"` fails because `\r` sits before the newline, so `$` never matches.

**Fix:** Strip carriage returns before grepping:
```bash
adb.exe devices 2>/dev/null | tr -d '\r' | grep -q "device$"
```

**File:** `deploy-android.sh`

---

## [2026-05-19] `make` fails — `powershell: No such file or directory`

**Symptom:** `make deploy` exits with error 127.

**Root cause:** In WSL, the Windows PowerShell binary is `powershell.exe`, not `powershell`.

**Fix:** Use `powershell.exe` in Makefile targets.

**File:** `Makefile`

---

## [2026-05-19] `make help` crashes — `Syntax error: "(" unexpected`

**Symptom:** Running `make` (default help target) exits with error 2.

**Root cause:** Unquoted `echo` strings containing `(` and `)` are interpreted as subshell syntax by `/bin/sh`.

**Fix:** Wrap all `echo` strings in double quotes:
```makefile
@echo "make install    - Install dependencies (npm install)"
```

**File:** `Makefile`
