import { GLASS, NAVY, OUT, PALE, Painter, RED, STEEL, SUN, WALL, WOOD, rng, type Ramp } from "../world/paint";
import { BENCHES, BOARD, BOAT, FIRE, LAMPS, LIGHTHOUSE, SALOON, STACKS, TILE, WALK_TILES, WORLD_H, WORLD_W } from "./map";
import type { Box } from "../world/map";

// The village picture, painted once onto a canvas the size of the map. The sea under it and the fire
// on top are animated by the scene.

const px = (b: Box): Box => ({ x: b.x * TILE, y: b.y * TILE, w: b.w * TILE, h: b.h * TILE });

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return { c, P: new Painter(ctx) };
}

/** Boardwalk planks running across, with seams, nail heads and the odd knot. */
function boardwalk(P: Painter, b: Box, rand: () => number) {
  // stilts and their shadow on the water
  P.dither(b.x + 4, b.y + b.h, b.w, 6, "rgba(8,30,80,0.5)", 0);
  for (let x = b.x + 6; x < b.x + b.w - 4; x += 40) {
    P.f(x, b.y + b.h, 6, 10, OUT);
    P.f(x + 1, b.y + b.h, 4, 9, WOOD[1]);
    P.f(x + 1, b.y + b.h, 1, 9, WOOD[2]);
  }
  P.f(b.x, b.y, b.w, b.h, OUT);
  for (let y = b.y + 1, row = 0; y < b.y + b.h - 1; y += 6, row++) {
    const h = Math.min(6, b.y + b.h - 1 - y);
    P.f(b.x + 1, y, b.w - 2, h, WOOD[3]);
    P.f(b.x + 1, y, b.w - 2, 1, WOOD[4]);
    if (h > 4) P.f(b.x + 1, y + 4, b.w - 2, 1, WOOD[2]);
    if (h > 5) P.f(b.x + 1, y + 5, b.w - 2, 1, WOOD[0]);
    for (let x = b.x + 10 + ((row * 17) % 31); x < b.x + b.w - 4; x += 31 + (row % 3) * 7) {
      P.f(x, y, 1, h - 1, WOOD[0]);
      P.p(x - 2, y + 2, STEEL[4]);
      P.p(x + 2, y + 2, STEEL[4]);
    }
  }
  P.specks(b.x + 2, b.y + 2, b.w - 4, b.h - 4, [WOOD[1], WOOD[2], WOOD[5]], Math.round((b.w * b.h) / 140), rand);
}

/** A low railing along the boardwalk's edges, broken where the pier leaves. */
function railing(P: Painter, plaza: Box, gapFrom: number, gapTo: number) {
  const post = (x: number, y: number) => {
    P.f(x, y, 4, 8, OUT);
    P.f(x + 1, y + 1, 2, 6, WOOD[4]);
  };
  const top = plaza.y - 2;
  for (let x = plaza.x; x < plaza.x + plaza.w; x += 16) post(x, top);
  P.f(plaza.x, top + 2, plaza.w, 2, OUT);
  P.f(plaza.x, top + 2, plaza.w, 1, WOOD[5]);
  const bottom = plaza.y + plaza.h - 6;
  for (let x = plaza.x; x < plaza.x + plaza.w; x += 16) if (x + 4 < gapFrom || x > gapTo) post(x, bottom);
  P.f(plaza.x, bottom + 2, gapFrom - plaza.x, 2, OUT);
  P.f(gapTo, bottom + 2, plaza.x + plaza.w - gapTo, 2, OUT);
  for (const x of [plaza.x - 2, plaza.x + plaza.w - 2]) for (let y = plaza.y; y < plaza.y + plaza.h; y += 16) post(x, y);
}

function windowAt(P: Painter, x: number, y: number, lit: boolean) {
  P.f(x, y, 14, 12, OUT);
  P.f(x + 1, y + 1, 12, 10, WOOD[4]);
  P.f(x + 2, y + 2, 10, 8, lit ? SUN[4] : GLASS[3]);
  P.f(x + 2, y + 2, 10, 2, lit ? SUN[5] : GLASS[4]);
  P.f(x + 7, y + 2, 1, 8, WOOD[2]);
  P.f(x + 2, y + 5, 10, 1, WOOD[2]);
}

/** The Gusher saloon: clapboard walls, a stepped red roof, swinging doors and a sign. */
function saloon(P: Painter) {
  const b = px(SALOON);
  const wallTop = b.y + 30;
  P.shadow(b.x, wallTop, b.w, b.h - 30, 5);
  P.f(b.x, wallTop, b.w, b.h - 30, OUT);
  for (let y = wallTop + 1; y < b.y + b.h - 1; y += 4) {
    P.f(b.x + 1, y, b.w - 2, 3, WALL[3]);
    P.f(b.x + 1, y, b.w - 2, 1, WALL[4]);
    P.f(b.x + 1, y + 3, b.w - 2, 1, WALL[1]);
  }
  // roof
  for (let i = 0; i < 4; i++) {
    const inset = 6 - i * 2;
    P.f(b.x - 4 + inset, b.y + 6 + i * 6, b.w + 8 - inset * 2, 7, OUT);
    P.f(b.x - 3 + inset, b.y + 7 + i * 6, b.w + 6 - inset * 2, 5, RED[3]);
    P.f(b.x - 3 + inset, b.y + 7 + i * 6, b.w + 6 - inset * 2, 1, RED[4]);
  }
  // sign plank
  P.bevel(b.x + 30, b.y, 100, 14, SUN, 3);
  for (const wx of [b.x + 12, b.x + 30, b.x + b.w - 44, b.x + b.w - 26]) windowAt(P, wx, wallTop + 12, true);
  // swinging doors
  const dx = b.x + b.w / 2 - 12;
  const dy = b.y + b.h - 26;
  P.f(dx, dy, 24, 26, OUT);
  P.f(dx + 1, dy + 1, 22, 25, NAVY[1]);
  P.f(dx + 2, dy + 8, 9, 12, WOOD[3]);
  P.f(dx + 13, dy + 8, 9, 12, WOOD[3]);
  P.f(dx + 2, dy + 8, 9, 1, WOOD[5]);
  P.f(dx + 13, dy + 8, 9, 1, WOOD[5]);
  // porch step
  P.f(dx - 6, b.y + b.h - 2, 36, 3, OUT);
  P.f(dx - 5, b.y + b.h - 2, 34, 1, WOOD[4]);
}

/** Red and white bands, a gallery and the lamp room. */
function lighthouse(P: Painter) {
  const b = px(LIGHTHOUSE);
  const x = b.x + 12;
  const w = b.w - 24;
  P.shadow(x, b.y + 30, w, b.h - 30, 5);
  for (let y = b.y + 30, i = 0; y < b.y + b.h - 2; y += 16, i++) P.cylinder(x, y, w, Math.min(16, b.y + b.h - 2 - y), i % 2 ? WALL : RED);
  P.f(x - 1, b.y + b.h - 2, w + 2, 2, OUT);
  // gallery and lamp room
  P.bevel(x - 6, b.y + 24, w + 12, 7, STEEL, 3);
  P.f(x + 2, b.y + 10, w - 4, 14, OUT);
  P.f(x + 3, b.y + 11, w - 6, 12, SUN[4]);
  P.f(x + 5, b.y + 13, w - 10, 8, SUN[5]);
  P.f(x, b.y + 4, w, 7, OUT);
  P.f(x + 1, b.y + 5, w - 2, 5, RED[2]);
  P.f(x + w / 2 - 1, b.y, 2, 5, OUT);
  // door
  P.f(x + w / 2 - 5, b.y + b.h - 18, 10, 16, OUT);
  P.f(x + w / 2 - 4, b.y + b.h - 17, 8, 15, WOOD[2]);
}

function noticeBoard(P: Painter, rand: () => number) {
  const b = px(BOARD);
  P.f(b.x + 4, b.y + 12, 4, b.h - 12, OUT);
  P.f(b.x + b.w - 8, b.y + 12, 4, b.h - 12, OUT);
  P.bevel(b.x, b.y, b.w, 22, WOOD, 3);
  for (let i = 0; i < 5; i++) {
    const nx = b.x + 4 + Math.floor(rand() * (b.w - 14));
    const ny = b.y + 3 + Math.floor(rand() * 10);
    P.f(nx, ny, 9, 8, i % 2 ? WALL[5] : PALE[4]);
    P.f(nx + 2, ny + 2, 5, 1, STEEL[3]);
    P.f(nx + 2, ny + 4, 4, 1, STEEL[3]);
    P.p(nx + 4, ny, RED[3]);
  }
}

/** A ring of stones and a stack of logs; the flames are drawn by the scene. */
function firePit(P: Painter) {
  const b = px(FIRE);
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2 + 4;
  P.dither(cx - 18, cy - 4, 36, 14, "rgba(16,22,44,0.3)", 1);
  for (let a = 0; a < 12; a++) {
    const t = (a / 12) * Math.PI * 2;
    const sx = Math.round(cx + Math.cos(t) * 16) - 3;
    const sy = Math.round(cy + Math.sin(t) * 9) - 2;
    P.bevel(sx, sy, 7, 5, STEEL, 3);
  }
  P.f(cx - 11, cy - 3, 22, 7, NAVY[0]);
  P.beam(cx - 10, cy + 2, cx + 9, cy - 3, WOOD);
  P.beam(cx - 9, cy - 3, cx + 10, cy + 2, WOOD);
}

function bench(P: Painter, b: Box) {
  const r = px(b);
  P.shadow(r.x + 2, r.y + 4, r.w - 4, r.h - 4, 3);
  P.bevel(r.x + 2, r.y + 4, r.w - 4, r.h - 6, WOOD, 4);
  if (r.w > r.h) for (let x = r.x + 6; x < r.x + r.w - 4; x += 6) P.f(x, r.y + 5, 1, r.h - 8, WOOD[1]);
  else for (let y = r.y + 8; y < r.y + r.h - 4; y += 6) P.f(r.x + 3, y, r.w - 6, 1, WOOD[1]);
}

function lamp(P: Painter, l: { x: number; y: number }) {
  const x = l.x * TILE + 6;
  const y = l.y * TILE - 8;
  P.f(x, y + 6, 4, 18, OUT);
  P.f(x + 1, y + 6, 2, 17, STEEL[2]);
  P.f(x - 3, y, 10, 8, OUT);
  P.f(x - 2, y + 1, 8, 6, SUN[4]);
  P.f(x - 1, y + 2, 6, 3, SUN[5]);
  P.f(x - 4, y + 22, 12, 3, OUT);
}

function stack(P: Painter, b: Box, i: number) {
  const r = px(b);
  P.shadow(r.x, r.y, r.w, r.h, 4);
  if (i % 2 === 0) {
    // barrels
    for (let x = r.x; x + 12 <= r.x + r.w; x += 13) {
      P.cylinder(x, r.y + 4, 12, r.h - 4, i === 0 ? RED : (["#1e5fae", "#2f7fd0", "#3e8ee8", "#5ca6f2", "#8fc4f7", "#cfe6ff"] as Ramp));
      P.f(x, r.y + 3, 12, 2, OUT);
      P.f(x + 1, r.y + 4, 10, 1, STEEL[5]);
    }
  } else {
    // crates
    for (let x = r.x; x + 14 <= r.x + r.w; x += 15) {
      P.bevel(x, r.y + 2, 14, r.h - 2, WOOD, 3);
      P.line(x + 2, r.y + 4, x + 11, r.y + r.h - 3, WOOD[1]);
    }
  }
}

function boat(P: Painter) {
  const b = px(BOAT);
  P.dither(b.x + 4, b.y + 18, b.w - 4, 4, "rgba(8,30,80,0.5)", 0);
  P.f(b.x + 2, b.y + 8, b.w - 4, 12, OUT);
  P.f(b.x, b.y + 8, b.w, 4, OUT);
  P.f(b.x + 3, b.y + 9, b.w - 6, 4, RED[3]);
  P.f(b.x + 4, b.y + 13, b.w - 8, 5, WALL[4]);
  P.f(b.x + 3, b.y + 9, b.w - 6, 1, RED[4]);
  P.bevel(b.x + 20, b.y, 24, 10, WALL, 3);
  P.f(b.x + 24, b.y + 3, 6, 4, GLASS[3]);
  P.f(b.x + 33, b.y + 3, 6, 4, GLASS[3]);
}

export function villagePicture() {
  const { c, P } = canvas(WORLD_W, WORLD_H);
  const rand = rng(77);
  const [plaza, pier] = WALK_TILES.map(px);
  boardwalk(P, { x: plaza.x - 4, y: plaza.y - 4, w: plaza.w + 8, h: plaza.h + 8 }, rand);
  boardwalk(P, { x: pier.x, y: pier.y - 4, w: pier.w, h: pier.h + 4 }, rand);
  boat(P);
  railing(P, { x: plaza.x - 4, y: plaza.y - 4, w: plaza.w + 8, h: plaza.h + 8 }, pier.x, pier.x + pier.w);
  saloon(P);
  lighthouse(P);
  noticeBoard(P, rand);
  firePit(P);
  BENCHES.forEach((b) => bench(P, b));
  STACKS.forEach((b, i) => stack(P, b, i));
  LAMPS.forEach((l) => lamp(P, l));
  return c;
}
