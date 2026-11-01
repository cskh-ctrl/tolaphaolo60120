// 02_nha_tho.js — DIỄN BIẾN + GIẢI THÍCH + BÀI HỌC + CÂU HỎI BÌNH LUẬN.
import { E, V, registerShot, layer, blurLayer, veil, ease, prog, key, talkAmount, wordTime } from '/engine/core.js';
import { POSES, posesAt, breathe, walkPose } from '/engine/rig2d.js';
import { drawChibi, chibiClose, chibiHead, blinkAt, signCross } from '/engine/stick.js';
import { dream, churchInside, churchOutside, pew } from '/engine/cg-sets.js';
import { factCard, lessonLine, emote, endQuestion, sourceChip, labelTag } from '/engine/cg-ui.js';
import { BIN, ME_AODAI, BO, CHA, CHA_LE, LITURGICAL } from '/engine/cg-cast.js';

registerShot('s07', { draw(g, t, info) {
  const cam = { z: 1.0 + 0.05 * ease.inOut(info.p) };
  dream(g, t, cam, { symbol: null });
  factCard(g, t, { title: 'Ngày của Chúa', body: ['Chúa Nhật: ngày Hội Thánh', 'mừng Chúa Giêsu Phục Sinh.'], src: 'GLHTCG 2174–2175', icon: 'cross', start: 0.2, dur: info.dur - 0.2, y: E.H * V(0.42, 0.4) });
}});

// family in the pew, priest at the altar in the back
function massScene(g, t, cam, o = {}) {
  const { GY, CX } = churchInside(g, t, cam, { pews: false });
  layer(g, cam, 0.62, g => drawChibi(g, { x: CX, y: GY - V(150, 230), s: V(1.1, 1.2), char: CHA_LE(LITURGICAL.ordinary), pose: breathe(POSES.openArms, t, 1, 4), expr: 'gentle', facing: 1, shadow: false }));
  layer(g, cam, 1, g => {
    const y = GY + V(60, 80), s = V(2.0, 2.3), xs = [CX - V(330, 250), CX - V(40, 20), CX + V(260, 250)];
    drawChibi(g, { x: xs[0], y, s, char: ME_AODAI, pose: breathe(o.mePose || POSES.sitPray, t, 1, 1), expr: o.meExpr || 'peaceful', facing: 1 });
    drawChibi(g, { x: xs[1], y, s, char: BIN, pose: o.binPose ? o.binPose(t) : breathe(POSES.sit, t, 1, 2), expr: o.binExpr || 'neutral', blink: blinkAt(t, 3), facing: 1 });
    drawChibi(g, { x: xs[2], y, s, char: BO, pose: breathe(o.boPose || POSES.sit, t, 1, 3), expr: o.boExpr || 'neutral', facing: -1, blink: blinkAt(t, 3.6, 2) });
    if (o.extra) o.extra(g, xs, y, s);
    pew(g, CX - E.W * 0.6, y + V(40, 50), E.W * 1.2, V(1.0, 1.1));
  });
  return { GY, CX };
}

registerShot('s08', { draw(g, t, info) {
  const cam = { z: 1.08 - 0.06 * ease.inOut(info.p), y: -40 };
  massScene(g, t, cam, { binExpr: 'neutral' });
  factCard(g, t, { title: 'Thánh lễ Chúa Nhật', body: ['Bổn phận của người Công giáo,', 'và là cách đáp lại tình yêu Chúa.'], src: 'GLHTCG 2180–2181', icon: 'church', start: 0.5, dur: info.dur - 0.5, y: E.H * V(0.25, 0.22), accent: '#ffd2d8' });
}});

registerShot('s09', { draw(g, t, info) {
  const cam = { z: 1.25, x: V(160, 200), y: 60 };
  massScene(g, t, cam, { boExpr: t < 1.6 ? 'yawn' : t < 2.4 ? 'shocked' : 'embarrassed', boPose: t < 1.6 ? POSES.stretch : POSES.sit, meExpr: t > 1.4 && t < 2.6 ? 'annoyed' : 'peaceful', binExpr: t > 2.2 ? 'laugh' : 'neutral',
    extra: (g, xs, y, s) => { if (t < 1.6) emote(g, xs[2] + 60, y - 520, 'zzz', t, 1.0); if (t > 1.6 && t < 2.6) emote(g, xs[2] - 40, y - 560, '!', t - 1.6, 1.2); } });
}});

registerShot('s10', { draw(g, t, info) {
  const cam = { z: 1.5 + 0.08 * ease.inOut(info.p), x: V(-40, 0), y: V(100, 200) };
  massScene(g, t, cam, { binPose: (tt) => signCross(tt - 0.3, 2.6), binExpr: t < 0.3 ? 'neutral' : 'pray' });
}});

registerShot('s11', { draw(g, t, info) {
  const cam = { z: 1.0 + 0.05 * ease.inOut(info.p) };
  dream(g, t, cam, { symbol: null, mood: 'pdream' });
  chibiClose(g, E.W / 2, E.H * V(0.62, 0.6), V(300, 330), { char: BIN, expr: 'awe', look: [0, -0.6], tilt: 0.03 * Math.sin(t) });
  emote(g, E.W / 2 + V(330, 300), E.H * V(0.4, 0.42), 'sparkle', t, 1.2);
  lessonLine(g, t, { lines: ['Đi lễ là đi gặp', 'Đấng yêu mình nhất.'], y: E.H * V(0.16, 0.16), dur: info.dur });
}});

registerShot('s12', { draw(g, t, info) {
  const cam = { z: 1.02 + 0.05 * ease.inOut(info.p), x: -30 };
  const { GY, CX } = churchOutside(g, t, cam);
  layer(g, cam, 1, g => {
    const s = V(2.0, 2.3), y = GY + V(30, 40), wk = (ph) => breathe(walkPose(ph), t, 0.4);
    const co = { x: CX + V(330, 330), y, s, char: CHA, pose: breathe(posesAt(t, [[0, 'wave'], [2.6, 'bless']]), t), expr: 'happy', facing: -1, blink: blinkAt(t, 3.2, 3) };
    drawChibi(g, co);
    const dx = t * 18;
    drawChibi(g, { x: CX - V(420, 380) + dx, y, s, char: BO, pose: wk(t * 7), expr: 'happy', facing: 1 });
    drawChibi(g, { x: CX - V(240, 200) + dx, y, s, char: ME_AODAI, pose: wk(t * 7 + 1), expr: 'smile', facing: 1 });
    drawChibi(g, { x: CX - V(60, -10) + dx, y, s, char: BIN, pose: posesAt(t, [[0, 'wave']]), expr: 'happy', facing: 1 });
    const [hx, hy, hr] = chibiHead(co); labelTag(g, { str: 'Cha Minh', x: hx, y: hy - hr - V(70, 80), a: ease.out(prog(t, 0.3, 0.7)) });
  });
}});

registerShot('s13', { draw(g, t, info) {
  endQuestion(g, t, { question: 'Bạn đi lễ Chúa Nhật vì bổn phận, thói quen từ nhỏ, hay vì thật sự muốn gặp Chúa?', cast: [ME_AODAI, BIN, BO] });
}});
