#!/usr/bin/env zsh
set -euo pipefail

review_source="docs/evidence/phase7/video/felicia-phase7-first-time-walkthrough-with-browser-audio.webm"
review_dir="docs/evidence/phase7/transitions-slow-motion"

rtk mkdir -p "$review_dir"

make_review_clip() {
  local start_time="$1"
  local clip_duration="$2"
  local filename="$3"
  rtk ffmpeg -y -ss "$start_time" -t "$clip_duration" -i "$review_source" \
    -filter_complex "[0:v]setpts=2.0*PTS[v];[0:a]atempo=0.5[a]" \
    -map "[v]" -map "[a]" -c:v libvpx-vp9 -crf 35 -b:v 0 -c:a libopus \
    "$review_dir/$filename"
}

make_review_clip 6.5 13 "01-awakening-to-chamber.webm"
make_review_clip 20.5 7 "02-chamber-to-fear.webm"
make_review_clip 58 7 "03-fear-completion-and-return.webm"
make_review_clip 67 7 "04-chamber-to-hope.webm"
make_review_clip 91 7 "05-hope-completion-and-return.webm"
make_review_clip 99 7 "06-chamber-to-identity.webm"
make_review_clip 121 8 "07-identity-completion-and-return.webm"
make_review_clip 148 15 "08-synchronization-to-final-consciousness.webm"
