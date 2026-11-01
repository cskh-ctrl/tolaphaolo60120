// 01_phong_ngu.js — HOOK + MÂU THUẪN: sáng Chúa Nhật, Bin ngủ nướng, Mẹ gọi dậy đi lễ.
import { E, V, registerShot, layer, blurLayer, veil, ease, prog, key, talkAmount, shake } from '/engine/core.js';
import { POSES, posesAt, breathe } from '/engine/rig2d.js';
import { drawChibi, chibiClose, chibiHead, blinkAt } from '/engine/stick.js';
import { bedroom, bed, blanket, alarmClock } from '/engine/cg-sets.js';
import { say, think, emote, hook, timeTag } from '/engine/cg-ui.js';
import { BIN, ME } from '/engine/cg-cast.js';

// shared: Bin's bed, seen from the side
function bedScene(g, t, cam, o = {}) {
  const { GY, M, CX } = bedroom(g, t, cam);
  layer(g, cam, 1, g => {
    const bx = CX - V(380, 330);
    bed(g, bx, GY, V(620, 560));
    if (o.binUp) drawChibi(g, { x: bx + V(230, 200), y: GY - V(118, 118), s: V(1.9, 2.1), char: BIN, pose: breathe(POSES.sit, t, 1, 2), expr: o.binExpr || 'pout', blink: blinkAt(t, 3.1), look: [-0.6, 0] , facing: -1, shadow: false });
    blanket(g, bx + 10, GY - V(18, 18), V(560, 500), '#a8d4f2', o.lump ?? (0.5 + 0.08 * Math.sin(t * 2.2)));
    if (!o.binUp) { // only the hair tuft peeks out
      g.save(); g.beginPath(); g.rect(bx, GY - 400, 200, 290); g.clip(); drawChibi(g, { x: bx + 120, y: GY - 60, s: 1.4, char: BIN, pose: POSES.sleep, rot: -Math.PI / 2, expr: 'asleep', shadow: false }); g.restore();
    }
    alarmClock(g, CX + V(330, 330), GY - V(0, 0), V(1.2, 1.3), t, o.ring);
  });
  return { GY, M, CX };
}

registerShot('s01', { draw(g, t, info) {
  const cam = { z: 1.04 + 0.06 * ease.inOut(info.p), x: -20, y: 0, ...(t < 1.2 ? (([x, y]) => ({ x: x - 20, y }))(shake(t, 5, 9)) : {}) };
  const { GY, CX } = bedScene(g, t, cam, { ring: t < 2.2 });
  layer(g, cam, 1, g => { emote(g, CX - V(180, 160), GY - V(420, 430), 'zzz', t, 1.2); });
  hook(g, t - 0.3, { kicker: 'TẠI SAO', lines: ['Chúa Nhật nào', 'cũng phải đi lễ?'], dur: info.dur - 0.3 });
}});

registerShot('s02', { draw(g, t, info) {
  const cam = { z: 1.0 + 0.04 * ease.inOut(info.p), x: V(120, 140) };
  const { GY, CX } = bedScene(g, t, cam, { ring: false });
  layer(g, cam, 1, g => {
    const mx = CX + V(520, 400), o = { x: mx, y: GY + 10, s: V(2.1, 2.5), facing: -1, char: ME, pose: breathe(posesAt(t, [[0, 'wave'], [0.7, 'handsHips']]), t, 1, 1), expr: 'smile', talk: talkAmount(info.globalT, info.shot.start, info.shot.end), blink: blinkAt(t, 3.7, 1) };
    drawChibi(g, o); const [hx, hy, hr] = chibiHead(o);
    say(g, t, { x: hx - V(120, 260), y: hy - hr - V(150, 190), str: 'Bin ơi, dậy đi lễ con!', start: 0.15, dur: info.dur - 0.2, tail: [hx - 30, hy - hr] });
  });
  timeTag(g, t, { str: 'Sáng Chúa Nhật', dur: info.dur });
}});

registerShot('s03', { draw(g, t, info) {
  const cam = { z: 1.0 + 0.05 * ease.inOut(info.p) };
  blurLayer(g, 10, g => bedScene(g, t, { z: 1.3, x: -260 }, { binUp: true }));
  veil(g, '#ffffff', 0.12);
  layer(g, cam, 1, g => {
    const r = V(330, 360), cx = E.W / 2, cy = E.H * V(0.55, 0.5);
    chibiClose(g, cx, cy, r, { char: BIN, expr: 'pout', talk: talkAmount(info.globalT, info.shot.start, info.shot.end), blink: blinkAt(t, 2.9), tilt: -0.05 + 0.04 * Math.sin(t * 2) });
    emote(g, cx + r * 1.0, cy - r * 1.05, 'anger', t, 1.1);
  });
}});

registerShot('s04', { draw(g, t, info) {
  const cam = { z: 1.06 - 0.04 * ease.inOut(info.p), x: -40 };
  const { GY, CX } = bedScene(g, t, cam, { binUp: true, binExpr: t > 2 ? 'confused' : 'pout', lump: 0.1 });
  layer(g, cam, 1, g => {
    const sit = key(t, [[0, 0], [1.2, 1]], ease.inOut);
    drawChibi(g, { x: CX + V(lerp2(330, 180, sit), lerp2(260, 120, sit)), y: GY - sit * V(62, 62), s: V(2.1, 2.4), facing: -1, char: ME, pose: breathe(sit < 0.5 ? POSES.relaxed : POSES.sit, t, 1, 3), expr: 'gentle', blink: blinkAt(t, 3.5, 2) });
    if (t > 2) emote(g, CX - V(150, 120), GY - V(520, 560), '?', t - 2, 1);
  });
}});
const lerp2 = (a, b, k) => a + (b - a) * k;

registerShot('s05', { draw(g, t, info) {
  const cam = { z: 1.0 + 0.06 * ease.inOut(info.p) };
  blurLayer(g, 10, g => bedScene(g, t, { z: 1.3, x: 300 }, { binUp: true }));
  veil(g, '#fff4e0', 0.18);
  layer(g, cam, 1, g => chibiClose(g, E.W / 2 + V(60, 0), E.H * V(0.55, 0.5), V(320, 350), { char: ME, expr: 'gentle', talk: talkAmount(info.globalT, info.shot.start, info.shot.end), blink: blinkAt(t, 3.4, 1), tilt: 0.06 }));
}});

registerShot('s06', { draw(g, t, info) {
  const cam = { z: 1.0 + 0.1 * ease.inOut(info.p) };
  blurLayer(g, 10, g => bedScene(g, t, { z: 1.3, x: -260 }, { binUp: true }));
  veil(g, '#d8d4f0', 0.25);
  layer(g, cam, 1, g => { const r = V(330, 360), cx = E.W / 2, cy = E.H * V(0.55, 0.5);
    chibiClose(g, cx, cy, r, { char: BIN, expr: t < 1.2 ? 'sad' : 'guilty', talk: talkAmount(info.globalT, info.shot.start, info.shot.end), look: [-0.5, 0.4] });
    emote(g, cx - r * 1.05, cy - r * 0.9, 'sweat', t, 1.2); });
}});
