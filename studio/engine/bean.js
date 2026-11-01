// engine/bean.js — "Đậu tròn sticker" character rig (the channel's chosen look).
// Each character is one rounded bean (head + body in one capsule): skin on top, clothes below, a hair cap, tiny stub
// arms and feet, a dark outline and a thick white sticker border. Faces reuse chibiFace (all CEXPR expressions).
//
//   drawBean(g, { x, y, s, facing, pose, rot, char, expr, talk, blink, look, prop, alpha, shadow, squash, front })
//   beanClose(g, cx, cy, r, { char, expr, talk, blink, look, tilt, hands:'pray'|null })  // giant close-up (r = half width)
//   beanHead(o) -> [x, y, r]     face centre + radius in world space (bubbles, emotes, labels)
//   signCross(t, dur)            pose for the Sign of the Cross (forehead → chest → left → right shoulder)
// Poses: the shared stick POSES (stand, wave, point, sit, kneel, jump, pray, sitPray, kneelPray, …) are mapped to the
// bean: hands follow the pose's hand directions, feet follow its feet (walkPose works), sitting/kneeling lower the body,
// jumping lifts it, the torso lean tilts the bean. Feet stay on `y` like drawChibi, so the two are interchangeable.
// Size at s = 1: adult 300 tall × 160 wide, kid 232 × 140.
import { E, S, clamp, lerp, seg, circle, alpha, shade, rr, ease } from './core.js';
import { POSES } from './rig2d.js';
import { chibiFace, CEXPR, blinkAt, drawCProp } from './chibi.js';
export { CEXPR, blinkAt };

const INK = () => S().outline || '#3a2c38';
const OWb = () => (S().ow || 2.6);
const dims = (ch) => (ch?.kid ? { w: 140, h: 232, split: 0.5, face: 0.7 } : { w: 160, h: 300, split: 0.52, face: 0.73 });
const ROBE = ['cassock', 'alb', 'habit', 'dress'];

function bodyPath(g, w, h) { g.beginPath(); rr(g, -w / 2, -h, w, h, w / 2); }
function stroke(g, w = OWb()) { g.lineWidth = w * 2; g.strokeStyle = INK(); g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
function fillO(g, c, w) { g.fillStyle = c; g.fill(); stroke(g, w); }
function capsule(g, x1, y1, x2, y2, wd) { const a = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(a) * wd / 2, ny = Math.cos(a) * wd / 2; g.beginPath(); g.moveTo(x1 + nx, y1 + ny); g.lineTo(x2 + nx, y2 + ny); g.arc(x2, y2, wd / 2, a + Math.PI / 2, a - Math.PI / 2, true); g.lineTo(x1 - nx, y1 - ny); g.arc(x1, y1, wd / 2, a - Math.PI / 2, a + Math.PI / 2, true); g.closePath(); }
function star(g, cx, cy, r1, c) { g.fillStyle = c; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r1 * 0.42 : r1; g.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2); } g.closePath(); g.fill(); }

// map a stick pose to bean parameters (bean-local: bottom centre = 0,0, facing +x)
function beanPose(p, d) {
  const { w, h } = d, k = h / 300;
  const hipDrop = (p.hip[1] + 100);                     // >0 sitting/kneeling, <0 jumping
  const sitting = hipDrop > 18 && Math.max(p.fF[1], p.fB[1]) > -10;
  const lift = hipDrop < -8 ? -hipDrop * 1.1 * k : 0;   // jump
  const lean = clamp(Math.atan2(p.sh[0] - p.hip[0], -(p.sh[1] - p.hip[1])) * 0.8, -0.5, 0.5);
  const tilt = clamp((p.head[0] - p.sh[0]) / 60, -0.25, 0.25);
  const shY = -h * 0.46, shX = w * 0.44, armLen = h * 0.3;
  const hand = (hp, side) => { const dx = (hp[0] - p.sh[0]) / 74, dy = (hp[1] - p.sh[1]) / 74; return [side * shX + dx * armLen * 1.05, shY + dy * armLen * 1.05]; };
  let hF = p.handF ? [p.handF[0] * w, -p.handF[1] * h] : hand(p.hF, 1), hB = p.handB ? [p.handB[0] * w, -p.handB[1] * h] : hand(p.hB, -1);
  // keep hands off the face unless the pose asks for it
  const fc = [w * 0.1, -h * d.face], fr = w * 0.36;
  const off = (q) => { if (p.keepHands || p.handF) return q; const vx = q[0] - fc[0], vy = q[1] - fc[1], dd = Math.hypot(vx, vy); return dd >= fr ? q : [fc[0] + vx / (dd || 1) * fr, fc[1] + vy / (dd || 1) * fr]; };
  hF = off(hF); hB = off(hB);
  const foot = (fp, side) => [fp[0] * 0.55 * k + side * w * 0.18, Math.min(0, fp[1] * 0.45 * k)];
  let fF = foot(p.fF, 1), fB = foot(p.fB, -1), bodyY = -lift, sit = 0;
  if (sitting) { sit = clamp(hipDrop / 28, 0, 1.2); bodyY = 0; fF = [w * 0.42, 0]; fB = [w * 0.24, 2]; }
  if (hipDrop > 30 && !sitting) { bodyY = hipDrop * 0.55 * k; }   // kneel / crouch: body sinks
  return { hF, hB, fF, fB, bodyY, lean, tilt, sit, shX, shY };
}

function hairCap(g, ch, w, h, d, front) {
  const hs = ch.hair?.style || 'short', hc = ch.hair?.color || '#2b2024', top = -h, fy = -h * d.face;
  const L = -w, Rr = w;
  g.fillStyle = hc; g.beginPath();
  switch (hs) {
    case 'boy': { const y0 = fy - w * 0.18; g.moveTo(L, y0 + 6); const n = 6; for (let i = 0; i <= n; i++) { const x = -w / 2 + 4 + (w - 8) * i / n; g.lineTo(x, y0 + (i % 2 ? 14 : -2)); } g.lineTo(Rr, y0 + 6); g.lineTo(Rr, top - 20); g.lineTo(L, top - 20); break; }
    case 'bun': case 'greyBun': case 'long': case 'bob': case 'ponytail': case 'pigtails': {
      const drop = ['bob', 'long', 'pigtails'].includes(hs) ? h * 0.07 : 0, y0 = fy + drop;
      g.moveTo(L, y0); g.lineTo(-w * 0.34, y0); g.bezierCurveTo(-w * 0.32, fy - w * 0.32, -w * 0.06, fy - w * 0.36, 0, fy - w * 0.26); g.bezierCurveTo(w * 0.06, fy - w * 0.36, w * 0.32, fy - w * 0.32, w * 0.34, y0); g.lineTo(Rr, y0); g.lineTo(Rr, top - 20); g.lineTo(L, top - 20); break; }
    case 'side': case 'short': { const y0 = fy - w * 0.2; g.moveTo(L, y0 + 10); g.lineTo(-w * 0.36, y0 + 8); g.bezierCurveTo(-w * 0.1, y0 - 6, w * 0.16, y0 - 10, w * 0.4, y0 + (hs === 'side' ? -14 : 4)); g.lineTo(Rr, y0); g.lineTo(Rr, top - 20); g.lineTo(L, top - 20); break; }
    case 'curly': { const y0 = fy - w * 0.22; g.moveTo(L, y0); for (let i = 0; i <= 6; i++) { const x = -w / 2 + w * i / 6; g.quadraticCurveTo(x - w / 12, y0 + 14, x, y0); } g.lineTo(Rr, top - 20); g.lineTo(L, top - 20); break; }
    case 'bald': { g.moveTo(L, fy - 2); g.lineTo(-w * 0.36, fy - 2); g.lineTo(-w * 0.36, fy - w * 0.32); g.lineTo(L, fy - w * 0.36); g.closePath(); g.moveTo(Rr, fy - 2); g.lineTo(w * 0.38, fy - 2); g.lineTo(w * 0.38, fy - w * 0.32); g.lineTo(Rr, fy - w * 0.36); break; }
    case 'veil': { g.fillStyle = hc; g.moveTo(L, -h * 0.4); g.lineTo(-w * 0.36, -h * 0.4); g.lineTo(-w * 0.36, fy - w * 0.2); g.quadraticCurveTo(0, fy - w * 0.42, w * 0.36, fy - w * 0.2); g.lineTo(w * 0.36, -h * 0.4); g.lineTo(Rr, -h * 0.4); g.lineTo(Rr, top - 20); g.lineTo(L, top - 20); break; }
    default: g.moveTo(L, fy - w * 0.2); g.lineTo(Rr, fy - w * 0.2); g.lineTo(Rr, top - 20); g.lineTo(L, top - 20);
  }
  g.closePath(); g.fill(); stroke(g, OWb() * 0.9);
  if (hs === 'veil') { g.beginPath(); g.moveTo(-w * 0.38, fy - w * 0.18); g.quadraticCurveTo(0, fy - w * 0.42, w * 0.38, fy - w * 0.18); g.lineTo(w * 0.38, fy - w * 0.08); g.quadraticCurveTo(0, fy - w * 0.3, -w * 0.38, fy - w * 0.08); g.closePath(); fillO(g, '#ffffff', OWb() * 0.7); }
  if (hs !== 'bald' && hs !== 'veil') { g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = w * 0.05; g.lineCap = 'round'; g.beginPath(); g.arc(-w * 0.05, -h + w * 0.55, w * 0.36, Math.PI * 1.15, Math.PI * 1.4); g.stroke(); }
}
function hairExtras(g, ch, w, h, d, pass) {   // pass 'back' (behind body) or 'front'
  const hs = ch.hair?.style, hc = ch.hair?.color || '#2b2024';
  if (pass === 'back') {
    if (hs === 'bun' || hs === 'greyBun') { g.beginPath(); g.arc(-w * 0.04, -h - w * 0.12, w * 0.2, 0, Math.PI * 2); return [hc]; }
    if (hs === 'ponytail') { g.beginPath(); g.ellipse(-w * 0.52, -h * 0.7, w * 0.12, w * 0.3, 0.3, 0, Math.PI * 2); return [hc]; }
    if (hs === 'pigtails') { g.beginPath(); g.ellipse(-w * 0.55, -h * 0.66, w * 0.12, w * 0.24, 0.3, 0, Math.PI * 2); g.ellipse(w * 0.55, -h * 0.66, w * 0.12, w * 0.24, -0.3, 0, Math.PI * 2); return [hc]; }
    if (hs === 'long') { g.beginPath(); rr(g, -w * 0.56, -h * 0.82, w * 1.12, h * 0.44, w * 0.2); return [hc]; }
    return null;
  }
  if (hs === 'boy') { g.beginPath(); g.moveTo(-6, -h + 4); g.quadraticCurveTo(6, -h - w * 0.32, w * 0.26, -h - w * 0.27); g.quadraticCurveTo(w * 0.09, -h - w * 0.17, w * 0.09, -h + 6); g.closePath(); fillO(g, hc); }
}
function clothes(g, ch, w, h, d) {
  const top = ch.top || { type: 'tshirt', color: '#ffb84d' }, col = top.color || '#ffb84d', lg = ch.legs || {};
  const sy = -h * d.split, robe = ROBE.includes(top.type);
  g.fillStyle = col; g.fillRect(-w, sy, w * 2, h + 10);
  if (!robe && lg.color && top.type !== 'aodai') { const by = -h * (lg.type === 'shorts' ? 0.16 : 0.2); g.fillStyle = lg.color; g.fillRect(-w, by, w * 2, h); seg(g, [[-w, by], [w, by]], OWb() * 1.6, INK()); if (lg.type === 'pants' || lg.type === 'shorts') seg(g, [[0, by + 4], [0, 4]], OWb() * 1.2, alpha(INK(), 0.55)); }
  if (top.type === 'aodai') { const by = -h * 0.14; g.fillStyle = lg.color || '#ffffff'; g.fillRect(-w, by, w * 2, h); seg(g, [[-w, by], [w, by]], OWb() * 1.6, INK()); g.fillStyle = col; g.beginPath(); g.moveTo(-w * 0.12, by - 2); g.lineTo(w * 0.12, by - 2); g.lineTo(w * 0.05, by + h * 0.1); g.lineTo(-w * 0.05, by + h * 0.1); g.closePath(); g.fill(); }
  if (top.type === 'dress') { g.fillStyle = shade(col, 0.35); g.fillRect(-w, -h * 0.12, w * 2, h * 0.04); }
  // neckline
  g.beginPath(); g.moveTo(-w, sy); g.quadraticCurveTo(0, sy + 16, w, sy); stroke(g, OWb() * 0.9);
  const ny = sy + 8;
  switch (top.type) {
    case 'tshirt': if (top.print === 'star') star(g, w * 0.08, sy + h * 0.17, w * 0.15, top.color2 || '#fff3c8'); if (top.print === 'heart') { const c = [w * 0.08, sy + h * 0.17]; g.fillStyle = top.color2 || '#fff'; g.beginPath(); g.moveTo(c[0], c[1] + 12); g.bezierCurveTo(c[0] - 22, c[1] - 4, c[0] - 9, c[1] - 18, c[0], c[1] - 6); g.bezierCurveTo(c[0] + 9, c[1] - 18, c[0] + 22, c[1] - 4, c[0], c[1] + 12); g.fill(); } break;
    case 'polo': g.beginPath(); g.moveTo(-w * 0.16, ny - 4); g.lineTo(0, ny + 16); g.lineTo(w * 0.16, ny - 4); g.lineTo(w * 0.08, ny + 2); g.lineTo(0, ny + 10); g.lineTo(-w * 0.08, ny + 2); g.closePath(); fillO(g, shade(col, 0.4), OWb() * 0.6); break;
    case 'shirt': case 'uniform': case 'blazer': { g.beginPath(); g.moveTo(-w * 0.18, ny - 4); g.lineTo(0, ny + 22); g.lineTo(w * 0.18, ny - 4); g.closePath(); fillO(g, top.type === 'blazer' ? '#ffffff' : shade(col, -0.04), OWb() * 0.6);
      if (top.tie) { g.beginPath(); g.moveTo(-6, ny + 8); g.lineTo(6, ny + 8); g.lineTo(9, ny + 52); g.lineTo(0, ny + 62); g.lineTo(-9, ny + 52); g.closePath(); fillO(g, top.tie, OWb() * 0.6); }
      if (top.badge) circle(g, w * 0.24, ny + 30, 6, top.badge); break; }
    case 'cassock': { g.beginPath(); rr(g, -w * 0.09, ny - 8, w * 0.18, 14, 4); fillO(g, '#ffffff', OWb() * 0.6); for (let i = 0; i < 6; i++) circle(g, 0, ny + 26 + i * (h * 0.4 / 6), 3.4, shade(col, 0.5)); break; }
    case 'alb': break;
    case 'habit': { g.beginPath(); rr(g, -w * 0.2, ny - 8, w * 0.4, 22, 10); fillO(g, '#ffffff', OWb() * 0.6); break; }
    case 'aodai': g.strokeStyle = shade(col, -0.3); g.lineWidth = 3.5; g.beginPath(); g.moveTo(-4, ny); g.quadraticCurveTo(w * 0.2, ny + 22, w * 0.3, ny + 40); g.stroke(); circle(g, w * 0.3, ny + 40, 3, shade(col, -0.3)); break;
    case 'blouse': g.strokeStyle = shade(col, -0.3); g.lineWidth = 3; g.beginPath(); g.arc(0, ny - 6, 16, 0.3, Math.PI - 0.3); g.stroke(); break;
    case 'hoodie': seg(g, [[-10, ny], [-12, ny + 30]], 3, '#ffffff'); seg(g, [[10, ny], [12, ny + 30]], 3, '#ffffff'); break;
    case 'sweater': for (let k = 0; k < 3; k++) seg(g, [[-w, -h * 0.06 - k * 6], [w, -h * 0.06 - k * 6]], 2, shade(col, -0.2)); break;
  }
  for (const a of ch.acc || []) if (a.startsWith('stole:')) { const sc = a.slice(6); for (const sx of [-1, 1]) { g.beginPath(); rr(g, sx * w * 0.2 - 12, sy + 4, 24, h * 0.42, 6); fillO(g, sc, OWb() * 0.6); } star(g, w * 0.2, sy + h * 0.3, 7, '#ffe08a'); }
  if ((ch.acc || []).includes('rosary')) for (let k = 0; k < 11; k++) { const a = Math.PI * (0.1 + k * 0.08); circle(g, Math.cos(a) * w * 0.3, sy + 6 + Math.sin(a) * 36, 3, '#a8703f'); }
}
function arm(g, ch, sh, hd, d) {
  const top = ch.top || {}, short = ['tshirt', 'polo', 'dress', 'uniform'].includes(top.type) && !top.sleeveLong;
  const col = short ? (ch.skin || S().skin) : (top.sleeve || top.color || '#ffb84d'), wd = d.w * 0.17;
  capsule(g, sh[0], sh[1], hd[0], hd[1], wd); fillO(g, col);
  if (short) { const m = [lerp(sh[0], hd[0], 0.4), lerp(sh[1], hd[1], 0.4)]; capsule(g, sh[0], sh[1], m[0], m[1], wd * 1.18); fillO(g, top.color || '#ffb84d'); }
  g.beginPath(); g.arc(hd[0], hd[1], wd * 0.5, 0, Math.PI * 2); fillO(g, ch.skin || S().skin, OWb() * 0.8);
}

export function beanHead(o) {
  const ch = o.char || {}, d = dims(ch), s = o.s ?? 1, f = o.facing ?? 1, bp = beanPose(o.pose || POSES.stand, d);
  let x = (o.front ? 0 : d.w * 0.06), y = bp.bodyY - d.h * d.face;
  if (o.rot) { const c = Math.cos(o.rot), sn = Math.sin(o.rot); [x, y] = [x * c - y * sn, x * sn + y * c]; }
  return [o.x + x * f * s, o.y + y * s, d.w * 0.42 * s];
}
export function drawBean(g, o) {
  const ch = o.char || {}, d = dims(ch), { w, h } = d, s = o.s ?? 1, f = o.facing ?? 1, bp = beanPose(o.pose || POSES.stand, d);
  const skin = ch.skin || S().skin;
  g.save(); if (o.alpha != null) g.globalAlpha *= o.alpha;
  if (o.shadow !== false && !o.rot) { g.fillStyle = 'rgba(80,50,80,.15)'; g.beginPath(); g.ellipse(o.x, o.y + 3, w * 0.62 * s, 12 * s, 0, 0, Math.PI * 2); g.fill(); }
  g.translate(o.x, o.y); g.scale(f * s, s); if (o.rot) g.rotate(o.rot);
  const sq = o.squash || 0; // feet
  const feet = () => { for (const [ft, far] of [[bp.fB, 1], [bp.fF, 0]]) { g.beginPath(); g.ellipse(ft[0] + w * 0.04, ft[1] - 11, w * 0.17, 12, 0, 0, Math.PI * 2); fillO(g, far ? shade(ch.shoes || '#ff6f61', -0.12) : (ch.shoes || '#ff6f61')); } };
  // body transform: sit back / lean / squash
  const bodyT = () => { g.translate(0, bp.bodyY); if (bp.sit) g.translate(-w * 0.08, -h * 0.06 * bp.sit); g.rotate(bp.lean); g.scale(1 + sq * 0.5, 1 - sq); };
  // 1) white sticker border (body + bun + feet)
  g.save(); g.lineJoin = 'round'; g.strokeStyle = '#ffffff'; g.lineWidth = 16 + OWb() * 2;
  for (const ft of [bp.fB, bp.fF]) { g.beginPath(); g.ellipse(ft[0] + w * 0.04, ft[1] - 11, w * 0.17, 12, 0, 0, Math.PI * 2); g.stroke(); }
  g.save(); bodyT(); bodyPath(g, w, h); g.stroke(); if (hairExtras(g, ch, w, h, d, 'back')) g.stroke(); g.restore(); g.restore();
  feet();
  g.save(); bodyT();
  const back = hairExtras(g, ch, w, h, d, 'back'); if (back) fillO(g, back[0]);
  if ((ch.acc || []).includes('backpack')) { g.beginPath(); rr(g, -w * 0.66, -h * 0.5, w * 0.3, h * 0.36, 12); fillO(g, ch.backpackColor || '#ff8a7a'); }
  const shF = [bp.shX, bp.shY], shB = [-bp.shX, bp.shY];
  const farFront = bp.hB[0] > -w * 0.1;
  if (!farFront) arm(g, ch, shB, bp.hB, d);
  // body
  bodyPath(g, w, h); g.fillStyle = skin; g.fill();
  g.save(); bodyPath(g, w, h); g.clip(); clothes(g, ch, w, h, d);
  g.save(); g.translate(o.front ? 0 : w * 0.06, 0); hairCap(g, ch, w, h, d, o.front); g.restore();
  g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(-w / 2, -h, w * 0.18, h);  // soft side light
  g.restore();
  bodyPath(g, w, h); stroke(g);
  hairExtras(g, ch, w, h, d, 'front');
  // face
  const fx = o.front ? 0 : w * 0.06, fy = -h * d.face, R = w * 0.42;
  g.save(); g.translate(fx, fy); g.rotate(bp.tilt * 0.3);
  chibiFace(g, 0, 0, R, { expr: o.expr, talk: o.talk, blink: o.blink, look: o.look, front: true, override: o.face });
  const acc = ch.acc || [];
  if (acc.includes('glasses')) { g.strokeStyle = INK(); g.lineWidth = 3.6; for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * R * 0.36, R * 0.12, R * 0.24, 0, Math.PI * 2); g.stroke(); } seg(g, [[-R * 0.12, R * 0.1], [R * 0.12, R * 0.1]], 3.2, INK()); }
  if (acc.includes('mustache')) { g.fillStyle = ch.hair?.color || '#2e2424'; g.beginPath(); g.ellipse(-R * 0.13, R * 0.37, R * 0.15, R * 0.06, -0.2, 0, Math.PI * 2); g.ellipse(R * 0.13, R * 0.37, R * 0.15, R * 0.06, 0.2, 0, Math.PI * 2); g.fill(); }
  g.restore();
  if (farFront) arm(g, ch, shB, bp.hB, d);
  arm(g, ch, shF, bp.hF, d);
  if (o.prop) drawCProp(g, o.prop, { hF: bp.hF, hB: bp.hB });
  g.restore(); g.restore();
}
// giant close-up: the top of the bean fills the frame (r = half width of the bean at that size)
export function beanClose(g, cx, cy, r, o = {}) {
  const ch = o.char || {}, d = dims(ch), sc = r / (d.w * 1.32 / 2), so = S().ow;
  g.save(); g.translate(cx, cy); if (o.tilt) g.rotate(o.tilt); g.scale(sc, sc);
  const h = d.h, w = d.w * 1.32; g.translate(0, h * d.face);   // face centre at (0,0); close-ups are chubbier
  try {
    const path = () => { g.beginPath(); rr(g, -w / 2, -h, w, h * 1.6, w / 2); };
    g.save(); g.lineJoin = 'round'; g.strokeStyle = '#ffffff'; g.lineWidth = 16 + OWb() * 2; path(); g.stroke(); if (hairExtras(g, ch, w, h, d, 'back')) g.stroke(); g.restore();
    const back = hairExtras(g, ch, w, h, d, 'back'); if (back) fillO(g, back[0]);
    path(); g.fillStyle = ch.skin || S().skin; g.fill();
    g.save(); path(); g.clip(); clothes(g, { ...ch, legs: null }, w, h, d); hairCap(g, ch, w, h, d, true); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(-w / 2, -h, w * 0.18, h * 2); g.restore();
    path(); stroke(g); hairExtras(g, ch, w, h, d, 'front');
    const R = d.w * 0.56; g.save(); g.translate(0, -h * d.face);
    chibiFace(g, 0, 0, R, { expr: o.expr, talk: o.talk, blink: o.blink, look: o.look, front: true, override: o.face });
    const acc = ch.acc || [];
    if (acc.includes('glasses')) { g.strokeStyle = INK(); g.lineWidth = 3.4; for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * R * 0.36, R * 0.12, R * 0.24, 0, Math.PI * 2); g.stroke(); } seg(g, [[-R * 0.12, R * 0.1], [R * 0.12, R * 0.1]], 3, INK()); }
    if (acc.includes('mustache')) { g.fillStyle = ch.hair?.color || '#2e2424'; g.beginPath(); g.ellipse(-R * 0.13, R * 0.37, R * 0.15, R * 0.06, -0.2, 0, Math.PI * 2); g.ellipse(R * 0.13, R * 0.37, R * 0.15, R * 0.06, 0.2, 0, Math.PI * 2); g.fill(); }
    g.restore();
    if (o.hands === 'pray') { const y = -h * 0.28; for (const sx of [-1, 1]) { capsule(g, sx * w * 0.5, -h * 0.4, sx * 8, y, w * 0.17); fillO(g, ch.top?.color || '#ffb84d'); } g.beginPath(); g.ellipse(0, y - 6, 14, 22, 0, 0, Math.PI * 2); fillO(g, ch.skin || S().skin); }
  } finally { S().ow = so; }
  g.restore();
}
// Sign of the Cross for the bean: near hand travels forehead → chest → left → right shoulder (fractions of w, h)
export function signCross(t, dur = 2.4) {
  const u = clamp(t / dur), stops = [[0, [0.42, 0.34]], [0.12, [0.1, 0.86]], [0.35, [0.06, 0.46]], [0.6, [-0.26, 0.6]], [0.85, [0.3, 0.6]], [1, [0.4, 0.4]]];
  let hp = stops[0][1]; for (let i = 1; i < stops.length; i++) { if (u <= stops[i][0]) { const k = ease.inOut((u - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0])); hp = [lerp(stops[i - 1][1][0], stops[i][1][0], k), lerp(stops[i - 1][1][1], stops[i][1][1], k)]; break; } hp = stops[i][1]; }
  return { ...POSES.stand, handF: hp, keepHands: true };
}
// aliases so shots written for drawChibi keep working with the bean look
export { drawBean as drawChibi, beanClose as chibiClose, beanHead as chibiHead };
