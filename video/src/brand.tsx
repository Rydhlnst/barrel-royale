import { useLayoutEffect, useRef } from "react";
import { getInfo as silkscreenInfo, loadFont as loadSilkscreen } from "@remotion/google-fonts/Silkscreen";
import { loadFont as loadPixelify } from "@remotion/google-fonts/PixelifySans";
import { loadFont as loadNunito } from "@remotion/google-fonts/Nunito";
import { AbsoluteFill, Easing, continueRender, delayRender, interpolate, random, useCurrentFrame } from "remotion";
import { C } from "@/lib/palette";
import { PixelIcon, Pixels, Sprite, type Palette } from "@/components/pixel/sprite";
import { base, cloudBig, cloudSmall, distantRig, drop, barrel, boat, flameA, flameB, flamePalette, gullDown, gullUp, roughneck } from "@/components/pixel/sprites";
import { HORIZON, glow, sea, waves } from "@/components/scenes/hero-scene";
import { pointer, rig } from "./art";

// The brand kit for the videos: the site's three fonts and palette, and the
// site's pixel art driven by the frame instead of CSS animations, which do not
// render in Remotion.

export const FPS = 60;
export { C };

// Pixelify Sans draws 5 almost like S and 2 close to 8, so "540" reads "S40". The display face takes its
// digits from Silkscreen instead: a face limited to 0–9, listed ahead of Pixelify, which keeps the letters.
const DIGITS = "Brand Digits";
if (typeof document !== "undefined") {
  const files = silkscreenInfo().fonts.normal;
  const faces = [
    new FontFace(DIGITS, `url(${files["400"].latin}) format("woff2")`, { unicodeRange: "U+0030-0039", weight: "100 600" }),
    new FontFace(DIGITS, `url(${files["700"].latin}) format("woff2")`, { unicodeRange: "U+0030-0039", weight: "601 900" }),
  ];
  const handle = delayRender("Loading the digits face");
  Promise.all(faces.map((f) => f.load()))
    .then((loaded) => loaded.forEach((f) => (document.fonts as unknown as { add: (face: FontFace) => void }).add(f)))
    .catch(() => {})
    .finally(() => continueRender(handle));
}

export const font = {
  logo: loadSilkscreen("normal", { weights: ["400", "700"], subsets: ["latin"] }).fontFamily,
  display: `"${DIGITS}", ${loadPixelify("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily}`,
  body: loadNunito("normal", { weights: ["700", "800"], subsets: ["latin"] }).fontFamily,
};
export const mono = "ui-monospace, Consolas, monospace";

export const ease = Easing.bezier(0.22, 1, 0.36, 1);
export const pop = Easing.bezier(0.34, 1.56, 0.64, 1);

/** 0 → 1 between `start` and `start + dur` frames, clamped and eased. */
export const ramp = (f: number, start: number, dur: number, easing = ease) =>
  interpolate(f, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

/** Snaps to whole steps of `n` px, so moving art stays on the pixel grid. */
export const snap = (v: number, n = 1) => Math.round(v / n) * n;

/** The site's chunky ink text outline (`.outlined`), scaled to `w` px. */
export const outline = (w = 5, drop = 2.6, color: string = C.ink) => {
  const d = Math.round(w * drop);
  const s = [
    [-w, 0], [w, 0], [0, -w], [0, w], [-w, -w], [w, -w], [-w, w], [w, w],
    [0, d], [-w, d], [w, d],
  ];
  return s.map(([x, y]) => `${x}px ${y}px 0 ${color}`).join(", ");
};

/** The site's pixel frame (`.box`): an ink ring and a hard drop shadow. */
export const ring = (b = 6, color: string = C.ink, dropColor = "rgba(30, 42, 74, 0.3)") =>
  `0 -${b}px 0 0 ${color}, 0 ${b}px 0 0 ${color}, -${b}px 0 0 0 ${color}, ${b}px 0 0 0 ${color}, 0 ${Math.round(b * 2.5)}px 0 0 ${dropColor}`;

/** A sprite placed on the frame, at a whole-number scale. */
export function Spr({
  rows,
  palette = base,
  scale,
  x,
  y,
  style,
}: {
  rows: readonly string[];
  palette?: Palette;
  scale: number;
  x?: number;
  y?: number;
  style?: React.CSSProperties;
}) {
  return (
    <PixelIcon
      rows={rows}
      palette={palette}
      scale={Math.round(scale)}
      style={{ position: x === undefined && y === undefined ? undefined : "absolute", left: x, top: y, display: "block", ...style }}
    />
  );
}

/** The site's sunburst, drawn per pixel on a small canvas and scaled up with hard edges, turning slowly. */
export function Sunburst({
  cx = 0.5,
  cy = 0.5,
  turn = 0.06,
  rays = 28,
  px = 6,
  colors = [C.sun, C.sunDeep],
  from = 0,
}: {
  cx?: number;
  cy?: number;
  /** degrees per frame */
  turn?: number;
  rays?: number;
  px?: number;
  colors?: [string, string];
  from?: number;
}) {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const w = Math.ceil(1920 / px);
  const h = Math.ceil(1080 / px);
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext("2d")!;
    const img = ctx.createImageData(w, h);
    const rgb = colors.map((c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]);
    const rot = ((from + frame * turn) * Math.PI) / 180;
    const ox = cx * w;
    const oy = cy * h;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const a = Math.atan2(y + 0.5 - oy, x + 0.5 - ox) - rot;
        const k = Math.floor(((a / (2 * Math.PI)) * rays + rays * 4) % rays) % 2;
        const [r, g, b] = rgb[k];
        const i = (y * w + x) * 4;
        img.data[i] = r;
        img.data[i + 1] = g;
        img.data[i + 2] = b;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [frame, w, h, cx, cy, turn, rays, colors, from]);
  return <canvas ref={ref} width={w} height={h} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", imageRendering: "pixelated" }} />;
}

const SKY_CLOUDS = [
  { rows: cloudBig, y: 8, speed: 0.06, at: 40 },
  { rows: cloudSmall, y: 30, speed: 0.045, at: 300 },
  { rows: cloudBig, y: 52, speed: 0.035, at: 180 },
];

const SPARKLES = [
  [60, 30],
  [130, 14],
  [350, 40],
  [410, 18],
  [300, 8],
  [170, 60],
] as const;

/** A flapping gull crossing the sky, `speed` art px per frame. */
function Gull({ y, speed, at, frame }: { y: number; speed: number; at: number; frame: number }) {
  const palette = { K: C.ink, W: C.white, Y: C.hat };
  const x = Math.floor(((at + frame * speed) % 560) - 40);
  return <Sprite rows={Math.floor(frame / 9) % 2 ? gullDown : gullUp} palette={palette} x={x} y={y + (Math.floor(frame / 18) % 2)} />;
}

/**
 * The hero scene: the rig on the open sea, 480 × 150 art px drawn 4× to fill
 * 1920 px. The sky is left clear for a sunburst behind it.
 */
export function SeaScene({
  frame,
  y = 480,
  showRig = true,
  boatX = 84,
  crane = true,
  children,
}: {
  frame: number;
  y?: number;
  showRig?: boolean;
  boatX?: number;
  crane?: boolean;
  children?: React.ReactNode;
}) {
  const bob = Math.floor(frame / 30) % 2;
  const wave = Math.floor(frame / 5) % 32;
  return (
    <svg viewBox="0 0 480 150" width={1920} height={600} shapeRendering="crispEdges" style={{ position: "absolute", left: 0, top: y, overflow: "visible" }}>
      <Pixels items={glow()} />
      {SPARKLES.map(([x, sy], i) => (
        <rect key={i} x={x} y={sy} width={2} height={2} fill={C.white} opacity={(frame + i * 23) % 80 < 20 ? 1 : 0} />
      ))}
      {SKY_CLOUDS.map((c, i) => (
        <Sprite key={i} rows={c.rows} palette={{ W: C.white, w: "#d3e8ff" }} x={Math.floor(((c.at + frame * c.speed) % 540) - 40)} y={c.y} />
      ))}
      <Sprite rows={distantRig} palette={{ X: "#e0891a" }} x={52} y={HORIZON - 9} />
      <Sprite rows={distantRig} palette={{ X: "#e0891a" }} x={418} y={HORIZON - 9} />
      <Pixels items={sea()} />
      <g transform={`translate(${wave - 32} 0)`}>
        <Pixels items={waves()} />
      </g>
      {showRig && (
        <>
          <Pixels items={rig({ crane })} />
          <rect x={247} y={4} width={3} height={3} fill={C.red} opacity={frame % 60 < 36 ? 1 : 0} />
          <Sprite rows={Math.floor(frame / 7) % 2 ? flameB : flameA} palette={flamePalette} x={151} y={24} />
          <Sprite rows={barrel} palette={base} x={171} y={59} />
          <Sprite rows={drop} palette={base} x={184} y={59 - (Math.floor(frame / 24) % 2)} />
          <Sprite rows={roughneck} palette={base} x={288} y={52} />
        </>
      )}
      <g transform={`translate(0 ${-bob})`}>
        <Sprite rows={boat} palette={base} x={Math.round(boatX)} y={HORIZON + 6} />
        <rect x={Math.round(boatX) - 2} y={HORIZON + 13} width={32} height={1} fill={C.white} />
      </g>
      <Gull y={24} speed={0.35} at={60} frame={frame} />
      <Gull y={40} speed={0.28} at={300} frame={frame + 7} />
      <Gull y={14} speed={0.24} at={420} frame={frame + 13} />
      {children}
    </svg>
  );
}

/** Big display text with the site's outline. */
export function Title({
  children,
  size = 120,
  color = C.white,
  family = font.logo,
  style,
}: {
  children: React.ReactNode;
  size?: number;
  color?: string;
  family?: string;
  style?: React.CSSProperties;
}) {
  const w = Math.max(3, Math.round(size / 22));
  return (
    <div
      style={{
        fontFamily: family,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.05,
        color,
        textShadow: outline(w),
        letterSpacing: family === font.logo ? size * 0.02 : 0,
        textTransform: family === font.logo ? "uppercase" : undefined,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** A chip like the site's: white box, pixel ring, display font. */
export function Chip({ children, bg = C.white, color = C.ink, size = 34, style }: { children: React.ReactNode; bg?: string; color?: string; size?: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.4,
        background: bg,
        color,
        boxShadow: ring(Math.max(4, Math.round(size / 7))),
        padding: `${Math.round(size * 0.28)}px ${Math.round(size * 0.6)}px`,
        fontFamily: font.display,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.1,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Text typed out one character at a time from `start`, `cps` characters per second. */
export function typed(text: string, frame: number, start: number, cps = 18, fps = FPS) {
  const n = Math.max(0, Math.floor(((frame - start) / fps) * cps));
  return text.slice(0, n);
}

/** A block caret that blinks twice a second. */
export function Caret({ frame, color = C.ink, w = 18, h = 48 }: { frame: number; color?: string; w?: number; h?: number }) {
  return <span style={{ display: "inline-block", width: w, height: h, background: color, marginLeft: 6, verticalAlign: "middle", opacity: frame % 30 < 16 ? 1 : 0 }} />;
}

/** The pixel pointer, pressed down a little while `down`. */
export function Pointer({ x, y, down = false, scale = 5 }: { x: number; y: number; down?: boolean; scale?: number }) {
  return <Spr rows={pointer} palette={base} scale={scale} x={Math.round(x)} y={Math.round(y)} style={{ transform: down ? "scale(0.86)" : undefined, transformOrigin: "0 0", zIndex: 50 }} />;
}

/**
 * The scene change: square blocks cover the frame along a diagonal, then clear
 * from the same corner, showing what is underneath. `start` is when covering begins.
 */
export function PixelWipe({ frame, start, color = C.ink, size = 120, dur = 22, hold = 4 }: { frame: number; start: number; color?: string; size?: number; dur?: number; hold?: number }) {
  const t = frame - start;
  if (t < 0 || t > dur * 2 + hold + 2) return null;
  const cols = Math.ceil(1920 / size);
  const rows = Math.ceil(1080 / size);
  const span = cols + rows;
  const blocks: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const k = (c + r) / span;
      const on = t >= k * dur && t < dur + hold + k * dur;
      if (on) blocks.push(<div key={`${r}-${c}`} style={{ position: "absolute", left: c * size, top: r * size, width: size, height: size, background: color }} />);
    }
  }
  return <AbsoluteFill style={{ zIndex: 100 }}>{blocks}</AbsoluteFill>;
}

/** True once the wipe that started at `start` has fully covered the frame. */
export const wiped = (frame: number, start: number, dur = 22) => frame >= start + dur;

type Particle = { x: number; y: number; vx: number; vy: number; spin: number; delay: number };

/** A deterministic burst of sprites from a point, falling under gravity. */
export function Burst({
  frame,
  start,
  x,
  y,
  count = 14,
  rows,
  palette = base,
  scale = 4,
  speed = 14,
  gravity = 0.55,
  spread = Math.PI * 2,
  angle = -Math.PI / 2,
  life = 90,
  seed = "burst",
}: {
  frame: number;
  start: number;
  x: number;
  y: number;
  count?: number;
  rows: readonly string[];
  palette?: Palette;
  scale?: number;
  speed?: number;
  gravity?: number;
  spread?: number;
  angle?: number;
  life?: number;
  seed?: string;
}) {
  const t0 = frame - start;
  if (t0 < 0 || t0 > life + 30) return null;
  const parts: Particle[] = Array.from({ length: count }, (_, i) => {
    const a = angle + (random(`${seed}a${i}`) - 0.5) * spread;
    const v = speed * (0.55 + random(`${seed}v${i}`) * 0.6);
    return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, spin: 0, delay: Math.floor(random(`${seed}d${i}`) * 6) };
  });
  return (
    <>
      {parts.map((p, i) => {
        const t = t0 - p.delay;
        if (t < 0) return null;
        const px = p.x + p.vx * t;
        const py = p.y + p.vy * t + 0.5 * gravity * t * t;
        const fade = interpolate(t, [life - 20, life], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return <Spr key={i} rows={rows} palette={palette} scale={scale} x={snap(px, scale)} y={snap(py, scale)} style={{ opacity: fade }} />;
      })}
    </>
  );
}

/** Small squares drifting up and fading, like sparks or embers. */
export function Embers({ frame, count = 40, colors = [C.flameCore, C.flame, C.flameEdge], area = { x: 0, y: 0, w: 1920, h: 1080 }, size = 8, rise = 2.2, seed = "ember" }: { frame: number; count?: number; colors?: string[]; area?: { x: number; y: number; w: number; h: number }; size?: number; rise?: number; seed?: string }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const period = 90 + Math.floor(random(`${seed}p${i}`) * 120);
        const t = (frame + Math.floor(random(`${seed}o${i}`) * period)) % period;
        const p = t / period;
        const x = area.x + random(`${seed}x${i}`) * area.w + Math.sin((frame + i * 40) / 25) * 14;
        const y = area.y + area.h - p * area.h * (0.6 + random(`${seed}r${i}`) * 0.6) * (rise / 2.2);
        const s = size * (random(`${seed}s${i}`) > 0.6 ? 2 : 1);
        return <div key={i} style={{ position: "absolute", left: snap(x, size), top: snap(y, size), width: s, height: s, background: colors[i % colors.length], opacity: p < 0.8 ? 1 : 1 - (p - 0.8) * 5 }} />;
      })}
    </>
  );
}

/** A footage window: ink frame, a title bar with the page's address, and the clip inside. */
export function Window({
  width,
  height,
  url,
  children,
  bar = 64,
  style,
}: {
  width: number;
  height: number;
  url?: React.ReactNode;
  children: React.ReactNode;
  bar?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ position: "absolute", width, height: height + (url ? bar : 0), background: C.white, boxShadow: ring(8, C.ink, "rgba(30, 42, 74, 0.35)"), ...style }}>
      {url && (
        <div style={{ height: bar, display: "flex", alignItems: "center", gap: 14, padding: "0 20px", background: C.sunPale, borderBottom: `6px solid ${C.ink}`, boxSizing: "border-box" }}>
          {[C.red, C.sun, C.leaf].map((c) => (
            <div key={c} style={{ width: 20, height: 20, background: c, boxShadow: `0 0 0 4px ${C.ink}` }} />
          ))}
          <div style={{ marginLeft: 16, flex: 1, height: 38, background: C.white, boxShadow: `0 0 0 4px ${C.ink}`, display: "flex", alignItems: "center", padding: "0 16px", fontFamily: font.display, fontWeight: 700, fontSize: 26, color: C.ink }}>
            {url}
          </div>
        </div>
      )}
      <div style={{ position: "relative", width, height, overflow: "hidden" }}>{children}</div>
    </div>
  );
}

/** Flat pixel sky bands, top to bottom. */
export function Bands({ colors, heights }: { colors: string[]; heights: number[] }) {
  let y = 0;
  return (
    <>
      {colors.map((c, i) => {
        const top = y;
        y += heights[i];
        return <div key={i} style={{ position: "absolute", left: 0, top, width: 1920, height: heights[i], background: c }} />;
      })}
    </>
  );
}

/** Stars that blink on their own beats, on a 6 px grid. */
export function Stars({ frame, count = 60, h = 600, seed = "star" }: { frame: number; count?: number; h?: number; seed?: string }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const x = snap(random(`${seed}x${i}`) * 1920, 6);
        const y = snap(random(`${seed}y${i}`) * h, 6);
        const period = 50 + Math.floor(random(`${seed}p${i}`) * 90);
        const on = (frame + i * 17) % period > period * 0.25;
        const big = random(`${seed}b${i}`) > 0.8;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: big ? 12 : 6, height: big ? 12 : 6, background: big ? C.sunPale : C.white, opacity: on ? 1 : 0.25 }} />;
      })}
    </>
  );
}
