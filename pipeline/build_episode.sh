#!/usr/bin/env bash
# Dựng trọn 1 tập: phân cảnh -> render 1080x1920 -> âm thanh -> ảnh bìa -> đóng gói thư mục.
# bash pipeline/build_episode.sh P061 [workers] [outdir]
set -euo pipefail
VID="$1"; WORKERS="${2:-3}"; OUTDIR="${3:-dist}"
REPO="$(cd "$(dirname "$0")/.." && pwd)"; STUDIO="$REPO/studio"
cd "$STUDIO"
mkdir -p projects
python3 "$REPO/pipeline/plan.py" --out projects "$VID"
P="projects/$VID"
node render.mjs --project "$P" --sheet --scale 0.3 > "$P/build/sheet.log" 2>&1 || true
node render.mjs --project "$P" --format jpeg --workers "$WORKERS" ${SCALE:+--scale $SCALE}
python3 audio/mix.py --project "$P" --out "$P/out/video.mp4"
python3 tools/make_cover.py --project "$P"
NAME=$(python3 - "$VID" <<'EOF'
import json, sys, os, re, unicodedata
vid = sys.argv[1]
eps = json.load(open(os.path.join(os.environ.get('REPO', '.'), 'pipeline', 'episodes.json'), encoding='utf-8'))
ids = [e['Video_ID'] for e in eps]; e = eps[ids.index(vid)]
s = unicodedata.normalize('NFD', e['Tieu_de_YouTube'].replace('đ', 'd').replace('Đ', 'D'))
s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
s = re.sub(r'[^A-Za-z0-9]+', '_', s).strip('_')[:50]
print(f"{ids.index(vid) + 1:02d}_{vid}_{s}")
EOF
)
DEST="$REPO/$OUTDIR/$NAME"; mkdir -p "$DEST"
cp "$P/out/video.mp4" "$DEST/${NAME}.mp4"
cp "$P/out/anh_bia.png" "$DEST/anh_bia.png"
cp "$P/out/thong_tin_dang_bai.txt" "$DEST/thong_tin_dang_bai.txt"
cp "$P/build/sheets/sheet_01.png" "$DEST/phan_canh_contact_sheet.png" 2>/dev/null || true
ffprobe -v error -show_entries format=duration -of csv=p=0 "$DEST/${NAME}.mp4" > "$DEST/.duration"
echo "DONE $NAME $(cat "$DEST/.duration")s"
