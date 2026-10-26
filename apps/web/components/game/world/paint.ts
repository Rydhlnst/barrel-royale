// A tiny pixel painter: shaded boxes, dithered shadows, cylinders and lines,
// drawn straight onto a canvas. Every colour comes from a ramp (dark → light),
// which is what makes the world read as pixel art rather than flat shapes.

export type Ramp = readonly string[];

export const OUT = "#20263a";
export const STEEL: Ramp = ["#262c3f", "#4b5468", "#66718a", "#8793a6", "#a7b2c2", "#cbd3de", "#e9eef4"];
export const RED: Ramp = ["#5a1512", "#8f2620", "#c2372f", "#e8453c", "#ff7a6b", "#ffb0a6"];
export const SUN: Ramp = ["#6b4708", "#b8780f", "#e8a020", "#ffd54a", "#ffe98a", "#fff6c8"];
export const WALL: Ramp = ["#6c7a92", "#8d9ab0", "#b7c3d3", "#dbe3ee", "#f4f7fb", "#ffffff"];
export const WOOD: Ramp = ["#3a2412", "#5a3a1c", "#7a4f27", "#9a6634", "#b98048", "#d6a06a"];
export const GLASS: Ramp = ["#0e2f63", "#16489a", "#1f63c6", "#3e8ee8", "#7fb8f5", "#cfe6ff"];
export const NAVY: Ramp = ["#141a33", "#1e2747", "#283458", "#33416b", "#40507f", "#55679a"];
export const GREEN: Ramp = ["#0b3d28", "#0f6b43", "#15905f", "#3fc285", "#a6f0c8"];
export const PALE: Ramp = ["#6f6330", "#a8944a", "#d9c66a", "#ffe58a", "#fff6c8"];
export const SHADOW = "rgba(16,22,44,0.42)";

/** Deterministic random numbers, so the world looks the same every load. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Lighten (f > 0) or darken (f < 0) a hex colour. */
export function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f)));
  return `#${ch.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** A five-step ramp around one colour, for things tinted by product. */
export const rampOf = (hex: string): Ramp => [shade(hex, -0.6), shade(hex, -0.35), shade(hex, -0.15), hex, shade(hex, 0.3), shade(hex, 0.6)];

export class Painter {
  constructor(readonly ctx: CanvasRenderingContext2D) {}

  f(x: number, y: number, w: number, h: number, c: string) {
    this.ctx.fillStyle = c;
    this.ctx.fillRect(x, y, w, h);
  }

  p(x: number, y: number, c: string) {
    this.f(x, y, 1, 1, c);
  }

  /** Outlined box lit from the top-left: light top and left edges, dark bottom and right. */
  bevel(x: number, y: number, w: number, h: number, r: Ramp, mid = r.length - 3, outline = OUT) {
    this.f(x, y, w, h, outline);
    this.f(x + 1, y + 1, w - 2, h - 2, r[mid]);
    this.f(x + 1, y + 1, w - 2, 1, r[mid + 1]);
    this.f(x + 1, y + 1, 1, h - 2, r[mid + 1]);
    this.f(x + 1, y + h - 2, w - 2, 1, r[mid - 1]);
    this.f(x + w - 2, y + 1, 1, h - 2, r[mid - 1]);
    this.p(x + 1, y + 1, r[Math.min(r.length - 1, mid + 2)]);
  }

  /** Checkerboard fill: the pixel-art way to draw a soft shadow or a half tone. */
  dither(x: number, y: number, w: number, h: number, c: string, phase = 0) {
    this.ctx.fillStyle = c;
    for (let yy = 0; yy < h; yy++) for (let xx = (yy + phase) % 2; xx < w; xx += 2) this.ctx.fillRect(x + xx, y + yy, 1, 1);
  }

  /** A soft drop shadow down and to the right of a footprint. */
  shadow(x: number, y: number, w: number, h: number, depth = 4) {
    this.dither(x + depth, y + h, w, depth, SHADOW, 1);
    this.dither(x + w, y + depth, depth, h, SHADOW, 1);
    this.f(x + 2, y + h, w - 2, 1, SHADOW);
  }

  specks(x: number, y: number, w: number, h: number, colors: readonly string[], count: number, rand: () => number) {
    for (let i = 0; i < count; i++) this.p(x + Math.floor(rand() * w), y + Math.floor(rand() * h), colors[Math.floor(rand() * colors.length)]);
  }

  line(x0: number, y0: number, x1: number, y1: number, c: string) {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.p(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  /** A beam three pixels thick: outline, a lit face and a shaded face. */
  beam(x0: number, y0: number, x1: number, y1: number, r: Ramp) {
    const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
    const [ox, oy] = steep ? [1, 0] : [0, 1];
    this.line(x0 - ox, y0 - oy, x1 - ox, y1 - oy, OUT);
    this.line(x0 + 2 * ox, y0 + 2 * oy, x1 + 2 * ox, y1 + 2 * oy, OUT);
    this.line(x0, y0, x1, y1, r[r.length - 2]);
    this.line(x0 + ox, y0 + oy, x1 + ox, y1 + oy, r[r.length - 4]);
  }

  /** An upright cylinder shaded across its width, brightest a third of the way in. */
  cylinder(x: number, y: number, w: number, h: number, r: Ramp) {
    for (let c = 0; c < w; c++) {
      if (c === 0 || c === w - 1) {
        this.f(x + c, y, 1, h, OUT);
        continue;
      }
      const t = c / (w - 1);
      const light = 1 - Math.min(1, Math.abs(t - 0.32) / 0.68);
      const idx = Math.max(1, Math.min(r.length - 1, Math.round(1 + light * (r.length - 2))));
      this.f(x + c, y, 1, h, r[idx]);
    }
  }

  /** A pipe lying sideways, shaded top (light) to bottom (dark). */
  pipe(x: number, y: number, w: number, h: number, r: Ramp) {
    this.f(x, y, w, h, OUT);
    for (let row = 1; row < h - 1; row++) {
      const t = row / (h - 1);
      const idx = Math.max(1, Math.min(r.length - 1, Math.round((1 - Math.abs(t - 0.3) / 0.7) * (r.length - 2)) + 1));
      this.f(x, y + row, w, 1, r[idx]);
    }
  }

  /** Diagonal hazard stripes, yellow on ink. */
  hazard(x: number, y: number, w: number, h: number, period = 6) {
    for (let yy = 0; yy < h; yy++)
      for (let xx = 0; xx < w; xx++) this.p(x + xx, y + yy, Math.floor((xx + yy) / (period / 2)) % 2 ? OUT : SUN[3]);
    this.f(x, y, w, 1, SUN[4]);
  }
}
