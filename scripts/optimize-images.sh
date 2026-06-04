#!/usr/bin/env bash
# Resize project images and compress videos for web (run after adding assets).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MAX_EDGE=1800
QUALITY=85
VIDEO_CRF=28

optimize_image() {
  local file="$1"
  sips -Z "$MAX_EDGE" "$file" --out "$file" >/dev/null
  local ext
  ext="$(echo "${file##*.}" | tr '[:upper:]' '[:lower:]')"
  case "$ext" in
    jpg | jpeg)
      sips -s format jpeg -s formatOptions "$QUALITY" "$file" --out "$file" >/dev/null
      ;;
    png)
      sips -s format png "$file" --out "$file" >/dev/null
      ;;
  esac
  echo "optimized image: $file"
}

optimize_video() {
  local file="$1"
  if ! command -v ffmpeg >/dev/null 2>&1; then
    echo "skip video (install ffmpeg): $file"
    return 0
  fi
  local tmp="${file%.mp4}.opt.mp4"
  ffmpeg -y -loglevel error -i "$file" \
    -c:v libx264 -crf "$VIDEO_CRF" -preset medium -movflags +faststart -an \
    "$tmp"
  mv "$tmp" "$file"
  echo "optimized video: $file"
}

while IFS= read -r file; do
  [ -n "$file" ] && optimize_image "$file"
done < <(
  find "$ROOT/assets/projects" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \)
)

while IFS= read -r file; do
  [ -n "$file" ] && optimize_video "$file"
done < <(find "$ROOT/assets/projects" -type f -iname '*.mp4')

du -sh "$ROOT/assets/projects"
