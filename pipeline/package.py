# Gom các thư mục tập (dist/NN_Pxxx_...) thành 6 thư mục lớn 10 tập rồi nén zip từng thư mục lớn.
# python3 pipeline/package.py dist release
import json, os, shutil, sys, zipfile

src, out = sys.argv[1], sys.argv[2]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
eps = [e['Video_ID'] for e in json.load(open(os.path.join(ROOT, 'pipeline', 'episodes.json'), encoding='utf-8'))]
os.makedirs(out, exist_ok=True)
have = {d.split('_')[1]: d for d in os.listdir(src) if os.path.isdir(os.path.join(src, d)) and os.path.exists(os.path.join(src, d, 'anh_bia.png'))}
rows, missing = [], []
for b in range(0, len(eps), 10):
    chunk = eps[b:b + 10]
    big = f'Phan_{b // 10 + 1:02d}_{chunk[0]}-{chunk[-1]}'
    bdir = os.path.join(out, big); os.makedirs(bdir, exist_ok=True)
    for vid in chunk:
        if vid not in have: missing.append(vid); continue
        d = have[vid]; shutil.copytree(os.path.join(src, d), os.path.join(bdir, d), dirs_exist_ok=True)
        dur = open(os.path.join(src, d, '.duration')).read().strip() if os.path.exists(os.path.join(src, d, '.duration')) else '?'
        rows.append(f'{d} | {float(dur):.0f}s' if dur != '?' else d)
    zp = os.path.join(out, big + '.zip')
    with zipfile.ZipFile(zp, 'w', zipfile.ZIP_STORED) as z:
        for r, _, files in os.walk(bdir):
            for f in sorted(files):
                if f.startswith('.'): continue
                p = os.path.join(r, f); z.write(p, os.path.relpath(p, out))
    shutil.rmtree(bdir)
    print('zip', zp, os.path.getsize(zp) // 1_000_000, 'MB')
notes = f"Đã dựng {len(rows)}/{len(eps)} video.\n\n" + '\n'.join(f'- {r}' for r in rows)
if missing: notes += '\n\nCHƯA XONG: ' + ', '.join(missing)
open(os.path.join(out, 'NOTES.md'), 'w', encoding='utf-8').write(notes)
print(notes)
