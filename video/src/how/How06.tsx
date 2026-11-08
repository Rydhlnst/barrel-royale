import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { barrel, base, crate, icons, roughneck } from "@/components/pixel/sprites";
import { PRODUCTS } from "@/lib/game/content";
import { C, Chip, font, Pointer, Spr, Title, ring, snap } from "../brand";
import { Dissolve, dissolved, EpEnd, Popup, Prompt, Shutter } from "../ep/kit";

// How 06 · Three ways to sell. A road forks into three doors. The roughneck
// carries a barrel up and opens each in turn: the Spot market (sell any time
// at the live index), the Dispatch board (contracts above base, before a
// deadline) and the Export terminal (ship out for $XOM). Then all three, side
// by side.

export const HOW06_SECONDS = 14;
const END = 730;

const DOORS = [
  { x: 420, color: C.leaf, name: "Spot market", open: 226 },
  { x: 960, color: C.sunDeep, name: "Dispatch board", open: 376 },
  { x: 1500, color: C.red, name: "Export terminal", open: 526 },
];
const DOOR = { w: 220, h: 260, y: 170 };
const STAND_Y = 330;
const SUMMARY = 640;

// where the roughneck walks: [frame, x, y]
const PATH: [number, number, number][] = [
  [94, 912, 960],
  [176, 912, 640],
  [214, DOORS[0].x - 48, STAND_Y],
  [326, DOORS[0].x - 48, STAND_Y],
  [364, DOORS[1].x - 48, STAND_Y],
  [476, DOORS[1].x - 48, STAND_Y],
  [514, DOORS[2].x - 48, STAND_Y],
];

function walker(frame: number) {
  if (frame <= PATH[0][0]) return { x: PATH[0][1], y: PATH[0][2], moving: false };
  for (let i = 1; i < PATH.length; i++) {
    const [a, ax, ay] = PATH[i - 1];
    const [b, bx, by] = PATH[i];
    if (frame < b) {
      const t = (frame - a) / (b - a);
      return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, moving: ax !== bx || ay !== by };
    }
  }
  const [, x, y] = PATH[PATH.length - 1];
  return { x, y, moving: false };
}

export function How06() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {dissolved(frame, END) ? <EpEnd frame={frame - END - 20} fps={fps} ep={6} tag="How it works" line="Three ways to sell" color={C.leaf} /> : <Crossroads frame={frame} fps={fps} />}
      <Shutter frame={frame} fps={fps} ep={6} tag="How 06" title="Three ways to sell" color={C.leaf} />
      <Dissolve frame={frame} start={END} color={C.leaf} />
    </AbsoluteFill>
  );
}

function Crossroads({ frame, fps }: { frame: number; fps: number }) {
  const w = walker(frame);
  const active = DOORS.findIndex((d, i) => frame >= d.open && (i === 2 ? frame < SUMMARY : frame < DOORS[i + 1].open - 50));
  return (
    <AbsoluteFill>
      {/* sky and grass */}
      {[C.sky, "#d3ecff", C.foam].map((c, i) => (
        <div key={i} style={{ position: "absolute", left: 0, top: i * 60, width: 1920, height: 60, background: c }} />
      ))}
      <div style={{ position: "absolute", left: 0, top: 180, width: 1920, height: 900, background: C.leaf }} />
      <div style={{ position: "absolute", left: 0, top: 180, width: 1920, height: 900, backgroundImage: `linear-gradient(90deg, #128052 6px, transparent 6px)`, backgroundSize: "60px 60px", opacity: 0.4 }} />

      {/* the road: a trunk from the bottom, a crossway along the doors */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} shapeRendering="crispEdges">
        <rect x={880} y={440} width={160} height={640} fill={C.sunPale} />
        <rect x={300} y={420} width={1320} height={110} fill={C.sunPale} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <rect key={i} x={952} y={560 + i * 66} width={16} height={34} fill={C.sunDeep} />
        ))}
        {Array.from({ length: 16 }, (_, i) => (
          <rect key={`c${i}`} x={330 + i * 82} y={467} width={40} height={16} fill={C.sunDeep} />
        ))}
      </svg>

      {/* the doors */}
      {DOORS.map((d, i) => {
        const o = Math.min(1, Math.max(0, (frame - d.open) / 14));
        const lit = active === i || frame >= SUMMARY;
        return (
          <div key={d.name}>
            <div style={{ position: "absolute", left: d.x - DOOR.w / 2 - 30, top: DOOR.y - 60, width: DOOR.w + 60, height: DOOR.h + 60, background: C.steelLight, boxShadow: ring(8) }} />
            <div style={{ position: "absolute", left: d.x - DOOR.w / 2 - 30, top: DOOR.y - 60, width: DOOR.w + 60, height: 50, background: d.color, display: "grid", placeItems: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 19, color: C.white, whiteSpace: "nowrap" }}>{d.name}</div>
            {/* the doorway shows warm light once open */}
            <div style={{ position: "absolute", left: d.x - DOOR.w / 2, top: DOOR.y, width: DOOR.w, height: DOOR.h, background: o > 0 ? C.sunPale : C.ink }} />
            {o > 0 && <DoorIcon i={i} x={d.x} frame={frame - d.open} />}
            <div style={{ position: "absolute", left: d.x - DOOR.w / 2, top: DOOR.y, width: snap(DOOR.w * (1 - o * 0.85), 4), height: DOOR.h, background: C.wood, boxShadow: `inset 0 0 0 6px ${C.woodDark}` }}>
              {o < 0.6 && <div style={{ position: "absolute", right: 18, top: DOOR.h / 2 - 8, width: 16, height: 16, background: C.sun }} />}
            </div>
            {lit && <div style={{ position: "absolute", left: d.x - DOOR.w / 2 - 38, top: DOOR.y - 68, width: DOOR.w + 76, height: DOOR.h + 76, boxShadow: `0 0 0 8px ${frame % 20 < 10 ? C.sun : d.color}` }} />}
          </div>
        );
      })}

      {/* the roughneck and his barrel */}
      <div style={{ position: "absolute", left: 0, top: 0, zIndex: 20 }}>
        <Spr rows={roughneck} palette={base} scale={6} x={snap(w.x, 6)} y={snap(w.y - (w.moving ? (Math.floor(frame / 6) % 2) * 6 : 0), 6)} />
        <Spr rows={barrel} palette={base} scale={5} x={snap(w.x + 92, 5)} y={snap(w.y + 52, 5)} />
      </div>
      {DOORS.map((d) => frame >= d.open - 30 && frame < d.open + 12 && <Prompt key={d.name} k="E" text="Open" down={frame >= d.open - 6 && frame < d.open + 2} x={d.x} y={STAND_Y - 16} pop={Math.min(1, (frame - d.open + 30) / 8)} />)}

      {frame >= 94 && frame < 176 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 600, display: "flex", justifyContent: "center", zIndex: 30 }}>
          <Chip bg={C.ink} color={C.sunPale} size={36}>
            <span style={{ fontFamily: font.logo }}>Got barrels? Pick a door</span>
          </Chip>
        </div>
      )}

      {/* the vignette under the open door */}
      {active >= 0 && frame < SUMMARY && <Vignette i={active} frame={frame - DOORS[active].open} fps={fps} />}
      {frame >= SUMMARY && <Summary frame={frame - SUMMARY} fps={fps} />}
    </AbsoluteFill>
  );
}

/** What waits behind each door, small. */
function DoorIcon({ i, x, frame }: { i: number; x: number; frame: number }) {
  const hop = snap(Math.abs(Math.sin(frame / 8)) * 12, 4);
  return <Spr rows={i === 1 ? crate : icons.coin} scale={7} x={x - 50} y={DOOR.y + 80 - hop} />;
}

function Vignette({ i, frame, fps }: { i: number; frame: number; fps: number }) {
  const d = DOORS[i];
  const pop = spring({ frame: frame - 10, fps, config: { damping: 11, stiffness: 220 } });
  const left = Math.min(1920 - 40 - 760, Math.max(40, d.x - 380));
  return (
    <div style={{ position: "absolute", left, top: 590, width: 760, padding: "26px 32px", background: C.white, boxShadow: `${ring(8)}, 0 0 0 16px ${d.color}`, scale: String(pop), transformOrigin: `${d.x - left}px 0`, zIndex: 40, display: "flex", flexDirection: "column", gap: 18, boxSizing: "border-box" }}>
      <Title size={48} color={d.color}>
        {d.name}
      </Title>
      {i === 0 && <Spot frame={frame} />}
      {i === 1 && <Dispatch frame={frame} />}
      {i === 2 && <Export frame={frame} />}
    </div>
  );
}

const line = { fontFamily: font.display, fontWeight: 700, fontSize: 34, color: C.ink } as const;

function Spot({ frame }: { frame: number }) {
  const click = 56;
  const index = 1 + Math.sin(frame / 9) * 0.04;
  const price = PRODUCTS.diesel.base * index;
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ padding: "10px 18px", background: C.ink, fontFamily: font.logo, fontWeight: 700, fontSize: 32, color: "#7dffb0", whiteSpace: "nowrap" }}>
          {PRODUCTS.diesel.ref} {index >= 1 ? "▲" : "▼"} {price.toFixed(2)}
        </div>
        <div style={{ padding: "12px 26px", background: frame >= click + 4 ? C.leaf : C.red, boxShadow: ring(5), fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.white, translate: frame >= click && frame < click + 8 ? "0 5px" : undefined, position: "relative" }}>
          {frame >= click + 4 ? "Sold!" : "Sell"}
          <Popup frame={frame} at={click + 4} x={60} y={-20} size={40} life={44}>
            +coins
          </Popup>
        </div>
      </div>
      <span style={line}>Sell any time at the live index</span>
      {frame >= 26 && frame < click + 16 && (
        <AbsoluteFill style={{ zIndex: 100 }}>
          <Pointer x={interpolate(frame, [26, click - 4], [700, 420], { extrapolateRight: "clamp" })} y={interpolate(frame, [26, click - 4], [260, 120], { extrapolateRight: "clamp" })} down={frame >= click && frame < click + 8} scale={6} />
        </AbsoluteFill>
      )}
    </>
  );
}

function Dispatch({ frame }: { frame: number }) {
  const left = 299 - Math.floor(frame / 6);
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, "0");
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: C.sunPale, boxShadow: ring(5) }}>
          <Spr rows={barrel} palette={{ ...base, R: PRODUCTS.diesel.color, W: PRODUCTS.diesel.shine }} scale={3} />
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 28, color: C.ink, whiteSpace: "nowrap" }}>Diesel 5 bbl</span>
        </div>
        <Chip bg={C.leaf} color={C.white} size={28}>
          <span style={{ fontFamily: font.logo }}>Premium</span>
        </Chip>
        <div style={{ padding: "10px 16px", background: C.ink, fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: frame % 20 < 10 ? C.red : C.sun }}>
          {mm}:{ss}
        </div>
      </div>
      <span style={line}>Contracts pay 10–30% above base. Fill them before the deadline.</span>
    </>
  );
}

function Export({ frame }: { frame: number }) {
  const t = (frame % 50) / 50;
  return (
    <>
      <div style={{ position: "relative", height: 90 }}>
        <Spr rows={barrel} palette={base} scale={6} x={snap(interpolate(t, [0, 1], [0, 300]), 6)} y={6} style={{ opacity: t < 0.9 ? 1 : 0 }} />
        <div style={{ position: "absolute", left: 330, top: 0, width: 90, height: 90, background: C.ink, boxShadow: ring(5, C.red) }} />
        <Spr rows={icons.coin} scale={6} x={snap(436 + t * 60, 6)} y={snap(10 - Math.sin(t * Math.PI) * 24, 6)} style={{ opacity: t > 0.1 ? 1 : 0 }} />
        <span style={{ position: "absolute", left: 540, top: 22, fontFamily: font.logo, fontWeight: 700, fontSize: 36, color: C.red }}>$XOM</span>
      </div>
      <span style={line}>Ship barrels out and earn $XOM</span>
    </>
  );
}

function Summary({ frame, fps }: { frame: number; fps: number }) {
  const cards = [
    { ...DOORS[0], line: "Any time, at the live index" },
    { ...DOORS[1], line: "10–30% above base, with a deadline" },
    { ...DOORS[2], line: "Ship out for $XOM" },
  ];
  return (
    <AbsoluteFill style={{ zIndex: 50 }}>
      <AbsoluteFill style={{ background: C.ink, opacity: Math.min(0.6, frame / 12) }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 540, display: "flex", justifyContent: "center", gap: 40 }}>
        {cards.map((c, i) => (
          <div key={c.name} style={{ width: 540, padding: "24px 28px", background: C.white, boxShadow: `${ring(8)}, 0 0 0 14px ${c.color}`, display: "flex", flexDirection: "column", gap: 14, boxSizing: "border-box", scale: String(spring({ frame: frame - i * 8, fps, config: { damping: 10, stiffness: 220 } })) }}>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 34, color: c.color, whiteSpace: "nowrap" }}>
              {i + 1}. {c.name}
            </span>
            <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 30, color: C.ink }}>{c.line}</span>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 860, display: "flex", justifyContent: "center", scale: String(spring({ frame: frame - 30, fps, config: { damping: 10 } })) }}>
        <Title size={64}>Your barrels, your call</Title>
      </div>
    </AbsoluteFill>
  );
}
