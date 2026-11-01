// auto.js — bộ shot dựng sẵn theo tham số cho series "Tớ là Phaolo".
// Mỗi shot trong story/shots.json có params.tpl (hook, wide, two, ots, close, insert, fact, freeze, church, lesson, walk, end)
// và các tham số khác do pipeline/plan.py sinh ra. Phong cách: người que What If, bảng màu pastel.
import { E, registerShot, layer, blurLayer, veil, ease, prog, key, talkAmount, shake, glow, rr, alpha, text, FONTS, clamp } from '/engine/core.js';
import { POSES, posesAt, breathe, walkPose } from '/engine/rig2d.js';
import { drawChibi, chibiClose, chibiHead, blinkAt, signCross } from '/engine/stick.js';
import { CHA, ME, BO, NA, EXTRA } from '/engine/cg-cast.js';
import { bedroom, livingRoom, kitchen, churchInside, churchOutside, classroom, office, street, park, dream,
  cross, candle, bible, rosaryProp, dove, heart, churchIcon, maryStatue, keyLight, fgBlur, atmosphere, box } from '/engine/cg-sets.js';
import { say, emote, hook, factCard, lessonLine, labelTag, timeTag, endQuestion, freeze } from '/engine/cg-ui.js';

// ---- nhân vật chính của series: Phaolo, dân văn phòng trẻ. Áo thun xanh ngọc, quần xanh than, tóc mái lệch. ----
export const PHAOLO = { name: 'Phaolo', skin: '#f2bf98', hair: { style: 'side', color: '#2a2224' },
  top: { type: 'tshirt', color: '#5fc4b0' }, legs: { type: 'pants', color: '#45507a' }, shoes: '#ffffff',
  stick: { top: 'tshirt', color: '#5fc4b0', legs: '#45507a', head: 'none' } };
const DUY = { ...EXTRA.huy, name: 'Duy', stick: { top: 'hoodie', color: '#ffa86a', head: 'curly' } };
const CAST = { na: NA, cha: CHA, me: ME, bo: BO, chiLan: EXTRA.chiLan, anhKhoa: EXTRA.anhKhoa, huy: DUY, baNoi: EXTRA.baNoi,
  ongNoi: EXTRA.ongNoi, soAnna: EXTRA.soAnna, coThao: EXTRA.coThao, ty: EXTRA.ty };
const partnerChar = (k) => CAST[k] || null;

const SETS = { bedroom, livingRoom, kitchen, churchInside, churchOutside, classroom, office, street, park, dream };
// nguồn sáng chính từng set (để quay viền sáng của nhân vật về phía nguồn)
const RIMDIR = { bedroom: [0.6, -0.7], livingRoom: [-0.7, -0.6], kitchen: [0.7, -0.6], churchInside: [0, -1], churchOutside: [-0.6, -0.8],
  classroom: [0.7, -0.6], office: [0, -1], street: [-0.6, -0.8], park: [-0.6, -0.8], dream: [0, -1] };
const FG = { bedroom: 'plant', livingRoom: 'flowers', kitchen: 'cup', churchInside: 'candle', churchOutside: 'plant', classroom: 'plant',
  office: 'cup', street: 'plant', park: 'flowers', dream: null };
const drawSet = (g, t, cam, name, opt = {}) => (SETS[name] || livingRoom)(g, t, cam, opt);
const rimOf = (set) => ({ dir: RIMDIR[set] || [-0.7, -0.6] });
const exprAt = (t, list, def = 'neutral') => { if (!list) return def; if (typeof list === 'string') return list; let e = def; for (const [tt, v] of list) if (t >= tt) e = v; return e; };
const talkOf = (info, who) => (info.talk && info.talk.who === who ? talkAmount(info.globalT, info.talk.from, info.talk.to) : 0);
const pose = (t, info, list, seed) => breathe(Array.isArray(list) ? posesAt(t, list) : (POSES[list] || POSES.stand), t, 1, seed);
function camOf(info, t, base = {}) { const p = ease.inOut(info.p), d = info.camDir || 1, mv = info.cam || 'push';
  const c = { z: 1, x: 0, y: 0, ...base };
  if (mv === 'push') c.z += 0.07 * p; else if (mv === 'pull') c.z += 0.08 * (1 - p); else if (mv === 'slide') c.x += d * (-40 + 80 * p);
  c.x += d * 12 * Math.sin(t * 0.4); return c; }
function deco(g, t, info) {
  if (info.tag) timeTag(g, t, { str: info.tag, dur: info.dur });
}
function emoteOn(g, t, info, head, side = 1) { if (!info.emote) return; const [hx, hy, hr] = head; const at = info.emoteAt ?? 0.4;
  if (t > at) emote(g, hx + side * hr * 1.05, hy - hr * 1.15, info.emote, t - at, 1.1); }
function nameTag(g, info, who, head) { if (!info.label || info.label.who !== who) return; const [hx, hy, hr] = head; labelTag(g, { str: info.label.str, x: hx, y: hy - hr - 70 }); }

// ---------- templates ----------
const T = {};

T.hook = (g, t, info) => {
  const cam = { z: 1.04 + 0.06 * ease.inOut(info.p), x: -20, ...(t < 0.6 ? (([x, y]) => ({ x: x - 20, y }))(shake(t, 4, 9)) : {}) };
  const { GY, CX } = drawSet(g, t, cam, info.set, info.setOpt);
  let head;
  layer(g, cam, 1, g => { const o = { x: CX - 250, y: GY + 60, s: 2.3, char: PHAOLO, facing: 1, pose: pose(t, info, [[0, 'think'], [1.4, 'shrug']], 2),
    expr: exprAt(t, info.expr, 'confused'), blink: blinkAt(t, 3.1), rim: rimOf(info.set) }; drawChibi(g, o); head = chibiHead(o);
    emote(g, head[0] + head[2] * 1.1, head[1] - head[2] * 1.2, '?', t - 0.5, 1.2); });
  if (FG[info.set]) fgBlur(g, t, cam, FG[info.set], E.W * 0.86);
  hook(g, t - 0.15, { kicker: info.kicker || 'TẠI SAO', lines: info.hookLines, dur: info.dur - 0.1, y: E.H * 0.17 });
};

T.wide = (g, t, info) => {
  const cam = camOf(info, t, { z: 0.98 });
  const { GY, CX } = drawSet(g, t, cam, info.set, info.setOpt);
  const P = partnerChar(info.partner);
  layer(g, cam, 1, g => {
    const hx = P ? CX - 230 : CX + (info.camDir || 1) * (info.set === 'office' ? 340 : 230);
    const sign = info.sign ? (() => { const q = signCross(t - 0.3, Math.min(2.6, info.dur - 0.4)); return q; })() : null;
    const o = { x: hx, y: GY + 80, s: P ? 1.9 : 2.3, char: PHAOLO, facing: P ? 1 : -(info.camDir || 1), pose: sign || pose(t, info, info.pose || 'relaxed', 2), expr: exprAt(t, info.expr, 'neutral'),
      talk: talkOf(info, 'hero'), blink: blinkAt(t, 3.2), rim: rimOf(info.set), prop: info.prop };
    drawChibi(g, o); const h = chibiHead(o); emoteOn(g, t, info, h); nameTag(g, info, 'hero', h);
    if (P) { const p = { x: CX + 240, y: GY + 50, s: 1.9, char: P, facing: -1, pose: pose(t, info, info.pose2 || 'stand', 5), expr: exprAt(t, info.expr2, 'smile'),
      talk: talkOf(info, 'partner'), blink: blinkAt(t, 3.7, 2), rim: rimOf(info.set) }; drawChibi(g, p); nameTag(g, info, 'partner', chibiHead(p)); }
  });
  if (FG[info.set] && info.fg !== false) fgBlur(g, t, cam, FG[info.set], (info.camDir || 1) > 0 ? E.W * 0.1 : E.W * 0.9);
  deco(g, t, info);
};

T.two = (g, t, info) => {
  const cam = camOf(info, t, { z: 1.05 });
  const { GY, CX } = drawSet(g, t, cam, info.set, info.setOpt);
  const P = partnerChar(info.partner) || DUY;
  let hh, ph;
  layer(g, cam, 1, g => {
    const a = { x: CX - 230, y: GY + 120, s: 2.6, char: PHAOLO, facing: 1, pose: pose(t, info, info.pose || 'talk', 2), expr: exprAt(t, info.expr, 'neutral'),
      talk: talkOf(info, 'hero'), blink: blinkAt(t, 3.2), rim: rimOf(info.set), prop: info.prop };
    const b = { x: CX + 240, y: GY + 120, s: 2.6, char: P, facing: -1, pose: pose(t, info, info.pose2 || 'relaxed', 5), expr: exprAt(t, info.expr2, 'neutral'),
      talk: talkOf(info, 'partner'), blink: blinkAt(t, 3.7, 2), rim: rimOf(info.set) };
    drawChibi(g, a); drawChibi(g, b); hh = chibiHead(a); ph = chibiHead(b);
    emoteOn(g, t, info, info.emoteWho === 'partner' ? ph : hh, info.emoteWho === 'partner' ? 1 : -1);
    nameTag(g, info, 'hero', hh); nameTag(g, info, 'partner', ph);
  });
  if (info.bubble) { const h = info.bubble.who === 'partner' ? ph : hh; say(g, t, { x: E.W / 2, y: h[1] - h[2] - 230, str: info.bubble.str, start: 0.1, dur: info.dur - 0.15, tail: [h[0], h[1] - h[2]], maxW: 820 }); }
  if (FG[info.set]) fgBlur(g, t, cam, FG[info.set], E.W * 0.08);
  deco(g, t, info);
};

T.ots = (g, t, info) => {
  const cam = camOf(info, t, { z: 1.08 });
  const { GY, CX } = drawSet(g, t, cam, info.set, info.setOpt);
  const P = partnerChar(info.partner);
  const front = info.who === 'partner' || !P ? 'hero' : 'partner'; // người ở tiền cảnh (mờ)
  const C = info.who === 'partner' && P ? P : PHAOLO, back = C === PHAOLO ? P : PHAOLO;
  let h;
  layer(g, cam, 1, g => { const o = { x: CX + 130, y: GY + 130, s: 2.8, char: C, facing: -1, pose: pose(t, info, info.pose || 'talk', 3), expr: exprAt(t, info.expr, 'neutral'),
    talk: talkOf(info, C === PHAOLO ? 'hero' : 'partner'), blink: blinkAt(t, 3.4), rim: rimOf(info.set), prop: info.prop }; drawChibi(g, o); h = chibiHead(o); emoteOn(g, t, info, h); });
  if (back) fgBlur(g, t, cam, 'shoulder', E.W * 0.12, { color: back.stick.color, y: E.H * 1.08, s: 2.0 });
  else if (FG[info.set]) fgBlur(g, t, cam, FG[info.set], E.W * 0.12);
  if (info.bubble) say(g, t, { x: E.W / 2 + 60, y: h[1] - h[2] - 220, str: info.bubble.str, start: 0.1, dur: info.dur - 0.15, tail: [h[0], h[1] - h[2]], maxW: 820 });
  deco(g, t, info);
  void front;
};

T.mid = (g, t, info) => {
  const cam = camOf(info, t, { z: 1.0 });
  const { GY, CX } = drawSet(g, t, cam, info.set, info.setOpt);
  let h;
  layer(g, cam, 1, g => { const sign = info.sign ? signCross(t - 0.3, Math.min(2.6, info.dur - 0.4)) : null;
    const o = { x: CX - (info.camDir || 1) * 120, y: GY + 520, s: 3.6, char: PHAOLO, facing: info.camDir || 1, pose: sign || pose(t, info, info.pose || 'explain', 6),
    expr: exprAt(t, info.expr, 'neutral'), talk: talkOf(info, 'hero'), blink: blinkAt(t, 3.0, 4), rim: rimOf(info.set), prop: info.prop };
    drawChibi(g, o); h = chibiHead(o); emoteOn(g, t, info, h, info.camDir || 1); });
  if (FG[info.set]) fgBlur(g, t, cam, FG[info.set], (info.camDir || 1) > 0 ? E.W * 0.9 : E.W * 0.1);
  deco(g, t, info);
};

T.close = (g, t, info) => {
  const cam = { z: 1 + 0.06 * ease.inOut(info.p) };
  blurLayer(g, 10, g => drawSet(g, t, { z: 1.3, x: (info.camDir || 1) * 240 }, info.set, info.setOpt));
  veil(g, '#ffffff', 0.12);
  const C = info.who === 'partner' && partnerChar(info.partner) ? partnerChar(info.partner) : PHAOLO;
  const r = 340, cx = E.W / 2 + (info.camDir || 1) * 20, cy = E.H * 0.5;
  layer(g, cam, 1, g => { chibiClose(g, cx, cy, r, { char: C, expr: exprAt(t, info.expr, 'neutral'), talk: talkOf(info, C === PHAOLO ? 'hero' : 'partner'),
    blink: blinkAt(t, 2.9), tilt: (info.tilt || 0) + 0.03 * Math.sin(t * 1.6), look: info.look }); });
  if (info.emote && t > (info.emoteAt ?? 0.3)) emote(g, cx + r * 1.0, cy - r * 1.05, info.emote, t - (info.emoteAt ?? 0.3), 1.3);
  deco(g, t, info);
};

function bigProp(g, t, kind, x, y, s) {
  const b = Math.sin(t * 1.4) * 8;
  switch (kind) {
    case 'cross': cross(g, x, y + 220 + b, s * 3.2, { color: '#ffd66e', glowC: '#fff6c8' }); break;
    case 'bible': bible(g, x, y + 80 + b, s * 2.6, true); break;
    case 'rosary': rosaryProp(g, x, y + b, s * 3.2); break;
    case 'candle': for (const [dx, h] of [[-140, 90], [0, 130], [140, 70]]) candle(g, x + dx, y + 260, s * 2.2, t, { h }); break;
    case 'heart': heart(g, x, y + b, s * 4.2); break;
    case 'dove': dove(g, x, y + b, s * 3.6, t); break;
    case 'church': churchIcon(g, x, y + 240 + b, s * 2.6); break;
    case 'mary': maryStatue(g, x, y + 300, s * 4.2); break;
    case 'phone': { g.save(); g.translate(x, y + b); g.rotate(-0.06);
      g.beginPath(); rr(g, -230, -400, 460, 800, 60); g.fillStyle = '#3a3448'; g.fill(); g.beginPath(); rr(g, -205, -370, 410, 740, 40); g.fillStyle = '#eaf6ff'; g.fill();
      const k = (n) => ease.outBack(prog(t, 0.3 + n * 0.45, 0.65 + n * 0.45));
      for (let n = 0; n < 4; n++) { const kk = k(n); if (kk <= 0) continue; const left = n % 2 === 0; g.save(); g.globalAlpha = clamp(kk); g.beginPath(); rr(g, left ? -175 : -35, -300 + n * 150, 210, 100, 30); g.fillStyle = left ? '#ffffff' : '#9fdcc8'; g.fill();
        g.fillStyle = alpha('#4a3848', 0.35); g.fillRect(left ? -150 : -10, -268 + n * 150, 150, 12); g.fillRect(left ? -150 : -10, -240 + n * 150, 100, 12); g.restore(); }
      g.restore(); break; }
    case 'calendar': { g.save(); g.translate(x, y + b); g.beginPath(); rr(g, -260, -260, 520, 520, 40); g.fillStyle = '#ffffff'; g.fill(); g.beginPath(); rr(g, -260, -260, 520, 130, 40); g.fillStyle = '#ff9a8a'; g.fill(); g.fillRect(-260, -170, 520, 40);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) { g.beginPath(); rr(g, -220 + j * 90, -100 + i * 85, 70, 60, 12); g.fillStyle = (i * 5 + j) % 7 === 6 ? '#ffd66e' : '#eef0f6'; g.fill(); } g.restore(); break; }
    case 'ticket': { g.save(); g.translate(x, y + b); g.rotate(0.08); g.beginPath(); rr(g, -320, -160, 640, 320, 26); g.fillStyle = '#fff3c8'; g.fill(); g.beginPath(); rr(g, -320, -160, 640, 80, 26); g.fillStyle = '#ff9a8a'; g.fill(); g.fillRect(-320, -110, 640, 30);
      for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(-230 + k * 92, 40, 38, 0, Math.PI * 2); g.fillStyle = '#ffffff'; g.fill(); text(g, String((k * 7 + 3) % 10), -230 + k * 92, 42, { size: 48, color: '#4a3848', font: FONTS.title }); } g.restore(); break; }
    default: cross(g, x, y + 220 + b, s * 3.2, { color: '#ffd66e', glowC: '#fff6c8' });
  }
}

T.insert = (g, t, info) => {
  blurLayer(g, 12, g => drawSet(g, t, { z: 1.35, x: (info.camDir || 1) * -200 }, info.set, info.setOpt));
  veil(g, '#fff8f0', 0.22);
  const z = 1 + 0.08 * ease.inOut(info.p);
  g.save(); g.translate(E.W / 2, E.H * 0.46); g.scale(z, z); g.translate(-E.W / 2, -E.H * 0.46);
  keyLight(g, t, E.W / 2 - 300, -100, { color: '#fff2c8', angle: 1.2, len: E.H * 1.1, a: 0.35 });
  glow(g, E.W / 2, E.H * 0.42, 520, '#fffbe8', 0.55);
  g.beginPath(); g.arc(E.W / 2, E.H * 0.4, 380, 0, Math.PI * 2); g.fillStyle = alpha(info.disc || '#c9b8f0', 0.55); g.fill();
  bigProp(g, t, info.prop || 'cross', E.W / 2, E.H * 0.38, 1);
  g.restore();
  atmosphere(g, t, { count: 26 });
  if (info.labelStr) labelTag(g, { str: info.labelStr, x: E.W / 2, y: E.H * 0.66, a: ease.out(prog(t, 0.3, 0.7)) });
  deco(g, t, info);
};

T.fact = (g, t, info) => {
  const cam = { z: 1 + 0.04 * ease.inOut(info.p) };
  const { GY, CX } = dream(g, t, cam, { symbol: null });
  layer(g, cam, 1, g => drawChibi(g, { x: CX + 250, y: GY + 210, s: 1.7, char: PHAOLO, facing: -1, pose: pose(t, info, [[0, 'think'], [1.5, 'pointUp']], 4),
    expr: exprAt(t, info.expr, 'thinking'), blink: blinkAt(t, 3.3), rim: { dir: [-0.3, -1] } }));
  const f = info.fact || {};
  factCard(g, t, { title: f.title, body: f.body, src: f.src, icon: f.icon || 'cross', start: 0.15, dur: info.dur, y: E.H * 0.36 });
};

T.freeze = (g, t, info) => {
  const frozen = 0.01; const cam = { z: 1.1 + 0.03 * ease.inOut(info.p), x: 0 };
  const { GY, CX } = drawSet(g, frozen, cam, info.set, info.setOpt);
  let h;
  layer(g, cam, 1, g => { const o = { x: CX - 200, y: GY + 120, s: 2.6, char: PHAOLO, facing: 1, pose: posesAt(t, [[0, info.pose || 'handsOnHead'], [1.2, 'facepalm']]),
    expr: exprAt(t, info.expr, 'shocked'), blink: 0, rim: rimOf(info.set) }; drawChibi(g, o); h = chibiHead(o); });
  freeze(g, t, { x: h[0], y: h[1], badge: info.badge || 'DỪNG HÌNH' });
  if (t > 0.5) emote(g, h[0] + h[2] * 1.1, h[1] - h[2] * 1.2, info.emote || '!', t - 0.5, 1.3);
  deco(g, t, info);
};

T.church = (g, t, info) => {
  const cam = camOf(info, t, { z: 1.02 });
  const { GY, CX } = churchInside(g, t, cam, info.setOpt || {});
  layer(g, cam, 1, g => { const o = { x: CX - 150, y: GY + 140, s: 2.3, char: PHAOLO, facing: 1, pose: pose(t, info, info.pose || 'sitPray', 2),
    expr: exprAt(t, info.expr, 'peaceful'), blink: blinkAt(t, 3.6), rim: { dir: [0.4, -1] } }; drawChibi(g, o); emoteOn(g, t, info, chibiHead(o)); });
  fgBlur(g, t, cam, 'pew', E.W * 0.5, { y: E.H * 1.12 });
  deco(g, t, info);
};

T.walk = (g, t, info) => {
  const d = info.camDir || 1; const cam = { z: 1.0, x: d * (-60 + 120 * info.p) };
  const { GY, CX } = drawSet(g, t, cam, info.set, info.setOpt);
  layer(g, cam, 1, g => { const x = CX + d * (-260 + 520 * ease.inOut(info.p)); const o = { x, y: GY + 70, s: 2.0, char: PHAOLO, facing: d, pose: walkPose(t * 7),
    expr: exprAt(t, info.expr, 'neutral'), blink: blinkAt(t, 3.0), rim: rimOf(info.set) }; drawChibi(g, o); emoteOn(g, t, info, chibiHead(o)); });
  deco(g, t, info);
};

T.lesson = (g, t, info) => {
  const cam = { z: 1 + 0.05 * ease.inOut(info.p) };
  const { GY, CX } = dream(g, t, cam, { symbol: info.symbol || null });
  layer(g, cam, 1, g => drawChibi(g, { x: CX, y: GY + 200, s: 2.1, char: PHAOLO, facing: 1, pose: pose(t, info, info.pose || 'openArms', 1),
    expr: exprAt(t, info.expr, 'peaceful'), blink: blinkAt(t, 3.6), rim: { dir: [0, -1] } }));
  lessonLine(g, t - 0.1, { lines: info.lesson, dur: info.dur - 0.05, y: E.H * 0.2 });
};

T.end = (g, t, info) => {
  const P = partnerChar(info.partner);
  endQuestion(g, t, { question: info.question, cast: P ? [PHAOLO, P] : [PHAOLO] });
};

for (const s of E.shots || []) {
  const tpl = s.params && s.params.tpl;
  if (tpl && T[tpl]) registerShot(s.id, { draw: (g, t, info) => T[tpl](g, t, info) });
}

// ---- ảnh bìa: config.cover = { hookLines, set, expr, emote } ----
registerShot('cover', { draw(g) {
  const c = (E.cfg && E.cfg.cover) || {};
  blurLayer(g, 8, g => drawSet(g, 0.5, { z: 1.2 }, c.set || 'livingRoom', c.setOpt || {}));
  veil(g, '#ffffff', 0.1);
  chibiClose(g, E.W / 2, E.H * 0.62, 360, { char: PHAOLO, expr: c.expr || 'shocked', look: [0, -0.3] });
  emote(g, E.W / 2 + 380, E.H * 0.42, c.emote || '?!', 1, 1.6);
  hook(g, 1, { kicker: c.kicker || 'TẠI SAO', lines: c.hookLines || ['?'], y: E.H * 0.16, dur: 99 });
  text(g, 'Tớ là Phaolo', E.W / 2, E.H * 0.93, { size: 52, color: '#ffffff', font: FONTS.title, stroke: 12, strokeColor: '#4a3848' });
}});
void box; void signCross; void key;
