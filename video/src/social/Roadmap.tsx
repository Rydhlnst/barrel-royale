import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { base, logo, logoPalette, roughneck } from "@/components/pixel/sprites";
import { C, Chip, font, Spr, Sunburst, Title, ring, snap } from "../brand";
import { currentPhase, PHASES, STATUS_LABEL, type Status } from "./roadmap-data";

// The roadmap visuals, drawn from roadmap-data.ts so they follow the site.
// RoadmapMap is a still: a pipeline winding through every phase, the shipped
// stretch running with oil, the crew standing at the phase that's live now.
// RoadmapUpdate is a short video for the phase in progress: its checklist
// slides in, the shipped items get stamped, the count climbs and the next
// phase is teased. Frame ROADMAP_CARD_FRAME doubles as the update card.

const STATUS_BG: Record<Status, string> = { done: C.leaf, now: C.red, next: C.sun, later: C.steelLight };
const STATUS_FG: Record<Status, string> = { done: C.white, now: C.white, next: C.ink, later: C.ink };

const shipped = (i: number) => PHASES[i].items.filter((x) => x.ok).length;

function Brand({ color = C.ink }: { color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <Spr rows={logo} palette={logoPalette} scale={3} style={{ boxShadow: ring(4) }} />
      <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 28, color }}>Barrel Royale</span>
    </div>
  );
}

// ---------------------------------------------------------------- the map

// the stations: four along the top, then the pipe turns down and runs back
const NODES = [
  { x: 250, y: 380 },
  { x: 720, y: 380 },
  { x: 1190, y: 380 },
  { x: 1660, y: 380 },
  { x: 1430, y: 760 },
  { x: 960, y: 760 },
  { x: 490, y: 760 },
];

/** The pipe's points from station a to station b. */
function leg(a: number, b: number) {
  const p = NODES[a];
  const q = NODES[b];
  return p.y === q.y ? [p, q] : [p, { x: p.x, y: q.y }, q];
}

export function RoadmapMap() {
  const frame = useCurrentFrame();
  const now = currentPhase();
  const done = PHASES.reduce((s, _, i) => s + shipped(i), 0);
  const total = PHASES.reduce((s, p) => s + p.items.length, 0);
  const pts = (a: number, b: number) =>
    leg(a, b)
      .map((p) => `${p.x},${p.y}`)
      .join(" ");
  return (
    <AbsoluteFill style={{ background: C.sunPale, overflow: "hidden" }}>
      <AbsoluteFill style={{ backgroundImage: `linear-gradient(${C.sun} 3px, transparent 3px), linear-gradient(90deg, ${C.sun} 3px, transparent 3px)`, backgroundSize: "60px 60px", opacity: 0.55 }} />

      {/* the pipeline */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} shapeRendering="crispEdges">
        {NODES.slice(1).map((_, i) => (
          <polyline key={`o${i}`} points={pts(i, i + 1)} fill="none" stroke={C.ink} strokeWidth={34} strokeLinejoin="miter" />
        ))}
        {NODES.slice(1).map((_, i) => {
          const flowing = i < now;
          return <polyline key={`i${i}`} points={pts(i, i + 1)} fill="none" stroke={flowing ? C.oil : C.steelLight} strokeWidth={20} strokeLinejoin="miter" />;
        })}
        {NODES.slice(1).map((_, i) =>
          i < now ? <polyline key={`f${i}`} points={pts(i, i + 1)} fill="none" stroke={C.sun} strokeWidth={8} strokeDasharray="24 24" strokeDashoffset={-frame * 2} /> : <polyline key={`d${i}`} points={pts(i, i + 1)} fill="none" stroke={C.steel} strokeWidth={8} strokeDasharray="12 20" />,
        )}
      </svg>

      {/* the stations and their cards */}
      {PHASES.map((p, i) => {
        const n = NODES[i];
        return (
          <div key={p.title}>
            <div style={{ position: "absolute", left: n.x - 56, top: n.y - 56, width: 112, height: 112, background: STATUS_BG[p.status], boxShadow: p.status === "now" ? `${ring(8)}, 0 0 0 18px ${C.sun}` : ring(8), display: "grid", placeItems: "center" }}>
              <Spr rows={p.icon} palette={base} scale={4} />
            </div>
            <div style={{ position: "absolute", left: n.x - 190, top: n.y + 78, width: 380, padding: "12px 16px", background: C.white, boxShadow: ring(6), display: "flex", flexDirection: "column", gap: 6, boxSizing: "border-box" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: font.display, fontWeight: 800, fontSize: 22, color: C.ink2 }}>{p.when}</span>
                <span style={{ padding: "2px 10px", background: STATUS_BG[p.status], color: STATUS_FG[p.status], fontFamily: font.logo, fontWeight: 700, fontSize: 18, boxShadow: `0 0 0 3px ${C.ink}` }}>{STATUS_LABEL[p.status]}</span>
              </div>
              <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 24, color: C.ink, lineHeight: 1.15 }}>{p.title}</span>
              <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 18, color: shipped(i) === p.items.length ? C.leaf : C.ink2 }}>
                {shipped(i)}/{p.items.length} shipped
              </span>
            </div>
          </div>
        );
      })}

      {/* the crew at the live phase */}
      <Spr rows={roughneck} palette={base} scale={5} x={NODES[now].x + 30} y={NODES[now].y - 172} />
      <div style={{ position: "absolute", left: NODES[now].x - 300, top: NODES[now].y - 150, rotate: "-6deg" }}>
        <Chip bg={C.red} color={C.white} size={24}>
          <span style={{ fontFamily: font.logo }}>We're here</span>
        </Chip>
      </div>

      {/* header and footer */}
      <div style={{ position: "absolute", left: 80, top: 56, display: "flex", flexDirection: "column", gap: 18 }}>
        <Brand />
        <Title size={92}>Roadmap</Title>
      </div>
      <div style={{ position: "absolute", right: 80, top: 80, padding: "16px 26px", background: C.ink, boxShadow: ring(7, C.sun), display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 22, color: C.sunPale }}>{PHASES[now].when} is live</span>
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 44, color: C.sun }}>
          {done}/{total} shipped
        </span>
      </div>
      <div style={{ position: "absolute", left: 80, bottom: 36, fontFamily: font.logo, fontWeight: 700, fontSize: 22, color: C.ink, letterSpacing: 2 }}>barrelroyale.io/roadmap · @barrelroyale</div>
    </AbsoluteFill>
  );
}

// ------------------------------------------------------------- the update

export const ROADMAP_UPDATE_SECONDS = 10;
export const ROADMAP_CARD_FRAME = 579;

export function RoadmapUpdate({ phase = currentPhase() }: { phase?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = PHASES[phase];
  const next = PHASES[phase + 1];
  const okIdx = p.items.map((x, i) => (x.ok ? i : -1)).filter((i) => i >= 0);
  const stampAt = (i: number) => 200 + okIdx.indexOf(i) * 20;
  const count = okIdx.filter((i) => frame >= stampAt(i)).length;
  const s = (d: number, damping = 11) => spring({ frame: frame - d, fps, config: { damping, stiffness: 200 } });
  const fill = count / p.items.length;
  const lastStamp = okIdx.length ? stampAt(okIdx[okIdx.length - 1]) : 200;
  return (
    <AbsoluteFill style={{ background: C.sun, overflow: "hidden" }}>
      <Sunburst cx={0.5} cy={1.1} rays={30} turn={0.04} />

      <div style={{ position: "absolute", left: 120, top: 50, right: 120, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, scale: String(s(0)) }}>
          <Chip bg={C.ink} color={C.sun} size={30}>
            <span style={{ fontFamily: font.logo }}>Roadmap update</span>
          </Chip>
          <Chip bg={STATUS_BG[p.status]} color={STATUS_FG[p.status]} size={30}>
            <span style={{ fontFamily: font.logo }}>
              {p.when} · {STATUS_LABEL[p.status]}
            </span>
          </Chip>
        </div>
        <div style={{ scale: String(s(6)) }}>
          <Brand />
        </div>
      </div>
      <div style={{ position: "absolute", left: 120, top: 146, scale: String(interpolate(s(12, 12), [0, 1], [0.6, 1], { extrapolateRight: "clamp" })), opacity: Math.min(1, s(12)), transformOrigin: "0 50%" }}>
        <Title size={88}>{p.title}</Title>
      </div>

      {/* the checklist */}
      <div style={{ position: "absolute", left: 120, top: 280, width: 1680, padding: "18px 28px", background: C.white, boxShadow: ring(9), display: "flex", flexDirection: "column", gap: 10, boxSizing: "border-box" }}>
        {p.items.map((it, i) => {
          const at = 40 + i * 16;
          const inn = Math.min(1, s(at, 14));
          const stamped = it.ok && frame >= stampAt(i);
          const pop = stamped ? interpolate(frame - stampAt(i), [0, 6, 12], [2.2, 0.9, 1], { extrapolateRight: "clamp" }) : 1;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, padding: "8px 12px", background: stamped ? "#e6f6ec" : i % 2 ? C.sky : C.white, translate: `${snap((1 - inn) * -200, 8)}px 0`, opacity: inn }}>
              <div style={{ width: 44, height: 44, flexShrink: 0, background: stamped ? C.leaf : C.white, boxShadow: `0 0 0 4px ${C.ink}`, display: "grid", placeItems: "center", scale: String(pop), fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.white }}>{stamped ? "✓" : ""}</div>
              <span style={{ flex: 1, fontFamily: font.display, fontWeight: 800, fontSize: 26, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.text}</span>
              {it.ok ? (
                <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 20, color: C.leaf, opacity: stamped ? 1 : 0 }}>Shipped</span>
              ) : (
                <span style={{ padding: "4px 12px", background: C.sun, boxShadow: `0 0 0 3px ${C.ink}`, fontFamily: font.logo, fontWeight: 700, fontSize: 20, color: C.ink, opacity: frame % 40 < 28 ? 1 : 0.55, whiteSpace: "nowrap" }}>In progress</span>
              )}
            </div>
          );
        })}
      </div>

      {/* the count and the bar */}
      <div style={{ position: "absolute", left: 120, top: 856, width: 1680, display: "flex", alignItems: "center", gap: 30 }}>
        <div style={{ flex: 1, height: 56, background: C.ink, boxShadow: ring(6, C.white), display: "flex", gap: 4, padding: 8, boxSizing: "border-box" }}>
          {Array.from({ length: 28 }, (_, i) => (
            <div key={i} style={{ flex: 1, background: i < Math.round(fill * 28) ? (i % 2 ? C.leaf : "#1fae74") : "transparent" }} />
          ))}
        </div>
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 44, color: C.ink, whiteSpace: "nowrap", scale: String(frame >= 200 && frame < lastStamp + 12 && (frame - 200) % 20 < 6 ? 1.12 : 1) }}>
          {count}/{p.items.length} shipped
        </span>
      </div>

      {/* the checkpoint and what's next */}
      <div style={{ position: "absolute", left: 120, top: 950, right: 120, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {p.gate ? (
          <div style={{ scale: String(s(lastStamp + 30)), transformOrigin: "0 50%" }}>
            <Chip bg={C.white} color={C.ink} size={24}>
              <span style={{ fontFamily: font.logo, color: C.red }}>Checkpoint</span>
              <span>{p.gate}</span>
            </Chip>
          </div>
        ) : (
          <span />
        )}
        {next && (
          <div style={{ scale: String(s(lastStamp + 60, 8)), transformOrigin: "100% 50%" }}>
            <Chip bg={C.ink} color={C.white} size={24}>
              <span style={{ fontFamily: font.logo, color: C.sun }}>Up next</span>
              <span>{next.title}</span>
            </Chip>
          </div>
        )}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 14, textAlign: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 20, color: C.ink, letterSpacing: 2 }}>barrelroyale.io/roadmap · @barrelroyale</div>
    </AbsoluteFill>
  );
}
