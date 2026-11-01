// 99_cover.js — 9:16 cover (tools/make_cover.py). Big readable question, hero face with a strong expression, the set behind.
import { E, registerShot, blurLayer, veil } from '/engine/core.js';
import { chibiClose } from '/engine/stick.js';
import { bedroom } from '/engine/cg-sets.js';
import { hook, emote } from '/engine/cg-ui.js';
import { BIN } from '/engine/cg-cast.js';

registerShot('cover', { draw(g) {
  blurLayer(g, 8, g => bedroom(g, 0, { z: 1.2 }));
  veil(g, '#ffffff', 0.1);
  chibiClose(g, E.W / 2, E.H * 0.62, 360, { char: BIN, expr: 'shocked', look: [0, -0.3] });
  emote(g, E.W / 2 + 380, E.H * 0.42, '?!', 1, 1.6);
  hook(g, 1, { kicker: 'TẠI SAO', lines: ['phải đi lễ', 'Chúa Nhật?'], y: E.H * 0.16, dur: 99 });
}});
