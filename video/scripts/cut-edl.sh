#!/bin/bash
# uso: cut-edl.sh <video> <edl.json> <saida.mp4>  — um trecho por vez, leve
set -e
export LC_ALL=C
IN="$1"; EDL="$2"; OUT="$3"; W=$(mktemp -d)
n=0
python3 -c "import json,sys;[print(a,b) for a,b in json.load(open(sys.argv[1]))]" "$EDL" | while read a b; do
  n=$((n+1)); f=$(printf "%s/p%03d.mp4" "$W" $n)
  dur=$(python3 -c "print(round($b-$a,3))"); fo=$(python3 -c "print(max(0,round($b-$a-0.03,3)))")
  nice -n 15 ffmpeg -v error -nostdin -y -ss "$a" -i "$IN" -t "$dur" -threads 2 \
    -c:v libx264 -preset veryfast -crf 17 -pix_fmt yuv420p -r 30 \
    -af "afade=t=in:d=0.03,afade=t=out:st=$fo:d=0.03" -c:a pcm_s16le -ar 48000 "${f%.mp4}.mov"
  echo "file '${f%.mp4}.mov'" >> "$W/lista.txt"
  if [ $((n % 10)) -eq 0 ]; then echo "trecho $n"; fi
done
nice -n 15 ffmpeg -v error -nostdin -y -f concat -safe 0 -i "$W/lista.txt" -c:v copy \
  -af "highpass=f=80,afftdn=nr=12:nf=-50,acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2,equalizer=f=3500:t=q:w=1.2:g=2,loudnorm=I=-16:TP=-2:LRA=9,alimiter=limit=0.8:level=false" \
  -threads 2 -c:a aac -b:a 192k -movflags +faststart "$OUT"
rm -rf "$W"
echo "pronto $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")"
