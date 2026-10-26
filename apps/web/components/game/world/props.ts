import { BOARD, CRANE, DECK, DERRICK, DOCK, HELIPAD, KIOSK, LEGS, PADS, PROPS, QUARTERS, RAIL, TANKS, TILE, WORLD_H, WORLD_W, px, type Box } from "./map";
import { GLASS, GREEN, NAVY, OUT, PALE, Painter, RED, SHADOW, STEEL, SUN, WALL, WOOD, rampOf, rng, type Ramp } from "./paint";

// The rig, painted pixel by pixel: shaded deck plates, railings, buildings and
// props, plus the things that sit on the pads. Everything is lit from the
// top-left and casts a dithered shadow down-right.

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return { c, P: new Painter(ctx) };
}

/* ---------------- deck ---------------- */

function plate(P: Painter, x: number, y: number, rand: () => number) {
  P.f(x, y, 16, 16, STEEL[3]);
  P.f(x, y, 16, 1, STEEL[4]);
  P.f(x, y, 1, 16, STEEL[4]);
  P.f(x, y + 15, 16, 1, STEEL[1]);
  P.f(x + 15, y, 1, 16, STEEL[1]);
  P.f(x + 1, y + 14, 14, 1, STEEL[2]);
  P.p(x, y, STEEL[5]);
  for (const [rx, ry] of [
    [2, 2],
    [13, 2],
    [2, 13],
    [13, 13],
  ]) {
    P.p(x + rx, y + ry, STEEL[5]);
    P.p(x + rx + 1, y + ry + 1, STEEL[1]);
  }
  const r = rand();
  if (r < 0.28) {
    // diamond tread
    for (let yy = 4; yy <= 10; yy += 3)
      for (let xx = 4; xx <= 10; xx += 3) {
        const flip = (xx + yy) % 2;
        P.p(x + xx, y + yy + flip, STEEL[4]);
        P.p(x + xx + 1, y + yy + 1 - flip, STEEL[2]);
      }
  } else if (r < 0.32) {
    // an old oil stain
    const cx = x + 5 + Math.floor(rand() * 6);
    const cy = y + 5 + Math.floor(rand() * 6);
    P.f(cx - 2, cy - 1, 5, 3, "#4d5468");
    P.f(cx - 1, cy - 2, 3, 5, "#4d5468");
    P.p(cx - 1, cy - 1, "#7a6f9a");
  } else if (r < 0.35) {
    P.specks(x + 3, y + 3, 10, 10, ["#a0623a", "#7a4425", "#c27a46"], 6, rand);
  }
  P.specks(x + 1, y + 1, 14, 13, [STEEL[2], STEEL[4]], 3, rand);
}

function deck(P: Painter, rand: () => number) {
  const d = px(DECK);
  // the deck's shadow on the sea
  P.dither(d.x + 4, d.y + d.h, d.w, 6, "rgba(8,30,80,0.5)", 0);
  P.dither(d.x + d.w, d.y + 6, 5, d.h - 6, "rgba(8,30,80,0.5)", 0);
  for (let y = d.y; y < d.y + d.h; y += TILE) for (let x = d.x; x < d.x + d.w; x += TILE) plate(P, x, y, rand);

  // painted walkway around the pads
  const lane = { x: 10 * TILE + 4, y: 13 * TILE + 6, w: 19 * TILE - 8, h: 12 * TILE - 10 };
  for (let x = lane.x; x < lane.x + lane.w; x += 8) {
    P.f(x, lane.y, 5, 2, SUN[3]);
    P.f(x, lane.y + 2, 5, 1, SUN[1]);
    P.f(x, lane.y + lane.h, 5, 2, SUN[3]);
    P.f(x, lane.y + lane.h + 2, 5, 1, SUN[1]);
  }
  for (let y = lane.y; y < lane.y + lane.h; y += 8) {
    P.f(lane.x, y, 2, 5, SUN[3]);
    P.f(lane.x + lane.w, y, 2, 5, SUN[3]);
  }
}

/* ---------------- railings ---------------- */

function frontFence(P: Painter, x0: number, x1: number, y: number, h: number) {
  // shadow on the deck under the rails
  P.dither(x0, y + h, x1 - x0, 2, SHADOW, 0);
  for (const ry of [y + 2, y + h - 5]) {
    P.f(x0, ry, x1 - x0, 1, SUN[4]);
    P.f(x0, ry + 1, x1 - x0, 1, SUN[2]);
    P.f(x0, ry + 2, x1 - x0, 1, OUT);
  }
  for (let x = x0; x <= x1 - 4; x += 16) post(P, x, y - 2, h + 2);
  post(P, x1 - 4, y - 2, h + 2);
}

function post(P: Painter, x: number, y: number, h: number) {
  P.f(x, y, 4, h, OUT);
  P.f(x + 1, y + 1, 1, h - 2, SUN[4]);
  P.f(x + 2, y + 1, 1, h - 2, SUN[2]);
  P.f(x - 1, y - 1, 6, 2, OUT);
  P.f(x, y - 1, 4, 1, SUN[5]);
}

function sideFence(P: Painter, x: number, y0: number, y1: number, inward: 1 | -1) {
  P.dither(inward > 0 ? x + 5 : x - 2, y0, 2, y1 - y0, SHADOW, 0);
  P.f(x, y0, 1, y1 - y0, OUT);
  P.f(x + 1, y0, 1, y1 - y0, SUN[4]);
  P.f(x + 2, y0, 1, y1 - y0, SUN[2]);
  P.f(x + 3, y0, 1, y1 - y0, OUT);
  for (let y = y0 + 6; y < y1 - 4; y += 16) P.bevel(x - 1, y, 6, 6, SUN, 3);
}

function railings(P: Painter) {
  const d = px(DECK);
  const right = d.x + d.w;
  const bottom = d.y + d.h;
  const dockL = DOCK.x * TILE;
  const dockR = (DOCK.x + DOCK.w) * TILE;
  P.f(d.x, d.y, d.w, 1, OUT);
  P.f(d.x, d.y, 1, d.h, OUT);
  P.f(right - 1, d.y, 1, d.h, OUT);
  P.f(d.x, bottom - 1, dockL - d.x, 1, OUT);
  P.f(dockR, bottom - 1, right - dockR, 1, OUT);
  sideFence(P, d.x + 2, d.y, bottom, 1);
  sideFence(P, right - RAIL.side + 1, d.y, bottom, -1);
  frontFence(P, d.x, right, d.y - 3, RAIL.top + 3);
  frontFence(P, d.x, dockL, bottom - RAIL.bottom, RAIL.bottom - 2);
  frontFence(P, dockR, right, bottom - RAIL.bottom, RAIL.bottom - 2);
  for (const x of [d.x + 64, right - 120]) lifebuoy(P, x, d.y - 3);
}

function lifebuoy(P: Painter, x: number, y: number) {
  P.f(x + 2, y, 6, 10, OUT);
  P.f(x, y + 2, 10, 6, OUT);
  P.f(x + 1, y + 1, 8, 8, OUT);
  P.f(x + 2, y + 1, 6, 8, RED[3]);
  P.f(x + 1, y + 2, 8, 6, RED[3]);
  P.f(x + 3, y + 3, 4, 4, OUT);
  P.f(x + 1, y + 4, 2, 2, WALL[5]);
  P.f(x + 7, y + 4, 2, 2, WALL[4]);
  P.f(x + 4, y + 1, 2, 2, WALL[5]);
  P.f(x + 4, y + 7, 2, 2, WALL[3]);
  P.p(x + 2, y + 2, RED[5]);
}

/* ---------------- buildings ---------------- */

function windowAt(P: Painter, x: number, y: number) {
  P.f(x, y, 14, 12, OUT);
  P.f(x + 1, y + 1, 12, 10, WALL[5]);
  P.f(x + 2, y + 2, 10, 8, GLASS[3]);
  P.f(x + 2, y + 2, 10, 2, GLASS[4]);
  P.f(x + 2, y + 8, 10, 2, GLASS[2]);
  P.p(x + 4, y + 3, GLASS[5]);
  P.p(x + 3, y + 4, GLASS[5]);
  P.p(x + 5, y + 3, GLASS[5]);
  P.f(x + 7, y + 2, 1, 8, WALL[4]);
  P.f(x - 1, y + 12, 16, 1, WALL[5]);
  P.f(x - 1, y + 13, 16, 1, WALL[1]);
}

function quarters(P: Painter, rand: () => number) {
  const b = px(QUARTERS);
  const top = b.y - 10;
  const roofH = 30;
  const wallTop = top + roofH;
  P.shadow(b.x, top, b.w, b.h + 10, 5);

  // wall: white siding, lit on the left, shaded on the right
  P.f(b.x, wallTop, b.w, b.y + b.h - wallTop, OUT);
  P.f(b.x + 1, wallTop, b.w - 2, b.y + b.h - wallTop - 1, WALL[3]);
  for (let y = wallTop + 3; y < b.y + b.h - 2; y += 4) P.f(b.x + 1, y, b.w - 2, 1, WALL[2]);
  P.f(b.x + 1, wallTop, 2, b.y + b.h - wallTop - 1, WALL[4]);
  P.f(b.x + b.w - 5, wallTop, 2, b.y + b.h - wallTop - 1, WALL[2]);
  P.f(b.x + b.w - 3, wallTop, 2, b.y + b.h - wallTop - 1, WALL[1]);
  P.f(b.x + 1, b.y + b.h - 3, b.w - 2, 2, WALL[1]);

  // windows, two rows, leaving room for the door
  for (const x of [b.x + 8, b.x + 28, b.x + 48, b.x + 86, b.x + 106]) windowAt(P, x, wallTop + 6);
  for (const x of [b.x + 8, b.x + 28, b.x + 86, b.x + 106]) windowAt(P, x, wallTop + 30);

  // door with a step and a sign
  const dx = b.x + 3 * TILE + 2;
  const dy = b.y + b.h - 30;
  P.f(dx - 2, dy - 2, 32, 32, OUT);
  P.f(dx - 1, dy - 1, 30, 30, WALL[1]);
  P.bevel(dx + 1, dy + 1, 26, 29, NAVY, 3);
  P.f(dx + 4, dy + 4, 8, 9, NAVY[2]);
  P.f(dx + 16, dy + 4, 8, 9, NAVY[2]);
  P.f(dx + 4, dy + 16, 8, 10, NAVY[2]);
  P.f(dx + 16, dy + 16, 8, 10, NAVY[2]);
  P.f(dx + 5, dy + 5, 6, 3, GLASS[4]);
  P.f(dx + 17, dy + 5, 6, 3, GLASS[4]);
  P.p(dx + 22, dy + 15, SUN[3]);
  P.p(dx + 22, dy + 16, SUN[1]);
  P.bevel(dx + 4, dy - 9, 20, 7, RED, 3);
  P.f(dx + 7, dy - 7, 14, 1, WALL[5]);
  P.f(dx + 7, dy - 5, 9, 1, WALL[4]);
  lifebuoy(P, dx - 16, dy + 4);

  // roof: red tiles in staggered rows
  P.f(b.x - 2, top, b.w + 4, roofH + 2, OUT);
  P.f(b.x - 1, top + 1, b.w + 2, roofH, RED[3]);
  for (let y = top + 1; y < top + roofH; y++) {
    const row = Math.floor((y - top - 1) / 4);
    if ((y - top - 1) % 4 === 3) P.f(b.x - 1, y, b.w + 2, 1, RED[2]);
    else if ((y - top - 1) % 4 === 0) {
      for (let x = b.x - 1 + (row % 2) * 4; x < b.x + b.w + 1; x += 8) {
        P.p(x, y, RED[4]);
        P.p(x + 7, y + 1, RED[2]);
      }
    }
  }
  P.f(b.x - 1, top + 1, b.w + 2, 1, RED[5]);
  P.f(b.x - 1, top + roofH - 2, b.w + 2, 2, RED[1]);
  P.dither(b.x + 1, wallTop, b.w - 2, 2, "rgba(60,70,100,0.45)", 0);
  // roof clutter: an AC unit, vents and an antenna
  P.bevel(b.x + 10, top + 6, 18, 12, STEEL, 4);
  for (let i = 0; i < 4; i++) P.f(b.x + 13, top + 9 + i * 2, 12, 1, STEEL[2]);
  P.bevel(b.x + 90, top + 8, 7, 9, STEEL, 4);
  P.bevel(b.x + 100, top + 10, 5, 7, STEEL, 4);
  P.f(b.x + 116, top - 14, 1, 20, OUT);
  P.f(b.x + 112, top - 10, 9, 1, OUT);
  P.f(b.x + 115, top - 16, 3, 3, RED[3]);
  P.specks(b.x + 1, top + 2, b.w - 2, roofH - 4, [RED[2], RED[4]], 20, rand);
}

function derrick(P: Painter) {
  const b = px(DERRICK);
  P.shadow(b.x, b.y, b.w, b.h, 5);
  // drill floor: steel grating with a hazard-striped front edge
  P.f(b.x, b.y, b.w, b.h, OUT);
  P.f(b.x + 1, b.y + 1, b.w - 2, b.h - 2, STEEL[1]);
  for (let y = b.y + 2; y < b.y + b.h - 8; y += 3) P.f(b.x + 2, y, b.w - 4, 1, STEEL[2]);
  for (let x = b.x + 2; x < b.x + b.w - 2; x += 3) P.f(x, b.y + 2, 1, b.h - 10, STEEL[0]);
  P.f(b.x + 1, b.y + 1, b.w - 2, 1, STEEL[3]);
  P.hazard(b.x + 1, b.y + b.h - 7, b.w - 2, 6);
  // doghouse on the floor
  P.bevel(b.x + 6, b.y + 34, 30, 30, NAVY, 3);
  P.f(b.x + 6, b.y + 34, 30, 5, STEEL[4]);
  P.f(b.x + 6, b.y + 38, 30, 1, OUT);
  P.f(b.x + 11, b.y + 44, 10, 7, OUT);
  P.f(b.x + 12, b.y + 45, 8, 5, GLASS[3]);
  P.f(b.x + 12, b.y + 45, 8, 1, GLASS[5]);
  // rotary table
  const cx = b.x + b.w / 2;
  const cy = b.y + 40;
  P.f(cx - 8, cy - 5, 16, 10, OUT);
  P.f(cx - 7, cy - 4, 14, 8, STEEL[4]);
  P.f(cx - 7, cy - 4, 14, 1, STEEL[5]);
  P.f(cx - 2, cy - 2, 4, 4, OUT);

  // the tower: four red legs and cross bracing, rising over the far rail
  const base = b.y + 30;
  const l0 = b.x + 22;
  const r0 = b.x + b.w - 25;
  const top = 2;
  P.beam(l0, base, cx - 7, top + 8, RED);
  P.beam(r0, base, cx + 5, top + 8, RED);
  for (let y = top + 18; y < base; y += 13) {
    const t = (y - top - 8) / (base - top - 8);
    const half = Math.round(6 + t * ((r0 - l0) / 2 - 6));
    P.f(cx - half, y - 1, half * 2, 1, OUT);
    P.f(cx - half, y, half * 2, 1, RED[4]);
    P.f(cx - half, y + 1, half * 2, 1, RED[2]);
    P.f(cx - half, y + 2, half * 2, 1, OUT);
    const t2 = (y + 13 - top - 8) / (base - top - 8);
    const half2 = Math.round(6 + Math.min(1, t2) * ((r0 - l0) / 2 - 6));
    P.line(cx - half + 2, y + 3, cx + half2 - 3, Math.min(base - 2, y + 12), RED[3]);
    P.line(cx + half - 3, y + 3, cx - half2 + 2, Math.min(base - 2, y + 12), RED[2]);
  }
  P.bevel(cx - 10, top, 20, 9, SUN, 3);
  P.f(cx - 7, top + 3, 14, 1, SUN[1]);
  // traveling block on its cable
  P.f(cx - 1, top + 9, 1, 26, STEEL[5]);
  P.bevel(cx - 4, top + 34, 7, 9, STEEL, 4);
}

function helipad(P: Painter, rand: () => number) {
  const b = px(HELIPAD);
  P.shadow(b.x, b.y, b.w, b.h, 4);
  P.bevel(b.x, b.y, b.w, b.h, NAVY, 2);
  P.dither(b.x + 2, b.y + 2, b.w - 4, 3, NAVY[4], 0);
  P.dither(b.x + 2, b.y + b.h - 5, b.w - 4, 3, NAVY[1], 1);
  P.specks(b.x + 4, b.y + 6, b.w - 8, b.h - 12, [NAVY[1], NAVY[3]], 60, rand);
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  for (let a = 0; a < 140; a++) {
    const t = (a / 140) * Math.PI * 2;
    for (const [r, c] of [
      [40, SUN[3]],
      [41, SUN[3]],
      [42, SUN[1]],
      [39, SUN[4]],
    ] as const)
      P.p(Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r * 0.82), c);
  }
  // the H, with a shadow
  for (const [x, y, w, h] of [
    [cx - 15, cy - 16, 7, 32],
    [cx + 8, cy - 16, 7, 32],
    [cx - 8, cy - 3, 16, 6],
  ]) {
    P.f(x + 1, y + 1, w, h, NAVY[0]);
    P.f(x, y, w, h, WALL[4]);
    P.f(x, y, w, 1, WALL[5]);
  }
  // edge lights
  for (let x = b.x + 6; x < b.x + b.w - 4; x += 16) for (const y of [b.y + 2, b.y + b.h - 4]) P.f(x, y, 2, 2, SUN[4]);
  for (let y = b.y + 10; y < b.y + b.h - 4; y += 16) for (const x of [b.x + 2, b.x + b.w - 4]) P.f(x, y, 2, 2, SUN[4]);
}

function tanks(P: Painter) {
  const b = px(TANKS);
  P.shadow(b.x, b.y - 8, 96, b.h + 8, 5);
  for (let i = 0; i < 3; i++) {
    const x = b.x + i * 32;
    const top = b.y - 8;
    const h = b.h + 8;
    P.cylinder(x, top + 4, 32, h - 4, WALL);
    P.f(x, top + h - 1, 32, 1, OUT);
    const band = i === 1 ? GLASS : RED;
    P.cylinder(x, top + 26, 32, 7, band);
    P.f(x + 1, top + 26, 30, 1, OUT);
    P.f(x + 1, top + 33, 30, 1, OUT);
    P.cylinder(x, top + 58, 32, 4, STEEL);
    // the lid, seen a little from above
    P.f(x + 2, top, 28, 7, OUT);
    P.f(x + 3, top + 1, 26, 5, STEEL[5]);
    P.f(x + 3, top + 4, 26, 2, STEEL[4]);
    P.f(x + 13, top + 2, 6, 2, STEEL[2]);
    // ladder
    P.f(x + 24, top + 8, 1, h - 10, STEEL[1]);
    P.f(x + 28, top + 8, 1, h - 10, STEEL[1]);
    for (let y = top + 10; y < top + h - 3; y += 4) P.f(x + 24, y, 5, 1, STEEL[2]);
    // stencil
    P.f(x + 6, top + 40, 10, 2, WALL[1]);
    P.f(x + 6, top + 44, 6, 2, WALL[1]);
  }
  P.pipe(b.x + 4, b.y + b.h - 14, 88, 5, STEEL);
  P.f(b.x + 46, b.y + b.h - 17, 5, 5, OUT);
  P.f(b.x + 47, b.y + b.h - 16, 3, 3, RED[3]);
}

function crane(P: Painter) {
  const b = px(CRANE);
  P.shadow(b.x, b.y, b.w, b.h, 4);
  P.cylinder(b.x + 4, b.y + 10, 24, 22, SUN);
  P.f(b.x + 4, b.y + b.h - 1, 24, 1, OUT);
  P.bevel(b.x, b.y, b.w, 13, SUN, 3);
  P.f(b.x + 18, b.y + 3, 10, 6, OUT);
  P.f(b.x + 19, b.y + 4, 8, 4, GLASS[3]);
  P.f(b.x + 19, b.y + 4, 8, 1, GLASS[5]);
  // the boom: two chords with lattice between them
  const x0 = b.x + 8;
  const y0 = b.y + 4;
  const x1 = b.x - 54;
  const y1 = b.y - 76;
  // second chord sits 6 px off to the side, square to the boom
  const len = Math.hypot(x1 - x0, y1 - y0);
  const nx = Math.round((-(y1 - y0) / len) * 6);
  const ny = Math.round(((x1 - x0) / len) * 6);
  const at = (t: number, side: number) => [Math.round(x0 + (x1 - x0) * t + nx * side), Math.round(y0 + (y1 - y0) * t + ny * side)] as const;
  for (let i = 0; i < 10; i++) {
    // zig-zag lacing between the chords
    const [ax, ay] = at(i / 10, i % 2);
    const [bx, by] = at((i + 1) / 10, (i + 1) % 2);
    P.line(ax, ay, bx, by, SUN[1]);
    P.line(ax + 1, ay, bx + 1, by, SUN[2]);
  }
  P.beam(x0, y0, x1, y1, SUN);
  P.beam(x0 + nx, y0 + ny, x1 + nx, y1 + ny, SUN);
  P.f(x1 + 1, y1 + 3, 1, 34, STEEL[5]);
  P.bevel(x1 - 3, y1 + 36, 9, 6, STEEL, 4);
  P.f(x1 - 1, y1 + 42, 3, 3, OUT);
}

function kiosk(P: Painter) {
  const b = px(KIOSK);
  P.shadow(b.x, b.y - 8, b.w, b.h + 8, 4);
  P.bevel(b.x + 1, b.y - 2, b.w - 2, b.h + 2, WALL, 3);
  // striped awning with a scalloped edge
  P.f(b.x - 2, b.y - 10, b.w + 4, 10, OUT);
  for (let x = 0; x < b.w + 2; x++) P.f(b.x - 1 + x, b.y - 9, 1, 8, Math.floor(x / 4) % 2 ? GLASS[3] : WALL[5]);
  P.f(b.x - 1, b.y - 9, b.w + 2, 1, GLASS[5]);
  for (let x = 0; x < b.w + 2; x += 4) P.f(b.x - 1 + x, b.y - 1, 2, 2, Math.floor(x / 4) % 2 ? GLASS[2] : WALL[3]);
  // screen with a rising chart
  P.f(b.x + 5, b.y + 3, b.w - 10, 13, OUT);
  P.f(b.x + 6, b.y + 4, b.w - 12, 11, GREEN[0]);
  const pts = [10, 9, 10, 7, 8, 5, 6, 4, 3, 4, 2, 3, 1, 2, 1, 0, 1, 0, 0, 0];
  pts.forEach((v, i) => i < b.w - 12 && P.p(b.x + 6 + i, b.y + 4 + Math.min(10, v + 1), GREEN[3]));
  P.f(b.x + 6, b.y + 4, b.w - 12, 1, GREEN[1]);
  // counter
  P.bevel(b.x, b.y + b.h - 10, b.w, 10, STEEL, 4);
  P.f(b.x + 4, b.y + b.h - 7, 6, 2, SUN[3]);
}

function board(P: Painter, rand: () => number) {
  const b = px(BOARD);
  P.shadow(b.x, b.y - 4, b.w, b.h + 4, 4);
  for (const x of [b.x + 3, b.x + b.w - 7]) {
    P.f(x, b.y + 10, 4, b.h - 10, OUT);
    P.f(x + 1, b.y + 10, 1, b.h - 11, WOOD[4]);
    P.f(x + 2, b.y + 10, 1, b.h - 11, WOOD[2]);
  }
  P.bevel(b.x, b.y - 5, b.w, 20, WOOD, 3);
  P.f(b.x + 2, b.y - 3, b.w - 4, 16, "#c79a5b");
  P.specks(b.x + 2, b.y - 3, b.w - 4, 16, ["#a87a40", "#ddb478"], 18, rand);
  for (const [x, y, w, h, pin] of [
    [b.x + 4, b.y - 2, 10, 8, RED[3]],
    [b.x + 16, b.y - 1, 11, 9, GLASS[3]],
    [b.x + 6, b.y + 7, 9, 6, SUN[3]],
  ] as const) {
    P.f(x, y, w, h, WALL[5]);
    P.f(x, y + h - 1, w, 1, WALL[2]);
    for (let ly = y + 3; ly < y + h - 1; ly += 2) P.f(x + 2, ly, w - 4, 1, WALL[1]);
    P.p(x + Math.floor(w / 2), y + 1, pin);
  }
  P.bevel(b.x + 6, b.y - 10, b.w - 12, 6, RED, 3);
}

function dock(P: Painter) {
  const b = px(DOCK);
  const top = b.y + TILE - 4;
  const bottom = b.y + b.h;
  P.dither(b.x + 3, bottom, b.w, 4, "rgba(8,30,80,0.5)", 0);
  P.f(b.x, top, b.w, bottom - top, OUT);
  for (let y = top + 1, row = 0; y < bottom - 1; y += 5, row++) {
    P.f(b.x + 2, y, b.w - 4, 1, WOOD[4]);
    P.f(b.x + 2, y + 1, b.w - 4, 2, WOOD[3]);
    P.f(b.x + 2, y + 3, b.w - 4, 1, WOOD[2]);
    P.f(b.x + 2, y + 4, b.w - 4, 1, WOOD[0]);
    for (let x = b.x + 8 + (row % 2) * 13; x < b.x + b.w - 4; x += 26) {
      P.f(x, y, 1, 4, WOOD[0]);
      P.p(x - 2, y + 2, STEEL[5]);
      P.p(x + 2, y + 2, STEEL[5]);
    }
  }
  for (const x of [b.x + 1, b.x + b.w - 9]) {
    P.cylinder(x, bottom - 6, 8, 14, PALE);
    P.f(x, bottom - 7, 8, 2, OUT);
    P.f(x + 1, bottom - 6, 6, 1, PALE[4]);
  }
  // a cleat and the boat's rope
  P.bevel(b.x + b.w - 14, bottom - 14, 8, 4, STEEL, 4);
  P.line(b.x + b.w - 10, bottom - 12, b.x + b.w + 10, bottom + 4, WOOD[5]);
}

function legs(P: Painter) {
  const bottom = (DECK.y + DECK.h) * TILE;
  for (const l of LEGS) {
    P.cylinder(l.x - 5, bottom, 12, 30, STEEL);
    P.f(l.x - 5, bottom + 26, 12, 4, "rgba(26,115,217,0.55)");
  }
  // cross bracing between neighbouring legs
  for (const [a, c] of [
    [0, 1],
    [2, 3],
  ]) {
    const x0 = LEGS[a].x + 7;
    const x1 = LEGS[c].x - 5;
    P.line(x0, bottom + 4, x1, bottom + 22, STEEL[2]);
    P.line(x0, bottom + 22, x1, bottom + 4, STEEL[2]);
  }
}

function padBase(P: Painter, b: Box, rand: () => number) {
  P.f(b.x - 1, b.y - 1, b.w + 2, b.h + 2, OUT);
  P.f(b.x, b.y, b.w, b.h, STEEL[2]);
  for (const edge of [
    [b.x, b.y, b.w, 3],
    [b.x, b.y + b.h - 3, b.w, 3],
  ])
    P.hazard(edge[0], edge[1], edge[2], edge[3], 4);
  P.f(b.x, b.y + 3, b.w, 1, STEEL[1]);
  P.f(b.x + 3, b.y + 6, b.w - 6, b.h - 12, STEEL[3]);
  P.f(b.x + 3, b.y + 6, b.w - 6, 1, STEEL[4]);
  for (const [x, y] of [
    [b.x + 2, b.y + 5],
    [b.x + b.w - 4, b.y + 5],
    [b.x + 2, b.y + b.h - 7],
    [b.x + b.w - 4, b.y + b.h - 7],
  ]) {
    P.f(x, y, 2, 2, STEEL[5]);
    P.p(x + 1, y + 1, STEEL[1]);
  }
  P.specks(b.x + 3, b.y + 6, b.w - 6, b.h - 12, [STEEL[2], STEEL[4]], 5, rand);
}

function props(P: Painter) {
  for (const { kind, box: b } of PROPS) {
    P.shadow(b.x, b.y, b.w, b.h, 3);
    if (kind === "barrels") {
      for (let i = 0; i < 3; i++) {
        const x = b.x + i * 10;
        P.cylinder(x, b.y + 1, 10, b.h - 1, i === 1 ? GLASS : RED);
        P.f(x + 1, b.y + 1, 8, 2, i === 1 ? GLASS[4] : RED[4]);
        P.f(x, b.y, 10, 1, OUT);
        P.f(x + 1, b.y + 5, 8, 1, OUT);
        P.f(x + 1, b.y + 10, 8, 1, OUT);
      }
    }
    if (kind === "crates") {
      P.bevel(b.x, b.y + 8, 14, 14, WOOD, 3);
      P.bevel(b.x + 12, b.y + 10, 14, 12, WOOD, 3);
      P.bevel(b.x + 5, b.y, 12, 10, WOOD, 3);
      for (const [x, y, s] of [
        [b.x, b.y + 8, 14],
        [b.x + 12, b.y + 10, 12],
      ])
        P.line(x + 2, y + 2, x + s - 3, y + s - 3, WOOD[1]);
    }
    if (kind === "bottles") {
      for (let i = 0; i < 2; i++) {
        P.cylinder(b.x + i * 7, b.y + 3, 7, b.h - 3, i ? GREEN : SUN);
        P.f(b.x + i * 7 + 2, b.y, 3, 4, OUT);
        P.p(b.x + i * 7 + 3, b.y + 1, STEEL[5]);
      }
    }
    if (kind === "hose") {
      for (const [r, c] of [
        [6, OUT],
        [5, SUN[2]],
        [4, SUN[3]],
        [3, OUT],
        [2, STEEL[1]],
      ] as const)
        for (let a = 0; a < 48; a++) {
          const t = (a / 48) * Math.PI * 2;
          P.p(Math.round(b.x + 9 + Math.cos(t) * r * 1.3), Math.round(b.y + 6 + Math.sin(t) * r * 0.9), c);
        }
    }
  }
}

/** The whole static rig in one picture the size of the world. Water stays transparent. */
export function rigPicture() {
  const { c, P } = canvas(WORLD_W, WORLD_H);
  const rand = rng(417);
  legs(P);
  dock(P);
  deck(P, rand);
  for (const p of PADS) padBase(P, px(p), rand);
  helipad(P, rand);
  props(P);
  railings(P);
  derrick(P);
  quarters(P, rand);
  tanks(P);
  kiosk(P);
  board(P, rand);
  crane(P);
  return c;
}

/* ---------------- things on the pads ---------------- */

function pumpjack(P: Painter, ox: number, up: boolean) {
  // skid, wellhead and samson post
  P.bevel(ox + 1, 25, 30, 6, STEEL, 3);
  P.bevel(ox + 1, 18, 6, 8, STEEL, 4);
  P.p(ox + 3, 20, RED[3]);
  P.beam(ox + 10, 25, ox + 15, 11, STEEL);
  P.beam(ox + 21, 25, ox + 16, 11, STEEL);
  // walking beam, tipping on the post
  const l = up ? 7 : 13;
  const r = up ? 13 : 7;
  P.beam(ox + 5, l, ox + 27, r, RED);
  P.f(ox + 14, 9, 4, 4, OUT);
  P.f(ox + 15, 10, 2, 2, STEEL[5]);
  // horse head
  P.f(ox + 2, l - 3, 5, 10, OUT);
  P.f(ox + 3, l - 2, 3, 8, RED[3]);
  P.f(ox + 3, l - 2, 1, 8, RED[4]);
  P.f(ox + 3, l + 6, 3, 1, RED[1]);
  P.f(ox + 4, l + 7, 1, 18 - l, STEEL[5]);
  // crank and counterweight
  const cy = up ? 20 : 16;
  P.f(ox + 23, r + 2, 1, cy - r - 2, OUT);
  P.f(ox + 22, cy - 3, 8, 7, OUT);
  P.f(ox + 23, cy - 2, 6, 5, STEEL[2]);
  P.f(ox + 23, cy - 2, 6, 1, STEEL[4]);
  P.p(ox + 25, cy, SUN[3]);
}

/** Pumpjack, two frames of 32 × 32. */
export function wellFrames() {
  const { c, P } = canvas(64, 32);
  pumpjack(P, 0, true);
  pumpjack(P, 32, false);
  return c;
}

/** A blown well: a scorched skid, a broken pipe, fire and smoke; two frames. */
export function blownFrames(flames: { a: (P: Painter, ox: number) => void; b: (P: Painter, ox: number) => void }) {
  const { c, P } = canvas(64, 32);
  for (const [ox, draw] of [
    [0, flames.a],
    [32, flames.b],
  ] as const) {
    P.bevel(ox + 2, 24, 28, 6, STEEL, 2);
    P.dither(ox + 4, 25, 24, 4, "#2a2a32", 0);
    P.beam(ox + 8, 24, ox + 12, 18, STEEL);
    draw(P, ox);
  }
  return c;
}

/** Two refinery towers banded in the colour of what they make, 32 × 44. */
export function unitPicture(band: string, level: number) {
  const { c, P } = canvas(32, 44);
  const tint = rampOf(band);
  const tower = (x: number, w: number, h: number) => {
    const top = 42 - h;
    P.cylinder(x, top + 2, w, h - 2, WALL);
    for (let y = top + 6; y < 40; y += 7) P.cylinder(x, y, w, 2, tint as Ramp);
    P.f(x + 1, top, w - 2, 3, OUT);
    P.f(x + 2, top + 1, w - 4, 1, STEEL[5]);
    P.f(x + w - 4, top + 4, 1, h - 6, STEEL[1]);
  };
  tower(2, 12, 28 + level * 4);
  tower(17, 10, 20 + level * 3);
  P.pipe(10, 34, 10, 4, STEEL);
  P.bevel(0, 40, 32, 4, STEEL, 3);
  return c;
}

/** Hazard tape and a padlock over a pad that opens at a higher rig level. */
export function lockedPicture() {
  const { c, P } = canvas(32, 32);
  P.dither(0, 0, 32, 32, "rgba(20,26,50,0.55)", 0);
  P.f(0, 0, 32, 32, "rgba(20,26,50,0.25)");
  P.f(0, 8, 32, 8, OUT);
  P.hazard(0, 9, 32, 6, 6);
  P.f(11, 16, 10, 2, OUT);
  P.f(11, 16, 2, 6, OUT);
  P.f(19, 16, 2, 6, OUT);
  P.f(12, 17, 1, 4, STEEL[4]);
  P.bevel(9, 21, 14, 10, SUN, 3);
  P.f(15, 24, 2, 4, OUT);
  return c;
}
