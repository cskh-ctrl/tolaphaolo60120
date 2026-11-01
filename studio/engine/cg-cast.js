// engine/cg-cast.js — the recurring cast of the Catholic channel. SAME look in every episode: never change colours,
// hair or outfits per video (that is how viewers recognise them). Add new one-off characters in the project's
// scenes/cast.js by spreading a base: { ...EXTRA.officeWoman, top: {...} }.
const SKIN = { light: '#ffe0cc', warm: '#ffd2b4', tan: '#f2bf98', old: '#f6d2bc' };

// Bin — cậu bé 9 tuổi tò mò, hay hỏi ngây ngô (hero). Signature: yellow-orange star tee, blue shorts, red sneakers.
export const BIN = { name: 'Bin', kid: true, skin: SKIN.warm, hair: { style: 'boy', color: '#3a2a2e' },
  top: { type: 'tshirt', color: '#ffb84d', color2: '#fff3c8', print: 'star' }, legs: { type: 'shorts', color: '#6b8fd6' }, shoes: '#ff6f61' };
// Na — bạn thân của Bin, hiểu biết hơn nhưng không dạy đời. Signature: mint dress, bob hair, round glasses, pink hairclip.
export const NA = { name: 'Na', kid: true, skin: SKIN.light, hair: { style: 'bob', color: '#4a2e2a' },
  top: { type: 'dress', color: '#8fd9c0' }, legs: { type: 'skirt', color: '#8fd9c0' }, shoes: '#ff9fb8', acc: ['glasses'] };
// Mẹ (Mẹ Hạnh) — dịu dàng, khéo léo. Signature: lavender blouse + navy long skirt, low bun. Sunday: MOM_SUNDAY (áo dài).
export const ME = { name: 'Mẹ', skin: SKIN.light, hair: { style: 'bun', color: '#3a2626' },
  top: { type: 'blouse', color: '#c9a8ec' }, legs: { type: 'longskirt', color: '#6a6aa8' }, shoes: '#8a6a9a' };
export const ME_AODAI = { ...ME, top: { type: 'aodai', color: '#a8d4f2' }, legs: { type: 'pants', color: '#ffffff' } };
// Bố (Bố Tuấn) — hài hước, gần gũi, hơi tròn bụng. Signature: sky-blue polo, khaki pants, mustache.
export const BO = { name: 'Bố', skin: SKIN.tan, belly: true, hair: { style: 'short', color: '#2e2424' },
  top: { type: 'polo', color: '#8ec5ea' }, legs: { type: 'pants', color: '#c9a77a' }, shoes: '#6a4a3a', acc: ['mustache'] };
// Cha Minh — linh mục thân thiện, xuất hiện khi cần kiến thức chuyên sâu. Black cassock + white collar, glasses, grey-streaked side part.
export const CHA = { name: 'Cha Minh', skin: SKIN.warm, hair: { style: 'side', color: '#4a4448' },
  top: { type: 'cassock', color: '#3a3644' }, legs: { type: 'pants', color: '#3a3644' }, shoes: '#2a2630', acc: ['glasses'] };
// Cha Minh during Mass: white alb + stole in the liturgical colour (green Ordinary Time, purple Advent/Lent, white Christmas/Easter, red Pentecost/martyrs).
export const CHA_LE = (stole = '#6fbf73') => ({ ...CHA, top: { type: 'alb', color: '#fbf8f2' }, legs: { type: 'pants', color: '#fbf8f2' }, acc: ['glasses', `stole:${stole}`], stick: { top: 'alb', color: '#fbf8f2', color2: stole, face: 'glasses', head: 'none' } });
export const LITURGICAL = { ordinary: '#6fbf73', advent: '#9a7ad6', lent: '#9a7ad6', christmas: '#fffaf0', easter: '#fffaf0', pentecost: '#e8584a', martyr: '#e8584a', gaudete: '#f2a6c8' };

// adults for stories that are not about kids (office, love & marriage, faith talks with non-Catholics)
export const EXTRA = {
  chiLan:  { name: 'Chị Lan', skin: SKIN.light, hair: { style: 'long', color: '#2e2226' }, top: { type: 'blazer', color: '#ff9a8a' }, legs: { type: 'pants', color: '#4a4a6a' }, shoes: '#4a3a4a' },  // nhân viên văn phòng
  anhKhoa: { name: 'Anh Khoa', skin: SKIN.tan, hair: { style: 'side', color: '#2a2224' }, top: { type: 'shirt', color: '#ffffff', tie: '#5a7ad6' }, legs: { type: 'pants', color: '#5a5a7a' }, shoes: '#3a2a2a' }, // đồng nghiệp / chồng trẻ
  huy:     { name: 'Huy', skin: SKIN.warm, hair: { style: 'curly', color: '#2a2224' }, top: { type: 'hoodie', color: '#ffa86a' }, legs: { type: 'pants', color: '#5a6a8a' }, shoes: '#ffffff' }, // bạn không Công giáo
  baNoi:   { name: 'Bà Nội', skin: SKIN.old, hair: { style: 'greyBun', color: '#c8c2c8' }, top: { type: 'blouse', color: '#c99a7a' }, legs: { type: 'pants', color: '#5a4a4a' }, shoes: '#5a4a4a', acc: ['rosary'] },
  ongNoi:  { name: 'Ông Nội', skin: SKIN.old, hair: { style: 'bald', color: '#d8d4d8' }, top: { type: 'shirt', color: '#e8e0c8' }, legs: { type: 'pants', color: '#7a6a5a' }, shoes: '#4a3a3a', acc: ['glasses'] },
  soAnna:  { name: 'Sơ Anna', skin: SKIN.light, hair: { style: 'veil', color: '#6a7a9a' }, top: { type: 'habit', color: '#9aa8c8' }, legs: { type: 'longskirt', color: '#9aa8c8' }, shoes: '#3a3a4a' }, // nữ tu
  coThao:  { name: 'Cô Thảo', skin: SKIN.light, hair: { style: 'ponytail', color: '#3a2626' }, top: { type: 'aodai', color: '#ffffff' }, legs: { type: 'pants', color: '#ffffff' }, shoes: '#c9a8ec' }, // cô giáo / giáo lý viên
  ty:      { name: 'Tý', kid: true, skin: SKIN.tan, hair: { style: 'short', color: '#2a2224' }, top: { type: 'uniform', color: '#ffffff', badge: '#e8584a' }, legs: { type: 'pants', color: '#3a4a8a' }, shoes: '#ffffff', acc: ['backpack'] }, // bạn cùng lớp
};
// ---- stick-figure outfits (engine/stick.js, the channel look). One signature colour per character. ----
BIN.stick = { top: 'tshirt', color: '#ffb84d', legs: '#6b8fd6', head: 'spiky' };
NA.stick = { top: 'dress', color: '#8fd9c0', head: 'ponytail', headColor: '#ff9fb8', face: 'glasses' };
ME.stick = { top: 'dress', color: '#c9a8ec', head: 'bun' };
ME_AODAI.stick = { top: 'aodai', color: '#a8d4f2', legs: '#ffffff', head: 'bun' };
BO.stick = { top: 'tshirt', color: '#8ec5ea', legs: '#c9a77a', head: 'none' };
CHA.stick = { top: 'cassock', color: '#4a4658', face: 'glasses', head: 'none' };
EXTRA.chiLan.stick = { top: 'dress', color: '#ff9a8a', head: 'ponytail', headColor: '#ffd66e' };
EXTRA.anhKhoa.stick = { top: 'suit', color: '#5a6a9a', color2: '#ffd66e', head: 'none' };
EXTRA.huy.stick = { top: 'hoodie', color: '#ffa86a', head: 'curly' };
EXTRA.baNoi.stick = { top: 'dress', color: '#c99a7a', head: 'bun' };
EXTRA.ongNoi.stick = { top: 'tshirt', color: '#e8e0c8', legs: '#7a6a5a', face: 'glasses', head: 'none' };
EXTRA.soAnna.stick = { top: 'habit', color: '#9aa8c8', head: 'veil', headColor: '#6a7a9a' };
EXTRA.coThao.stick = { top: 'aodai', color: '#ffffff', legs: '#ffffff', head: 'ponytail', headColor: '#c9a8ec' };
EXTRA.ty.stick = { top: 'tshirt', color: '#ffffff', legs: '#3a4a8a', head: 'capBack', headColor: '#e8584a' };
export const MAIN = [BIN, NA, ME, BO, CHA];
