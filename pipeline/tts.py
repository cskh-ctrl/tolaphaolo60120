# Tạo giọng đọc Nam Minh (edge-tts) + mốc thời gian từng chữ cho mọi tập.
# python3 pipeline/tts.py [P061 P062 ...]   -> episodes/<ID>/voice.mp3, episodes/<ID>/words.json
import asyncio, json, os, re, sys, unicodedata
import edge_tts

VOICE = os.environ.get('VOICE', 'vi-VN-NamMinhNeural')
RATE = os.environ.get('RATE', '+0%')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EPS = json.load(open(os.path.join(ROOT, 'pipeline', 'episodes.json'), encoding='utf-8'))


def norm(w):
    w = unicodedata.normalize('NFC', w).lower()
    return re.sub(r'[^\w]', '', w)


def clean_script(s):
    s = unicodedata.normalize('NFC', s)
    s = s.replace('“', '"').replace('”', '"').replace('…', '...')
    return re.sub(r'\s+', ' ', s).strip()


async def one(ep, sem):
    vid = ep['Video_ID']; out = os.path.join(ROOT, 'episodes', vid); os.makedirs(out, exist_ok=True)
    mp3, wj = os.path.join(out, 'voice.mp3'), os.path.join(out, 'words.json')
    if os.path.exists(mp3) and os.path.exists(wj): return vid, 'skip'
    text = clean_script(ep['TTS_Full_Script'])
    async with sem:
        for attempt in range(4):
            try:
                com = edge_tts.Communicate(text, VOICE, rate=RATE, boundary='WordBoundary')
                audio, bounds = bytearray(), []
                async for ch in com.stream():
                    if ch['type'] == 'audio': audio += ch['data']
                    elif ch['type'] == 'WordBoundary':
                        bounds.append((ch['offset'] / 1e7, (ch['offset'] + ch['duration']) / 1e7, ch['text']))
                break
            except Exception as e:
                print(vid, 'retry', e); await asyncio.sleep(3 + attempt * 5)
        else:
            return vid, 'FAIL'
    # map boundaries (may merge/split tokens, no punctuation) onto script tokens (with punctuation)
    toks = text.split(' ')
    bnorm = []
    for s, e, w in bounds:
        parts = [p for p in w.split() if norm(p)] or [w]
        for k, p in enumerate(parts):
            d = (e - s) / len(parts); bnorm.append([s + k * d, s + (k + 1) * d, norm(p)])
    words, j = [], 0
    for tk in toks:
        n = norm(tk)
        if not n:  # pure punctuation token: glue onto previous
            if words: words[-1]['word'] += tk
            continue
        # search ahead a few boundaries for a match
        hit = None
        for k in range(j, min(j + 6, len(bnorm))):
            if bnorm[k][2] == n or (bnorm[k][2] and (n.startswith(bnorm[k][2]) or bnorm[k][2].startswith(n))):
                hit = k; break
        if hit is None:
            st = words[-1]['end'] + 0.02 if words else 0.05
            words.append({'word': tk, 'start': round(st, 3), 'end': round(st + 0.2, 3), 'interp': True})
            continue
        s, e = bnorm[hit][0], bnorm[hit][1]
        # number tokens etc. that span several boundaries ("2157" read as many words)
        k2 = hit
        while k2 + 1 < len(bnorm) and n.startswith(''.join(b[2] for b in bnorm[hit:k2 + 2])) and len(''.join(b[2] for b in bnorm[hit:k2 + 1])) < len(n):
            k2 += 1; e = bnorm[k2][1]
        words.append({'word': tk, 'start': round(s, 3), 'end': round(e, 3)})
        j = k2 + 1
    open(mp3, 'wb').write(audio)
    json.dump({'words': words}, open(wj, 'w', encoding='utf-8'), ensure_ascii=False)
    miss = sum(1 for w in words if w.get('interp'))
    return vid, f'{len(words)} words, {miss} interp, {words[-1]["end"]:.1f}s'


async def main():
    ids = sys.argv[1:]
    sem = asyncio.Semaphore(4)
    res = await asyncio.gather(*[one(ep, sem) for ep in EPS if not ids or ep['Video_ID'] in ids])
    for r in res: print(*r)

asyncio.run(main())
