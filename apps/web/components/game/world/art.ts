import { C } from "@/lib/palette";
import { PRODUCTS, type Product } from "@/lib/game/content";
import { rect, runs, type Palette, type Px } from "@/components/pixel/sprite";
import { barrel, base, flameA, flameB, flamePalette, hat, roughneck } from "@/components/pixel/sprites";
import { blownFrames as blownBase } from "./props";
import type { Painter } from "./paint";

// Every picture in the world is drawn here onto canvases from the same pixel
// palette as the site, then handed to Phaser as textures.

export function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

export function paint(ctx: CanvasRenderingContext2D, items: Px[], ox = 0, oy = 0, scale = 1) {
  for (const p of items) {
    ctx.fillStyle = p.c;
    ctx.fillRect((ox + p.x) * scale, (oy + p.y) * scale, (p.w ?? 1) * scale, (p.h ?? 1) * scale);
  }
}

/** Frames side by side in one canvas, for Phaser to slice. */
export function strip(frames: Px[][], w: number, h: number) {
  const { c, ctx } = canvas(w * frames.length, h);
  frames.forEach((f, i) => paint(ctx, f, i * w, 0));
  return c;
}

/* ---------------- the roughneck ---------------- */

const swapLegs = (rows: readonly string[], a: string, b: string) => [...rows.slice(0, 17), a, b];

const FRONT = [...roughneck];
const BACK = [
  "................",
  "......KKKK......",
  ".....KHHHHK.....",
  "....KHHHHHHK....",
  "...KHHHHHHHHK...",
  "..KKKKKKKKKKKK..",
  "...KMMMMMMMMK...",
  "...KMMMMMMMMK...",
  "...KMMMMMMMMK...",
  "...KSMMMMMMSK...",
  "....KSSSSSSK....",
  ".....KKKKKK.....",
  "....KOOOOOOK....",
  "...KOTOOOOTOK...",
  "..KSOOOOOOOOSK..",
  "..KSOOOOOOOOSK..",
  "...KOOOOOOOOK...",
  "...KOOOKKOOOK...",
  "...KKKK..KKKK...",
];
const SIDE = [
  "................",
  "......KKKK......",
  ".....KEEHHK.....",
  "....KEHHHHHK....",
  "...KHHHHHHHHK...",
  "...KKKKKKKKKKKK.",
  "....KMSSSSSSK...",
  "....KMSSSSKSK...",
  "....KMSSSSSSSK..",
  "....KSSSSMMMMK..",
  ".....KSSSSSSK...",
  "......KKKKKK....",
  ".....KTOOOOK....",
  "....KOOOOOOOK...",
  "....KOOSSOOOK...",
  "....KOOSSOOOK...",
  "....KOOOOOOOK...",
  "....KOOKKOOK....",
  "....KKKK.KKKK...",
];

/** 9 frames of 16 × 19: front, back and side (facing right), each idle and two steps. */
export function characterFrames(palette: Palette) {
  const frames = [
    FRONT,
    swapLegs(FRONT, "...KOOOKKOOOK...", "...KKKK...KK...."),
    swapLegs(FRONT, "...KOOOKKOOOK...", "....KK...KKKK..."),
    BACK,
    swapLegs(BACK, "...KOOOKKOOOK...", "...KKKK...KK...."),
    swapLegs(BACK, "...KOOOKKOOOK...", "....KK...KKKK..."),
    SIDE,
    swapLegs(SIDE, "...KOOK..KOOK...", "...KKKK..KKKK..."),
    swapLegs(SIDE, ".....KOOOOK.....", ".....KKKKKK....."),
  ];
  return strip(
    frames.map((rows) => runs(rows, palette)),
    16,
    19,
  );
}

export const palettes = {
  player: base,
  dispatcher: hat(C.white, C.sky),
  trader: hat(C.red, C.redLight),
  foreman: hat(C.leaf, "#4fd08f"),
};

/* ---------------- sea, rain ---------------- */

/** Crests on a 64 px water tile: x, y, length, and the frame they're born on. */
const CRESTS: [number, number, number, number][] = [
  [4, 6, 7, 0],
  [36, 4, 5, 2],
  [22, 15, 6, 1],
  [52, 18, 7, 3],
  [8, 27, 5, 2],
  [40, 31, 6, 0],
  [26, 40, 7, 3],
  [56, 44, 5, 1],
  [12, 50, 6, 0],
  [44, 56, 7, 2],
  [30, 60, 4, 1],
];
const SPARKS: [number, number, number][] = [
  [17, 9, 1],
  [47, 24, 3],
  [5, 38, 0],
  [35, 50, 2],
  [59, 3, 2],
];

/**
 * Four frames of a 64 px sea tile. Each crest grows, rolls a step sideways and
 * fades over the cycle, starting on its own frame, so the sea never moves in
 * lock-step.
 */
export function waterFrames() {
  return [0, 1, 2, 3].map((f) => {
    const { c, ctx } = canvas(64, 64);
    const items: Px[] = [rect(0, 0, 64, 64, C.sea)];
    for (const [x0, y, len, born] of CRESTS) {
      const age = (f - born + 4) % 4;
      const x = (x0 + age * 2) % 64;
      const w = [len - 2, len, len + 1, len - 1][age];
      const top = age === 2 ? C.white : C.foam;
      for (const dx of [0, -64]) {
        items.push(rect(x + dx, y, w, 1, top));
        if (age > 0) items.push(rect(x + dx + 1, y + 1, w, 1, "#155fc0"));
        if (age === 3) items.push(rect(x + dx - 2, y - 1, 2, 1, "#2a86e8"));
      }
    }
    for (const [x, y, on] of SPARKS) if (f === on) items.push(rect(x, y, 1, 1, C.white), rect(x + 1, y, 1, 1, C.foam));
    paint(ctx, items);
    return c;
  });
}

/** A slow swell laid over the sea: soft darker bands that drift the other way. */
export function swellTile() {
  const { c, ctx } = canvas(128, 128);
  const items: Px[] = [];
  for (let y = 0; y < 128; y++) {
    const phase = Math.sin((y / 128) * Math.PI * 2);
    if (phase > 0.55) for (let x = (y * 3) % 8; x < 128; x += 8) items.push(rect(x, y, 4, 1, "rgba(10,60,150,0.5)"));
    if (phase < -0.85) for (let x = (y * 5) % 12; x < 128; x += 12) items.push(rect(x, y, 3, 1, "rgba(150,200,255,0.35)"));
  }
  paint(ctx, items);
  return c;
}

export function rainTile() {
  const { c, ctx } = canvas(32, 32);
  const items: Px[] = [];
  for (const [x, y] of [
    [2, 1],
    [14, 9],
    [26, 4],
    [8, 18],
    [20, 24],
    [30, 16],
  ]) {
    items.push(rect(x, y, 1, 4, C.rain));
  }
  paint(ctx, items);
  return c;
}

/* ---------------- the rig and the pads, painted in props.ts ---------------- */

export { lockedPicture, rigPicture as deckPicture, unitPicture, wellFrames } from "./props";

/** A blown well: the shared scorched skid with this module's flame sprites, doubled. */
export function blownFrames() {
  const flame = (rows: readonly string[]) => (P: Painter, ox: number) => {
    for (const p of runs(rows, flamePalette)) P.f(ox + 7 + p.x * 2, 1 + p.y * 2, (p.w ?? 1) * 2, 2, p.c);
  };
  return blownBase({ a: flame(flameA), b: flame(flameB) });
}

export function barrelPicture(p: Product) {
  const { c, ctx } = canvas(13, 12);
  paint(ctx, runs(barrel, { ...base, R: PRODUCTS[p].color, r: C.ink, W: PRODUCTS[p].shine }));
  return c;
}

/** The supply boat from the banner, doubled up to sit at the dock. */
export function boatPicture() {
  const rows = [
    "..............KKKK..........",
    "..............KWWK..........",
    "..............KWBK..........",
    "KKKKKKKKKKKKKKKKKKKKKKKKKKKK",
    "KRRRRRRRRRRRRRRRRRRRRRRRRRRK",
    ".KrrrrrrrrrrrrrrrrrrrrrrrrK.",
    "..KKKKKKKKKKKKKKKKKKKKKKKK..",
  ];
  const { c, ctx } = canvas(56, 14);
  paint(ctx, runs(rows, base), 0, 0, 2);
  return c;
}
