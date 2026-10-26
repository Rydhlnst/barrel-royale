import type { Target } from "@/lib/game/store";

// The rig layout. Things are placed on a 16 px grid, but collisions and
// "standing at" checks use pixel rectangles that match what is drawn, so the
// roughneck stops right at the railing and at the edge of each building.

export const TILE = 16;
export const COLS = 48;
export const ROWS = 32;
export const WORLD_W = COLS * TILE;
export const WORLD_H = ROWS * TILE;

export type Box = { x: number; y: number; w: number; h: number };

export const DECK: Box = { x: 6, y: 5, w: 36, h: 22 };
export const DOCK: Box = { x: 21, y: 26, w: 6, h: 4 };
export const QUARTERS: Box = { x: 7, y: 6, w: 8, h: 6 };
export const DERRICK: Box = { x: 21, y: 7, w: 7, h: 5 };
export const HELIPAD: Box = { x: 32, y: 6, w: 9, h: 7 };
export const TANKS: Box = { x: 35, y: 15, w: 6, h: 5 };
export const CRANE: Box = { x: 36, y: 22, w: 2, h: 2 };
export const KIOSK: Box = { x: 16, y: 10, w: 2, h: 2 };
export const BOARD: Box = { x: 29, y: 24, w: 2, h: 2 };
export const BOAT: Box = { x: 27, y: 28, w: 5, h: 2 };

/** Twelve 2×2 deck pads for wells and refinery units, in slot order. */
export const PADS: Box[] = [14, 18, 22].flatMap((y) => [11, 16, 21, 26].map((x) => ({ x, y, w: 2, h: 2 })));

/** Where the rig's legs meet the water, for the foam. */
export const LEGS = [8, 15, 32, 39].map((tx) => ({ x: tx * TILE + 5, y: (DECK.y + DECK.h) * TILE + 30 }));

export const SPAWN = { x: 24 * TILE + 8, y: 13 * TILE + 12 };

export const px = (b: Box): Box => ({ x: b.x * TILE, y: b.y * TILE, w: b.w * TILE, h: b.h * TILE });

const deck = px(DECK);
const dock = px(DOCK);

/** Railing sizes, shared with the drawing in art.ts. */
export const RAIL = { side: 8, top: 6, bottom: 12 };

/** Floor the roughneck can stand on: the deck inside its railings, and the dock. */
const WALK: Box[] = [
  { x: deck.x + RAIL.side, y: deck.y + RAIL.top, w: deck.w - 2 * RAIL.side, h: deck.h - RAIL.top - RAIL.bottom },
  { x: dock.x + 6, y: deck.y + deck.h - RAIL.bottom - 2, w: dock.w - 12, h: dock.y + dock.h - (deck.y + deck.h - RAIL.bottom - 2) - 8 },
];

/** Small props that make the deck look worked on; they block like the buildings do. */
export const PROPS: { kind: "barrels" | "crates" | "bottles" | "hose"; box: Box }[] = [
  { kind: "barrels", box: { x: 116, y: 196, w: 30, h: 14 } },
  { kind: "crates", box: { x: 540, y: 356, w: 26, h: 22 } },
  { kind: "bottles", box: { x: 648, y: 214, w: 14, h: 16 } },
  { kind: "hose", box: { x: 456, y: 196, w: 18, h: 12 } },
];

/** Footprints of everything drawn on the deck, matching the pictures. */
const quarters = px(QUARTERS);
const tanks = px(TANKS);
const kiosk = px(KIOSK);
const board = px(BOARD);
export const OBSTACLES: Box[] = [
  { x: quarters.x, y: quarters.y - 10, w: quarters.w, h: quarters.h + 10 },
  px(DERRICK),
  { x: tanks.x + 1, y: tanks.y - 8, w: 94, h: tanks.h + 8 },
  px(CRANE),
  { x: kiosk.x, y: kiosk.y - 8, w: kiosk.w, h: kiosk.h + 8 },
  { x: board.x, y: board.y - 4, w: board.w, h: board.h + 4 },
  ...PADS.map(px),
  ...PROPS.map((p) => p.box),
];

const inside = (b: Box, x: number, y: number) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;

export function isBlocked(x: number, y: number) {
  return !WALK.some((b) => inside(b, x, y)) || OBSTACLES.some((b) => inside(b, x, y));
}

/** Gap between a point and a box, 0 when inside. */
export function gap(b: Box, x: number, y: number) {
  const dx = Math.max(b.x - x, 0, x - (b.x + b.w));
  const dy = Math.max(b.y - y, 0, y - (b.y + b.h));
  return Math.hypot(dx, dy);
}

/** Things to walk up to: the box that gets highlighted and how close counts as "at" it. */
export const SPOTS: { id: Target; box: Box; reach: number; label: string }[] = [
  ...PADS.map((b, i) => ({ id: `pad:${i}` as Target, box: px(b), reach: 12, label: `Slot ${i + 1}` })),
  { id: "market", box: { x: kiosk.x, y: kiosk.y - 8, w: kiosk.w, h: kiosk.h + 8 }, reach: 14, label: "Market terminal" },
  { id: "dispatch", box: { x: board.x, y: board.y - 4, w: board.w, h: board.h + 4 }, reach: 14, label: "Dispatch board" },
  { id: "storage", box: { x: tanks.x + 1, y: tanks.y - 8, w: 94, h: tanks.h + 8 }, reach: 14, label: "Storage tanks" },
  { id: "quarters", box: { x: quarters.x + 3 * TILE, y: quarters.y + quarters.h - 22, w: 2 * TILE, h: 22 }, reach: 12, label: "Crew quarters" },
];
