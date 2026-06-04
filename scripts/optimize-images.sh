#!/usr/bin/env bash
# Resize project images for web (run after adding new assets).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MAX_EDGE=1800
QUALITY=85

while IFS= read -r -d '' file; do
  sips -Z "$MAX_EDGE" "$file" --out "$file" >/dev/null
  ext="$(echo "${file##*.}" | tr '[:upper:]' '[:lower:]')"
  case "$ext" in
    jpg | jpeg)
      sips -s format jpeg -s formatOptions "$QUALITY" "$file" --out "$file" >/dev/null
      ;;
    *.png)
      sips -s format png "$file" --out "$file" >/dev/null
      ;;
  esac
  echo "optimized: $file"
done < <(find "$ROOT/assets/projects" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -print0)

du -sh "$ROOT/assets/projects"
