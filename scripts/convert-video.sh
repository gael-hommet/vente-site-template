#!/usr/bin/env bash
# Convert a single source video into web-ready deliverables.
# Usage: scripts/convert-video.sh input.mov [output-basename]
#
# Produces (in public/assets/video and public/posters):
#   <name>.mp4        H.264, faststart, no audio
#   <name>.webm       VP9, no audio
#   <name>.jpg poster
# Add --sequence to also emit a WebP frame sequence in public/sequences/<name>/.
#
# Requires ffmpeg (provided by the devcontainer). This is the documented,
# single-file counterpart to `pnpm assets:video`.
set -euo pipefail

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg introuvable. Installez-le: sudo apt-get update && sudo apt-get install -y ffmpeg"
  exit 1
fi

SRC="${1:?Usage: convert-video.sh <input> [output-basename] [--sequence]}"
NAME="${2:-$(basename "${SRC%.*}")}"
NAME="$(echo "$NAME" | tr '[:upper:] ' '[:lower:]-')"
SEQUENCE=false
[[ "${*:2}" == *"--sequence"* ]] && SEQUENCE=true

OUT_VIDEO="public/assets/video"
OUT_POSTER="public/posters"
mkdir -p "$OUT_VIDEO" "$OUT_POSTER"
SCALE="scale='min(1920,iw)':-2"

echo "→ MP4"
ffmpeg -y -i "$SRC" -vf "$SCALE" -c:v libx264 -crf 23 -preset slow -movflags +faststart -an "$OUT_VIDEO/$NAME.mp4"
echo "→ WebM"
ffmpeg -y -i "$SRC" -vf "$SCALE" -c:v libvpx-vp9 -crf 34 -b:v 0 -an "$OUT_VIDEO/$NAME.webm"
echo "→ Poster"
ffmpeg -y -i "$SRC" -vf "${SCALE},thumbnail" -frames:v 1 "$OUT_POSTER/$NAME.jpg"

if [ "$SEQUENCE" = true ]; then
  echo "→ Séquence WebP"
  mkdir -p "public/sequences/$NAME"
  ffmpeg -y -i "$SRC" -vf "fps=12,$SCALE" -c:v libwebp -quality 70 "public/sequences/$NAME/frame-%04d.webp"
fi

echo "✔ Terminé. Original conservé: $SRC"
