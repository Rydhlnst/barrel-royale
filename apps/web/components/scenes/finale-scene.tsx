import { C } from "@/lib/palette";
import { Pixels, Sprite, line, rect, type Px } from "@/components/pixel/sprite";
import { barrel, base, boat, cloudBig, cloudSmall, distantRig, drop, roughneck } from "@/components/pixel/sprites";
import { Gull, glow, sea, waves } from "./hero-scene";

// The closing scene above the footer: the same sea and light as the hero, seen
// from a pier, with the rig far out on the horizon. 480 × 120 art pixels with
// the horizon at y = 56; the rays behind it are centred there.

const W = 480;
const H = 120;
const HORIZON = 56;

/** The rig from the hero, small and far away. */
function farRig(): Px[] {
  const out: Px[] = [];
  for (const x of [229, 236, 244, 251]) out.push(rect(x, 50, 2, HORIZON - 50, C.ink));
  out.push(rect(224, 47, 33, 4, C.ink), rect(225, 48, 31, 2, C.steel));
  out.push(rect(226, 41, 9, 6, C.ink), rect(227, 42, 7, 4, C.white));
  out.push(...line(238, 47, 242, 30, C.red), ...line(247, 47, 243, 30, C.red), rect(239, 40, 8, 1, C.red), rect(240, 35, 6, 1, C.red));
  out.push(rect(240, 28, 6, 2, C.ink));
  out.push(...line(250, 44, 262, 36, C.sun));
  return out;
}

/** A steel pier running in from the right, on pale pilings like the banner's. */
function pier(): Px[] {
  const out: Px[] = [];
  for (let x = 280; x < W; x += 44) out.push(rect(x, 92, 8, H - 92, C.ink), rect(x + 2, 92, 4, H - 92, "#ffe58a"));
  out.push(rect(266, 85, W - 266, 8, C.ink), rect(267, 86, W - 267, 4, C.steel), rect(267, 86, W - 267, 1, C.steelLight));
  for (let x = 267; x < W; x += 4) out.push(rect(x, 90, 2, 2, C.sun), rect(x + 2, 90, 2, 2, C.ink));
  return out;
}

const sparkles = [
  [70, 18],
  [150, 8],
  [330, 26],
  [400, 10],
  [190, 34],
] as const;

export function FinaleScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      shapeRendering="crispEdges"
      className={className}
      role="img"
      aria-label="The roughneck on a pier at sea, with the rig far out on the horizon under the sunburst"
    >
      <Pixels items={glow(HORIZON, 30)} />
      {sparkles.map(([x, y], i) => (
        <rect key={i} x={x} y={y} width={2} height={2} fill={C.white} className="twinkle" style={{ animationDelay: `${-i * 0.7}s` }} />
      ))}
      <g className="drift" style={{ animationDelay: "-60s", animationDuration: "170s" }}>
        <Sprite rows={cloudBig} palette={{ W: C.white, w: "#d3e8ff" }} y={6} />
      </g>
      <g className="drift" style={{ animationDelay: "-130s", animationDuration: "210s" }}>
        <Sprite rows={cloudSmall} palette={{ W: C.white, w: "#d3e8ff" }} y={22} />
      </g>
      <Sprite rows={distantRig} palette={{ X: "#e0891a" }} x={90} y={HORIZON - 9} />
      <Sprite rows={distantRig} palette={{ X: "#e0891a" }} x={390} y={HORIZON - 9} />
      <Pixels items={farRig()} />
      <rect x={242} y={26} width={2} height={2} fill={C.red} className="blink" />

      <Pixels items={sea(HORIZON, H)} />
      <Pixels items={waves(HORIZON)} className="waves" />

      <g className="bob">
        <Sprite rows={boat} palette={base} x={160} y={HORIZON + 10} />
        <rect x={158} y={HORIZON + 17} width={32} height={1} fill={C.white} />
      </g>

      <Pixels items={pier()} />
      <Sprite rows={roughneck} palette={base} x={280} y={66} />
      <Sprite rows={barrel} palette={base} x={300} y={73} />
      <Sprite rows={barrel} palette={base} x={314} y={73} />
      <Sprite rows={drop} palette={base} x={329} y={73} className="bob" />

      <Gull y={18} delay="-12s" duration="44s" />
      <Gull y={30} delay="-33s" duration="50s" />
    </svg>
  );
}
