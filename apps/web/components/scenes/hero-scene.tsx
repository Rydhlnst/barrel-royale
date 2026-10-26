import { C } from "@/lib/palette";
import { Pixels, Sprite, disc, line, rect, type Px } from "@/components/pixel/sprite";
import {
  barrel,
  base,
  boat,
  cloudBig,
  cloudSmall,
  distantRig,
  drop,
  flameA,
  flameB,
  flamePalette,
  gullDown,
  gullUp,
  roughneck,
} from "@/components/pixel/sprites";

// The hero: a rig on the open sea under the sunburst. 480 × 150 art pixels with
// the horizon at y = 96. The sky is left transparent so the sunburst behind the
// SVG shows through, and the light it radiates from sits right behind the rig.
// On narrow screens the sides are cropped, so everything that matters sits
// between x = 140 and x = 340.

const W = 480;
const H = 150;
export const HORIZON = 96;

const SEA = ["#2a86e8", C.sea, C.seaDeep];

// The sea, its waves and the sun glow are shared with the closing scene, so
// both take the horizon and the scene height.

/** The light the rays come from: a pale sun, half sunk at the horizon. */
export function glow(horizon = HORIZON, r = 40): Px[] {
  return [
    ...disc(240, horizon, r, (dy) => (dy < 0 ? C.sunPale : null)),
    ...disc(240, horizon, Math.round(r * 0.75), (dy) => (dy < 0 ? "#fffbe6" : null)),
  ];
}

export function sea(horizon = HORIZON, height = H): Px[] {
  const depth = height - horizon;
  const stops = [horizon + 1, horizon + Math.round(depth * 0.22), horizon + Math.round(depth * 0.52), height];
  const out: Px[] = [rect(0, horizon, W, 1, C.ink)];
  SEA.forEach((c, i) => out.push(rect(0, stops[i], W, stops[i + 1] - stops[i], c)));
  // dithered seams between the bands
  for (let i = 1; i < SEA.length; i++) {
    const y = stops[i];
    for (let x = 0; x < W; x++) {
      if (x % 4 === 0) out.push({ x, y: y - 2, c: SEA[i] });
      if (x % 2 === 1) out.push({ x, y: y - 1, c: SEA[i] });
    }
  }
  // the sun's path on the water
  for (let y = horizon + 2, i = 0; y < horizon + depth * 0.65; y += 3, i++) {
    const half = Math.max(2, 22 - i * 2);
    out.push(rect(240 - half + ((i * 7) % 5), y, Math.round(half * 0.8), 1, C.sunPale));
    out.push(rect(240 + Math.round(half * 0.3), y, Math.max(1, Math.round(half * 0.5)), 1, C.foam));
  }
  return out;
}

export function waves(horizon = HORIZON): Px[] {
  const tile: [number, number, number][] = [
    [2, 4, 5],
    [14, 9, 4],
    [24, 14, 6],
    [6, 20, 4],
    [18, 26, 6],
    [28, 32, 4],
    [9, 38, 6],
    [21, 45, 5],
  ];
  const out: Px[] = [];
  for (let ox = -32; ox < W + 32; ox += 32) {
    for (const [x, y, w] of tile) out.push(rect(ox + x, horizon + y, w, 1, C.foam));
  }
  return out;
}

/** Cartoon steel: an ink edge either side of a lit face. */
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

function rig(): Px[] {
  const out: Px[] = [];

  // legs, with the part under water fading into the sea
  for (const x of [200, 222, 254, 276]) {
    out.push(...column(x, 78, HORIZON - 78));
    out.push(rect(x, HORIZON + 1, 5, 16, "#1f5fb8"), rect(x + 1, HORIZON + 1, 2, 16, "#4a8ae0"));
    out.push(rect(x - 3, HORIZON + 1, 3, 1, C.white), rect(x + 5, HORIZON + 1, 3, 1, C.white));
  }
  // bracing
  for (const [a, b] of [
    [205, 222],
    [227, 254],
    [259, 276],
  ]) {
    out.push(...line(a, 80, b - 1, 93, C.ink), ...line(b - 1, 80, a, 93, C.ink));
  }
  out.push(rect(200, 87, 81, 2, C.ink));

  // main deck: ink frame, steel plate, hazard stripes along the edge
  out.push(rect(170, 71, 136, 8, C.ink), rect(171, 72, 134, 4, C.steel), rect(171, 72, 134, 1, C.steelLight));
  for (let x = 171; x < 305; x += 4) out.push(rect(x, 76, 2, 2, C.sun), rect(x + 2, 76, 2, 2, C.ink));

  // living quarters: white block, blue windows, red roof trim
  out.push(rect(194, 48, 32, 24, C.ink), rect(195, 49, 30, 22, C.white), rect(195, 49, 30, 3, C.red));
  for (let y = 55; y <= 65; y += 5) for (let x = 198; x <= 218; x += 5) out.push(rect(x, y, 3, 3, C.sea), rect(x, y, 3, 1, C.foam));
  out.push(rect(206, 66, 6, 5, C.ink));
  // helideck on top
  out.push(rect(186, 43, 46, 5, C.ink), rect(187, 44, 44, 3, C.steel));
  for (let x = 188; x < 230; x += 5) out.push(rect(x, 44, 3, 1, C.sun));

  // drill floor and derrick
  out.push(rect(228, 63, 40, 9, C.ink), rect(229, 64, 38, 7, C.steel), rect(229, 64, 38, 1, C.steelLight), rect(244, 66, 8, 5, C.ink));
  out.push(...derrick());

  // crane with a yellow boom
  out.push(rect(270, 56, 8, 16, C.ink), rect(271, 56, 6, 16, C.steel));
  out.push(rect(267, 50, 14, 8, C.ink), rect(268, 51, 12, 6, C.sun), rect(275, 52, 4, 3, C.sea));
  out.push(...line(276, 50, 316, 20, C.ink), ...line(277, 51, 317, 21, C.sun), ...line(277, 52, 317, 22, C.sun), ...line(277, 53, 317, 23, C.ink));
  out.push(rect(317, 23, 1, 22, C.ink), rect(314, 45, 7, 3, C.ink), rect(315, 46, 5, 1, C.sun));

  // flare boom reaching out to the left
  out.push(...line(194, 60, 158, 34, C.ink), ...line(194, 61, 158, 35, C.steel), ...line(194, 62, 158, 36, C.ink));
  return out;
}

const sparkles = [
  [60, 30],
  [130, 14],
  [350, 40],
  [410, 18],
  [300, 8],
  [170, 60],
] as const;

const skyClouds = [
  { rows: cloudBig, y: 8, delay: "-30s", duration: "150s" },
  { rows: cloudSmall, y: 30, delay: "-95s", duration: "190s" },
  { rows: cloudBig, y: 52, delay: "-140s", duration: "230s" },
];

export function Gull({ y, delay, duration }: { y: number; delay: string; duration: string }) {
  const palette = { K: C.ink, W: C.white, Y: C.hat };
  return (
    <g className="gull" style={{ animationDelay: delay, animationDuration: duration }}>
      <Sprite rows={gullUp} palette={palette} y={y} className="frame-a" />
      <Sprite rows={gullDown} palette={palette} y={y} className="frame-b" />
    </g>
  );
}

export function HeroScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      shapeRendering="crispEdges"
      className={className}
      role="img"
      aria-label="An offshore oil rig on the open sea under a sunburst, with a red derrick, a yellow crane, a flare, a supply boat and the roughneck on deck"
    >
      <Pixels items={glow()} />
      {sparkles.map(([x, y], i) => (
        <rect key={i} x={x} y={y} width={2} height={2} fill={C.white} className="twinkle" style={{ animationDelay: `${-i * 0.6}s` }} />
      ))}
      {skyClouds.map((c, i) => (
        <g key={i} className="drift" style={{ animationDelay: c.delay, animationDuration: c.duration }}>
          <Sprite rows={c.rows} palette={{ W: C.white, w: "#d3e8ff" }} y={c.y} />
        </g>
      ))}
      <Sprite rows={distantRig} palette={{ X: "#e0891a" }} x={52} y={HORIZON - 9} />
      <Sprite rows={distantRig} palette={{ X: "#e0891a" }} x={418} y={HORIZON - 9} />

      <Pixels items={sea()} />
      <Pixels items={waves()} className="waves" />

      <Pixels items={rig()} />
      <rect x={247} y={4} width={3} height={3} fill={C.red} className="blink" />
      <Sprite rows={flameA} palette={flamePalette} x={151} y={24} className="frame-a flicker" />
      <Sprite rows={flameB} palette={flamePalette} x={151} y={24} className="frame-b flicker" />
      <Sprite rows={barrel} palette={base} x={171} y={59} />
      <Sprite rows={drop} palette={base} x={184} y={59} className="bob" />
      <Sprite rows={roughneck} palette={base} x={288} y={52} />

      <g className="bob">
        <Sprite rows={boat} palette={base} x={84} y={HORIZON + 6} />
        <rect x={82} y={HORIZON + 13} width={32} height={1} fill={C.white} />
      </g>

      <Gull y={24} delay="-4s" duration="38s" />
      <Gull y={40} delay="-21s" duration="46s" />
      <Gull y={14} delay="-30s" duration="52s" />
    </svg>
  );
}
