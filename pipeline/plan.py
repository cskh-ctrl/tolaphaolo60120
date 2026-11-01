# Sinh project cho từng tập: config.json, story/shots.json (phân cảnh theo mẫu), timeline/words.json, captionLines,
# ảnh bìa và file nội dung đăng bài.  python3 pipeline/plan.py --studio <conggiao-2d-studio> P061 [P062 ...]
import argparse, json, os, re, shutil, subprocess, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EPS = {e['Video_ID']: e for e in json.load(open(os.path.join(ROOT, 'pipeline', 'episodes.json'), encoding='utf-8'))}

# partner (mã nhân vật trong auto.js), nhãn tên, set mặc định, đồ vật insert
EP = {
 'P061': (None, None, 'office', 'cross'), 'P062': ('huy', 'Duy', 'office', 'cross'), 'P063': ('chiLan', 'chị Thục', 'street', 'calendar'),
 'P064': (None, None, 'park', 'bible'), 'P065': ('chiLan', 'chị Ngân', 'office', 'cross'), 'P066': (None, None, 'churchInside', 'candle'),
 'P067': ('chiLan', 'chị Irina', 'office', 'calendar'), 'P068': ('chiLan', 'Thư', 'livingRoom', 'calendar'), 'P069': ('ty', 'Tí', 'livingRoom', 'heart'),
 'P070': (None, None, 'churchOutside', 'candle'), 'P071': ('ongNoi', 'cậu Tư', 'livingRoom', 'candle'), 'P072': (None, None, 'livingRoom', 'phone'),
 'P073': ('chiLan', 'chị Ngân', 'office', 'calendar'), 'P074': ('chiLan', 'Trâm', 'park', 'heart'), 'P075': ('huy', 'Phúc', 'livingRoom', 'cross'),
 'P076': ('ongNoi', 'bác Hai Lộc', 'livingRoom', 'heart'), 'P077': ('anhKhoa', 'anh Thịnh', 'churchInside', 'candle'), 'P078': ('anhKhoa', 'anh Toàn', 'street', 'candle'),
 'P079': ('huy', 'Duy', 'office', 'ticket'), 'P080': (None, None, 'street', 'heart'), 'P081': ('na', 'bé Na', 'livingRoom', 'candle'),
 'P082': (None, None, 'churchOutside', 'mary'), 'P083': ('huy', 'Huy', 'street', 'bible'), 'P084': ('bo', 'Bố', 'livingRoom', 'heart'),
 'P085': (None, None, 'classroom', 'phone'), 'P086': ('huy', 'Khoa', 'office', 'phone'), 'P087': ('huy', 'Huy', 'churchInside', 'bible'),
 'P088': (None, None, 'classroom', 'bible'), 'P089': (None, None, 'park', 'bible'), 'P090': ('chiLan', 'Thư', 'livingRoom', 'bible'),
 'P091': ('anhKhoa', 'bác sĩ Quang', 'office', 'phone'), 'P092': ('anhKhoa', 'anh Toàn', 'park', 'heart'), 'P093': (None, None, 'street', 'bible'),
 'P094': (None, None, 'office', 'calendar'), 'P095': (None, None, 'churchOutside', 'calendar'), 'P096': ('me', 'Mẹ', 'livingRoom', 'phone'),
 'P097': ('chiLan', 'chị Mỹ', 'kitchen', 'calendar'), 'P098': (None, None, 'bedroom', 'bible'), 'P099': ('huy', 'Phúc', 'street', 'dove'),
 'P100': ('baNoi', 'Bà ngoại', 'bedroom', 'candle'), 'P101': ('anhKhoa', 'Tùng', 'churchInside', 'candle'), 'P102': ('chiLan', 'Linh', 'kitchen', 'heart'),
 'P103': (None, None, 'bedroom', 'heart'), 'P104': ('chiLan', 'chị Hạnh', 'bedroom', 'heart'), 'P105': ('chiLan', 'Linh', 'kitchen', 'heart'),
 'P106': ('chiLan', 'Trinh', 'classroom', 'church'), 'P107': ('soAnna', 'sơ Mai', 'classroom', 'bible'), 'P108': (None, None, 'livingRoom', 'phone'),
 'P109': (None, None, 'park', 'heart'), 'P110': ('anhKhoa', 'anh Thắng', 'office', 'heart'), 'P111': (None, None, 'bedroom', 'phone'),
 'P112': ('anhKhoa', 'anh Toàn', 'street', 'heart'), 'P113': (None, None, 'bedroom', 'heart'), 'P114': (None, None, 'street', 'phone'),
 'P115': ('na', 'bé Na', 'churchOutside', 'mary'), 'P116': (None, None, 'churchInside', 'cross'), 'P117': ('chiLan', 'Diệp', 'street', 'church'),
 'P118': ('huy', 'Duy', 'office', 'dove'), 'P119': ('chiLan', 'chị Ngân', 'office', 'calendar'), 'P120': (None, None, 'park', 'heart'),
}

SET_KW = [
 ('churchInside', r'trong nhà thờ|vào nhà thờ|tới nhà thờ|đến nhà thờ|thánh lễ|đi lễ|tòa giải tội|phòng thánh|lễ giao thừa|nhà nguyện|hàng ghế'),
 ('office', r'sếp|báo cáo|công ty|văn phòng|đồng nghiệp|dòng code|máy tính|cuộc họp|phòng họp|trưởng phòng|email|bàn làm việc|phòng kinh doanh'),
 ('street', r'kẹt xe|xe máy|ngã tư|đèn đỏ|ngoài đường|trên đường|xe buýt|chạy xe|làn xe|xe tải|xe ôm|trạm xe'),
 ('kitchen', r'bữa cơm|mâm cơm|ăn cơm|bàn ăn|nhà bếp|quán chè|trà sữa|cơm trưa|bàn nhậu|ly rượu|bánh sinh nhật'),
 ('bedroom', r'giường|đi ngủ|thức dậy|nằm viện|bệnh viện|phòng khám|giường bệnh|mất ngủ'),
 ('park', r'công viên|ghế đá|sân bóng|bờ hồ|ven hồ|ngọn đồi|cánh đồng|đi dạo'),
 ('classroom', r'lớp học|giờ học|trường học|lớp giáo lý|bục giảng|giảng đường|chấm bài'),
 ('livingRoom', r'phòng khách|di ảnh|gian nhà|về nhà|hiên nhà|ngoài hiên'),
 ('churchOutside', r'sân nhà thờ|tháp chuông|hành hương|đền thánh|cổng nhà thờ'),
]
PROP_KW = [
 ('cross', r'thánh giá|thập giá|thập tự|làm dấu|tro'), ('bible', r'kinh thánh|tin mừng|phúc âm|cuốn sách|trang sách|chương \w+ câu'),
 ('rosary', r'tràng hạt|lần chuỗi|mân côi'), ('candle', r'ngọn nến|cây nến|thắp nến|nến'), ('phone', r'điện thoại|tin nhắn|zalo|màn hình|email|clip|đường link'),
 ('dove', r'thánh thần|bồ câu'), ('mary', r'đức mẹ|đức maria|mẹ maria'), ('calendar', r'tháng mười|tháng tư|tháng năm|lịch|ngày \w+ tháng|thứ hai|chúa nhật'),
 ('heart', r'yêu thương|tình yêu|thương|trái tim'), ('church', r'nhà thờ|giáo hội'),
]
TEACH = r'giáo lý|glhtcg|kinh thánh|phúc âm|tin mừng|giáo hội dạy|hội thánh dạy|giáo hội nói|hội thánh nói|công đồng|giáo hoàng|giáo luật|thánh augustinô|thánh tôma|điều răn|giáo huấn|thông điệp'
EXPR_KW = [
 (r'cười|vui|hớn hở|khoái', 'laugh', 'music'), (r'khóc|buồn|nghẹn|đau lòng|mất', 'sad', 'gloom'), (r'cáu|giận|bực|tức|hét|chửi|văng', 'angry', 'anger'),
 (r'xấu hổ|đỏ mặt|ngượng|ngại|sặc', 'embarrassed', 'sweat'), (r'sợ|lo|run|hoảng|toát mồ hôi', 'worried', 'sweat'), (r'cầu nguyện|lạy chúa|amen|làm dấu', 'pray', None),
 (r'yêu|thương|ấm|hiền', 'gentle', 'heart'), (r'bất ngờ|giật mình|sững|choáng|trời ơi|hả\b', 'shocked', '!'), (r'nghĩ|tự hỏi|thắc mắc|hiểu', 'thinking', 'idea'),
 (r'tự hào|thắng|vô địch|xong rồi', 'proud', 'sparkle'),
]
NUMS = {'một': 1, 'hai': 2, 'ba': 3, 'bốn': 4, 'năm': 5, 'sáu': 6, 'bảy': 7}
FREEZE_KW = r'xong rồi|gục|khựng|đứng hình|chết lặng|giật mình|sững|cứng họng|im bặt|im lặng|ngớ người|nhận ra|tớ chợt|bỗng'


def nfc(s): return unicodedata.normalize('NFC', s)
def low(s): return nfc(s).lower()
def slugify(s):
    s = unicodedata.normalize('NFD', s.replace('đ', 'd').replace('Đ', 'D'))
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-zA-Z0-9]+', '-', s).strip('-').lower()[:48]


def sentences(words):
    out, cur = [], []
    for i, w in enumerate(words):
        cur.append(i)
        t = w['word'].rstrip('"”’)')
        if re.search(r'[.!?…]$', t) or (re.search(r'[:]$', t) and i + 1 < len(words) and words[i + 1]['word'].startswith('"')):
            out.append(cur); cur = []
    if cur: out.append(cur)
    return out


def split_long(words, idx, maxd=6.2):
    d = words[idx[-1]]['end'] - words[idx[0]]['start']
    if d <= maxd or len(idx) < 6: return [idx]
    # cắt ở dấu phẩy gần giữa nhất
    best, bk = None, 1e9
    for k in range(2, len(idx) - 2):
        if re.search(r'[,;:]$', words[idx[k]]['word']):
            mid = words[idx[k]]['end'] - words[idx[0]]['start']
            if abs(mid - d / 2) < bk and mid > 1.6 and d - mid > 1.6: best, bk = k, abs(mid - d / 2)
    if best is None: return [idx]
    return split_long(words, idx[:best + 1], maxd) + split_long(words, idx[best + 1:], maxd)


def text_of(words, idx): return ' '.join(words[i]['word'] for i in idx)


def two_lines(s, maxw=26):
    w = s.split()
    if len(s) <= 18: return [s]
    best = min(range(1, len(w)), key=lambda k: abs(len(' '.join(w[:k])) - len(' '.join(w[k:]))))
    return [' '.join(w[:best]), ' '.join(w[best:])]


def hook_text(q):
    q = nfc(q).strip()
    m = re.match(r'^(Tại sao|Vì sao)\s+(.*)$', q)
    if m: return 'TẠI SAO', two_lines(m.group(2)[0].lower() + m.group(2)[1:] if not re.match(r'^(Chúa|Đức|Giáo|Thánh|Kinh|Mười|Ông)', m.group(2)) else m.group(2))
    return 'BẠN CÓ BIẾT?', two_lines(q)


def first_source(src):
    src = nfc(src or '')
    m = re.search(r'GLHTCG\s*(?:số\s*)?([\d\-–]+(?:\s*(?:và|,)\s*[\d\-–]+)?)', src)
    if m: return 'GLHTCG ' + re.sub(r'\s*và\s*', ', ', m.group(1)).strip(' ,')
    m = re.search(r'\b(Mt|Mc|Lc|Ga|Cv|Rm|1 Cr|2 Cr|Gl|Ep|Pl|Cl|Dt|Gc|1 Pr|Kh|St|Xh|Lv|Ds|Đnl|Tv|Is|Gr|Hc|Kn|Gv|1 Ga)\s*\d+[,\.]\s*[\d\-–]+', src)
    if m: return m.group(0)
    m = re.search(r'(Giáo luật[^;,(]*|Công đồng[^;,(]*|Thông điệp[^;,(]*|Tông huấn[^;,(]*)', src)
    if m: return m.group(1).strip()[:40]
    return None


def all_sources(src):
    src = nfc(src or ''); out = []
    for m in re.finditer(r'GLHTCG\s*(?:số\s*)?[\d\-–]+', src): out.append(re.sub(r'\s*số\s*', ' ', m.group(0)))
    for m in re.finditer(r'\b(Mt|Mc|Lc|Ga|Cv|Rm|1 Cr|Gl|Ep|Dt|Gc|Kh|St|Xh|Lv|Tv|Is|Hc|Kn|Gv)\s*\d+[,\.]\s*[\d\-–]+', src): out.append(m.group(0))
    seen = []
    for s in out:
        if s not in seen: seen.append(s)
    return seen


def plan(vid, studio, render_dir):
    ep = EPS[vid]; partner, plabel, dset, dprop = EP[vid]
    P = os.path.join(render_dir, vid); shutil.rmtree(P, ignore_errors=True)
    for d in ('input', 'timeline', 'story', 'scenes/shots', 'out', 'build'): os.makedirs(os.path.join(P, d), exist_ok=True)
    src_ep = os.path.join(ROOT, 'episodes', vid)
    shutil.copy(os.path.join(src_ep, 'voice.mp3'), os.path.join(P, 'input', 'voice.mp3'))
    shutil.copy(os.path.join(ROOT, 'pipeline', 'scenes', 'shots', 'auto.js'), os.path.join(P, 'scenes', 'shots', 'auto.js'))
    open(os.path.join(P, 'scenes', 'shots', '99_cover.js'), 'w').write('// ảnh bìa: shot "cover" được đăng ký trong auto.js (đọc config.cover)\n')
    words = json.load(open(os.path.join(src_ep, 'words.json'), encoding='utf-8'))['words']
    for w in words: w['word'] = w['word'].replace(' ', ''); w.pop('interp', None)
    json.dump({'words': words}, open(os.path.join(P, 'timeline', 'words.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    adur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', os.path.join(P, 'input', 'voice.mp3')], capture_output=True, text=True).stdout.strip())
    total = round(max(adur, words[-1]['end']) + 1.4, 2)

    # ---- câu -> cụm shot ----
    sents = []
    for s in sentences(words): sents += split_long(words, s)
    last_q = sents[-1]
    groups, cur = [], []
    for s in sents[:-1]:
        if cur and (words[s[-1]]['end'] - words[cur[0]]['start'] > 6.0): groups.append(cur); cur = []
        cur = cur + s
        if words[cur[-1]]['end'] - words[cur[0]]['start'] >= 2.6: groups.append(cur); cur = []
    if cur:
        if groups and words[cur[-1]]['end'] - words[cur[0]]['start'] < 1.6: groups[-1] = groups[-1] + cur
        else: groups.append(cur)
    groups.append(last_q)
    N = len(groups)
    texts = [text_of(words, g) for g in groups]
    lows = [low(t) for t in texts]

    # ---- vai trò đặc biệt ----
    roles = {0: 'hook', N - 1: 'end'}
    fact_idx = [i for i in range(2, N - 2) if re.search(TEACH, lows[i])]
    facts = []
    for i in fact_idx:
        if len(facts) < 2 and all(abs(i - j) > 3 for j in facts) and i not in roles: facts.append(i)
    for i in facts: roles[i] = 'fact'
    lesson = None
    for i in range(N - 2, int(N * 0.7), -1):
        if i not in roles and len(texts[i].split()) <= 14 and '"' not in texts[i] and '?' not in texts[i]: lesson = i; break
    if lesson: roles[lesson] = 'lesson'
    fz_c = [i for i in range(int(N * 0.25), int(N * 0.65)) if i not in roles and all(abs(i - j) > 1 for j in roles)]
    fz = next((i for i in fz_c if re.search(FREEZE_KW, lows[i])), None) or next((i for i in fz_c if len(texts[i].split()) <= 9), None) or (fz_c[len(fz_c) // 2] if fz_c else None)
    if fz is not None: roles[fz] = 'freeze'

    # ---- người nói trong các câu thoại (luân phiên, bắt đầu bằng bạn diễn) ----
    speaker_of_word = {}
    if partner:
        who, inq, qstart = 'partner', False, None
        for i, w in enumerate(words):
            if w['word'].startswith('"') and not inq: inq, qstart = True, i
            if inq: speaker_of_word[i] = who
            if inq and w['word'].rstrip('.,!?…').endswith('"'):
                inq = False; who = 'hero' if who == 'partner' else 'partner'

    shots, cur_set, last_tpl, rot, used_insert, church_used = [], dset, [], 0, -9, False
    shown_label = False
    music = []
    for i, g in enumerate(groups):
        st = 0 if i == 0 else round(words[g[0]]['start'] - 0.12, 3)
        en = total if i == N - 1 else round(words[groups[i + 1][0]]['start'] - 0.12, 3)
        L, T = lows[i], texts[i]
        # set
        narr = re.sub(r'"[^"]*"?', ' ', L)
        if i > 0:
            for name, kw in SET_KW:
                if re.search(kw, narr): cur_set = name; break
        p = {'set': cur_set, 'camDir': 1 if i % 2 == 0 else -1, 'cam': ['push', 'slide', 'pull', 'push'][i % 4]}
        if partner: p['partner'] = partner
        # biểu cảm + emote
        ex, em = None, None
        for kw, e1, e2 in EXPR_KW:
            if re.search(kw, L): ex, em = e1, e2; break
        if not ex: ex = 'confused' if '?' in T else ('surprised' if '!' in T else ['neutral', 'smile', 'thinking', 'smile'][i % 4])
        if not em and '?' in T: em = '?'
        p['expr'] = ex
        if em and i % 2 == 0: p['emote'] = em
        # tag thời gian
        m = re.match(r'^ngày (một|hai|ba|bốn|năm|sáu|bảy)[.,]', L)
        if m: p['tag'] = f'NGÀY {NUMS[m.group(1)]}'
        m = re.search(r'\bnăm (\d{3,4})\b', L) or re.search(r'(thế kỷ (?:thứ )?[\wà-ỹ]+)', L)
        if m and 'tag' not in p: p['tag'] = ('Năm ' + m.group(1)) if m.group(1).isdigit() else m.group(1)[0].upper() + m.group(1)[1:]
        # thoại
        spk = [speaker_of_word.get(k) for k in g if speaker_of_word.get(k)]
        talk_who = spk[0] if spk else None
        if talk_who:
            ks = [k for k in g if speaker_of_word.get(k) == talk_who]
            p['talk'] = {'who': talk_who, 'from': words[ks[0]]['start'], 'to': words[ks[-1]]['end']}
        prop_kind = next((k for k, kw in PROP_KW if re.search(kw, L)), None)
        role = roles.get(i)
        caps = True
        if role == 'hook':
            k, hl = hook_text(ep['Chu_de']); p.update(tpl='hook', kicker=k, hookLines=hl)
            sfx = [{'at': 0.25, 'name': 'pop', 'gain': -12}]
        elif role == 'end':
            p.update(tpl='end', question=nfc(T).replace('"', '')); caps = False; sfx = [{'at': 0.3, 'name': 'twinkle', 'gain': -12}]
        elif role == 'fact':
            body = nfc(T).replace('"', '')
            if len(body.split()) > 22:
                body = nfc(ep['Thong_diep_chinh']).split(':')[0].split(',')[0]
                if len(body.split()) > 22: body = ' '.join(body.split()[:20]) + '…'
            title = re.sub(r'\?$', '', nfc(ep['Chu_de']))
            title = title if len(title) <= 34 else (ep['Tieu_de_YouTube'] if len(ep['Tieu_de_YouTube']) <= 34 else 'Giáo lý nói gì?')
            icon = {'bible': 'bible', 'heart': 'heart', 'dove': 'dove', 'church': 'church'}.get(prop_kind or dprop, 'cross')
            src = first_source(ep['Nguon_tham_khao'])
            srcs = all_sources(ep['Nguon_tham_khao'])
            if len(facts) > 1 and i == facts[1] and len(srcs) > 1: src = srcs[1]
            p.update(tpl='fact', fact={'title': title, 'body': [body], 'src': src, 'icon': icon}, expr='thinking')
            sfx = [{'at': 0.2, 'name': 'shimmer', 'gain': -16}]
        elif role == 'lesson':
            p.update(tpl='lesson', lesson=two_lines(nfc(T).rstrip('.')), expr='peaceful', symbol={'dove': 'dove', 'heart': 'heart', 'bible': 'bible', 'church': 'church'}.get(dprop, 'cross'))
            caps = False; sfx = [{'at': 0.3, 'name': 'shimmer', 'gain': -14}]
        elif role == 'freeze':
            p.update(tpl='freeze', expr='shocked', emote='!', badge='DỪNG HÌNH'); sfx = [{'at': 0.05, 'name': 'shimmer', 'gain': -10}]
        else:
            opts = ['wide', 'close', 'two', 'ots', 'insert', 'mid'] if partner else ['wide', 'close', 'mid', 'insert', 'walk' if cur_set in ('street', 'park', 'churchOutside') else 'wide', 'mid', 'close']
            tpl = None
            if talk_who and partner: tpl = ['two', 'close', 'ots'][rot % 3]; rot += 1
            elif prop_kind and i - used_insert >= 3: tpl = 'insert'
            elif cur_set == 'churchInside' and not church_used: tpl = 'church'; church_used = True
            if not tpl:
                tpl = opts[i % len(opts)]
                if tpl == 'insert' and i - used_insert < 3: tpl = 'wide'
            if last_tpl[-2:] == [tpl, tpl]: tpl = 'wide' if tpl != 'wide' else 'close'
            if tpl == 'insert':
                used_insert = i; p['prop'] = prop_kind or dprop
            if tpl in ('close', 'ots') and talk_who: p['who'] = talk_who
            elif tpl == 'close' and partner and i % 3 == 0 and re.search(re.escape(low(plabel or '###')), L): p['who'] = 'partner'
            if tpl == 'church': p['pose'] = 'sitPray'; p['expr'] = 'peaceful'
            if tpl in ('wide', 'mid'): p['pose'] = ['relaxed', 'explain', 'think', 'shrug', 'pointUp', 'crossArms', 'handsHips', 'point', 'talk'][(i * 5) % 9]
            if tpl in ('wide', 'mid') and re.search(r'làm dấu|vạch dấu', L): p['sign'] = True; p['expr'] = 'pray'
            if tpl == 'insert': p['disc'] = '#7fb0e0' if p.get('prop') == 'dove' else ['#c9b8f0', '#a8d8f0', '#ffc8b8', '#b8e8c8'][i % 4]
            if re.search(PROP_KW[4][1], L) and tpl in ('wide', 'two', 'ots'): p['prop'] = 'phone'; p['pose'] = 'phone'
            # bong bóng thoại cho câu ngắn nằm trọn trong ngoặc
            if tpl in ('two', 'ots') and talk_who and T.startswith('"') and T.rstrip('.!?').endswith('"') and len(T.split()) <= 8 and T.count('"') == 2:
                p['bubble'] = {'who': talk_who, 'str': T.replace('"', '')}; caps = False
            p['tpl'] = tpl
            sfx = []
            if tpl == 'insert': sfx = [{'at': 0.2, 'name': 'blip', 'gain': -14}]
            elif tpl == 'church': sfx = [{'at': 0.1, 'name': 'churchbell', 'gain': -14}]
            elif p.get('emote') in ('!', 'sweat'): sfx = [{'at': 0.4, 'name': 'boing', 'gain': -14}]
            elif p.get('emote'): sfx = [{'at': 0.4, 'name': 'twinkle', 'gain': -16}]
        if partner and not shown_label and p['tpl'] in ('two', 'wide', 'ots') and plabel:
            p['label'] = {'who': 'partner', 'str': plabel}; shown_label = True
        last_tpl.append(p['tpl'])
        tr = {'type': 'cut'}
        if role == 'freeze': tr = {'type': 'flash', 'dur': 0.4}
        elif role in ('fact', 'lesson', 'end'): tr = {'type': 'fade', 'dur': 0.4}
        elif i > 0 and shots and shots[-1]['params']['set'] != p['set'] and p['tpl'] not in ('close', 'insert'): tr = {'type': 'whip', 'dur': 0.35, 'dir': p['camDir']}
        amb = {'office': ('roomtone', -27), 'street': ('city', -27), 'churchInside': ('murmur', -29), 'park': ('wind', -30)}.get(p['set'], ('roomtone', -28))
        shots.append({'id': f's{i + 1:02d}', 'start': st, 'end': en, 'line': nfc(T), 'scene': f"{p['tpl']} @ {p['set']}", 'set': p['set'],
                      'in': tr, 'sfx': sfx, 'amb': {'name': amb[0], 'gain': amb[1]} if p['tpl'] not in ('end', 'fact', 'lesson') else None,
                      'params': p, 'captions': caps})
    # nhạc
    reflective = ep['Dang_ke'].startswith(('F7', 'F4'))
    f0 = shots[facts[0]]['start'] if facts else total * 0.45
    music = [{'start': 0, 'end': round(total * 0.3, 2), 'mood': 'gentle' if reflective else 'cute', 'intensity': 0.5},
             {'start': round(total * 0.3, 2), 'end': round(max(f0, total * 0.42), 2), 'mood': 'reflect' if reflective else 'gentle', 'intensity': 0.5},
             {'start': round(max(f0, total * 0.42), 2), 'end': round(total * 0.75, 2), 'mood': 'sacred', 'intensity': 0.5},
             {'start': round(total * 0.75, 2), 'end': total, 'mood': 'gentle', 'intensity': 0.7}]
    title = nfc(ep['Chu_de'])
    json.dump({'title': title, 'duration': total, 'shots': shots, 'music': music}, open(os.path.join(P, 'story', 'shots.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

    # phụ đề: cụm ≤ 4 chữ, không vắt qua dấu câu
    lines, cur = [], []
    for k, w in enumerate(words):
        cur.append(w['word'])
        brk = re.search(r'[,.!?:;…"]$', w['word']) or (k + 1 < len(words) and words[k + 1]['start'] - w['end'] > 0.45)
        if brk or len(cur) >= 4:
            if not brk and len(cur) >= 4 and k + 1 < len(words) and re.search(r'[,.!?:;…"]$', words[k + 1]['word']) and len(cur) == 4:
                pass
            lines.append(' '.join(cur)); cur = []
    if cur: lines.append(' '.join(cur))
    # gộp cụm 1 chữ lẻ vào cụm trước nếu cùng câu
    merged = []
    for l in lines:
        if merged and len(l.split()) == 1 and not re.search(r'[.!?]$', merged[-1]) and len(merged[-1].split()) <= 4: merged[-1] += ' ' + l
        else: merged.append(l)
    k, hl = hook_text(ep['Chu_de'])
    cfg = {'title': title, 'lang': 'vi', 'aspect': '9:16', 'resolution': '1080p', 'fps': 24, 'style': 'pastel', 'voiceover': 'input/voice.mp3', 'script': None,
           'duration': total, 'captions': True, 'bars': 'none', 'fadeIn': 0.3, 'fadeOut': 0.6, 'music': {'enabled': True, 'gainDb': -19, 'seed': int(vid[1:])},
           'sfx': {'enabled': True, 'gainDb': -6}, 'loudness': -14, 'captionLines': merged,
           'cover': {'kicker': k, 'hookLines': hl, 'set': dset, 'expr': ['shocked', 'confused', 'surprised', 'worried'][int(vid[1:]) % 4], 'emote': '?!'}}
    json.dump(cfg, open(os.path.join(P, 'config.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    # thông tin đăng bài
    hashtags = nfc(ep['Hashtags'])
    q = nfc(groups and texts[-1]).replace('"', '')
    info = f"""=== VIDEO {vid} ===
Chủ đề: {title}
Dạng kể: {ep['Dang_ke']}
Thời lượng: {total:.0f} giây

=== TIÊU ĐỀ (chọn 1) ===
1. {nfc(ep['Tieu_de_YouTube'])}
2. {title}
3. {nfc(ep['Tieu_de_YouTube'])} | Tớ là Phaolo

=== YOUTUBE SHORTS ===
Tiêu đề: {nfc(ep['Tieu_de_YouTube'])} #Shorts
Mô tả:
{nfc(ep['Mo_ta_YouTube'])}

{q}

Nguồn: {', '.join(all_sources(ep['Nguon_tham_khao'])) or first_source(ep['Nguon_tham_khao']) or 'xem bên dưới'}
{hashtags} #Shorts #CongGiao #GiaoLyCongGiao
Tags: {nfc(ep['YouTube_Tags'])}

=== TIKTOK ===
Caption: {nfc(ep['Tieu_de_YouTube'])}. {q} {hashtags} #conggiao #catholic #giaoly #fyp

=== FACEBOOK REELS ===
Caption: {nfc(ep['Thong_diep_chinh'])}
{q}
Nguồn: {', '.join(all_sources(ep['Nguon_tham_khao']))}
{hashtags}

=== BÌNH LUẬN GHIM ===
{nfc(ep['Binh_luan_ghim'])}

=== NGUỒN ===
{nfc(ep['Nguon_tham_khao'])}

=== LƯU Ý KIỂM CHỨNG (nội bộ, không đăng) ===
{nfc(ep['Luu_y_kiem_chung'])}
"""
    open(os.path.join(P, 'out', 'thong_tin_dang_bai.txt'), 'w', encoding='utf-8').write(info)
    return P, N, total


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--out', required=True); ap.add_argument('ids', nargs='*'); a = ap.parse_args()
    for vid in (a.ids or sorted(EPS)):
        P, N, total = plan(vid, None, a.out); print(vid, N, 'shots', f'{total:.1f}s', P)
