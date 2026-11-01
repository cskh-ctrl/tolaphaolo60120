// engine/chibi.js — cute pastel chibi character rig for the Catholic 2D studio (clear outlines, big heads, rich faces).
// Uses the same 11-point poses as rig2d.js (POSES, posesAt, breathe, walkPose all work) and maps them to chibi
// proportions. Local space: feet on y=0, up is -y, the figure faces +x. Height ≈ 250 units at s = 1 (kid ≈ 0.8x).
//
//   drawChibi(g, { x, y, s, facing, pose, rot, char, expr, talk, blink, look:[x,y], prop, alpha, shadow, squash })
//   chibiClose(g, cx, cy, r, { char, expr, talk, blink, look, tilt, hands:'pray'|null })   // giant close-up head
//   chibiHead(o) -> [x, y, r]   world position of the head centre (bubbles, emotes)
//   blinkAt(t, period, seed)    natural blinking
//   signCross(t, dur)           pose for the Sign of the Cross (forehead → chest → left → right shoulder)
//
// char (see cg-cast.js): { name, kid, adult, skin, hair:{style,color}, top:{type,color,color2}, legs:{type,color},
//   shoes, acc:['glasses','beard','mustache','stole:<colour>','backpack','rosary','collar'], belly }
// top.type: tshirt | shirt | polo | blouse | hoodie | sweater | blazer | aodai | cassock | alb | habit | uniform | dress
// legs.type: pants | shorts | skirt | longskirt
// hair.style: boy | short | side | bob | long | ponytail | bun | greyBun | bald | curly | veil | pigtails
import { E, S, clamp, lerp, mixVal, seg, circle, ring, alpha, shade, mix, rr, poly, ease } from './core.js';
import { POSES } from './rig2d.js';

// extra poses (stick-figure space, like rig2d POSES)
Object.assign(POSES, {
  pray:       { head: [5, -206], sh: [1, -174], hip: [0, -100], eF: [20, -142], hF: [24, -164], eB: [14, -142], hB: [22, -166], kF: [6, -50], fF: [3, 0], kB: [-6, -50], fB: [-11, 0] },
  handsHips:  { head: [3, -208], sh: [0, -174], hip: [0, -100], eF: [30, -138], hF: [12, -106], eB: [-26, -138], hB: [-12, -106], kF: [8, -50], fF: [10, 0], kB: [-8, -50], fB: [-14, 0] },
  stretch:    { head: [0, -212], sh: [0, -176], hip: [0, -100], eF: [14, -212], hF: [10, -252], eB: [-12, -212], hB: [-8, -252], kF: [6, -50], fF: [6, 0], kB: [-6, -50], fB: [-12, 0] },
  hold:       { head: [5, -207], sh: [1, -173], hip: [0, -100], eF: [20, -134], hF: [34, -140], eB: [14, -136], hB: [28, -142], kF: [6, -50], fF: [3, 0], kB: [-6, -50], fB: [-11, 0] },
  kneelPray:  { head: [8, -170], sh: [4, -136], hip: [0, -62], eF: [22, -104], hF: [26, -124], eB: [16, -104], hB: [24, -126], kF: [36, -46], fF: [36, 0], kB: [-6, -4], fB: [-48, 0] },
  sitPray:    { head: [6, -180], sh: [1, -146], hip: [0, -72], eF: [20, -112], hF: [24, -132], eB: [14, -112], hB: [22, -134], kF: [44, -74], fF: [46, 0], kB: [40, -72], fB: [38, 0] },
  hug:        { head: [8, -206], sh: [3, -173], hip: [0, -100], eF: [34, -150], hF: [52, -150], eB: [28, -152], hB: [44, -156], kF: [8, -50], fF: [8, 0], kB: [-6, -50], fB: [-12, 0] },
  bless:      { head: [4, -208], sh: [1, -174], hip: [0, -100], eF: [26, -180], hF: [40, -206], eB: [-7, -136], hB: [-9, -100], kF: [6, -50], fF: [3, 0], kB: [-6, -50], fB: [-11, 0] },
  openArms:   { head: [4, -208], sh: [1, -174], hip: [0, -100], eF: [30, -160], hF: [56, -170], eB: [-28, -160], hB: [-52, -170], kF: [6, -50], fF: [6, 0], kB: [-6, -50], fB: [-12, 0] },
  sleep:      { head: [3, -208], sh: [0, -174], hip: [0, -100], eF: [12, -150], hF: [20, -176], eB: [-10, -140], hB: [-14, -110], kF: [10, -52], fF: [6, 0], kB: [-2, -50], fB: [-6, 0] }, // with rot: -Math.PI/2 (lying in bed)
  sulk:       { head: [10, -196], sh: [4, -168], hip: [0, -100], eF: [18, -142], hF: [-4, -146], eB: [12, -144], hB: [10, -150], kF: [6, -50], fF: [3, 0], kB: [-6, -50], fB: [-11, 0] },
  tugBlanket: { head: [8, -200], sh: [4, -170], hip: [0, -100], eF: [24, -176], hF: [30, -200], eB: [18, -176], hB: [22, -204], kF: [8, -50], fF: [6, 0], kB: [-4, -50], fB: [-8, 0] },
});

const K = (c) => !!c?.kid;
// map a stick pose to chibi proportions
function chibiPose(p, ch) {
  const kid = K(ch), legK = kid ? 0.5 : 0.66, torK = kid ? 0.78 : 0.95, armK = kid ? 0.72 : 0.84;
  const hip = [p.hip[0], p.hip[1] * legK];
  const L = (q) => [hip[0] + (q[0] - p.hip[0]) * (kid ? 0.85 : 1), hip[1] + (q[1] - p.hip[1]) * legK];
  const sh = [hip[0] + (p.sh[0] - p.hip[0]) * torK, hip[1] + (p.sh[1] - p.hip[1]) * torK];
  const A = (q) => [sh[0] + (q[0] - p.sh[0]) * armK, sh[1] + (q[1] - p.sh[1]) * armK];
  const R = kid ? 54 : 50;
  const dx = p.head[0] - p.sh[0], dy = p.head[1] - p.sh[1], d = Math.hypot(dx, dy) || 1;
  const neck = R * (kid ? 0.78 : 0.92);
  const head = [sh[0] + (dx / d) * neck, sh[1] + (dy / d) * neck];
  // big chibi heads: keep hands/elbows from covering the face (push them just outside the head circle)
  const off = (q, k) => { const vx = q[0] - head[0], vy = q[1] - head[1], d2 = Math.hypot(vx, vy); if (d2 >= R * k) return q; if (d2 < 1e-3) return [head[0] + R * k, head[1]]; return [head[0] + vx / d2 * R * k, head[1] + vy / d2 * R * k]; };
  const hk = p.keepHands ? 0 : 1.18;
  return { head, R, sh, hip, eF: off(A(p.eF), hk * 0.95), hF: off(A(p.hF), hk), eB: off(A(p.eB), hk * 0.95), hB: off(A(p.hB), hk), kF: L(p.kF), fF: L(p.fF), kB: L(p.kB), fB: L(p.fB), tilt: Math.atan2(dx, -dy) * 0.5 };
}
const OUT = () => S().outline || S().ink;
const OW = () => S().ow || 4.5;
// outlined capsule polyline
function limb(g, pts, w, col, ow = OW()) { seg(g, pts, w + ow * 2, OUT()); seg(g, pts, w, col); }
function blob(g, fill, ow = OW()) { g.fillStyle = fill; g.fill(); g.lineWidth = ow * 2; g.strokeStyle = OUT(); g.lineJoin = 'round'; g.stroke(); g.fill(); }
function oCircle(g, x, y, r, fill, ow = OW()) { g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); g.lineWidth = ow * 2; g.strokeStyle = OUT(); g.stroke(); g.fillStyle = fill; g.fill(); }
function oEllipse(g, x, y, rx, ry, rot, fill, ow = OW()) { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2); g.lineWidth = ow * 2; g.strokeStyle = OUT(); g.stroke(); g.fillStyle = fill; g.fill(); }
const norm = (v) => { const d = Math.hypot(v[0], v[1]) || 1; return [v[0] / d, v[1] / d]; };
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
const pt = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

// ---------- faces ----------
export const CEXPR = {
  neutral: { eyes: 'dot', mouth: 'small' }, smile: { eyes: 'dot', mouth: 'smile' }, happy: { eyes: 'happy', mouth: 'grin', blush: 1 },
  joy: { eyes: 'happy', brows: 'raised', mouth: 'grin', blush: 1 }, laugh: { eyes: 'laugh', brows: 'raised', mouth: 'grin', blush: 1 },
  surprised: { eyes: 'wide', brows: 'raised', mouth: 'o' }, shocked: { eyes: 'wide', brows: 'raised', mouth: 'oBig', lines: 1 },
  scared: { eyes: 'wide', brows: 'worried', mouth: 'wavy', sweat: 1 }, worried: { eyes: 'dot', brows: 'worried', mouth: 'wavy' },
  nervous: { eyes: 'dot', brows: 'worried', mouth: 'flat', sweat: 1 }, angry: { eyes: 'dot', brows: 'angry', mouth: 'frown', red: 1 },
  annoyed: { eyes: 'half', brows: 'angry', mouth: 'flat' }, pout: { eyes: 'dot', brows: 'worried', mouth: 'pout', blush: 1 },
  determined: { eyes: 'dot', brows: 'angry', mouth: 'smile' }, sad: { eyes: 'dot', brows: 'worried', mouth: 'frown' },
  cry: { eyes: 'closed', brows: 'worried', mouth: 'cry', tears: 1 }, smirk: { eyes: 'half', mouth: 'smirk' },
  sleepy: { eyes: 'closed', mouth: 'small' }, asleep: { eyes: 'closed', mouth: 'o', drool: 1 }, yawn: { eyes: 'closed', brows: 'raised', mouth: 'yawn' },
  thinking: { eyes: 'dot', brows: 'confused', mouth: 'small', look: [0.5, -0.7] }, confused: { eyes: 'dot', brows: 'confused', mouth: 'wavy' },
  awe: { eyes: 'sparkle', brows: 'raised', mouth: 'o', blush: 1 }, love: { eyes: 'heart', mouth: 'grin', blush: 1 },
  peaceful: { eyes: 'closed', mouth: 'smile', blush: 0.6 }, pray: { eyes: 'closed', mouth: 'small', blush: 0.4 },
  gentle: { eyes: 'happy', mouth: 'smile', blush: 0.6 }, proud: { eyes: 'closed', brows: 'raised', mouth: 'grin', blush: 0.6 },
  guilty: { eyes: 'side', brows: 'worried', mouth: 'wavy', sweat: 1 }, embarrassed: { eyes: 'happy', brows: 'worried', mouth: 'wavy', blush: 1.4, sweat: 1 },
};
export const blinkAt = (t, period = 3.3, seed = 0) => ((t + seed * 0.77) % period) > period - 0.13;

// face(g, cx, cy, R, { expr, talk, blink, look, front })  — cx,cy = head centre, facing +x
export function chibiFace(g, cx, cy, R, o = {}) {
  const ex = { ...(CEXPR[o.expr] || CEXPR.neutral), ...(o.override || {}) };
  const ink = S().feature || '#3a2a38', front = !!o.front;
  const fx = cx + (front ? 0 : R * 0.2), ey = cy + R * 0.12;
  const look = o.look || ex.look || [0, 0];
  const eyeX = front ? [fx - R * 0.36, fx + R * 0.36] : [fx - R * 0.26, fx + R * 0.36];
  const es = (i) => (front ? 1 : i === 0 ? 0.86 : 1);
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  // blush first (under everything)
  const bl = ex.blush ?? 0.45;
  if (bl > 0) { g.fillStyle = alpha(S().blush || '#ff9fa8', 0.42 * Math.min(1.5, bl)); for (const [i, x] of eyeX.entries()) { g.beginPath(); g.ellipse(x + (i ? R * 0.08 : -R * 0.06), ey + R * 0.3, R * 0.15 * es(i), R * 0.08, 0, 0, Math.PI * 2); g.fill(); } }
  if (ex.red) { g.fillStyle = 'rgba(255,90,90,.18)'; g.beginPath(); g.ellipse(cx, cy - R * 0.2, R * 0.8, R * 0.5, 0, 0, Math.PI * 2); g.fill(); }
  const closed = o.blink || ex.eyes === 'closed';
  eyeX.forEach((x, i) => {
    const s = es(i), lx = look[0] * R * 0.06, ly = look[1] * R * 0.06;
    if (closed) { g.strokeStyle = ink; g.lineWidth = R * 0.07; g.beginPath(); g.arc(x, ey - R * 0.04, R * 0.12 * s, Math.PI * 0.15, Math.PI * 0.85); g.stroke(); return; }
    switch (ex.eyes) {
      case 'happy': g.strokeStyle = ink; g.lineWidth = R * 0.075; g.beginPath(); g.arc(x, ey + R * 0.06, R * 0.13 * s, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); break;
      case 'laugh': g.strokeStyle = ink; g.lineWidth = R * 0.075; g.beginPath(); g.moveTo(x - R * 0.12 * s, ey - R * 0.08); g.lineTo(x + R * 0.04 * s * (i ? -1 : 1), ey); g.lineTo(x - R * 0.12 * s, ey + R * 0.08); if (i) { g.beginPath(); g.moveTo(x + R * 0.12 * s, ey - R * 0.08); g.lineTo(x - R * 0.04 * s, ey); g.lineTo(x + R * 0.12 * s, ey + R * 0.08); } g.stroke(); break;
      case 'half': g.fillStyle = ink; g.beginPath(); g.ellipse(x + lx, ey + R * 0.03, R * 0.11 * s, R * 0.08, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = ink; g.fillRect(x - R * 0.16 * s, ey - R * 0.06, R * 0.32 * s, R * 0.035); break;
      case 'side': g.fillStyle = ink; g.beginPath(); g.ellipse(x - R * 0.06, ey, R * 0.1 * s, R * 0.14, 0, 0, Math.PI * 2); g.fill(); circle(g, x - R * 0.09, ey - R * 0.05, R * 0.035, '#fff'); break;
      case 'wide': circle(g, x, ey, R * 0.17 * s, '#ffffff'); ring(g, x, ey, R * 0.17 * s, R * 0.05, ink); circle(g, x + lx, ey + ly, R * 0.07 * s, ink); break;
      case 'sparkle': { g.fillStyle = ink; g.beginPath(); g.ellipse(x + lx, ey + ly, R * 0.13 * s, R * 0.17, 0, 0, Math.PI * 2); g.fill(); circle(g, x + lx - R * 0.04, ey + ly - R * 0.06, R * 0.055, '#fff'); circle(g, x + lx + R * 0.045, ey + ly + R * 0.05, R * 0.03, '#fff');
        const st = (sx, sy, r2) => { g.fillStyle = '#fff'; g.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, rr2 = k % 2 ? r2 * 0.35 : r2; g.lineTo(sx + Math.cos(a) * rr2, sy + Math.sin(a) * rr2); } g.closePath(); g.fill(); }; st(x + lx + R * 0.03, ey + ly - R * 0.02, R * 0.06); break; }
      case 'heart': { g.fillStyle = '#ff5a7a'; const hs = R * 0.13 * s; g.beginPath(); g.moveTo(x, ey + hs); g.bezierCurveTo(x - hs * 1.6, ey - hs * 0.2, x - hs * 0.6, ey - hs * 1.3, x, ey - hs * 0.4); g.bezierCurveTo(x + hs * 0.6, ey - hs * 1.3, x + hs * 1.6, ey - hs * 0.2, x, ey + hs); g.fill(); break; }
      default: g.fillStyle = ink; g.beginPath(); g.ellipse(x + lx, ey + ly, R * 0.105 * s, R * 0.15, 0, 0, Math.PI * 2); g.fill(); circle(g, x + lx - R * 0.035, ey + ly - R * 0.06, R * 0.045, '#ffffff');
    }
  });
  // brows
  const by = ey - R * 0.3, bw = R * 0.12;
  const brow = (x, a, s) => seg(g, [[x - bw * s, by + a], [x + bw * s, by - a]], R * 0.055, ink);
  if (ex.brows === 'worried') { brow(eyeX[0], -R * 0.06, es(0)); brow(eyeX[1], R * 0.06, 1); }
  else if (ex.brows === 'angry') { brow(eyeX[0], R * 0.07, es(0)); brow(eyeX[1], -R * 0.07, 1); }
  else if (ex.brows === 'raised') eyeX.forEach((x, i) => { g.strokeStyle = ink; g.lineWidth = R * 0.05; g.beginPath(); g.arc(x, by + R * 0.1, R * 0.12 * es(i), Math.PI * 1.25, Math.PI * 1.75); g.stroke(); });
  else if (ex.brows === 'confused') { brow(eyeX[0], R * 0.05, es(0)); g.strokeStyle = ink; g.lineWidth = R * 0.05; g.beginPath(); g.arc(eyeX[1], by + R * 0.06, R * 0.12, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); }
  // mouth
  const mx = fx + (front ? 0 : R * 0.06), my = cy + R * 0.5, talk = o.talk || 0, red = '#9a3a4a', tongue = '#ff8a96';
  const openMouth = (w, h) => { g.beginPath(); g.ellipse(mx, my, w, h, 0, 0, Math.PI * 2); g.fillStyle = red; g.fill(); g.save(); g.clip(); circle(g, mx, my + h * 0.9, w * 0.8, tongue); g.restore(); g.lineWidth = R * 0.04; g.strokeStyle = ink; g.stroke(); };
  if (talk > 0.05) openMouth(R * 0.13, R * (0.04 + 0.14 * talk));
  else switch (ex.mouth) {
    case 'grin': { g.beginPath(); g.moveTo(mx - R * 0.2, my - R * 0.06); g.quadraticCurveTo(mx, my + R * 0.32, mx + R * 0.2, my - R * 0.06); g.closePath(); g.fillStyle = red; g.fill(); g.save(); g.clip(); circle(g, mx, my + R * 0.2, R * 0.13, tongue); g.restore(); g.lineWidth = R * 0.045; g.strokeStyle = ink; g.stroke(); break; }
    case 'smile': g.strokeStyle = ink; g.lineWidth = R * 0.055; g.beginPath(); g.arc(mx, my - R * 0.12, R * 0.15, 0.45, Math.PI - 0.45); g.stroke(); break;
    case 'small': g.strokeStyle = ink; g.lineWidth = R * 0.05; g.beginPath(); g.arc(mx, my - R * 0.07, R * 0.08, 0.5, Math.PI - 0.5); g.stroke(); break;
    case 'o': openMouth(R * 0.07, R * 0.09); break;
    case 'oBig': openMouth(R * 0.12, R * 0.17); break;
    case 'yawn': openMouth(R * 0.13, R * 0.2); break;
    case 'flat': seg(g, [[mx - R * 0.1, my], [mx + R * 0.1, my]], R * 0.05, ink); break;
    case 'frown': g.strokeStyle = ink; g.lineWidth = R * 0.055; g.beginPath(); g.arc(mx, my + R * 0.12, R * 0.12, Math.PI + 0.55, Math.PI * 2 - 0.55); g.stroke(); break;
    case 'pout': g.strokeStyle = ink; g.lineWidth = R * 0.05; g.beginPath(); g.moveTo(mx - R * 0.07, my); g.quadraticCurveTo(mx, my - R * 0.08, mx + R * 0.07, my); g.stroke(); break;
    case 'cry': { g.beginPath(); g.moveTo(mx - R * 0.16, my + R * 0.06); g.quadraticCurveTo(mx, my - R * 0.18, mx + R * 0.16, my + R * 0.06); g.closePath(); g.fillStyle = red; g.fill(); g.lineWidth = R * 0.045; g.strokeStyle = ink; g.stroke(); break; }
    case 'smirk': g.strokeStyle = ink; g.lineWidth = R * 0.05; g.beginPath(); g.moveTo(mx - R * 0.1, my); g.quadraticCurveTo(mx + R * 0.04, my + R * 0.05, mx + R * 0.14, my - R * 0.07); g.stroke(); break;
    case 'wavy': { g.strokeStyle = ink; g.lineWidth = R * 0.05; g.beginPath(); for (let i = 0; i <= 14; i++) { const u = i / 14, x = mx - R * 0.14 + u * R * 0.28, y = my + Math.sin(u * Math.PI * 3) * R * 0.03; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); break; }
  }
  if (ex.tears) { g.fillStyle = 'rgba(120,200,255,.9)'; for (const x of eyeX) { g.beginPath(); g.moveTo(x, ey + R * 0.08); g.quadraticCurveTo(x - R * 0.07, ey + R * 0.3, x, ey + R * 0.36); g.quadraticCurveTo(x + R * 0.07, ey + R * 0.3, x, ey + R * 0.08); g.fill(); } }
  if (ex.sweat) { const sx = cx - R * (front ? 0.7 : 0.45), sy = cy - R * 0.45; g.fillStyle = '#9fdcff'; g.beginPath(); g.moveTo(sx, sy - R * 0.16); g.quadraticCurveTo(sx - R * 0.1, sy, sx, sy + R * 0.06); g.quadraticCurveTo(sx + R * 0.1, sy, sx, sy - R * 0.16); g.fill(); g.lineWidth = R * 0.025; g.strokeStyle = OUT(); g.stroke(); }
  if (ex.lines) { g.strokeStyle = alpha(ink, 0.5); g.lineWidth = R * 0.03; for (let k = 0; k < 4; k++) { const x = cx - R * 0.5 + k * R * 0.14; seg(g, [[x, cy - R * 0.9], [x, cy - R * 0.55]], R * 0.03, alpha(ink, 0.45)); } }
  if (ex.drool) { g.fillStyle = 'rgba(150,210,255,.8)'; g.beginPath(); g.ellipse(mx + R * 0.06, my + R * 0.14, R * 0.03, R * 0.07, 0, 0, Math.PI * 2); g.fill(); }
  g.restore();
}

// ---------- hair ----------
function hairBack(g, h, R, ch) {
  const c = h.color || '#3a2a2a';
  g.beginPath();
  switch (h.style) {
    case 'long': rr(g, -R * 1.02, -R * 0.4, R * 1.5, R * 2.0, R * 0.5); blob(g, c); break;
    case 'bob': rr(g, -R * 1.06, -R * 0.5, R * 1.7, R * 1.42, R * 0.45); blob(g, c); break;
    case 'ponytail': g.moveTo(-R * 0.7, -R * 0.55); g.quadraticCurveTo(-R * 1.75, -R * 0.4, -R * 1.45, R * 0.9); g.quadraticCurveTo(-R * 1.1, R * 0.2, -R * 0.6, -R * 0.1); g.closePath(); blob(g, c); break;
    case 'pigtails': for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * R * 0.95, R * 0.25, R * 0.28, R * 0.55, sx * 0.3, 0, Math.PI * 2); blob(g, c); } break;
    case 'bun': case 'greyBun': g.arc(-R * 0.55, -R * 0.82, R * 0.36, 0, Math.PI * 2); blob(g, c); break;
    case 'veil': g.moveTo(-R * 0.2, -R * 1.05); g.quadraticCurveTo(-R * 1.25, -R * 0.9, -R * 1.25, R * 0.4); g.lineTo(-R * 1.1, R * 1.5); g.lineTo(R * 0.3, R * 1.3); g.lineTo(R * 0.6, R * 0.2); g.closePath(); blob(g, h.color || '#5a6a8a'); break;
  }
}
function hairFront(g, h, R, front) {
  const c = h.color || '#3a2a2a', st = h.style;
  if (st === 'bald') { g.beginPath(); g.moveTo(-R * 0.98, R * 0.05); g.quadraticCurveTo(-R * 1.05, -R * 0.45, -R * 0.62, -R * 0.62); g.lineTo(-R * 0.5, -R * 0.2); g.quadraticCurveTo(-R * 0.7, 0, -R * 0.6, R * 0.25); g.closePath(); blob(g, c); return; }
  if (st === 'veil') { // nun: white band + veil top
    g.beginPath(); g.arc(0, 0, R * 1.07, Math.PI * 0.98, Math.PI * 2.02); g.quadraticCurveTo(R * 0.9, -R * 0.35, R * 0.75, -R * 0.42); g.lineTo(-R * 0.75, -R * 0.42); g.closePath(); blob(g, h.color || '#5a6a8a');
    g.beginPath(); g.moveTo(-R * 0.9, -R * 0.34); g.quadraticCurveTo(0, -R * 0.62, R * 0.95, -R * 0.3); g.lineTo(R * 0.93, -R * 0.18); g.quadraticCurveTo(0, -R * 0.46, -R * 0.92, -R * 0.18); g.closePath(); blob(g, '#ffffff', OW() * 0.7); return;
  }
  // a cap of hair over the top of the head with a fringe across the forehead (3/4 view: fringe toward +x)
  const fr = front ? 0 : 1;
  g.beginPath();
  g.moveTo(-R * 1.0, R * (st === 'boy' || st === 'short' || st === 'side' || st === 'curly' ? 0.05 : 0.35));
  g.bezierCurveTo(-R * 1.15, -R * 1.0, R * 0.55, -R * 1.35, R * 1.02, -R * 0.3);
  if (st === 'side') { g.quadraticCurveTo(R * 0.6, -R * 0.62, -R * 0.1, -R * 0.42); g.quadraticCurveTo(-R * 0.4, -R * 0.36, -R * 0.62, -R * 0.1); }
  else if (st === 'boy') { g.lineTo(R * 0.78, -R * 0.36); g.lineTo(R * 0.62, -R * 0.18); g.lineTo(R * 0.48, -R * 0.4); g.lineTo(R * 0.28, -R * 0.22); g.lineTo(R * 0.12, -R * 0.44); g.lineTo(-R * 0.08, -R * 0.26); g.lineTo(-R * 0.3, -R * 0.42); g.quadraticCurveTo(-R * 0.6, -R * 0.2, -R * 0.66, R * 0.06); }
  else if (st === 'curly') { for (let k = 0; k < 5; k++) { const x0 = R * (0.9 - k * 0.32); g.quadraticCurveTo(x0 - R * 0.16, -R * 0.12, x0 - R * 0.32, -R * 0.36); } g.quadraticCurveTo(-R * 0.75, -R * 0.1, -R * 0.75, R * 0.1); }
  else { // short / bob / long / ponytail / bun / greyBun / pigtails: soft fringe
    g.quadraticCurveTo(R * 0.7, -R * 0.38, R * 0.4, -R * 0.4); g.quadraticCurveTo(R * 0.2, -R * 0.28, R * 0.05, -R * 0.44); g.quadraticCurveTo(-R * 0.2, -R * 0.3, -R * 0.4, -R * 0.38);
    if (['bob', 'long', 'pigtails'].includes(st)) { g.quadraticCurveTo(-R * 0.62, -R * 0.1, -R * 0.62, R * 0.5); g.lineTo(-R * 1.0, R * 0.5); }
    else g.quadraticCurveTo(-R * 0.62, -R * 0.1, -R * 0.66, R * 0.12);
  }
  g.closePath(); blob(g, c);
  if (st === 'boy') { g.beginPath(); g.moveTo(-R * 0.1, -R * 1.02); g.quadraticCurveTo(R * 0.05, -R * 1.45, R * 0.35, -R * 1.38); g.quadraticCurveTo(R * 0.1, -R * 1.25, R * 0.12, -R * 1.0); blob(g, c, OW() * 0.8); }
  // shine
  g.strokeStyle = alpha('#ffffff', 0.35); g.lineWidth = R * 0.07; g.lineCap = 'round'; g.beginPath(); g.arc(-R * 0.05 + fr * 0, -R * 0.15, R * 0.72, Math.PI * 1.25, Math.PI * 1.45); g.stroke();
}

// ---------- clothing ----------
const robeTypes = ['cassock', 'alb', 'habit', 'aodai', 'dress'];
function torso(g, p, ch, f) {
  const top = ch.top || { type: 'tshirt', color: '#ffb84d' }, kid = K(ch), belly = ch.belly ? 1 : 0;
  const u = norm([p.hip[0] - p.sh[0], p.hip[1] - p.sh[1]]), n = [-u[1], u[0]];
  const w1 = kid ? 30 : 30, w2 = (kid ? 30 : 31) + belly * 8;
  const col = top.color || '#ffb84d';
  let bot = p.hip, wb = w2, hem = null;
  if (robeTypes.includes(top.type)) { const footY = Math.max(p.fF[1], p.fB[1]); const len = top.type === 'aodai' ? (p.hip[1] < -20 ? Math.abs(p.hip[1]) * 0.62 : 18) : top.type === 'dress' ? (kid ? 22 : 36) : Math.abs(footY - p.hip[1]) - 10; hem = add(p.hip, [0, 1], Math.max(14, len)); wb = top.type === 'aodai' ? w2 + 6 : w2 + 18; }
  const A = add(p.sh, n, w1), B = add(p.sh, n, -w1), C = add(p.hip, n, -w2), D = add(p.hip, n, w2);
  g.beginPath(); g.moveTo(...add(A, u, 6)); g.quadraticCurveTo(...add(p.sh, u, -4), ...add(B, u, 6));
  if (hem) { g.lineTo(...C); g.lineTo(hem[0] - wb, hem[1]); g.quadraticCurveTo(hem[0], hem[1] + 6, hem[0] + wb, hem[1]); g.lineTo(...D); }
  else { g.lineTo(...add(C, n, belly * -4)); g.quadraticCurveTo(p.hip[0], p.hip[1] + 8 + belly * 6, ...add(D, n, belly * 4)); }
  g.closePath(); blob(g, col);
  if (top.type === 'aodai' && hem) { seg(g, [p.hip, add(hem, [0, -4])], 3, shade(col, -0.12)); }
  // details
  const neck = add(p.sh, u, 2), c2 = top.color2 || '#ffffff';
  switch (top.type) {
    case 'shirt': case 'uniform': case 'blazer': {
      poly(g, [add(neck, n, -12), add(neck, n, 12), add(neck, u, 16)], top.type === 'blazer' ? '#ffffff' : c2);
      g.strokeStyle = OUT(); g.lineWidth = 3; g.beginPath(); g.moveTo(...add(neck, n, -12)); g.lineTo(...add(neck, u, 16)); g.lineTo(...add(neck, n, 12)); g.stroke();
      if (top.tie) { const a = add(neck, u, 12); poly(g, [add(a, n, -5), add(a, n, 5), add(a, u, 34), add(a, u, 40)], top.tie); }
      else for (let k = 1; k <= 2; k++) circle(g, ...add(neck, u, 18 + k * 14), 2.6, shade(col, -0.35));
      if (top.type === 'uniform' && top.badge) circle(g, ...add(add(neck, u, 24), n, f > 0 ? 16 : -16), 4, top.badge);
      break; }
    case 'polo': poly(g, [add(neck, n, -11), add(neck, n, 11), add(neck, u, 12)], shade(col, 0.35)); circle(g, ...add(neck, u, 20), 2.5, shade(col, -0.35)); break;
    case 'hoodie': seg(g, [add(neck, n, 6), add(add(neck, u, 22), n, 7)], 2.5, '#ffffff'); seg(g, [add(neck, n, -6), add(add(neck, u, 22), n, -5)], 2.5, '#ffffff'); break;
    case 'sweater': for (let k = 0; k < 3; k++) seg(g, [add(add(p.hip, u, -6 - k * 5), n, -w2 + 4), add(add(p.hip, u, -6 - k * 5), n, w2 - 4)], 1.6, shade(col, -0.18)); break;
    case 'cassock': { // black cassock + white roman collar + buttons
      rr(g, neck[0] - 9, neck[1] - 6, 18, 8, 3); g.fillStyle = '#ffffff'; g.fill(); g.strokeStyle = OUT(); g.lineWidth = 2; g.stroke();
      for (let k = 0; k < 6; k++) circle(g, ...add(neck, u, 14 + k * 16), 2.2, shade(col, 0.45)); break; }
    case 'alb': { // white alb + cincture, stole drawn in acc
      seg(g, [add(p.hip, n, -w2 + 4), add(p.hip, n, w2 - 4)], 3, shade(col, -0.18)); break; }
    case 'habit': rr(g, neck[0] - 16, neck[1] - 4, 32, 18, 8); g.fillStyle = '#ffffff'; g.fill(); g.strokeStyle = OUT(); g.lineWidth = 2; g.stroke(); break;
    case 'aodai': g.strokeStyle = shade(col, -0.2); g.lineWidth = 2.4; g.beginPath(); g.moveTo(...add(neck, n, 2)); g.quadraticCurveTo(...add(add(neck, u, 10), n, 14), ...add(add(neck, u, 20), n, 20)); g.stroke(); break;
    case 'blouse': g.strokeStyle = shade(col, -0.25); g.lineWidth = 2.4; g.beginPath(); g.arc(neck[0], neck[1] + 2, 10, 0.2, Math.PI - 0.2); g.stroke(); break;
    case 'tshirt': if (top.print === 'star') { const c = add(add(p.sh, u, 34), n, 0); g.fillStyle = c2; g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r2 = k % 2 ? 5 : 12; g.lineTo(c[0] + Math.cos(a) * r2, c[1] + Math.sin(a) * r2); } g.closePath(); g.fill(); }
      if (top.print === 'heart') { const c = add(p.sh, u, 34); g.fillStyle = c2; g.beginPath(); g.moveTo(c[0], c[1] + 8); g.bezierCurveTo(c[0] - 14, c[1] - 2, c[0] - 6, c[1] - 12, c[0], c[1] - 4); g.bezierCurveTo(c[0] + 6, c[1] - 12, c[0] + 14, c[1] - 2, c[0], c[1] + 8); g.fill(); } break;
  }
  const acc = ch.acc || [];
  for (const a of acc) if (a.startsWith('stole:')) { const sc = a.slice(6); for (const s2 of [-1, 1]) { const p0 = add(add(p.sh, n, s2 * 10), u, -2), p1 = add(add(p.hip, n, s2 * 12), u, 34); seg(g, [p0, p1], 15 + OW() * 2, OUT()); seg(g, [p0, p1], 15, sc); } const c = add(add(p.sh, n, 10), u, 40); seg(g, [[c[0] - 5, c[1]], [c[0] + 5, c[1]]], 2.4, '#ffe08a'); seg(g, [[c[0], c[1] - 6], [c[0], c[1] + 7]], 2.4, '#ffe08a'); }
  if (acc.includes('rosary')) { g.fillStyle = '#ffffff'; for (let k = 0; k < 9; k++) { const q = add(add(neck, u, 4 + k * 5), n, Math.sin(k / 8 * Math.PI) * 14 - 7); circle(g, q[0], q[1], 2.2, '#8a5a3a'); } }
}
function sleeveInfo(top) { const t = top?.type; if (['tshirt', 'polo', 'uniform', 'dress'].includes(t)) return 'short'; if (['hoodie', 'sweater', 'blazer', 'cassock', 'alb', 'habit', 'aodai', 'shirt', 'blouse'].includes(t)) return t === 'shirt' && top.rolled ? 'short' : 'long'; return null; }
function arm(g, sh, e, h, ch, far) {
  const skin = ch.skin || S().skin, top = ch.top || {}, sl = sleeveInfo(top), w = K(ch) ? 15 : 15;
  const cc = top.sleeve || top.color || '#ffb84d', col = far ? shade(cc, -0.1) : cc, sk = far ? shade(skin, -0.06) : skin;
  limb(g, [sh, e, h], w, sk);
  if (sl === 'long') limb(g, [sh, e, pt(e, h, 0.78)], w + 5, col);
  else if (sl === 'short') limb(g, [sh, pt(sh, e, 0.7)], w + 6, col);
  oCircle(g, h[0], h[1], K(ch) ? 9.5 : 10, sk);
}
function leg(g, hip, k, ft, ch, far, f) {
  const skin = ch.skin || S().skin, lg = ch.legs || { type: 'pants', color: '#6b8fd6' }, w = K(ch) ? 16 : 17;
  const col = far ? shade(lg.color || '#6b8fd6', -0.1) : lg.color || '#6b8fd6', sk = far ? shade(skin, -0.06) : skin;
  const toe = [ft[0] + 12, ft[1]];
  if (lg.type === 'shorts' || lg.type === 'skirt' || lg.type === 'longskirt') limb(g, [hip, k, ft], w - 3, sk);
  if (lg.type === 'pants') limb(g, [hip, k, pt(k, ft, 0.85)], w, col);
  if (lg.type === 'shorts') limb(g, [hip, pt(hip, k, 0.85)], w + 3, col);
  const shoe = far ? shade(ch.shoes || '#ff6f61', -0.12) : ch.shoes || '#ff6f61';
  oEllipse(g, toe[0] - 4, ft[1] - 5, K(ch) ? 15 : 16, K(ch) ? 8.5 : 9, 0, shoe);
}
function skirt(g, p, ch) {
  const lg = ch.legs; if (!lg || !['skirt', 'longskirt'].includes(lg.type)) return;
  const u = norm([p.hip[0] - p.sh[0], p.hip[1] - p.sh[1]]), n = [-u[1], u[0]];
  const len = lg.type === 'longskirt' ? Math.abs(Math.max(p.fF[1], p.fB[1]) - p.hip[1]) - 14 : Math.abs(p.hip[1]) * 0.5 + 6;
  const top = add(p.hip, u, -8), b = add(p.hip, u, len), w2 = 32, wb = lg.type === 'longskirt' ? 40 : 44;
  g.beginPath(); g.moveTo(...add(top, n, w2)); g.lineTo(...add(top, n, -w2)); g.lineTo(...add(b, n, -wb)); g.quadraticCurveTo(...add(b, u, 6), ...add(b, n, wb)); g.closePath(); blob(g, lg.color || '#8a7ad6');
}

// ---------- main ----------
export function chibiHead(o) {
  const ch = o.char || {}, s = (o.s ?? 1) * (K(ch) ? 0.82 : 1), f = o.facing ?? 1, p = chibiPose(o.pose || POSES.stand, ch);
  let [x, y] = p.head; if (o.rot) { const [hx, hy] = p.hip; const c = Math.cos(o.rot), sn = Math.sin(o.rot); [x, y] = [hx + (x - hx) * c - (y - hy) * sn, hy + (x - hx) * sn + (y - hy) * c]; }
  return [o.x + x * f * s, o.y + y * s, p.R * s];
}
export function drawChibi(g, o) {
  const ch = o.char || {}, s = (o.s ?? 1) * (K(ch) ? 0.82 : 1), f = o.facing ?? 1;
  const p = chibiPose(o.pose || POSES.stand, ch), R = p.R;
  g.save(); if (o.alpha != null) g.globalAlpha *= o.alpha;
  if (o.shadow !== false && !o.rot) { g.fillStyle = 'rgba(80,50,80,.16)'; g.beginPath(); g.ellipse(o.x, o.y + 3, 46 * s, 9 * s, 0, 0, Math.PI * 2); g.fill(); }
  g.translate(o.x, o.y); g.scale(f * s, s * (o.squash ? 1 - o.squash : 1));
  if (o.rot) { g.translate(p.hip[0], p.hip[1]); g.rotate(o.rot); g.translate(-p.hip[0], -p.hip[1]); }
  const acc = ch.acc || [];
  // back hair / veil / backpack
  g.save(); g.translate(...p.head); g.rotate(p.tilt); hairBack(g, ch.hair || {}, R, ch); g.restore();
  if (acc.includes('backpack')) { const u = norm([p.hip[0] - p.sh[0], p.hip[1] - p.sh[1]]); const c = add(add(p.sh, u, 30), [-u[1], u[0]], 0); g.beginPath(); rr(g, c[0] - 46, c[1] - 30, 30, 62, 10); blob(g, ch.backpackColor || '#ff8a7a'); }
  // far limbs, legs, torso, near arm
  arm(g, p.sh, p.eB, p.hB, ch, true);
  leg(g, p.hip, p.kB, p.fB, ch, true, f);
  leg(g, p.hip, p.kF, p.fF, ch, false, f);
  skirt(g, p, ch);
  torso(g, p, ch, f);
  // head
  const skin = ch.skin || S().skin;
  g.save(); g.translate(...p.head); g.rotate(p.tilt);
  oEllipse(g, -R * 0.18, R * 0.08, R * 0.16, R * 0.2, 0, skin);            // ear
  oEllipse(g, 0, 0, R * 1.0, R * 0.94, 0, skin);
  hairFront(g, ch.hair || {}, R, false);
  oEllipse(g, -R * 0.18, R * 0.1, R * 0.12, R * 0.15, 0, skin, OW() * 0.6);  // ear over hair edge
  if (!o.noFace) chibiFace(g, 0, 0, R, { expr: o.expr, talk: o.talk, blink: o.blink, look: o.look, override: o.face });
  if (acc.includes('glasses')) { g.strokeStyle = OUT(); g.lineWidth = 3.4; for (const dx of [-0.06, 0.56]) { g.beginPath(); g.arc(R * dx, R * 0.12, R * 0.2, 0, Math.PI * 2); g.stroke(); } seg(g, [[R * 0.14, R * 0.1], [R * 0.36, R * 0.1]], 3, OUT()); }
  if (acc.includes('mustache')) { g.fillStyle = (ch.hair?.color) || '#3a2a2a'; g.beginPath(); g.ellipse(R * 0.18, R * 0.36, R * 0.12, R * 0.05, -0.2, 0, Math.PI * 2); g.ellipse(R * 0.4, R * 0.36, R * 0.12, R * 0.05, 0.2, 0, Math.PI * 2); g.fill(); }
  g.restore();
  arm(g, p.sh, p.eF, p.hF, ch, false);
  if (o.prop) drawCProp(g, o.prop, p);
  g.restore();
}

// props held in the near hand (or 'B' = far hand): rosary, book, bible, candle, phone, cup, flower, palm, bag
export function drawCProp(g, prop, p) {
  const t = typeof prop === 'string' ? { type: prop } : prop, h = t.hand === 'B' ? p.hB : p.hF, [x, y] = h;
  switch (t.type) {
    case 'rosary': { g.strokeStyle = '#8a5a3a'; g.lineWidth = 1.6; for (let k = 0; k < 12; k++) { const a = Math.PI * 0.5 + (k / 11) * Math.PI * 1.2 - 0.6; circle(g, x + Math.cos(a) * 16, y + 18 + Math.sin(a) * 18, 3, '#b07a4a'); } seg(g, [[x, y + 36], [x, y + 54]], 3, '#b07a4a'); seg(g, [[x - 6, y + 42], [x + 6, y + 42]], 3, '#b07a4a'); break; }
    case 'book': case 'bible': { g.beginPath(); rr(g, x - 6, y - 30, 40, 50, 4); blob(g, t.type === 'bible' ? '#8a4a4a' : (t.color || '#7fb8e8'), 3); if (t.type === 'bible') { seg(g, [[x + 14, y - 20], [x + 14, y + 6]], 3, '#ffd66e'); seg(g, [[x + 6, y - 12], [x + 22, y - 12]], 3, '#ffd66e'); } break; }
    case 'candle': { g.beginPath(); rr(g, x - 5, y - 46, 12, 50, 3); blob(g, '#fff8ea', 3); g.save(); g.globalCompositeOperation = 'lighter'; circle(g, x + 1, y - 58, 18, 'rgba(255,200,90,.25)'); g.restore(); g.fillStyle = '#ffb43c'; g.beginPath(); g.ellipse(x + 1, y - 56, 5, 10, 0, 0, Math.PI * 2); g.fill(); circle(g, x + 1, y - 53, 3, '#fff6c8'); break; }
    case 'phone': g.beginPath(); rr(g, x - 4, y - 30, 22, 36, 5); blob(g, '#4a4a5a', 3); g.fillStyle = t.glow || '#bfe8ff'; g.fillRect(x - 1, y - 27, 16, 28); break;
    case 'cup': g.beginPath(); rr(g, x - 4, y - 26, 22, 26, 5); blob(g, t.color || '#ffffff', 3); break;
    case 'flower': seg(g, [[x, y], [x + 4, y - 40]], 3, '#5fbf8a'); for (let k = 0; k < 5; k++) { const a = k * Math.PI * 0.4; oCircle(g, x + 4 + Math.cos(a) * 8, y - 44 + Math.sin(a) * 8, 6, t.color || '#ff9fb8', 2); } circle(g, x + 4, y - 44, 5, '#ffd66e'); break;
    case 'bag': g.beginPath(); rr(g, x - 16, y, 34, 30, 6); blob(g, t.color || '#c9a07a', 3); break;
  }
}

// Sign of the Cross pose over `dur` seconds (forehead → chest → left shoulder → right shoulder). Use with expr 'pray'.
export function signCross(t, dur = 2.4) {
  const base = POSES.stand, u = clamp(t / dur), sh = base.sh;
  const stops = [[0, [14, -112]], [0.12, [22, -196]], [0.35, [24, -146]], [0.6, [6, -168]], [0.85, [28, -168]], [1, [20, -150]]];
  let hF = stops[0][1]; for (let i = 1; i < stops.length; i++) { if (u <= stops[i][0]) { const k = ease.inOut((u - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0])); hF = pt(stops[i - 1][1], stops[i][1], k); break; } hF = stops[i][1]; }
  const eF = [lerp(sh[0], hF[0], 0.5) + 18, lerp(sh[1], hF[1], 0.5) + 12];
  return { ...base, hF, eF };
}

// ---------- giant close-up (head + shoulders fill the frame) ----------
export function chibiClose(g, cx, cy, r, o = {}) {
  const ch = o.char || {}, top = ch.top || {}, skin = ch.skin || S().skin, h = ch.hair || {}, ow = r * 0.035;
  g.save(); g.translate(cx, cy); if (o.tilt) g.rotate(o.tilt);
  const so = S().ow; S().ow = ow; // thicker outline at close-up scale
  try {
    // shoulders
    g.beginPath(); g.ellipse(0, r * 1.75, r * 1.25, r * 0.9, 0, Math.PI, Math.PI * 2); g.closePath(); blob(g, top.color || '#ffb84d');
    if (top.type === 'cassock') { g.beginPath(); rr(g, -r * 0.18, r * 0.86, r * 0.36, r * 0.14, r * 0.05); blob(g, '#ffffff', ow * 0.6); }
    if (['shirt', 'uniform', 'polo', 'blazer'].includes(top.type)) { poly(g, [[-r * 0.3, r * 0.9], [r * 0.3, r * 0.9], [0, r * 1.25]], top.type === 'polo' ? shade(top.color || '#fff', 0.35) : '#ffffff'); }
    for (const a of ch.acc || []) if (a.startsWith('stole:')) for (const sx of [-1, 1]) { g.beginPath(); rr(g, sx * r * 0.42 - r * 0.12, r * 0.95, r * 0.24, r * 1.2, r * 0.06); blob(g, a.slice(6), ow * 0.8); }
    g.save(); g.scale(r / 50, r / 50); const R = 50; S().ow = ow * 50 / r;
    hairBack(g, h, R, ch);
    oEllipse(g, -R * 0.98, R * 0.1, R * 0.15, R * 0.2, 0, skin); oEllipse(g, R * 0.98, R * 0.1, R * 0.15, R * 0.2, 0, skin);
    oEllipse(g, 0, 0, R * 1.0, R * 0.94, 0, skin);
    hairFrontFront(g, h, R);
    chibiFace(g, 0, 0, R, { expr: o.expr, talk: o.talk, blink: o.blink, look: o.look, front: true, override: o.face });
    if ((ch.acc || []).includes('glasses')) { g.strokeStyle = OUT(); g.lineWidth = 2.6; for (const dx of [-0.36, 0.36]) { g.beginPath(); g.arc(R * dx, R * 0.12, R * 0.22, 0, Math.PI * 2); g.stroke(); } seg(g, [[-R * 0.14, R * 0.1], [R * 0.14, R * 0.1]], 2.4, OUT()); }
    if ((ch.acc || []).includes('mustache')) { g.fillStyle = h.color || '#3a2a2a'; g.beginPath(); g.ellipse(-R * 0.12, R * 0.36, R * 0.13, R * 0.05, -0.2, 0, Math.PI * 2); g.ellipse(R * 0.12, R * 0.36, R * 0.13, R * 0.05, 0.2, 0, Math.PI * 2); g.fill(); }
    g.restore();
    if (o.hands === 'pray') { g.save(); g.translate(0, r * 1.15); g.beginPath(); g.moveTo(-r * 0.16, r * 0.4); g.quadraticCurveTo(-r * 0.2, -r * 0.1, 0, -r * 0.35); g.quadraticCurveTo(r * 0.2, -r * 0.1, r * 0.16, r * 0.4); g.closePath(); S().ow = ow; blob(g, skin); seg(g, [[0, -r * 0.3], [0, r * 0.38]], ow * 1.2, OUT()); g.restore(); }
  } finally { S().ow = so; }
  g.restore();
}
// symmetric front hair for close-ups
function hairFrontFront(g, h, R) {
  const c = h.color || '#3a2a2a', st = h.style;
  if (st === 'bald') { for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * R * 0.86, -R * 0.2, R * 0.2, R * 0.38, sx * 0.3, 0, Math.PI * 2); blob(g, c); } return; }
  if (st === 'veil') { g.beginPath(); g.arc(0, 0, R * 1.08, Math.PI, Math.PI * 2); g.lineTo(R * 1.08, R * 0.6); g.lineTo(R * 0.86, R * 0.6); g.quadraticCurveTo(R * 0.9, -R * 0.4, 0, -R * 0.5); g.quadraticCurveTo(-R * 0.9, -R * 0.4, -R * 0.86, R * 0.6); g.lineTo(-R * 1.08, R * 0.6); g.closePath(); blob(g, c || '#5a6a8a');
    g.beginPath(); g.moveTo(-R * 0.88, -R * 0.3); g.quadraticCurveTo(0, -R * 0.62, R * 0.88, -R * 0.3); g.lineTo(R * 0.86, -R * 0.16); g.quadraticCurveTo(0, -R * 0.48, -R * 0.86, -R * 0.16); g.closePath(); blob(g, '#ffffff', OW() * 0.7); return; }
  const long = ['bob', 'long', 'pigtails'].includes(st);
  g.beginPath(); g.moveTo(-R * 1.02, R * (long ? 0.55 : 0.05)); g.bezierCurveTo(-R * 1.2, -R * 1.25, R * 1.2, -R * 1.25, R * 1.02, R * (long ? 0.55 : 0.05));
  if (long) g.lineTo(R * 0.7, R * 0.55);
  if (st === 'boy') { const xs = [0.72, 0.5, 0.28, 0.06, -0.16, -0.38, -0.6]; g.lineTo(R * 0.72, -R * 0.1); xs.forEach((x, i) => g.lineTo(R * x, -R * (i % 2 ? 0.42 : 0.24))); g.lineTo(-R * 0.72, -R * 0.1); }
  else if (st === 'side') { g.quadraticCurveTo(R * 0.7, -R * 0.5, R * 0.1, -R * 0.45); g.quadraticCurveTo(-R * 0.5, -R * 0.4, -R * 0.74, -R * 0.0); }
  else { g.quadraticCurveTo(R * 0.72, -R * 0.4, R * 0.36, -R * 0.42); g.quadraticCurveTo(R * 0.18, -R * 0.3, 0, -R * 0.46); g.quadraticCurveTo(-R * 0.18, -R * 0.3, -R * 0.36, -R * 0.42); g.quadraticCurveTo(-R * 0.72, -R * 0.4, long ? -R * 0.7 : -R * 0.74, long ? R * 0.55 : 0); }
  g.closePath(); blob(g, c);
  if (st === 'boy') { g.beginPath(); g.moveTo(-R * 0.05, -R * 1.0); g.quadraticCurveTo(R * 0.05, -R * 1.42, R * 0.32, -R * 1.36); g.quadraticCurveTo(R * 0.1, -R * 1.22, R * 0.12, -R * 0.98); blob(g, c, OW() * 0.8); }
  g.strokeStyle = alpha('#ffffff', 0.35); g.lineWidth = R * 0.07; g.lineCap = 'round'; g.beginPath(); g.arc(0, -R * 0.15, R * 0.75, Math.PI * 1.2, Math.PI * 1.42); g.stroke();
}
