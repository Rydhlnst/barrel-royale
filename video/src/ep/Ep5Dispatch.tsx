import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { barrel, base, crownBarrel, icons } from "@/components/pixel/sprites";
import { PRODUCTS, type Product } from "@/lib/game/content";
import { Burst, C, font, Pointer, Spr, ring, snap } from "../brand";
import { Bar, bumpAt, Counter, Dissolve, dissolved, EpEnd, Popup, Shutter } from "./kit";

// EP 5 · Fill the tanker, take the premium. A card game first: three dispatch
// contracts flip face up, the cursor picks one and hits ACCEPT, and the card
// zooms into the dock. Barrels slide down the chute into the tanker's hold, the
// PREMIUM stamp slams, the coin counter climbs, and the tanker sails off.

export const EP5_SECONDS = 12;
const END = 610;

const barrelOf = (p: Product) => ({ ...base, R: PRODUCTS[p].color, r: C.ink, W: PRODUCTS[p].shine });
const CARDS: { p: Product; qty: number }[] = [
  { p: "diesel", qty: 20 },
  { p: "jet", qty: 12 },
  { p: "lng", qty: 8 },
];
const PICK = 1;
const ACCEPT = 236;
const ZOOM = 262;
const DOCK = 292;
const LOAD = { from: 312, every: 13 };
const STAMP = 480;

export function Ep5Dispatch() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {dissolved(frame, END) ? <EpEnd frame={frame - END - 20} fps={fps} ep={5} line="Take the premium" color={C.hat} /> : frame < DOCK ? <Board frame={frame} fps={fps} /> : <Dock frame={frame - DOCK} fps={fps} />}
      <Shutter frame={frame} fps={fps} ep={5} title={["Fill the tanker,", "take the premium"]} color={C.hat} />
      <Dissolve frame={frame} start={END} color={C.hat} />
    </AbsoluteFill>
  );
}

function Card({ frame, fps, i, x }: { frame: number; fps: number; i: number; x: number }) {
  const flipAt = 104 + i * 22;
  const f = frame - flipAt;
  const sx = f < 0 ? 1 : f < 8 ? 1 - f / 8 : f < 16 ? (f - 8) / 8 : 1;
  const face = f >= 8;
  const c = CARDS[i];
  const picked = i === PICK;
  const hover = picked && frame >= 196 ? -30 : 0;
  const zoom = picked ? interpolate(frame, [ZOOM, DOCK], [1, 4], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => t * t }) : 1;
  const others = !picked && frame >= ACCEPT ? interpolate(frame, [ACCEPT, ACCEPT + 16], [1, 0], { extrapolateRight: "clamp" }) : 1;
  const accepted = picked && frame >= ACCEPT + 6;
  const timer = interpolate(frame, [120, 290], [1, 0.55], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: x, top: 270 + hover, width: 420, height: 580, scale: `${sx * zoom} ${zoom}`, opacity: others, zIndex: picked ? 10 : 1 }}>
      {!face ? (
        <div style={{ position: "absolute", inset: 0, background: `repeating-linear-gradient(45deg, ${C.red} 0 30px, ${C.redDeep} 30px 60px)`, boxShadow: ring(9), display: "grid", placeItems: "center" }}>
          <div style={{ padding: 20, background: C.sunPale, boxShadow: ring(6) }}>
            <Spr rows={crownBarrel} scale={8} />
          </div>
        </div>
      ) : (
        <div style={{ position: "absolute", inset: 0, background: C.white, boxShadow: picked && frame >= 196 ? ring(9, C.sun) : ring(9), display: "flex", flexDirection: "column", alignItems: "center", padding: "26px 24px", gap: 18 }}>
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 28, color: C.ink2 }}>Contract #{14 + i}</span>
          <div style={{ padding: 16, background: C.sky, boxShadow: `0 0 0 5px ${C.ink}` }}>
            <Spr rows={barrel} palette={barrelOf(c.p)} scale={11} />
          </div>
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 44, color: C.ink }}>{PRODUCTS[c.p].name}</span>
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 38, color: C.red }}>{c.qty} bbl</span>
          <Bar p={timer} w={340} h={24} color={C.sunDeep} />
          <div style={{ marginTop: "auto", width: "100%", padding: "14px 0", background: accepted ? C.leaf : C.ink, color: C.white, fontFamily: font.logo, fontWeight: 700, fontSize: 38, textAlign: "center", boxShadow: ring(5), translate: picked && frame >= ACCEPT && frame < ACCEPT + 6 ? "0 6px" : undefined }}>{accepted ? "Accepted" : "Accept"}</div>
        </div>
      )}
      {face && (
        <div style={{ position: "absolute", right: -20, top: 60, padding: "6px 14px", background: C.sun, boxShadow: ring(4), rotate: "8deg", fontFamily: font.logo, fontWeight: 700, fontSize: 24, color: C.ink }}>Premium</div>
      )}
    </div>
  );
}

function Board({ frame, fps }: { frame: number; fps: number }) {
  const xs = [220, 750, 1280];
  const px = interpolate(frame, [150, 196, 210, ACCEPT - 2], [1500, xs[PICK] + 260, xs[PICK] + 260, xs[PICK] + 230], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const py = interpolate(frame, [150, 196, 210, ACCEPT - 2], [1000, 600, 600, 790], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: C.wood }}>
      {/* the cork board */}
      <div style={{ position: "absolute", left: 120, top: 130, width: 1680, height: 880, background: "#c98a4b", boxShadow: ring(12, C.woodDark), backgroundImage: `radial-gradient(${C.woodDark} 3px, transparent 3px)`, backgroundSize: "36px 36px" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 60, color: C.white, textShadow: `5px 5px 0 ${C.ink}` }}>Dispatch board</div>
      {xs.map((x, i) => (
        <Card key={i} frame={frame} fps={fps} i={i} x={x} />
      ))}
      {frame >= 150 && frame < ZOOM && <Pointer x={px} y={py} down={frame >= ACCEPT && frame < ACCEPT + 6} scale={8} />}
    </AbsoluteFill>
  );
}

/** The tanker, 100 × 30 art px. */
function Tanker() {
  return (
    <svg width={900} height={270} viewBox="0 0 100 30" shapeRendering="crispEdges">
      <polygon points="0,14 100,14 94,28 6,28" fill={C.ink} />
      <polygon points="2,15 98,15 93,27 7,27" fill={C.red} />
      <rect x={2} y={22} width={96} height={2} fill={C.redDeep} />
      <rect x={4} y={12} width={92} height={3} fill={C.ink} />
      <rect x={14} y={9} width={50} height={4} fill={C.ink} />
      <rect x={15} y={10} width={48} height={2} fill={C.oil} />
      <rect x={76} y={1} width={16} height={12} fill={C.ink} />
      <rect x={77} y={2} width={14} height={10} fill={C.white} />
      {[79, 83, 87].map((x) => (
        <rect key={x} x={x} y={4} width={2} height={2} fill={C.sea} />
      ))}
      <rect x={84} y={-4} width={4} height={6} fill={C.ink} />
      <rect x={85} y={-3} width={2} height={4} fill={C.sun} />
    </svg>
  );
}

function Dock({ frame, fps }: { frame: number; fps: number }) {
  const want = CARDS[PICK].qty;
  const loaded = Math.max(0, Math.min(want, Math.floor((frame + DOCK - LOAD.from) / LOAD.every) + 1));
  const stamp = frame + DOCK - STAMP;
  const sail = Math.max(0, frame + DOCK - 530);
  const shipX = 880 + sail * sail * 0.12;
  const sink = Math.round((loaded / want) * 3) * 6;
  const shake = stamp >= 0 && stamp < 14 ? snap(Math.sin(stamp * 3) * 12, 2) : 0;
  const coins = 240 + (stamp >= 0 ? Math.round(Math.min(1, stamp / 30) * 96) : 0);
  const wave = Math.floor(frame / 6) % 2;
  return (
    <AbsoluteFill style={{ translate: `${shake}px ${shake / 2}px` }}>
      {/* the card's zoom lands as a white flash */}
      <AbsoluteFill style={{ background: C.sky }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 300, background: "#bfe0ff" }} />
      <div style={{ position: "absolute", left: 0, top: 760, width: 1920, height: 320, background: C.sea }} />
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: i * 170 + wave * 40, top: 800 + (i % 3) * 70, width: 70, height: 8, background: C.foam }} />
      ))}
      {/* the pier and its chute */}
      <div style={{ position: "absolute", left: 0, top: 560, width: 560, height: 200, background: C.wood, borderTop: `10px solid ${C.woodDark}` }} />
      {[60, 220, 380, 520].map((x) => (
        <div key={x} style={{ position: "absolute", left: x, top: 760, width: 30, height: 200, background: C.woodDark }} />
      ))}
      <div style={{ position: "absolute", left: 420, top: 470, width: 640, height: 30, background: C.steel, boxShadow: ring(6), rotate: "14deg", transformOrigin: "0 0" }} />
      {/* the stack waiting on the pier */}
      {Array.from({ length: Math.max(0, want - loaded) }, (_, i) => (
        <Spr key={i} rows={barrel} palette={barrelOf(CARDS[PICK].p)} scale={6} x={40 + (i % 5) * 76} y={470 - Math.floor(i / 5) * 84} />
      ))}
      {/* the barrel on the chute right now */}
      {loaded < want && frame + DOCK >= LOAD.from && (() => {
        const t = ((frame + DOCK - LOAD.from) % LOAD.every) / LOAD.every;
        return <Spr rows={barrel} palette={barrelOf(CARDS[PICK].p)} scale={6} x={snap(430 + t * 600, 6)} y={snap(400 + t * 150, 6)} />;
      })()}
      {/* the tanker */}
      <div style={{ position: "absolute", left: shipX, top: 530 + sink + wave * 4 }}>
        <Tanker />
      </div>
      {/* the hold meter */}
      {sail === 0 && (
        <div style={{ position: "absolute", left: 1040, top: 380, display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 34, color: C.ink }}>
            Hold {loaded}/{want}
          </span>
          <Bar p={loaded / want} w={420} h={36} color={C.leaf} />
        </div>
      )}
      {Array.from({ length: want }, (_, i) => (
        <Popup key={i} frame={frame + DOCK} at={LOAD.from + i * LOAD.every + LOAD.every - 1} x={1180} y={500} size={36} life={30} color={C.white}>
          +1
        </Popup>
      ))}
      <div style={{ position: "absolute", right: 40, top: 30 }}>
        <Counter label="Coins" value={coins} icon={<Spr rows={icons.coin} scale={4} />} bump={bumpAt(frame + DOCK, STAMP)} />
      </div>
      {stamp >= 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 160, display: "flex", justifyContent: "center", zIndex: 60 }}>
          <div style={{ padding: "18px 60px", border: `14px solid ${C.sunDeep}`, background: C.sun, boxShadow: ring(6), rotate: "-8deg", scale: String(interpolate(spring({ frame: stamp, fps, config: { damping: 7, stiffness: 260 } }), [0, 1], [3.2, 1])) }}>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 130, color: C.ink, letterSpacing: 4 }}>Premium</span>
          </div>
        </div>
      )}
      <Popup frame={frame + DOCK} at={STAMP + 10} x={1700} y={170} size={54} life={70}>
        +Premium
      </Popup>
      <Burst frame={frame + DOCK} start={STAMP} x={1500} y={160} rows={icons.coin} scale={5} count={18} speed={16} seed="premium" />
      {sail > 0 && sail < 70 && (
        <div style={{ position: "absolute", left: shipX + 640, top: 380 + sink, padding: "10px 18px", background: C.white, boxShadow: ring(5), fontFamily: font.logo, fontWeight: 700, fontSize: 40, color: C.ink }}>Toot!</div>
      )}
    </AbsoluteFill>
  );
}
