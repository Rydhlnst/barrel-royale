import { VILLAGE } from "@/lib/village-rules";
import type { Box } from "../world/map";

// Royal Harbor, the village: a wooden boardwalk on stilts with a saloon, a lighthouse, a notice board and a
// fire pit in the middle, and a pier down to the boat back to your rig. Laid out on a 16 px grid like the rig;
// collisions use pixel boxes that match the drawing.

export const TILE = 16;
export const WORLD_W = VILLAGE.width;
export const WORLD_H = VILLAGE.height;

const px = (b: Box): Box => ({ x: b.x * TILE, y: b.y * TILE, w: b.w * TILE, h: b.h * TILE });

export const WALK_TILES: Box[] = [
  { x: 3, y: 5, w: 34, h: 18 },
  { x: 18, y: 23, w: 4, h: 3 },
];
export const SALOON: Box = { x: 5, y: 2, w: 10, h: 6 };
export const LIGHTHOUSE: Box = { x: 31, y: 0, w: 4, h: 8 };
export const BOARD: Box = { x: 24, y: 5, w: 3, h: 2 };
export const FIRE: Box = { x: 19, y: 13, w: 2, h: 2 };
export const BENCHES: Box[] = [
  { x: 16, y: 13, w: 1, h: 2 },
  { x: 23, y: 13, w: 1, h: 2 },
  { x: 19, y: 10, w: 2, h: 1 },
  { x: 19, y: 17, w: 2, h: 1 },
];
export const LAMPS = [
  { x: 4, y: 9 },
  { x: 35, y: 9 },
  { x: 4, y: 20 },
  { x: 35, y: 20 },
  { x: 17, y: 23 },
  { x: 22, y: 23 },
];
export const STACKS: Box[] = [
  { x: 4, y: 15, w: 2, h: 2 },
  { x: 33, y: 13, w: 3, h: 2 },
  { x: 10, y: 20, w: 2, h: 1 },
  { x: 28, y: 20, w: 2, h: 1 },
];
export const BOAT: Box = { x: 22, y: 25, w: 5, h: 2 };

export const SPAWN = { x: 20 * TILE, y: 22 * TILE };

const WALK = WALK_TILES.map(px);
const OBSTACLES: Box[] = [
  { ...px(SALOON), h: px(SALOON).h - 2 },
  { x: LIGHTHOUSE.x * TILE + 4, y: 0, w: LIGHTHOUSE.w * TILE - 8, h: LIGHTHOUSE.h * TILE - 2 },
  { x: BOARD.x * TILE, y: BOARD.y * TILE, w: BOARD.w * TILE, h: BOARD.h * TILE - 4 },
  { x: FIRE.x * TILE - 4, y: FIRE.y * TILE - 2, w: FIRE.w * TILE + 8, h: FIRE.h * TILE + 4 },
  ...BENCHES.map((b) => ({ ...px(b), y: px(b).y + 4, h: px(b).h - 4 })),
  ...STACKS.map(px),
  ...LAMPS.map((l) => ({ x: l.x * TILE + 5, y: l.y * TILE + 10, w: 6, h: 6 })),
];

const inside = (b: Box, x: number, y: number) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;

export function isBlocked(x: number, y: number) {
  return !WALK.some((b) => inside(b, x, y)) || OBSTACLES.some((b) => inside(b, x, y));
}

/** Where the boat back to the rig is boarded: the end of the pier. */
export const BOAT_SPOT: Box = { x: 18 * TILE, y: 25 * TILE, w: 4 * TILE, h: TILE };

export function gap(b: Box, x: number, y: number) {
  const dx = Math.max(b.x - x, 0, x - (b.x + b.w));
  const dy = Math.max(b.y - y, 0, y - (b.y + b.h));
  return Math.hypot(dx, dy);
}
