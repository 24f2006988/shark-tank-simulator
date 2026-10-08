import type { SharkId } from "@/lib/types";

/** Pixel-art portraits drawn in code on a 40x40 grid: no image files, and every shark gets their own silhouette. */
export const SIZE = 40;

export type PixelMood = "hooked" | "warm" | "neutral" | "doubtful" | "cold" | "out" | "thinking" | "surprised";

/** A horizontal run of one colour: the unit the SVG renders, so a face is a few hundred rects, not 1600. */
export interface Run {
  x: number;
  y: number;
  w: number;
  c: string;
}

type Cell = string | null;
type Test = (x: number, y: number) => boolean;

class Grid {
  readonly size: number;
  readonly cells: Cell[];

  constructor(size: number = SIZE) {
    this.size = size;
    this.cells = new Array<Cell>(size * size).fill(null);
  }

  set(x: number, y: number, c: Cell): void {
    if (x >= 0 && y >= 0 && x < this.size && y < this.size) this.cells[y * this.size + x] = c;
  }

  get(x: number, y: number): Cell {
    return x >= 0 && y >= 0 && x < this.size && y < this.size ? this.cells[y * this.size + x] : null;
  }

  /** Inclusive rectangle. */
  rect(x0: number, y0: number, x1: number, y1: number, c: Cell): void {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, c);
  }

  fill(test: Test, c: string): void {
    for (let y = 0; y < this.size; y++) for (let x = 0; x < this.size; x++) if (test(x, y)) this.set(x, y, c);
  }

  /** Draws a small sprite from text rows; `.` is transparent and letters look up the palette. */
  stamp(rows: string[], ox: number, oy: number, pal: Record<string, string>): void {
    rows.forEach((row, dy) => {
      [...row].forEach((ch, dx) => {
        const c = pal[ch];
        if (c) this.set(ox + dx, oy + dy, c);
      });
    });
  }

  /** Cells that touch (4-neighbour) a filled cell of `other` but are empty in both. */
  outlineOf(other: Grid): [number, number][] {
    const out: [number, number][] = [];
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.get(x, y) || other.get(x, y)) continue;
        const near = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].some(([dx, dy]) => this.get(x + dx, y + dy) || other.get(x + dx, y + dy));
        if (near) out.push([x, y]);
      }
    }
    return out;
  }

  runs(): Run[] {
    const runs: Run[] = [];
    for (let y = 0; y < this.size; y++) {
      let x = 0;
      while (x < this.size) {
        const c = this.get(x, y);
        if (!c) {
          x++;
          continue;
        }
        let w = 1;
        while (x + w < this.size && this.get(x + w, y) === c) w++;
        runs.push({ x, y, w, c });
        x += w;
      }
    }
    return runs;
  }
}

const OUT = "#2a1c16";
const GOLD = "#f2c14e";
const GOLD_D = "#c8962d";
const CX = 20;
const CY = 19;

interface Spec {
  skin: string;
  shade: string;
  hair: string;
  hairDark: string;
  hairLight: string;
  brow: string;
  lip: string;
  iris: string;
  /** Head half-width, half-height and squareness (2 = ellipse, 3+ = boxy jaw). */
  rx: number;
  ry: number;
  p: number;
  /** Heavier brows for the older, sterner shark. */
  thickBrows: boolean;
}

const SPECS: Record<SharkId, Spec> = {
  vikram: { skin: "#d9a070", shade: "#b97d52", hair: "#44444c", hairDark: "#2c2c33", hairLight: "#bcbcc6", brow: "#3a3a42", lip: "#9a4a3a", iris: "#3b2416", rx: 11.6, ry: 11.6, p: 3.1, thickBrows: true },
  meera: { skin: "#e6ad82", shade: "#c98a60", hair: "#1f1512", hairDark: "#120b09", hairLight: "#6a4638", brow: "#1f1512", lip: "#b24a48", iris: "#2a160c", rx: 10.6, ry: 11.6, p: 2.3, thickBrows: false },
  arjun: { skin: "#c79167", shade: "#a06c46", hair: "#1b1715", hairDark: "#0f0d0c", hairLight: "#524840", brow: "#1b1715", lip: "#85423a", iris: "#24150d", rx: 10.2, ry: 12.4, p: 2.7, thickBrows: false },
  zara: { skin: "#f0c19b", shade: "#d19a74", hair: "#43264a", hairDark: "#2c1832", hairLight: "#b48ae0", brow: "#43264a", lip: "#c2307a", iris: "#3a2030", rx: 10.4, ry: 11.8, p: 2.5, thickBrows: false },
};

const headTest =
  (sp: Spec, grow = 0): Test =>
  (x, y) =>
    Math.abs((x + 0.5 - CX) / (sp.rx + grow)) ** sp.p + Math.abs((y + 0.5 - CY) / (sp.ry + grow)) ** sp.p <= 1;

/** First and last filled x on a row of the head. */
function edges(sp: Spec, y: number): [number, number] {
  const inH = headTest(sp);
  let l = CX;
  let r = CX - 1;
  for (let x = 0; x < SIZE; x++) {
    if (inH(x, y)) {
      l = Math.min(l, x);
      r = Math.max(r, x);
    }
  }
  return [l, r];
}

const mirror = (x: number) => SIZE - 1 - x;

function drawBody(g: Grid, id: SharkId, sp: Spec): void {
  const row = (y: number, hw: number, c: string) => g.rect(Math.round(19.5 - hw), y, Math.round(19.5 + hw), y, c);
  switch (id) {
    case "vikram": {
      for (let y = 31; y < SIZE; y++) row(y, 11.5 + (y - 31) * 1.45, "#1f2b47");
      for (let y = 31; y <= 37; y++) row(y, 5.2 - (y - 31) * 0.8, "#f1f5f9");
      g.rect(19, 33, 20, 39, GOLD);
      g.rect(19, 32, 20, 32, GOLD_D);
      for (let i = 0; i < 8; i++) {
        g.set(12 + Math.round(i * 0.7), 31 + i, "#141d33");
        g.set(mirror(12 + Math.round(i * 0.7)), 31 + i, "#141d33");
      }
      g.rect(29, 36, 31, 36, "#e0485a");
      g.rect(29, 37, 30, 37, "#e0485a");
      break;
    }
    case "meera": {
      for (let y = 31; y < SIZE; y++) row(y, 10 + (y - 31) * 1.25, "#f0647c");
      for (let x = 7; x <= 32; x++) {
        const yc = Math.round(31.5 + (x - 7) * 0.3);
        g.rect(x, yc, x, yc + 2, "#0e8a80");
        g.set(x, yc, GOLD);
      }
      break;
    }
    case "arjun": {
      for (let y = 31; y < SIZE; y++) row(y, 11.5 + (y - 31) * 1.5, "#17899f");
      g.fill((x, y) => Math.abs((x + 0.5 - CX) / 9.5) ** 2 + Math.abs((y + 0.5 - 31) / 4.6) ** 2 <= 1, "#0f6578");
      break;
    }
    case "zara": {
      for (let y = 31; y < SIZE; y++) row(y, 10 + (y - 31) * 1.3, "#6a3fcc");
      for (let y = 31; y <= 36; y++) row(y, 4.5 - (y - 31) * 0.7, "#f4effd");
      for (let i = 0; i < 8; i++) {
        g.set(11 + Math.round(i * 0.65), 31 + i, "#9a79e8");
        g.set(mirror(11 + Math.round(i * 0.65)), 31 + i, "#9a79e8");
      }
      g.rect(29, 35, 30, 36, GOLD);
      break;
    }
  }
  g.rect(17, 28, 22, 33, sp.shade);
  if (id === "meera") {
    g.rect(16, 33, 23, 33, GOLD);
    g.rect(17, 31, 22, 32, sp.shade);
  }
  if (id === "arjun") {
    // Headphones resting on the chest, hood strings on top.
    for (let x = 12; x <= 27; x++) {
      const y = 34 + Math.round(2.5 * (1 - ((x - 19.5) / 8) ** 2));
      g.rect(x, y, x, y + 1, "#14171c");
    }
    g.rect(9, 31, 11, 35, "#14171c");
    g.rect(28, 31, 30, 35, "#14171c");
    g.rect(10, 32, 10, 34, "#27d3ee");
    g.rect(29, 32, 29, 34, "#27d3ee");
    g.rect(18, 36, 18, 39, "#cdeef5");
    g.rect(21, 36, 21, 39, "#cdeef5");
  }
}

function drawHairBack(g: Grid, id: SharkId, sp: Spec): void {
  switch (id) {
    case "meera": {
      g.fill((x, y) => Math.abs((x + 0.5 - CX) / 4.8) ** 2 + Math.abs((y + 0.5 - 4.6) / 4.6) ** 2 <= 1, sp.hair);
      g.fill(headTest({ ...sp, rx: 13.2, ry: 13.6, p: 2.4 }), sp.hair);
      g.rect(6, 19, 8, 29, sp.hair);
      g.rect(31, 19, 33, 29, sp.hair);
      for (let i = 0; i <= 13; i++) g.set(13 + i, 7 - Math.round(i * 0.35), GOLD);
      g.set(27, 2, GOLD_D);
      g.set(12, 7, GOLD_D);
      g.set(18, 2, sp.hairLight);
      g.set(21, 2, sp.hairLight);
      break;
    }
    case "arjun": {
      for (let i = 0; i < 6; i++) g.rect(23 - Math.floor(i / 2), 1 + i, 25 - Math.floor(i / 3), 1 + i, sp.hair);
      break;
    }
    case "zara": {
      g.fill(headTest({ ...sp, rx: 13.4, ry: 13.6, p: 2.4 }), sp.hair);
      for (let y = 20; y <= 37; y++) {
        const wave = Math.floor(y / 3) % 2;
        g.rect(6 + wave, y, 9 + wave, y, sp.hair);
        g.rect(mirror(9 + wave), y, mirror(6 + wave), y, sp.hair);
      }
      g.rect(7, 27, 8, 28, sp.hairLight);
      g.rect(31, 31, 32, 32, sp.hairLight);
      break;
    }
    default:
      break;
  }
}

function drawHead(g: Grid, sp: Spec): void {
  const inH = headTest(sp);
  const [l, r] = edges(sp, 21);
  g.rect(l - 2, 19, l - 1, 23, sp.skin);
  g.rect(r + 1, 19, r + 2, 23, sp.skin);
  g.set(l - 1, 21, sp.shade);
  g.set(r + 1, 21, sp.shade);
  g.fill(inH, sp.skin);
  g.fill((x, y) => inH(x, y) && x >= CX + sp.rx * 0.55, sp.shade);
  g.fill((x, y) => inH(x, y) && y >= 29, sp.shade);
  g.set(20, 22, sp.shade);
  g.set(19, 23, sp.shade);
  g.set(20, 23, sp.shade);
}

function drawHairFront(g: Grid, id: SharkId, sp: Spec): void {
  const inH = headTest(sp);
  const grown = headTest(sp, 1.3);
  switch (id) {
    case "vikram": {
      const hl = (x: number) => Math.round(9 + (Math.abs(x + 0.5 - CX) / 10.5) ** 2 * 6);
      g.fill((x, y) => grown(x, y) && y <= hl(x), sp.hair);
      g.fill((x, y) => grown(x, y) && y <= hl(x) && Math.abs(x + 0.5 - CX) >= 8.2 && y >= 11, sp.hairLight);
      g.rect(15, 9, 17, 9, sp.hairLight);
      for (let y = 14; y <= 19; y++) {
        const [l, r] = edges(sp, y);
        g.rect(l, y, l + 1, y, sp.hairLight);
        g.rect(r - 1, y, r, y, sp.hairLight);
      }
      for (let x = 8; x <= 31; x++) if (inH(x, hl(x) + 1)) g.set(x, hl(x) + 1, sp.shade);
      break;
    }
    case "meera": {
      const hl = (x: number) => Math.round(10 + (Math.abs(x + 0.5 - CX) / 10) ** 1.6 * 6);
      g.fill((x, y) => grown(x, y) && y <= hl(x), sp.hair);
      g.rect(19, 9, 20, 11, sp.hairLight);
      for (let y = 13; y <= 25; y++) {
        const [l, r] = edges(sp, y);
        g.rect(l - 1, y, l + 1, y, sp.hair);
        g.rect(r - 1, y, r + 1, y, sp.hair);
      }
      for (let x = 10; x <= 29; x++) if (inH(x, hl(x) + 1)) g.set(x, hl(x) + 1, sp.shade);
      break;
    }
    case "arjun": {
      const top = [9, 7, 6, 7, 5, 6, 3, 5, 2, 4, 5, 2, 4, 5, 6, 4, 7, 6, 8, 10];
      const low = [15, 14, 13, 14, 12, 13, 11, 13, 12, 10, 11, 13, 11, 12, 13, 11, 13, 14, 15, 16];
      top.forEach((t, i) => {
        const x = 10 + i;
        g.rect(x, t, x, low[i], sp.hair);
        if (i % 3 === 0) g.set(x, t + 1, sp.hairLight);
        if (inH(x, low[i] + 1)) g.set(x, low[i] + 1, sp.shade);
      });
      break;
    }
    case "zara": {
      const hl = (x: number) => Math.round(9 + (x - 9) * 0.28);
      g.fill((x, y) => grown(x, y) && y <= hl(x), sp.hair);
      for (let y = 13; y <= 29; y++) {
        const [l, r] = edges(sp, y);
        g.rect(l - 1, y, l + 1, y, sp.hair);
        g.rect(r - 1, y, r + 1, y, sp.hair);
      }
      for (let x = 16; x <= 22; x++) g.rect(x, hl(x) - 1, x, hl(x), sp.hairLight);
      g.rect(16, 9, 18, 9, sp.hairLight);
      for (let x = 9; x <= 31; x++) if (inH(x, hl(x) + 1)) g.set(x, hl(x) + 1, sp.shade);
      break;
    }
  }
}

function drawExtras(g: Grid, id: SharkId, sp: Spec): void {
  const inH = headTest(sp);
  const [lEar, rEar] = [edges(sp, 21)[0] - 2, edges(sp, 21)[1] + 2];
  switch (id) {
    case "vikram": {
      const beard = (x: number, y: number) => inH(x, y) && y >= 24 && !(x >= 16 && x <= 23 && y >= 26 && y <= 28);
      g.fill(beard, sp.hairLight);
      g.fill((x, y) => beard(x, y) && y >= 29, "#9a9aa6");
      const lens = (ox: number) => {
        g.rect(ox + 1, 16, ox + 6, 16, "#202027");
        g.rect(ox + 1, 21, ox + 6, 21, "#202027");
        g.rect(ox, 17, ox, 20, "#202027");
        g.rect(ox + 7, 17, ox + 7, 20, "#202027");
      };
      lens(11);
      lens(21);
      g.rect(19, 18, 20, 18, "#202027");
      g.rect(9, 17, 10, 17, "#202027");
      g.rect(29, 17, 30, 17, "#202027");
      break;
    }
    case "meera": {
      g.set(20, 12, "#d62839");
      for (const [ex, dir] of [
        [lEar, 1],
        [rEar, -1],
      ] as const) {
        g.set(ex, 23, GOLD);
        g.set(ex, 24, GOLD_D);
        g.rect(ex - 1, 25, ex + 1, 25, GOLD);
        g.set(ex + dir, 26, GOLD_D);
      }
      break;
    }
    case "arjun": {
      g.fill((x, y) => inH(x, y) && y >= 26 && !(x >= 17 && x <= 22 && y >= 26 && y <= 28) && (x * 3 + y * 5) % 4 === 0, "#7d5238");
      g.set(lEar, 22, "#e5e7eb");
      break;
    }
    case "zara": {
      for (const ex of [lEar, rEar]) {
        g.set(ex, 23, GOLD);
        g.rect(ex - 1, 24, ex + 1, 24, GOLD);
        g.set(ex, 25, GOLD);
      }
      break;
    }
  }
}

interface Base {
  /** Everything behind the face: body, hair back, head, outline. */
  back: Run[];
  /** Everything over the face: fringe, beard, glasses, earrings. */
  front: Run[];
}

const baseCache = new Map<SharkId, Base>();

export function buildBase(id: SharkId): Base {
  const cached = baseCache.get(id);
  if (cached) return cached;
  const sp = SPECS[id];
  const back = new Grid();
  const front = new Grid();
  drawBody(back, id, sp);
  drawHairBack(back, id, sp);
  drawHead(back, sp);
  drawHairFront(front, id, sp);
  drawExtras(front, id, sp);
  for (const [x, y] of back.outlineOf(front)) back.set(x, y, OUT);
  const base = { back: back.runs(), front: front.runs() };
  baseCache.set(id, base);
  return base;
}

export interface Features {
  brows: Run[];
  blush: Run[];
  eyesOpen: Run[];
  eyesShut: Run[];
  mouthShut: Run[];
  mouthOpen: Run[];
}

type Pt = [number, number];
const BROWS: Record<string, Pt[]> = {
  flat: [[13, 14], [14, 14], [15, 14], [16, 14], [17, 14]],
  arch: [[13, 15], [14, 14], [15, 13], [16, 14], [17, 14]],
  high: [[13, 14], [14, 13], [15, 12], [16, 13], [17, 13]],
  angry: [[13, 13], [14, 13], [15, 14], [16, 15], [17, 15]],
  halfAngry: [[13, 14], [14, 14], [15, 15], [16, 15], [17, 15]],
  sad: [[13, 15], [14, 15], [15, 14], [16, 14], [17, 13]],
};

const EYE_Y = 17;
const EYES = {
  open: { rows: ["KKKKK", "WIHIW", "WIPIW", ".sss."], dy: 0 },
  glance: { rows: ["KKKKK", "WWIHW", "WWIPW", ".sss."], dy: 0 },
  half: { rows: ["KKKKK", "WWIIW", "sssss"], dy: 0 },
  narrow: { rows: ["KKKKK", "WIIIW", ".sss."], dy: 1 },
  wide: { rows: ["KKKKK", "WWWWW", "WIPIW", "WWWWW", ".sss."], dy: -1 },
  up: { rows: ["KKKKK", "IHWWW", "IPWWW", ".sss."], dy: 0 },
  happy: { rows: [".KKK.", "K...K"], dy: 1 },
  shut: { rows: ["KKKKK"], dy: 1 },
} as const;

type EyeName = keyof typeof EYES;

const MOUTHS = {
  neutral: { rows: ["LLLLL"], x: 18, y: 27 },
  smile: { rows: ["L.....L", ".LLLLL."], x: 17, y: 26 },
  big: { rows: ["LWWWWWWWL", ".LDDDDDL.", "..LLLLL.."], x: 16, y: 26 },
  smirk: { rows: ["....LLL", "LLLL..."], x: 17, y: 26 },
  frown: { rows: [".LLLLL.", "L.....L"], x: 17, y: 27 },
  ooh: { rows: ["LLL", "LDL", "LLL"], x: 19, y: 26 },
  hmm: { rows: ["...L", "LLL."], x: 20, y: 26 },
} as const;

type MouthName = keyof typeof MOUTHS;

const OPEN_MOUTH = { rows: ["LLLLL", "LDDDL", ".LTL."], x: 18, y: 26 };
const OPEN_BIG = { rows: ["LWWWWWWWL", "LDDDDDDDL", ".LTTTTTL.", ".LLLLLLL."], x: 16, y: 26 };
const OPEN_ROUND = { rows: ["LLLLL", "LDDDL", "LDDDL", "LLLLL"], x: 18, y: 26 };

interface Look {
  left: EyeName;
  right: EyeName;
  browL: keyof typeof BROWS;
  browR: keyof typeof BROWS;
  mouth: MouthName;
  open: typeof OPEN_MOUTH;
  blush: boolean;
}

const LOOKS: Record<PixelMood, Look> = {
  neutral: { left: "open", right: "open", browL: "flat", browR: "flat", mouth: "neutral", open: OPEN_MOUTH, blush: false },
  warm: { left: "open", right: "open", browL: "arch", browR: "arch", mouth: "smile", open: OPEN_MOUTH, blush: true },
  hooked: { left: "happy", right: "happy", browL: "arch", browR: "arch", mouth: "big", open: OPEN_BIG, blush: true },
  doubtful: { left: "glance", right: "half", browL: "high", browR: "halfAngry", mouth: "smirk", open: OPEN_MOUTH, blush: false },
  cold: { left: "narrow", right: "narrow", browL: "angry", browR: "angry", mouth: "frown", open: OPEN_MOUTH, blush: false },
  thinking: { left: "up", right: "up", browL: "high", browR: "flat", mouth: "hmm", open: OPEN_MOUTH, blush: false },
  surprised: { left: "wide", right: "wide", browL: "high", browR: "high", mouth: "ooh", open: OPEN_ROUND, blush: false },
  out: { left: "shut", right: "shut", browL: "sad", browR: "sad", mouth: "frown", open: OPEN_MOUTH, blush: false },
};

const featureCache = new Map<string, Features>();

export function buildFeatures(id: SharkId, mood: PixelMood): Features {
  const key = `${id}:${mood}`;
  const cached = featureCache.get(key);
  if (cached) return cached;
  const sp = SPECS[id];
  const look = LOOKS[mood];
  const pal = { K: OUT, W: "#fffaf0", I: sp.iris, P: "#120b08", H: "#ffffff", s: sp.shade };
  const mpal = { L: sp.lip, W: "#f7f2ea", D: "#4b1c1c", T: "#d96b6b" };

  const eyes = (left: EyeName, right: EyeName) => {
    const g = new Grid();
    for (const [name, x] of [
      [left, 13],
      [right, 22],
    ] as const) {
      const e = EYES[name];
      g.stamp([...e.rows], x, EYE_Y + e.dy, pal);
    }
    return g.runs();
  };

  const brows = new Grid();
  const draw = (pts: Pt[], flip: boolean) =>
    pts.forEach(([x, y]) => {
      const px = flip ? mirror(x) : x;
      brows.set(px, y, sp.brow);
      if (sp.thickBrows) brows.set(px, y + 1, sp.brow);
    });
  draw(BROWS[look.browL], false);
  draw(BROWS[look.browR], true);

  const blush = new Grid();
  if (look.blush) {
    blush.rect(11, 23, 13, 24, "#e7878a");
    blush.rect(26, 23, 28, 24, "#e7878a");
  }

  const m = MOUTHS[look.mouth];
  const shut = new Grid();
  shut.stamp([...m.rows], m.x, m.y, mpal);
  const open = new Grid();
  open.stamp([...look.open.rows], look.open.x, look.open.y, mpal);

  const features: Features = {
    brows: brows.runs(),
    blush: blush.runs(),
    eyesOpen: eyes(look.left, look.right),
    eyesShut: eyes("shut", "shut"),
    mouthShut: shut.runs(),
    mouthOpen: open.runs(),
  };
  featureCache.set(key, features);
  return features;
}

// ---------- Emotes: little pixel icons the sharks "pop" above their heads ----------

export type EmoteKind = "exclaim" | "star" | "question" | "anger" | "dots";

const EMOTE_ROWS: Record<EmoteKind, { rows: string[]; pal: Record<string, string> }> = {
  exclaim: {
    rows: ["..RR..", "..RR..", "..RR..", "..RR..", "..RR..", "......", "..RR..", "..RR.."],
    pal: { R: "#e5484d" },
  },
  star: {
    rows: ["....Y....", "....Y....", "...YYY...", "YYYYYYYYY", ".YYYYYYY.", "..YYYYY..", "..YYYYY..", ".YYY.YYY.", ".YY...YY."],
    pal: { Y: "#f6c343" },
  },
  question: {
    rows: ["..BBBB..", ".BB..BB.", "......BB", ".....BB.", "....BB..", "....BB..", "........", "....BB.."],
    pal: { B: "#4c8dff" },
  },
  anger: {
    rows: [".RR..RR.", ".R....R.", "........", "........", ".R....R.", ".RR..RR."],
    pal: { R: "#e5484d" },
  },
  dots: {
    rows: ["G.G.G"],
    pal: { G: "#9aa3b2" },
  },
};

const EMOTE_SIZE = 12;
const emoteCache = new Map<EmoteKind, Run[]>();

/** Pixel runs for an emote on a 12x12 grid, with the same dark outline as the sharks. */
export function buildEmote(kind: EmoteKind): Run[] {
  const cached = emoteCache.get(kind);
  if (cached) return cached;
  const { rows, pal } = EMOTE_ROWS[kind];
  const body = new Grid(EMOTE_SIZE);
  const ox = Math.floor((EMOTE_SIZE - rows[0].length) / 2);
  const oy = Math.floor((EMOTE_SIZE - rows.length) / 2);
  body.stamp(rows, ox, oy, pal);
  const edge = new Grid(EMOTE_SIZE);
  for (const [x, y] of edge.outlineOf(body)) edge.set(x, y, OUT);
  for (let y = 0; y < EMOTE_SIZE; y++) for (let x = 0; x < EMOTE_SIZE; x++) if (body.get(x, y)) edge.set(x, y, body.get(x, y));
  const runs = edge.runs();
  emoteCache.set(kind, runs);
  return runs;
}

export const EMOTE_GRID = EMOTE_SIZE;
