import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { barrel, base, icons } from "@/components/pixel/sprites";
import { LEVELS, PRODUCTS, UNITS, type Refined, type UnitKind } from "@/lib/game/content";
import { C, Chip, font, PixelWipe, Pointer, Spr, Title, ring, snap } from "../brand";
import { Dissolve, dissolved, EpEnd, Shutter } from "../ep/kit";

// How 09 · Rig levels, on the drafting table. A blueprint of the deck: each
// upgrade stamps the next level, the slot grid grows from 6 to 12 and the
// storage tank from 60 to 240 bbl. Then two finished rigs side by side, the
// same 12 slots filled two different ways: wells and refinery units share the
// deck, so every rig is built differently.

export const HOW09_SECONDS = 14;
const END = 730;

const AT = [104, 196, 288, 380, 472];
const WIPE = 560;
const RIGS = WIPE + 26;

const BLUE = "#1d4f9c";
const LINE = "#5d8fd8";

export function How09() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {dissolved(frame, END) ? <EpEnd frame={frame - END - 20} fps={fps} ep={9} tag="How it works" line="Build your rig" color={C.sea} /> : frame < RIGS ? <Blueprint frame={frame} fps={fps} /> : <TwoRigs frame={frame - RIGS} fps={fps} />}
      <PixelWipe frame={frame} start={WIPE} color={BLUE} />
      <Shutter frame={frame} fps={fps} ep={9} tag="How 09" title="Rig levels" color={C.sea} />
      <Dissolve frame={frame} start={END} color={C.sea} />
    </AbsoluteFill>
  );
}

function Paper({ children }: { children: React.ReactNode }) {
  return (
    <AbsoluteFill style={{ background: C.wood }}>
      <div style={{ position: "absolute", left: 70, top: 60, width: 1780, height: 960, background: BLUE, boxShadow: ring(8), backgroundImage: `linear-gradient(${LINE} 2px, transparent 2px), linear-gradient(90deg, ${LINE} 2px, transparent 2px)`, backgroundSize: "40px 40px", overflow: "hidden" }}>
        {children}
      </div>
      {/* a pencil and a ruler on the table */}
      <div style={{ position: "absolute", left: 1500, top: 1030, width: 300, height: 26, background: C.sun, boxShadow: ring(4) }} />
      <div style={{ position: "absolute", left: 1470, top: 1030, width: 30, height: 26, background: C.skin, boxShadow: ring(4) }} />
      <div style={{ position: "absolute", left: 120, top: 1026, width: 520, height: 34, background: C.steelLight, boxShadow: ring(4), backgroundImage: `linear-gradient(90deg, ${C.ink} 3px, transparent 3px)`, backgroundSize: "40px 14px", backgroundRepeat: "repeat-x" }} />
    </AbsoluteFill>
  );
}

function Blueprint({ frame, fps }: { frame: number; fps: number }) {
  const lvl = Math.max(1, AT.filter((a) => frame >= a).length);
  const L = LEVELS[lvl - 1];
  const prev = LEVELS[Math.max(0, lvl - 2)];
  const since = frame - AT[lvl - 1];
  const storage = interpolate(since, [0, 24], [lvl > 1 ? prev.storage : 0, L.storage], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const maxStorage = LEVELS[LEVELS.length - 1].storage;
  const tankH = 560;

  // the cursor clicks Upgrade just before each new level
  const next = AT.findIndex((a, i) => i > 0 && frame < a + 10);
  const ptr = next > 0 && frame >= AT[next] - 40 ? { x: interpolate(frame, [AT[next] - 40, AT[next] - 8], [1700, 1560], { extrapolateRight: "clamp" }), y: interpolate(frame, [AT[next] - 40, AT[next] - 8], [1000, 880], { extrapolateRight: "clamp" }), down: frame >= AT[next] - 6 && frame < AT[next] + 2 } : null;

  return (
    <Paper>
      <div style={{ position: "absolute", left: 60, top: 40 }}>
        <Title size={56}>Deck plan</Title>
      </div>

      {/* the slot grid: 4 across, up to 3 rows */}
      {Array.from({ length: 12 }, (_, i) => {
        const opensAt = AT[LEVELS.findIndex((l) => l.slots > i)];
        if (frame < opensAt) {
          return <div key={i} style={{ position: "absolute", left: 90 + (i % 4) * 196, top: 180 + Math.floor(i / 4) * 196, width: 170, height: 170, border: `4px dashed ${LINE}`, boxSizing: "border-box", opacity: 0.6 }} />;
        }
        const s = spring({ frame: frame - opensAt - (i % 2) * 4, fps, config: { damping: 10, stiffness: 220 } });
        return (
          <div key={i} style={{ position: "absolute", left: 90 + (i % 4) * 196, top: 180 + Math.floor(i / 4) * 196, width: 170, height: 170, border: `6px solid ${C.white}`, boxSizing: "border-box", display: "grid", placeItems: "center", scale: String(Math.min(1.2, s)), fontFamily: font.logo, fontWeight: 700, fontSize: 40, color: C.white }}>
            {i + 1}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 90, top: 790, fontFamily: font.logo, fontWeight: 700, fontSize: 34, color: C.white }}>
        Deck slots: <span style={{ color: C.sun }}>{L.slots}</span>
      </div>

      {/* the storage tank */}
      <div style={{ position: "absolute", left: 960, top: 180, width: 220, height: tankH, border: `6px solid ${C.white}`, boxSizing: "border-box" }}>
        <div style={{ position: "absolute", left: 6, right: 6, bottom: 6, height: snap(((tankH - 12) * storage) / maxStorage, 8), background: C.sun, opacity: 0.9 }} />
        {LEVELS.map((l) => (
          <div key={l.storage} style={{ position: "absolute", right: -70, bottom: ((tankH - 12) * l.storage) / maxStorage - 2, width: 60, height: 4, background: LINE }} />
        ))}
      </div>
      <div style={{ position: "absolute", left: 870, top: 790, width: 400, textAlign: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.white, whiteSpace: "nowrap" }}>
        Storage: <span style={{ color: C.sun }}>{Math.round(storage)}</span> bbl
      </div>

      {/* the level card and its stamp */}
      <div style={{ position: "absolute", left: 1300, top: 180, width: 400, padding: "26px 30px", background: C.sky, boxShadow: ring(7), display: "flex", flexDirection: "column", gap: 18, boxSizing: "border-box" }}>
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.ink2 }}>Rig level</span>
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 150, color: C.ink, lineHeight: 1, scale: String(interpolate(since, [0, 8], [1.3, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })) }}>{lvl}</span>
        <div style={{ display: "flex", gap: 6 }}>
          {LEVELS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 22, background: i < lvl ? C.sea : C.steelLight, boxShadow: `0 0 0 3px ${C.ink}` }} />
          ))}
        </div>
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 24, color: C.ink, whiteSpace: "nowrap" }}>
          {L.slots} slots · {L.storage} bbl
        </span>
      </div>
      {frame >= AT[0] && (
        <div style={{ position: "absolute", left: 1460, top: 140, rotate: "12deg", scale: String(interpolate(spring({ frame: since, fps, config: { damping: 12, stiffness: 260 } }), [0, 1], [2.4, 1], { extrapolateRight: "clamp" })), padding: "6px 16px", border: `6px solid ${C.red}`, fontFamily: font.logo, fontWeight: 700, fontSize: 34, color: C.red, background: "rgba(255,255,255,0.85)" }}>
          {lvl === 5 ? "Max level" : `Level ${lvl}`}
        </div>
      )}
      {lvl === 5 && since >= 20 && (
        <div style={{ position: "absolute", left: 930, top: 120, scale: String(spring({ frame: since - 20, fps, config: { damping: 9, stiffness: 220 } })) }}>
          <Chip bg={C.sun} color={C.ink} size={28}>
            <span style={{ fontFamily: font.logo }}>Biggest tank</span>
          </Chip>
        </div>
      )}
      <div style={{ position: "absolute", left: 1400, top: 820, width: 260, padding: "16px 0", background: lvl === 5 ? C.steelDeep : C.leaf, boxShadow: ring(6), textAlign: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 34, color: C.white, translate: ptr?.down ? "0 6px" : undefined }}>{lvl === 5 ? "Maxed" : "Upgrade"}</div>
      {ptr && (
        <AbsoluteFill style={{ zIndex: 100 }}>
          <Pointer x={ptr.x - 70} y={ptr.y - 60} down={ptr.down} scale={7} />
        </AbsoluteFill>
      )}
    </Paper>
  );
}

type Tile = "well" | UnitKind;

const UNIT_OUT: Record<UnitKind, Refined> = { distillation: "diesel", cracker: "diesel", liquefier: "lng" };

function TileView({ t, frame, delay, fps }: { t: Tile; frame: number; delay: number; fps: number }) {
  const s = spring({ frame: frame - delay, fps, config: { damping: 10, stiffness: 220 } });
  const isWell = t === "well";
  const color = isWell ? C.sunPale : C.white;
  return (
    <div style={{ width: 160, height: 140, background: color, boxShadow: `0 0 0 5px ${C.ink}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, scale: String(Math.min(1.15, s)) }}>
      {isWell ? <Spr rows={icons.derrick} scale={5} /> : <Spr rows={barrel} palette={{ ...base, R: PRODUCTS[UNIT_OUT[t]].color, r: C.ink, W: PRODUCTS[UNIT_OUT[t]].shine }} scale={5} />}
      <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: isWell ? 18 : 14, color: C.ink, whiteSpace: "nowrap" }}>{isWell ? "Well" : UNITS[t].name}</span>
    </div>
  );
}

function TwoRigs({ frame, fps }: { frame: number; fps: number }) {
  const rigs: { name: string; tiles: Tile[]; color: string }[] = [
    { name: "The driller", color: C.sunDeep, tiles: ["well", "well", "well", "well", "well", "well", "well", "well", "well", "distillation", "cracker", "liquefier"] },
    { name: "The refiner", color: C.leaf, tiles: ["well", "distillation", "well", "cracker", "well", "distillation", "liquefier", "well", "cracker", "liquefier", "well", "distillation"] },
  ];
  return (
    <Paper>
      {rigs.map((r, k) => {
        const wells = r.tiles.filter((t) => t === "well").length;
        return (
          <div key={r.name} style={{ position: "absolute", left: 70 + k * 860, top: 40, width: 780, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Title size={46} color={r.color}>
                {r.name}
              </Title>
              <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 24, color: C.white }}>
                {wells} wells · {12 - wells} units
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 160px)", gap: 26, padding: 24, background: "rgba(0,0,0,0.18)", boxShadow: `0 0 0 6px ${r.color}` }}>
              {r.tiles.map((t, i) => (
                <TileView key={i} t={t} frame={frame} delay={k * 10 + i * 3} fps={fps} />
              ))}
            </div>
          </div>
        );
      })}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 46, gap: 14 }}>
        <div style={{ scale: String(spring({ frame: frame - 40, fps, config: { damping: 10, stiffness: 200 } })) }}>
          <Chip bg={C.white} color={C.ink} size={34}>
            <span style={{ fontFamily: font.logo }}>Wells and refinery units share the deck</span>
          </Chip>
        </div>
        <div style={{ scale: String(spring({ frame: frame - 56, fps, config: { damping: 10, stiffness: 200 } })) }}>
          <Title size={58} color={C.sun}>
            Every rig is built differently
          </Title>
        </div>
      </AbsoluteFill>
    </Paper>
  );
}
