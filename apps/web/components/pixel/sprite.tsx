// Pixel art from strings: each character is one pixel, looked up in a palette,
// and "." (or any key the palette lacks) is transparent. Runs of one colour on a
// row merge into a single rect to keep the SVG small.

export type Palette = Record<string, string>;
export type Px = { x: number; y: number; w?: number; h?: number; c: string };

export function runs(rows: readonly string[], palette: Palette, ox = 0, oy = 0): Px[] {
  const out: Px[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = palette[row[x]];
      if (!c) {
        x++;
        continue;
      }
      let w = 1;
      while (row[x + w] === row[x]) w++;
      out.push({ x: ox + x, y: oy + y, w, c });
      x += w;
    }
  });
  return out;
}

/** Draws a list of pixels inside an SVG. */
export function Pixels({ items, className }: { items: readonly Px[]; className?: string }) {
  return (
    <g className={className}>
      {items.map((p, i) => (
        <rect key={i} x={p.x} y={p.y} width={p.w ?? 1} height={p.h ?? 1} fill={p.c} />
      ))}
    </g>
  );
}

export function Sprite({
  rows,
  palette,
  x = 0,
  y = 0,
  className,
}: {
  rows: readonly string[];
  palette: Palette;
  x?: number;
  y?: number;
  className?: string;
}) {
  return <Pixels items={runs(rows, palette, x, y)} className={className} />;
}

/** A sprite as its own SVG, sized in whole screen pixels per art pixel. */
export function PixelIcon({
  rows,
  palette,
  scale = 4,
  className,
  style,
  label,
}: {
  rows: readonly string[];
  palette: Palette;
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
}) {
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w * scale}
      height={h * scale}
      shapeRendering="crispEdges"
      className={className}
      style={style}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Sprite rows={rows} palette={palette} />
    </svg>
  );
}

// Drawing helpers for art that is easier to describe than to type out.

export const rect = (x: number, y: number, w: number, h: number, c: string): Px => ({ x, y, w, h, c });

/** Bresenham line, one pixel wide. */
export function line(x0: number, y0: number, x1: number, y1: number, c: string): Px[] {
  const out: Px[] = [];
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    out.push({ x: x0, y: y0, c });
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
  return out;
}

/** Filled pixel circle; `color` picks each row's colour from its offset (or skips it with null). */
export function disc(cx: number, cy: number, r: number, color: (dy: number) => string | null): Px[] {
  const out: Px[] = [];
  for (let dy = -r; dy <= r; dy++) {
    const c = color(dy);
    if (!c) continue;
    const half = Math.floor(Math.sqrt(r * r - dy * dy));
    out.push({ x: cx - half, y: cy + dy, w: half * 2 + 1, h: 1, c });
  }
  return out;
}
