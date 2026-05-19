#!/bin/bash
PLUGIN_ID="daggerforge"

if ! adb.exe devices 2>/dev/null | tr -d '\r' | grep -q "device$"; then
    echo "No Android device connected, skipping Android deploy."
    exit 0
fi

VAULTS=$(adb.exe shell find /storage/emulated/0 -maxdepth 3 -name ".obsidian" -type d 2>/dev/null | tr -d '\r')
if [ -z "$VAULTS" ]; then
    echo "No Obsidian vaults found on Android device."
    exit 1
fi

VAULT=$(echo "$VAULTS" | head -1)
PLUGIN_DIR="${VAULT}/plugins/${PLUGIN_ID}"
echo "Deploying to Android: $PLUGIN_DIR"

adb.exe shell mkdir -p "$PLUGIN_DIR"
for FILE in main.js manifest.json styles.css; do
    [ -f "$FILE" ] && adb.exe push "$FILE" "$PLUGIN_DIR/$FILE"
done

echo "Android deploy complete."
