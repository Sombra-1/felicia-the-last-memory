#!/usr/bin/env zsh
set -euo pipefail

video_dir="docs/evidence/phase7.1/video"
review_dir="docs/evidence/phase7.1/transitions-slow-motion"
video_source="$video_dir/felicia-phase7-first-time-walkthrough-video.webm"
audio_source="$video_dir/felicia-phase7-browser-audio.webm"
review_source="$video_dir/felicia-phase7.1-first-time-walkthrough-with-browser-audio.webm"
audio_offset="11.02"

rtk mkdir -p "$review_dir"

rtk ffmpeg -y -i "$video_source" -itsoffset "$audio_offset" -i "$audio_source" \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a libopus -shortest "$review_source"

make_review_clip() {
  local start_time="$1"
  local clip_duration="$2"
  local filename="$3"
  rtk ffmpeg -y -ss "$start_time" -t "$clip_duration" -i "$review_source" \
    -filter_complex "[0:v]setpts=2.0*PTS[v];[0:a]atempo=0.5[a]" \
    -map "[v]" -map "[a]" -c:v libvpx-vp9 -crf 35 -b:v 0 -c:a libopus \
    "$review_dir/$filename"
}

# Walkthrough order is Fear → Hope → Identity. Review clips are named by transition.
make_review_clip 105.6 5.8 "01-chamber-to-identity.webm"
make_review_clip 130.6 5.6 "02-identity-return.webm"
make_review_clip 25.4 6.0 "03-chamber-to-fear.webm"
make_review_clip 65.1 5.6 "04-fear-return.webm"
make_review_clip 72.6 6.0 "05-chamber-to-hope.webm"
make_review_clip 98.1 5.6 "06-hope-return.webm"
make_review_clip 153.8 15.0 "07-reconstruction-to-final-world.webm"
