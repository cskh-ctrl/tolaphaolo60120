// engine/stick.js — the channel's character look: the "What If" stick figures (rig2d) in pastel colours.
// Plum-ink figures with a white rim light, cream face features, one signature outfit colour per character.
// Same API as the other rigs, so shots only change their import:
//   drawChibi(g, { x, y, s, facing, pose, rot, char, expr, talk, blink, look, prop, alpha, shadow, trail, rim })
//   chibiClose(g, cx, cy, r, { char, expr, talk, blink, look, tilt, rimSide })     // giant close-up (bigFace)
//   chibiHead(o) -> [x, y, r]     head centre + radius in world space (bubbles, emotes, labels)
//   signCross(t, dur), blinkAt(t, period, seed)
// The outfit comes from char.stick (see cg-cast.js). Extra poses (pray, sitPray, kneelPray, handsHips, bless,
// openArms, hug, stretch, hold, sleep, sulk, tugBlanket) are registered by chibi.js on import.
import { S } from './core.js';
import { drawFigure, bigFace, headPos, EXPR, EXTRA_PROPS } from './rig2d.js';
import { signCross, blinkAt, drawCProp } from './chibi.js';
export { signCross, blinkAt };

Object.assign(EXPR, {
  pout: { eyes: 'dot', brows: 'worried', mouth: 'frown' }, gentle: { eyes: 'happy', brows: null, mouth: 'smile' },
  guilty: { eyes: 'dot', brows: 'worried', mouth: 'wavy', sweat: true, look: [-0.6, 0.4] }, peaceful: { eyes: 'closed', brows: null, mouth: 'smile' },
  pray: { eyes: 'closed', brows: null, mouth: 'smallSmile' }, laugh: { eyes: 'happy', brows: 'raised', mouth: 'grin' },
  annoyed: { eyes: 'dot', brows: 'angry', mouth: 'flat' }, embarrassed: { eyes: 'happy', brows: 'worried', mouth: 'wavy', sweat: true },
  yawn: { eyes: 'closed', brows: 'raised', mouth: 'oBig' }, asleep: { eyes: 'closed', brows: null, mouth: 'o' },
  love: { eyes: 'happy', brows: 'raised', mouth: 'grin' }, proud: { eyes: 'closed', brows: 'raised', mouth: 'grin' },
});
for (const k of ['rosary', 'book', 'bible', 'candle', 'flower', 'bag']) EXTRA_PROPS[k] = (g, h, t, p) => drawCProp(g, { ...t, hand: 'F' }, { hF: h, hB: h });

const outfit = (ch = {}) => ({ ...(ch.stick || {}), kid: !!ch.kid });
const RIM = (o) => (o.rim === false ? false : { color: S().rimColor || '#ffffff', dir: [-0.75, -0.55], w: S().rimWidth || 5, ...(o.rim || {}) });
export function drawChibi(g, o) { drawFigure(g, { ...o, outfit: outfit(o.char), rim: RIM(o) }); }
export function chibiClose(g, cx, cy, r, o = {}) { bigFace(g, cx, cy, r, { ...o, outfit: outfit(o.char), rimColor: S().rimColor || '#ffffff', rimSide: o.rimSide ?? -1 }); }
export function chibiHead(o) { return headPos({ ...o, outfit: outfit(o.char) }); }
export { drawChibi as drawStick, chibiClose as stickClose, chibiHead as stickHead };
