#!/bin/bash
# Archive deprecated verification/debug scripts and temporal docs
set -euo pipefail
TODAY=$(date +%Y%m%d)
ARCHIVE_DIR="scripts/archive-$TODAY"
mkdir -p "$ARCHIVE_DIR"

echo "Archiving deprecated files to $ARCHIVE_DIR"

# Patterns to archive (per CONTRIBUTING.md)
patterns=(
  "check-*.js"
  "debug-*.js"
  "final-*.js"
  "api-test-*.js"
  "*_PROGRESS.md"
  "*_STATUS.md"
  "*_SUMMARY.md"
  "*_COMPLETE.md"
  "*_FINISHED.md"
  "*_FINAL.md"
  "AGENT_*.md"
)

# Search and move matching files from repo root and backend
for p in "${patterns[@]}"; do
  # root
  for f in $(ls -1 $p 2>/dev/null || true); do
    echo "Archiving $f"
    mv "$f" "$ARCHIVE_DIR/"
  done

  # backend
  for f in $(ls -1 backend/$p 2>/dev/null || true); do
    echo "Archiving backend/$f"
    mv "$f" "$ARCHIVE_DIR/"
  done
done

echo "Archive complete. Please review $ARCHIVE_DIR and commit the changes." 
