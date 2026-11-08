import { C } from "@/lib/palette";
import { line, rect, type Px } from "@/components/pixel/sprite";
import { HORIZON } from "@/components/scenes/hero-scene";

// The hero rig, pixel for pixel. It is private to the site's hero scene
// (apps/web/components/scenes/hero-scene.tsx), so it is copied here; keep the two
// in step if the rig is redrawn.

function column(x: number, y: number, h: number): Px[] {
  return [rect(x, y, 5, h, C.ink), rect(x + 1, y, 2, h, C.steel), rect(x + 3, y, 1, h, C.steelDeep)];
}

function derrick(): Px[] {
  const out: Px[] = [];
  const top = 14;
  const bottom = 64;
  const l0 = 232;
  const r0 = 264;
  const l1 = 243;
  const r1 = 253;
  const leftAt = (y: number) => Math.round(l0 + ((l1 - l0) * (bottom - y)) / (bottom - top));
  const rightAt = (y: number) => Math.round(r0 - ((r0 - r1) * (bottom - y)) / (bottom - top));
  out.push(...line(l0 - 1, bottom, l1 - 1, top, C.ink), ...line(l0, bottom, l1, top, C.red), ...line(l0 + 1, bottom, l1 + 1, top, C.red));
  out.push(...line(r0 + 1, bottom, r1 + 1, top, C.ink), ...line(r0, bottom, r1, top, C.red), ...line(r0 - 1, bottom, r1 - 1, top, C.red));
  const girders = [top, 24, 35, 47, bottom];
  for (let i = 0; i < girders.length; i++) {
    const y = girders[i];
    out.push(rect(leftAt(y), y, rightAt(y) - leftAt(y) + 1, 1, C.red));
    if (i === 0) continue;
    const yp = girders[i - 1];
    out.push(...line(leftAt(yp) + 2, yp + 1, rightAt(y) - 2, y - 1, C.red), ...line(rightAt(yp) - 2, yp + 1, leftAt(y) + 2, y - 1, C.red));
  }
  out.push(rect(240, 7, 17, 7, C.ink), rect(241, 8, 15, 5, C.sunPale), rect(241, 12, 15, 1, C.sunDeep));
  return out;
}

/** The rig from the hero, without its crane boom (drawn apart so the crane can swing a load). */
export function rig({ crane = true } = {}): Px[] {
  const out: Px[] = [];
  for (const x of [200, 222, 254, 276]) {
    out.push(...column(x, 78, HORIZON - 78));
    out.push(rect(x, HORIZON + 1, 5, 16, "#1f5fb8"), rect(x + 1, HORIZON + 1, 2, 16, "#4a8ae0"));
    out.push(rect(x - 3, HORIZON + 1, 3, 1, C.white), rect(x + 5, HORIZON + 1, 3, 1, C.white));
  }
  for (const [a, b] of [
    [205, 222],
    [227, 254],
    [259, 276],
  ]) {
    out.push(...line(a, 80, b - 1, 93, C.ink), ...line(b - 1, 80, a, 93, C.ink));
  }
  out.push(rect(200, 87, 81, 2, C.ink));

  out.push(rect(170, 71, 136, 8, C.ink), rect(171, 72, 134, 4, C.steel), rect(171, 72, 134, 1, C.steelLight));
  for (let x = 171; x < 305; x += 4) out.push(rect(x, 76, 2, 2, C.sun), rect(x + 2, 76, 2, 2, C.ink));

  out.push(rect(194, 48, 32, 24, C.ink), rect(195, 49, 30, 22, C.white), rect(195, 49, 30, 3, C.red));
  for (let y = 55; y <= 65; y += 5) for (let x = 198; x <= 218; x += 5) out.push(rect(x, y, 3, 3, C.sea), rect(x, y, 3, 1, C.foam));
  out.push(rect(206, 66, 6, 5, C.ink));
  out.push(rect(186, 43, 46, 5, C.ink), rect(187, 44, 44, 3, C.steel));
  for (let x = 188; x < 230; x += 5) out.push(rect(x, 44, 3, 1, C.sun));

  out.push(rect(228, 63, 40, 9, C.ink), rect(229, 64, 38, 7, C.steel), rect(229, 64, 38, 1, C.steelLight), rect(244, 66, 8, 5, C.ink));
  out.push(...derrick());

  out.push(rect(270, 56, 8, 16, C.ink), rect(271, 56, 6, 16, C.steel));
  out.push(rect(267, 50, 14, 8, C.ink), rect(268, 51, 12, 6, C.sun), rect(275, 52, 4, 3, C.sea));
  if (crane) {
    out.push(...line(276, 50, 316, 20, C.ink), ...line(277, 51, 317, 21, C.sun), ...line(277, 52, 317, 22, C.sun), ...line(277, 53, 317, 23, C.ink));
    out.push(rect(317, 23, 1, 22, C.ink), rect(314, 45, 7, 3, C.ink), rect(315, 46, 5, 1, C.sun));
  }

  out.push(...line(194, 60, 158, 34, C.ink), ...line(194, 61, 158, 35, C.steel), ...line(194, 62, 158, 36, C.ink));
  return out;
}

/** The crane's boom on its own, ending at the tip (317, 23) where the hook line hangs. */
export function craneBoom(): Px[] {
  return [...line(276, 50, 316, 20, C.ink), ...line(277, 51, 317, 21, C.sun), ...line(277, 52, 317, 22, C.sun), ...line(277, 53, 317, 23, C.ink)];
}

/** A pixel arrow pointer, white with an ink edge. */
export const pointer = [
  "K..........",
  "KK.........",
  "KWK........",
  "KWWK.......",
  "KWWWK......",
  "KWWWWK.....",
  "KWWWWWK....",
  "KWWWWWWK...",
  "KWWWWWWWK..",
  "KWWWWWWWWK.",
  "KWWWWWKKKKK",
  "KWWKWWK....",
  "KWK.KWWK...",
  "KK..KWWK...",
  "K....KWWK..",
  ".....KKK...",
] as const;
