import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { barrel, base } from "@/components/pixel/sprites";
import { PRODUCTS, UNITS, type Product, type UnitKind } from "@/lib/game/content";
import { C, font, Pointer, Spr, ring, snap } from "../brand";
import { bumpAt, Dissolve, dissolved, EpEnd, Popup, Shutter } from "./kit";

// EP 4 · Crude in, diesel and jet fuel out. A refinery assembly line: raw
// barrels ride the conveyor, the cursor hits RUN on each unit, the distillation
// tower, the cracker and the liquefier shake and puff, refined barrels pop out
// onto the rack, and the market ticker across the top ticks up.

export const EP4_SECONDS = 12;
const END = 610;

const barrelOf = (p: Product) => ({ ...base, R: PRODUCTS[p].color, r: C.ink, W: PRODUCTS[p].shine });

const MACHINES: Record<UnitKind, { x: number }> = {
  distillation: { x: 330 },
  cracker: { x: 900 },
  liquefier: { x: 1470 },
};

// each job: the raw barrel enters at `in`, reaches its unit at `at`, comes out refined at `out`
const JOBS: { raw: Product; unit: UnitKind; out: Product; in: number; at: number }[] = [
  { raw: "light", unit: "distillation", out: "diesel", in: 96, at: 150 },
  { raw: "heavy", unit: "cracker", out: "diesel", in: 150, at: 250 },
  { raw: "gas", unit: "liquefier", out: "lng", in: 210, at: 350 },
  { raw: "light", unit: "distillation", out: "jet", in: 330, at: 384 },
  { raw: "heavy", unit: "cracker", out: "diesel", in: 380, at: 470 },
];
const WORK = 44;
const CONVEYOR_Y = 700;

export function Ep4Refinery() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {!dissolved(frame, END) ? <Line frame={frame} fps={fps} /> : <EpEnd frame={frame - END - 20} fps={fps} ep={4} line="Crude in, fuel out" color={C.leaf} />}
      <Shutter frame={frame} fps={fps} ep={4} title={["Crude in,", "diesel and jet fuel out"]} color={C.leaf} />
      <Dissolve frame={frame} start={END} color={C.leaf} />
    </AbsoluteFill>
  );
}

function busy(frame: number, unit: UnitKind) {
  return JOBS.some((j) => j.unit === unit && frame >= j.at && frame < j.at + WORK);
}

function Line({ frame, fps }: { frame: number; fps: number }) {
  const done = JOBS.filter((j) => frame >= j.at + WORK);
  const lastDone = done.length ? done[done.length - 1].at + WORK : -100;

  // the cursor visits each unit just before its job starts and clicks RUN
  const clickAt = (j: (typeof JOBS)[number]) => j.at - 4;
  const next = JOBS.find((j) => frame < clickAt(j) + 10) ?? JOBS[JOBS.length - 1];
  const prev = JOBS[Math.max(0, JOBS.indexOf(next) - 1)];
  const tx = MACHINES[next.unit].x + 110;
  const fx = MACHINES[prev.unit].x + 110;
  const m0 = clickAt(prev) + 10;
  const m1 = clickAt(next) - 6;
  const mv = m1 > m0 ? interpolate(frame, [m0, m1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  const cx = next === prev ? tx : fx + (tx - fx) * mv;

  return (
    <AbsoluteFill>
      {/* the hall: brick wall and floor */}
      <div style={{ position: "absolute", inset: 0, background: C.stormShade, backgroundImage: `linear-gradient(${C.ink} 6px, transparent 6px), linear-gradient(90deg, ${C.ink} 6px, transparent 6px)`, backgroundSize: "160px 80px" }} />
      <div style={{ position: "absolute", left: 0, top: 820, width: 1920, height: 260, background: C.steelDeep, borderTop: `10px solid ${C.ink}` }} />

      <Ticker frame={frame} />

      {/* the product rack */}
      <div style={{ position: "absolute", left: 440, top: 120, width: 1040, height: 130, background: C.wood, boxShadow: ring(7), display: "flex", alignItems: "flex-end", gap: 30, padding: "0 30px 10px" }}>
        <span style={{ position: "absolute", left: 20, top: -50, fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.white }}>Products</span>
      </div>
      {done.map((j, i) => {
        const t = frame - (j.at + WORK);
        const sx = MACHINES[j.unit].x + 60;
        const sy = 380;
        const ex = 490 + i * 190;
        const ey = 140;
        const p = Math.min(1, t / 30);
        const x = sx + (ex - sx) * p;
        const y = sy + (ey - sy) * p - Math.sin(p * Math.PI) * 220;
        return <Spr key={i} rows={barrel} palette={barrelOf(j.out)} scale={7} x={snap(x, 7)} y={snap(y, 7)} style={{ zIndex: 30 }} />;
      })}

      {/* the conveyor */}
      <div style={{ position: "absolute", left: 0, top: CONVEYOR_Y + 90, width: 1920, height: 40, background: C.ink }} />
      <div style={{ position: "absolute", left: 0, top: CONVEYOR_Y + 96, width: 1920, height: 26, background: `repeating-linear-gradient(90deg, ${C.steel} 0 40px, ${C.steelDeep} 40px 80px)`, backgroundPosition: `${(frame * 4) % 80}px 0` }} />

      <Tower frame={frame} on={busy(frame, "distillation")} />
      <Cracker frame={frame} on={busy(frame, "cracker")} />
      <Liquefier frame={frame} on={busy(frame, "liquefier")} />

      {/* raw barrels riding in */}
      {JOBS.map((j, i) => {
        if (frame < j.in || frame >= j.at) return null;
        const x = interpolate(frame, [j.in, j.at], [-100, MACHINES[j.unit].x + 60]);
        return <Spr key={i} rows={barrel} palette={barrelOf(j.raw)} scale={7} x={snap(x, 7)} y={CONVEYOR_Y} style={{ zIndex: 25 }} />;
      })}

      {/* RUN buttons under the units */}
      {(Object.keys(MACHINES) as UnitKind[]).map((u) => {
        const job = JOBS.find((j) => j.unit === u && frame >= clickAt(j) && frame < clickAt(j) + 8);
        return (
          <div key={u} style={{ position: "absolute", left: MACHINES[u].x + 10, top: 880, width: 220, padding: "12px 0", background: busy(frame, u) ? C.leaf : C.red, boxShadow: ring(6), fontFamily: font.logo, fontWeight: 700, fontSize: 32, color: C.white, textAlign: "center", translate: job ? "0 6px" : undefined }}>
            {busy(frame, u) ? "Running" : "Run"}
          </div>
        );
      })}
      {(Object.keys(MACHINES) as UnitKind[]).map((u) => (
        <div key={u} style={{ position: "absolute", left: MACHINES[u].x, top: 960, width: 240, textAlign: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: C.white }}>
          {UNITS[u].name}
        </div>
      ))}
      {frame >= 100 && frame < 560 && <Pointer x={cx} y={905} down={JOBS.some((j) => frame >= clickAt(j) && frame < clickAt(j) + 8)} scale={7} />}

      {JOBS.map((j, i) => (
        <Popup key={i} frame={frame} at={j.at + WORK} x={MACHINES[j.unit].x + 120} y={330} color={PRODUCTS[j.out].shine} size={46}>
          {PRODUCTS[j.out].name}!
        </Popup>
      ))}

      {/* combo counter */}
      <div style={{ position: "absolute", right: 40, top: 300, padding: "16px 24px", background: C.ink, boxShadow: ring(6, C.sun), scale: String(1 + bumpAt(frame, lastDone) * 0.25), display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: C.sunPale }}>Refined</span>
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 80, color: C.sun, lineHeight: 1 }}>x{done.length}</span>
      </div>
    </AbsoluteFill>
  );
}

/** The market ticker: product benchmarks with green arrows, prices nudging up. */
function Ticker({ frame }: { frame: number }) {
  const items: Product[] = ["diesel", "jet", "lng", "light", "heavy", "gas"];
  const lift = 1 + Math.max(0, frame - 90) * 0.0004;
  const row = items.map((p) => `${PRODUCTS[p].ref}  ▲ ${(PRODUCTS[p].base * lift).toFixed(2)}`).join("     ");
  const x = -((frame * 5) % 1800);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 70, background: C.ink, borderBottom: `6px solid ${C.leaf}`, overflow: "hidden", zIndex: 40 }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 200, background: C.leaf, display: "grid", placeItems: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.white, zIndex: 2 }}>Market</div>
      <div style={{ position: "absolute", left: 220 + x, top: 14, whiteSpace: "nowrap", fontFamily: font.logo, fontWeight: 700, fontSize: 36, color: "#7dffb0" }}>
        {row}     {row}     {row}
      </div>
    </div>
  );
}

const jolt = (frame: number, on: boolean) => (on ? snap(Math.sin(frame * 2.4) * 5, 1) : 0);

function Tower({ frame, on }: { frame: number; on: boolean }) {
  const x = MACHINES.distillation.x + 40;
  return (
    <div style={{ position: "absolute", left: x, top: 290, width: 160, height: 500, translate: `${jolt(frame, on)}px 0` }}>
      <div style={{ position: "absolute", inset: 0, background: C.white, boxShadow: ring(8) }} />
      {[C.sunDeep, C.red, C.leaf, C.sea, C.sunDeep, C.red].map((c, i) => (
        <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 30 + i * 74, height: 26, background: c, opacity: on && Math.floor(frame / 5) % 6 === i ? 0.4 : 1 }} />
      ))}
      <div style={{ position: "absolute", left: 50, top: -40, width: 60, height: 40, background: C.ink }} />
      {on && <div style={{ position: "absolute", left: 40 + (Math.floor(frame / 6) % 2) * 20, top: -80 - (frame % 30), width: 40, height: 30, background: C.steelLight, opacity: 0.8 }} />}
    </div>
  );
}

function Cracker({ frame, on }: { frame: number; on: boolean }) {
  const x = MACHINES.cracker.x;
  const turn = on ? Math.floor(frame / 4) % 2 : 0;
  return (
    <div style={{ position: "absolute", left: x, top: 470, width: 240, height: 320, translate: `${jolt(frame, on)}px 0` }}>
      <div style={{ position: "absolute", inset: 0, background: C.steelLight, boxShadow: ring(8) }} />
      <div style={{ position: "absolute", left: 160, top: -150, width: 50, height: 150, background: C.red, boxShadow: ring(6) }} />
      {on && <div style={{ position: "absolute", left: 160 + (Math.floor(frame / 7) % 2) * 14, top: -210 - (frame % 24), width: 44, height: 34, background: C.steelLight, opacity: 0.8 }} />}
      {/* the gear: a square that steps between 0 and 45 degrees */}
      <div style={{ position: "absolute", left: 60, top: 80, width: 120, height: 120, background: C.sunDeep, boxShadow: ring(6), rotate: turn ? "45deg" : "0deg" }}>
        <div style={{ position: "absolute", left: 40, top: 40, width: 40, height: 40, background: C.ink }} />
      </div>
      <div style={{ position: "absolute", left: 20, top: 250, width: 200, height: 20, background: on ? C.red : C.ink }} />
    </div>
  );
}

function Liquefier({ frame, on }: { frame: number; on: boolean }) {
  const x = MACHINES.liquefier.x;
  return (
    <div style={{ position: "absolute", left: x, top: 420, width: 240, height: 370, translate: `${jolt(frame, on)}px 0` }}>
      <div style={{ position: "absolute", left: 40, top: 230, width: 26, height: 140, background: C.ink }} />
      <div style={{ position: "absolute", left: 174, top: 230, width: 26, height: 140, background: C.ink }} />
      <svg width={240} height={260} viewBox="0 0 24 26" shapeRendering="crispEdges" style={{ position: "absolute", left: 0, top: 0 }}>
        <circle cx={12} cy={12} r={11.5} fill={C.ink} />
        <circle cx={12} cy={12} r={10} fill={C.white} />
        <rect x={2} y={11} width={20} height={2} fill={PRODUCTS.lng.color} />
        <rect x={6} y={4} width={3} height={3} fill={C.sky} />
      </svg>
      {on && [0, 1, 2].map((k) => <div key={k} style={{ position: "absolute", left: 30 + k * 70, top: 20 + ((frame + k * 11) % 40), width: 12, height: 12, background: C.sky }} />)}
    </div>
  );
}
