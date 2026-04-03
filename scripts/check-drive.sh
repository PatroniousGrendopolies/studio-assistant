#!/bin/bash
# Check Nigel's Google Drive folder for new files and download them
# Runs daily via cron or manually: ./scripts/check-drive.sh

set -euo pipefail

DRIVE_FOLDER_ID="1RJUAZHYP0EUj7EabQfJFC3c3CmUlTyeL"
ACCOUNT="autolandsupport@gmail.com"
DOWNLOAD_DIR="$(dirname "$0")/../.gstack/drive-downloads"
MANIFEST="$(dirname "$0")/../.gstack/drive-manifest.txt"

mkdir -p "$DOWNLOAD_DIR"
touch "$MANIFEST"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Checking Drive folder for new files..."

# List all files recursively (top-level + subfolders)
FILES=$(gog drive ls --account "$ACCOUNT" --parent "$DRIVE_FOLDER_ID" --max 100 --plain 2>/dev/null || echo "")

if [ -z "$FILES" ] || [ "$FILES" = "No files" ]; then
  echo "No files found or Drive access failed."
  exit 0
fi

# Skip header line, process each file
NEW_COUNT=0
echo "$FILES" | tail -n +2 | while IFS=$'\t' read -r ID NAME TYPE SIZE MODIFIED; do
  # Skip folders (we'll handle them separately if needed)
  if [ "$TYPE" = "folder" ]; then
    # Check inside subfolders too
    SUBFILES=$(gog drive ls --account "$ACCOUNT" --parent "$ID" --max 100 --plain 2>/dev/null || echo "")
    if [ -n "$SUBFILES" ] && [ "$SUBFILES" != "No files" ]; then
      echo "$SUBFILES" | tail -n +2 | while IFS=$'\t' read -r SID SNAME STYPE SSIZE SMODIFIED; do
        if [ "$STYPE" = "folder" ]; then continue; fi
        if grep -q "^${SID}$" "$MANIFEST" 2>/dev/null; then
          echo "  [skip] $NAME/$SNAME (already processed)"
        else
          echo "  [NEW]  $NAME/$SNAME ($SSIZE, modified $SMODIFIED)"
          mkdir -p "$DOWNLOAD_DIR/$NAME"
          gog drive download "$SID" --account "$ACCOUNT" --output "$DOWNLOAD_DIR/$NAME/$SNAME" 2>/dev/null && {
            echo "$SID" >> "$MANIFEST"
            NEW_COUNT=$((NEW_COUNT + 1))
          } || echo "  [FAIL] Could not download $SNAME"
        fi
      done
    fi
    continue
  fi

  # Check if we've already processed this file
  if grep -q "^${ID}$" "$MANIFEST" 2>/dev/null; then
    echo "  [skip] $NAME (already processed)"
    continue
  fi

  echo "  [NEW]  $NAME ($SIZE, modified $MODIFIED)"
  gog drive download "$ID" --account "$ACCOUNT" --output "$DOWNLOAD_DIR/$NAME" 2>/dev/null && {
    echo "$ID" >> "$MANIFEST"
    NEW_COUNT=$((NEW_COUNT + 1))
  } || echo "  [FAIL] Could not download $NAME"
done

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Done. Check $DOWNLOAD_DIR for new files."
