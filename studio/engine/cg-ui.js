// engine/cg-ui.js — pastel on-screen graphics for 60-second Catholic Shorts (9:16 first, V() aware).
//   say(g, t, o)          speech bubble with wrapped Vietnamese text (pops in, tail points to the speaker's head)
//   think(g, t, o)        thought bubble (cloud + small circles)
//   emote(g, x, y, type, t, s)  cartoon marks: '?', '!', '?!', 'zzz', 'sweat', 'heart', 'anger', 'sparkle', 'idea', 'music', 'gloom', 'shock'
//   hook(g, t, o)         big opening question "TẠI SAO…?" in a sticker banner
//   factCard(g, t, o)     knowledge card: icon + title + 1–3 short lines + source chip (GLHTCG 2180, Mt 18,20, GL 1247)
//   sourceChip(g, o)      small rounded source label (always show the source when a teaching is stated)
//   lessonLine(g, t, o)   the takeaway line, centered, gentle glow
//   endQuestion(g, t, o)  final comment question screen: bubble question + "Bình luận" pill + cast waving
//   labelTag(g, o)        small name tag under/over a character ("Bin", "Cha Minh") on first appearance
//   timeTag(g, t, o)      "Sáng Chúa Nhật" / "7 giờ sáng" corner tag for time/location
import { E, S, V, clamp, lerp, prog, ease, alpha, shade, mix, seg, circle, ring, rr, poly, text, measure, glow, linGrad, FONTS } from './core.js';
import { drawChibi, chibiHead } from './stick.js';
import { POSES, breathe } from './rig2d.js';
import { cross, heart, bible, churchIcon, dove } from './cg-sets.js';

const OUT = () => S().outline || '#4a3848';
const ow = (k = 1) => (S().tw ?? S().ow ?? 4.5) * k;        // text / emote-mark stroke (kept in the What If pastel look for legibility)
const sw = (k = 1) => (S().ow ?? 4.5) * k;                  // shape outlines (0 in the What If pastel look → clean cards with a soft shadow)
function ob(g, fill, k = 1) { if (sw(k) > 0.2) { g.fillStyle = fill; g.fill(); g.lineWidth = sw(k) * 2; g.strokeStyle = OUT(); g.lineJoin = 'round'; g.stroke(); g.fill(); return; }
  g.save(); g.shadowColor = 'rgba(40,24,56,0.22)'; g.shadowBlur = 26 * k; g.shadowOffsetY = 8 * k; g.fillStyle = fill; g.fill(); g.restore(); g.fillStyle = fill; g.fill(); }
const fadeIO = (t, dur, a = 0.25, b = 0.25) => clamp(Math.min(t / a, (dur - t) / b));
// wrap text into lines that fit maxW (word-based; works with Vietnamese spaces)
export function wrap(g, str, size, maxW, font = FONTS.ui, weight = 800) { const words = String(str).split(/\s+/); const lines = []; let cur = '';
  for (const w of words) { const test = cur ? cur + ' ' + w : w; if (measure(g, test, size, font, weight) > maxW && cur) { lines.push(cur); cur = w; } else cur = test; } if (cur) lines.push(cur); return lines; }

export function say(g, t, o = {}) {
  const { x = E.W / 2, y = E.H * 0.25, str = '…', start = 0, dur = 3, size = V(46, 54), maxW = V(620, 760), tail = null, color = '#ffffff', ink = OUT(), font = FONTS.ui, shout = false } = o;
  const lt = t - start; if (lt < 0 || lt > dur) return; const a = fadeIO(lt, dur, 0.15, 0.2), sc = ease.outBack(prog(lt, 0, 0.3));
  const lines = wrap(g, str, size, maxW, font, 800), lh = size * 1.28, w = Math.max(...lines.map(l => measure(g, l, size, font, 800))) + size * 1.3, h = lines.length * lh + size * 0.8;
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(sc, sc);
  g.beginPath(); if (shout) { const n = 18; for (let i = 0; i <= n; i++) { const an = i / n * Math.PI * 2, rx = w * 0.62 * (i % 2 ? 1 : 1.12), ry = h * 0.7 * (i % 2 ? 1 : 1.14); g.lineTo(Math.cos(an) * rx, Math.sin(an) * ry); } g.closePath(); } else rr(g, -w / 2, -h / 2, w, h, Math.min(h / 2, size * 0.9));
  ob(g, color, 1);
  if (tail) { const tx = tail[0] - x, ty = tail[1] - y, d = Math.hypot(tx, ty) || 1, ux = tx / d, uy = ty / d, bx = clamp(tx * 0.25, -w * 0.3, w * 0.3), by = uy > 0 ? h / 2 - 4 : -h / 2 + 4, end = [bx + ux * Math.min(d * 0.5, size * 1.6), by + uy * Math.min(d * 0.5, size * 1.6)];
    g.beginPath(); g.moveTo(bx - size * 0.35, by); g.lineTo(end[0], end[1]); g.lineTo(bx + size * 0.35, by); if (sw() > 0.2) { g.lineWidth = sw() * 2; g.strokeStyle = ink; g.lineJoin = 'round'; g.stroke(); } g.fillStyle = color; g.fill(); if (sw() > 0.2) g.fillRect(bx - size * 0.32, by - (uy > 0 ? sw() * 2.2 : -sw() * 0.2), size * 0.64, sw() * 2); }
  lines.forEach((l, i) => text(g, l, 0, -((lines.length - 1) * lh) / 2 + i * lh, { size, color: ink, font, weight: 800 }));
  g.restore();
}
export function think(g, t, o = {}) {
  const { x = E.W / 2, y = E.H * 0.25, str = '…', start = 0, dur = 3, size = V(44, 50), maxW = V(560, 680), from = null, color = '#ffffff' } = o;
  const lt = t - start; if (lt < 0 || lt > dur) return; const a = fadeIO(lt, dur, 0.2, 0.2), sc = ease.outBack(prog(lt, 0, 0.35));
  const lines = wrap(g, str, size, maxW), lh = size * 1.28, w = Math.max(...lines.map(l => measure(g, l, size, FONTS.ui, 800))) + size * 1.6, h = lines.length * lh + size * 1.1;
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(sc, sc); g.beginPath();
  const n = 12; for (let i = 0; i < n; i++) { const an = i / n * Math.PI * 2, cx = Math.cos(an) * w * 0.46, cy = Math.sin(an) * h * 0.46, r = Math.min(w, h) * 0.24; g.moveTo(cx + r, cy); g.arc(cx, cy, r, 0, Math.PI * 2); } g.moveTo(w * 0.46, 0); g.ellipse(0, 0, w * 0.48, h * 0.48, 0, 0, Math.PI * 2);
  if (sw() > 0.2) { g.lineWidth = sw() * 2; g.strokeStyle = OUT(); g.stroke(); g.fillStyle = color; g.fill(); } else ob(g, color);
  if (from) { const fx = from[0] - x, fy = from[1] - y; for (let k = 1; k <= 2; k++) { g.beginPath(); g.arc(fx * (0.45 + k * 0.17), fy * (0.45 + k * 0.17), size * (0.32 - k * 0.09), 0, Math.PI * 2); ob(g, color); } }
  lines.forEach((l, i) => text(g, l, 0, -((lines.length - 1) * lh) / 2 + i * lh, { size, color: OUT(), font: FONTS.ui, weight: 800 }));
  g.restore();
}
export function emote(g, x, y, type, t = 0, s = 1) {
  const b = Math.sin(t * 6) * 6 * s, pop = ease.outBack(clamp(t / 0.25)); g.save(); g.translate(x, y + b); g.scale(s * pop, s * pop);
  const T = (str, c, sz = 90, rot = 0) => { g.save(); g.rotate(rot); text(g, str, 0, 0, { size: sz, color: c, font: FONTS.title, weight: 700, stroke: ow(1.6) * 2, strokeColor: OUT() }); g.restore(); };
  switch (type) {
    case '?': T('?', '#8ec5ea', 100, 0.15); break; case '!': T('!', '#ff7a8a', 100, -0.1); break; case '?!': T('?!', '#ffb43c', 90, 0.1); break;
    case 'zzz': for (let k = 0; k < 3; k++) { const ph = (t * 0.8 + k / 3) % 1; g.save(); g.globalAlpha *= Math.sin(ph * Math.PI); text(g, 'z', k * 26 + ph * 30, -ph * 90, { size: 40 + k * 14, color: '#8ec5ea', font: FONTS.title, stroke: 8, strokeColor: OUT() }); g.restore(); } break;
    case 'sweat': g.beginPath(); g.moveTo(0, -36); g.quadraticCurveTo(-24, 6, 0, 18); g.quadraticCurveTo(24, 6, 0, -36); ob(g, '#9fdcff'); break;
    case 'heart': heart(g, 0, 0, 0.8); heart(g, 44, -40, 0.45, '#ff9fb8'); break;
    case 'anger': for (let k = 0; k < 4; k++) { g.save(); g.rotate(k * Math.PI / 2); g.beginPath(); g.moveTo(8, -8); g.quadraticCurveTo(14, -30, 34, -34); g.lineWidth = 12 + ow() * 2; g.strokeStyle = OUT(); g.lineCap = 'round'; g.stroke(); g.lineWidth = 12; g.strokeStyle = '#ff5a6a'; g.stroke(); g.restore(); } break;
    case 'sparkle': for (const [dx, dy, r] of [[0, 0, 30], [40, -30, 16], [-36, -24, 12]]) { g.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + t, rr2 = k % 2 ? r * 0.35 : r; g.lineTo(dx + Math.cos(a) * rr2, dy + Math.sin(a) * rr2); } g.closePath(); ob(g, '#ffe08a', 0.7); } break;
    case 'idea': { glow(g, 0, -10, 90, '#fff2a0', 0.6); g.beginPath(); g.arc(0, -16, 30, Math.PI * 0.8, Math.PI * 2.2); g.lineTo(12, 22); g.lineTo(-12, 22); g.closePath(); ob(g, '#ffe08a'); g.beginPath(); rr(g, -12, 22, 24, 14, 4); ob(g, '#c8c8d8', 0.7); for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.55; seg(g, [[Math.cos(a) * 44, -16 + Math.sin(a) * 44], [Math.cos(a) * 62, -16 + Math.sin(a) * 62]], 6, OUT()); } break; }
    case 'music': T('♪', '#c9a8ec', 80, -0.2); g.translate(46, -30); T('♫', '#8ec5ea', 60, 0.2); break;
    case 'gloom': for (let k = 0; k < 4; k++) seg(g, [[-48 + k * 32, -40], [-48 + k * 32, 10]], 6, alpha('#7a6a9a', 0.7)); break;
    case 'shock': for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + (k - 1) * 0.5; seg(g, [[Math.cos(a) * 20, Math.sin(a) * 20], [Math.cos(a) * 60, Math.sin(a) * 60]], 8 + ow() * 2, OUT()); seg(g, [[Math.cos(a) * 20, Math.sin(a) * 20], [Math.cos(a) * 60, Math.sin(a) * 60]], 8, '#ffe08a'); } break;
  }
  g.restore();
}
// opening hook: "TẠI SAO" sticker + the question (2 lines max). Keep it ≤ 2.5 s on screen.
export function hook(g, t, o = {}) {
  const { kicker = 'TẠI SAO', lines = ['phải đi lễ', 'Chúa Nhật?'], y = E.H * V(0.2, 0.17), dur = 3, color = '#ffb43c' } = o; const a = fadeIO(t, dur, 0.15, 0.3); if (a <= 0) return;
  g.save(); g.globalAlpha *= a; const sc = ease.outBack(prog(t, 0, 0.35)); g.translate(E.W / 2, y); g.scale(sc, sc); g.rotate(-0.03);
  const ks = V(54, 64), kw = measure(g, kicker, ks, FONTS.title, 700) + ks * 1.2; g.beginPath(); rr(g, -kw / 2, -ks * 0.75, kw, ks * 1.5, ks * 0.4); ob(g, '#ff7a8a'); text(g, kicker, 0, 0, { size: ks, color: '#ffffff', font: FONTS.title, spacing: 3 });
  const bs = V(80, 96); lines.forEach((l, i) => { const sz = Math.min(bs, (E.W * 0.9) / Math.max(1, measure(g, l, bs, FONTS.title, 700) / bs)); text(g, l, 0, ks * 1.6 + i * bs * 1.1, { size: sz, color: i === lines.length - 1 ? color : '#ffffff', font: FONTS.title, stroke: ow(2) * 2, strokeColor: OUT(), spacing: 1 }); });
  g.restore();
}
const ICONS = { cross: (g) => cross(g, 0, 46, 0.62, { color: '#ffd66e' }), heart: (g) => heart(g, 0, 6, 0.75), bible: (g) => bible(g, 0, 30, 0.6), church: (g) => churchIcon(g, 0, 48, 0.36), dove: (g) => dove(g, 0, 0, 0.42, 0) };
export function factCard(g, t, o = {}) {
  const { title = 'Ngày của Chúa', body = ['Chúa Nhật là ngày Chúa Phục Sinh.'], src = null, icon = 'cross', start = 0, dur = 4, y = E.H * V(0.42, 0.36), accent = '#8ec5ea' } = o;
  const lt = t - start; if (lt < 0 || lt > dur) return; const a = fadeIO(lt, dur, 0.2, 0.25), sc = 0.9 + 0.1 * ease.outBack(prog(lt, 0, 0.35));
  const W = V(1100, 920), ts = V(54, 60), bs = V(40, 46), lines = body.flatMap(b => wrap(g, b, bs, W - V(240, 120))), lh = bs * 1.35;
  const H = ts * 1.6 + lines.length * lh + (src ? bs * 1.8 : bs * 0.8) + (E.vertical ? 160 : 0);
  g.save(); g.globalAlpha *= a; g.translate(E.W / 2, y); g.scale(sc, sc);
  g.beginPath(); rr(g, -W / 2, -H / 2, W, H, 36); ob(g, S().ui.card, 1.2); g.beginPath(); rr(g, -W / 2, -H / 2, W, ts * 1.5 + (E.vertical ? 150 : 0), 36); g.save(); g.clip(); g.fillStyle = alpha(accent, 0.35); g.fillRect(-W / 2, -H / 2, W, H); g.restore();
  let yy = -H / 2 + (E.vertical ? 80 : ts * 0.8); const ix = E.vertical ? 0 : -W / 2 + 90;
  g.save(); g.translate(ix, yy); g.scale(1.1, 1.1); (ICONS[icon] || ICONS.cross)(g); g.restore();
  if (E.vertical) yy += 120; text(g, title, E.vertical ? 0 : ix + 70, yy, { size: ts, color: OUT(), font: FONTS.title, align: E.vertical ? 'center' : 'left' });
  yy += ts * 1.25; lines.forEach((l, i) => { const li = ease.out(prog(lt, 0.25 + i * 0.25, 0.55 + i * 0.25)); text(g, l, E.vertical ? 0 : -W / 2 + 90, yy + i * lh + (1 - li) * 14, { size: bs, color: S().ui.text, font: FONTS.ui, weight: 800, align: E.vertical ? 'center' : 'left', alpha: li }); });
  if (src) sourceChip(g, { str: src, x: 0, y: H / 2 - bs * 1.0, a: ease.out(prog(lt, 0.6, 0.9)) });
  g.restore();
}
export function sourceChip(g, o = {}) { const { str = 'GLHTCG 2180', x = E.W / 2, y = E.H * 0.9, size = V(30, 34), a = 1, color = '#fff3c8' } = o; if (a <= 0) return; const w = measure(g, str, size, FONTS.ui, 900) + size * 1.6; g.save(); g.globalAlpha *= a; g.beginPath(); rr(g, x - w / 2, y - size * 0.8, w, size * 1.6, size * 0.8); ob(g, color, 0.6); text(g, str, x, y, { size, color: OUT(), font: FONTS.ui, weight: 900 }); g.restore(); }
export function lessonLine(g, t, o = {}) { const { lines = ['Đi lễ là', 'đi gặp Người mình yêu.'], y = E.H * V(0.22, 0.2), dur = 4, color = '#ffffff' } = o; const a = fadeIO(t, dur, 0.4, 0.4); if (a <= 0) return; const s = V(70, 84);
  g.save(); g.globalAlpha *= a; lines.forEach((l, i) => { const k = ease.out(prog(t, 0.15 + i * 0.35, 0.6 + i * 0.35)); const sz = Math.min(s, (E.W * 0.9) / Math.max(1, measure(g, l, s) / s)); text(g, l, E.W / 2, y + i * s * 1.2 + (1 - k) * 20, { size: sz, color: i === lines.length - 1 ? '#ffb43c' : color, stroke: ow(2) * 2, strokeColor: OUT(), alpha: k, glow: 0 }); }); g.restore(); }
export function labelTag(g, o = {}) { const { str = 'Bin', x = E.W / 2, y = E.H / 2, color = '#ffffff', a = 1, size = V(34, 40) } = o; if (a <= 0) return; const w = measure(g, str, size, FONTS.ui, 900) + size * 1.2; g.save(); g.globalAlpha *= a; g.beginPath(); rr(g, x - w / 2, y - size * 0.75, w, size * 1.5, size * 0.75); ob(g, color, 0.7); text(g, str, x, y, { size, color: OUT(), font: FONTS.ui, weight: 900 }); g.restore(); }
export function timeTag(g, t, o = {}) { const { str = 'Sáng Chúa Nhật', x = V(60, 60), y = V(80, 220), dur = 99 } = o; const a = fadeIO(t, dur, 0.3, 0.3); if (a <= 0) return; const size = V(36, 42), w = measure(g, str, size, FONTS.ui, 900) + size * 1.4;
  g.save(); g.globalAlpha *= a; g.translate((1 - ease.out(prog(t, 0, 0.4))) * -w, 0); g.beginPath(); rr(g, x, y - size * 0.8, w, size * 1.6, 14); ob(g, '#fff3c8', 0.7); text(g, str, x + w / 2, y, { size, color: OUT(), font: FONTS.ui, weight: 900 }); g.restore(); }
// final screen: question (big, in a bubble) + comment pill + the cast of this episode waving
export function endQuestion(g, t, o = {}) {
  const { question = 'Bạn đi lễ vì bổn phận, thói quen hay vì muốn gặp Chúa?', cast = [], cta = 'Bình luận chia sẻ nhé!', bg = ['#ffe9f3', '#efe6ff', '#e2f3ff'] } = o;
  g.fillStyle = linGrad(g, 0, 0, 0, E.H, bg); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3); glow(g, E.W / 2, E.H * 0.35, E.W * 0.7, '#ffffff', 0.5);
  const qy = E.H * V(0.28, 0.27), size = V(58, 68); say(g, t, { x: E.W / 2, y: qy, str: question, start: 0.1, dur: 999, size, maxW: V(1300, 880), tail: [E.W / 2 - V(120, 80), qy + V(300, 380)] });
  const p = ease.outBack(prog(t, 0.6, 1.0)); g.save(); g.translate(E.W / 2, E.H * V(0.56, 0.5)); g.scale(p, p); const cs = V(44, 50), cw = measure(g, cta, cs, FONTS.ui, 900) + cs * 3; g.beginPath(); rr(g, -cw / 2, -cs, cw, cs * 2, cs); ob(g, '#ff7a8a'); text(g, cta, cs * 0.6, 0, { size: cs, color: '#ffffff', font: FONTS.ui, weight: 900 });
  g.beginPath(); rr(g, -cw / 2 + cs * 0.5, -cs * 0.55, cs * 1.3, cs * 1.0, cs * 0.3); ob(g, '#ffffff', 0.5); g.restore();
  const n = cast.length, gap = Math.min(V(300, 300), (E.W * 0.86) / Math.max(1, n)), y0 = E.H * V(0.93, 0.9);
  cast.forEach((ch, i) => { const k = ease.out(prog(t, 0.3 + i * 0.1, 0.7 + i * 0.1)), wave = Math.sin(t * 6 + i) * 0.5 + 0.5; const pose = { ...POSES.wave, hF: [36 + wave * 10, -236 + wave * 8] };
    drawChibi(g, { x: E.W / 2 + (i - (n - 1) / 2) * gap, y: y0 + (1 - k) * 60, s: V(1.8, 2.1), facing: i < n / 2 ? 1 : -1, char: ch, pose: breathe(pose, t, 1, i), expr: 'happy', alpha: k }); });
}

// freeze(g, t, o): What If time-stop overlay — cool tint, particles hanging in the air, slow rings around the hero, corner badge.
// Enter the shot with "in": {"type": "flash"} and a "shimmer"/"freeze" SFX; keep the world frozen and move only the hero.
export function freeze(g, t, o = {}) { const { x = E.W / 2, y = E.H * 0.45, badge = null, tint = '#bcd4ff', a = 0.16, seed = 7 } = o;
  g.save(); g.fillStyle = alpha(tint, a); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3); g.restore();
  const r = (k) => ((Math.sin(k * 127.1 + seed * 311.7) * 43758.5453) % 1 + 1) % 1;
  for (let i = 0; i < 46; i++) { const px = r(i) * E.W, py = r(i + 50) * E.H * 0.85, s = 3 + r(i + 99) * 9; g.fillStyle = alpha('#ffffff', 0.55 + 0.3 * r(i + 7)); g.beginPath(); g.arc(px + Math.sin(t * 0.3 + i) * 2, py, s, 0, Math.PI * 2); g.fill(); }
  for (let k = 0; k < 3; k++) { const ph = ((t * 0.35 + k / 3) % 1); g.strokeStyle = alpha('#ffffff', 0.5 * (1 - ph)); g.lineWidth = 3; g.beginPath(); g.arc(x, y, 120 + ph * 360, 0, Math.PI * 2); g.stroke(); }
  if (badge) { const sz = V(40, 48); text(g, badge, E.W - V(200, 230), V(110, 300), { size: sz, color: '#ffffff', font: FONTS.title, weight: 700, stroke: ow(1.4) * 2, strokeColor: OUT() }); }
}

