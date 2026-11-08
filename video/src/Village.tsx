import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { base, distantRig, flameA, flameB, flamePalette, logo, logoPalette, roughneck } from "@/components/pixel/sprites";
import { C, Chip, PixelWipe, Spr, Stars, Title, font, pop, ramp, ring, snap, typed } from "./brand";

// The Village teaser: a blueprint draws the plan and gets stamped, a pixel wipe
// opens on the boardwalk between the rigs at dusk, where the houses go up,
// windows light, the campfire catches and roughnecks from other rigs walk in
// with their rig numbers over their heads. It ends on THE VILLAGE, under
// construction. Nothing here is live yet, so the copy only says it is coming.

export const VILLAGE_SECONDS = 14;
export const VILLAGE_STILL = 790;

const WIPE = 200;
const OPEN = 222;
const DECK = 700;
const SEA = 790;

type House = { x: number; w: number; h: number; wall: string; roof: string };
const HOUSES: House[] = [
  { x: 120, w: 260, h: 200, wall: C.red, roof: C.redDeep },
  { x: 430, w: 220, h: 250, wall: C.sea, roof: C.seaDeep },
  { x: 1230, w: 240, h: 230, wall: C.leaf, roof: "#0d6b46" },
  { x: 1520, w: 280, h: 190, wall: C.sunDeep, roof: "#c9821a" },
];

const CREW = [
  { from: -140, to: 700, hat: C.hat, light: C.hatLight, tag: "#0007", at: 40 },
  { from: -140, to: 820, hat: C.red, light: C.redLight, tag: "#1888", at: 75 },
  { from: 2060, to: 1080, hat: C.leaf, light: "#6fd6a4", tag: "#0613", at: 55 },
  { from: 2060, to: 1190, hat: C.sea, light: C.foam, tag: "#2901", at: 95 },
  { from: -140, to: 580, hat: C.sun, light: C.sunPale, tag: "#0333", at: 120 },
  { from: 2060, to: 1300, hat: C.white, light: C.steelLight, tag: "#1204", at: 140 },
];

const CHAT = [
  { who: 4, text: "gm crew", at: 215 },
  { who: 3, text: "nice haul!", at: 245 },
  { who: 1, text: "crew up?", at: 285 },
  { who: 5, text: "storm tips?", at: 315 },
];

export function Village() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.stormSky, overflow: "hidden" }}>
      {frame < OPEN + 4 ? <Blueprint frame={frame} /> : <Harbor frame={frame} v={frame - OPEN} />}
      <PixelWipe frame={frame} start={WIPE} color={C.sun} size={120} />
    </AbsoluteFill>
  );
}

/* ---------------- scene 1: the plan ---------------- */

const PLAN = [
  { x: 180, y: 520, w: 300, h: 220, label: "Houses", at: 30 },
  { x: 560, y: 470, w: 260, h: 270, label: "Houses", at: 45 },
  { x: 880, y: 600, w: 220, h: 140, label: "Square", at: 70 },
  { x: 1160, y: 500, w: 280, h: 240, label: "Market", at: 90 },
  { x: 1500, y: 560, w: 260, h: 180, label: "Noticeboard", at: 110 },
];

function Blueprint({ frame }: { frame: number }) {
  const line = "#cfe6ff";
  const deck = ramp(frame, 15, 50);
  const stamp = ramp(frame, 150, 14, pop);
  return (
    <AbsoluteFill style={{ background: C.seaDeep }}>
      {/* grid paper */}
      {Array.from({ length: 49 }, (_, i) => (
        <div key={`v${i}`} style={{ position: "absolute", left: i * 40, top: 0, width: i % 4 ? 2 : 4, height: 1080, background: "rgba(207, 230, 255, 0.16)" }} />
      ))}
      {Array.from({ length: 28 }, (_, i) => (
        <div key={`h${i}`} style={{ position: "absolute", left: 0, top: i * 40, width: 1920, height: i % 4 ? 2 : 4, background: "rgba(207, 230, 255, 0.16)" }} />
      ))}

      <div style={{ position: "absolute", left: 96, top: 80, fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: line, letterSpacing: 6 }}>
        Project file · {typed("Barrel Royale", frame, 4, 30)}
      </div>
      <Title size={110} color={C.white} style={{ position: "absolute", left: 96, top: 140, textShadow: "none", fontFamily: font.logo }}>
        {typed("The Village", frame, 20, 16)}
      </Title>
      <div style={{ position: "absolute", left: 100, top: 280, fontFamily: font.display, fontWeight: 700, fontSize: 38, color: line, opacity: ramp(frame, 60, 20) }}>
        One home port for every rig
      </div>

      {/* the boardwalk line, drawn left to right */}
      <div style={{ position: "absolute", left: 120, top: 760, width: snap(1680 * deck, 8), height: 8, background: line }} />
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: 160 + i * 140, top: 768, width: 6, height: snap(90 * ramp(frame, 40 + i * 3, 20), 6), background: line }} />
      ))}

      {PLAN.map((p) => {
        const k = ramp(frame, p.at, 28);
        return (
          <div key={p.x}>
            {/* outline drawn edge by edge */}
            <div style={{ position: "absolute", left: p.x, top: p.y + p.h, width: p.w * Math.min(1, k * 4), height: 6, background: line }} />
            <div style={{ position: "absolute", left: p.x, top: p.y + p.h - p.h * Math.max(0, Math.min(1, k * 4 - 1)), width: 6, height: p.h * Math.max(0, Math.min(1, k * 4 - 1)), background: line }} />
            <div style={{ position: "absolute", left: p.x, top: p.y, width: p.w * Math.max(0, Math.min(1, k * 4 - 2)), height: 6, background: line }} />
            <div style={{ position: "absolute", left: p.x + p.w - 6, top: p.y, width: 6, height: p.h * Math.max(0, Math.min(1, k * 4 - 3)), background: line }} />
            <div style={{ position: "absolute", left: p.x + 18, top: p.y + 18, fontFamily: font.logo, fontWeight: 700, fontSize: 24, color: line, opacity: k > 0.9 ? 1 : 0, letterSpacing: 2 }}>
              {p.label}
            </div>
          </div>
        );
      })}
      {/* a dimension arrow over the square */}
      <div style={{ position: "absolute", left: 880, top: 560, width: 220, height: 4, background: C.sun, opacity: ramp(frame, 120, 10) }} />
      <div style={{ position: "absolute", left: 930, top: 518, fontFamily: font.display, fontWeight: 700, fontSize: 28, color: C.sun, opacity: ramp(frame, 120, 10) }}>
        all crews
      </div>

      {/* APPROVED stamp */}
      <div
        style={{
          position: "absolute",
          left: 1290,
          top: 130,
          rotate: "-9deg",
          scale: String(interpolate(stamp, [0, 1], [2.4, 1])),
          opacity: frame >= 150 ? 1 : 0,
          padding: "14px 30px",
          border: `10px solid ${C.red}`,
          color: C.red,
          fontFamily: font.logo,
          fontWeight: 700,
          fontSize: 76,
          letterSpacing: 8,
          background: "rgba(255,255,255,0.92)",
        }}
      >
        Approved
      </div>
    </AbsoluteFill>
  );
}

/* ---------------- scene 2: the harbor at dusk ---------------- */

function Harbor({ frame, v }: { frame: number; v: number }) {
  const title = ramp(frame, 600, 26, pop);
  const dim = ramp(frame, 590, 30);
  const wave = Math.floor(frame / 6) % 48;
  return (
    <AbsoluteFill>
      {/* dusk sky in bands, warm at the horizon */}
      {[C.stormSky, C.storm, "#5b4f86", "#a8607a", "#e8894a", C.sunDeep].map((c, i) => (
        <div key={c} style={{ position: "absolute", left: 0, top: i * 120, width: 1920, height: 120, background: c }} />
      ))}
      <Stars frame={frame} count={50} h={320} seed="village" />
      {/* the sun going down behind the square, in pixel steps */}
      {[
        [96, 0],
        [156, 24],
        [204, 48],
        [228, 72],
        [240, 96],
      ].map(([w, y]) => (
        <div key={y} style={{ position: "absolute", left: 960 - w / 2, top: 584 + y, width: w, height: 24, background: C.sun }} />
      ))}

      {/* rigs on the horizon on both sides */}
      <Spr rows={distantRig} palette={{ X: C.ink }} scale={12} x={40} y={612} />
      <Spr rows={distantRig} palette={{ X: C.ink }} scale={9} x={1790} y={639} />

      {/* the sea */}
      <div style={{ position: "absolute", left: 0, top: 720, width: 1920, height: 360, background: C.seaDeep }} />
      {Array.from({ length: 22 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: ((i * 173 + wave * 4) % 2000) - 60, top: 800 + (i % 5) * 52, width: 72 + (i % 3) * 24, height: 6, background: C.foam, opacity: 0.6 }} />
      ))}

      {/* the boardwalk on stilts */}
      {Array.from({ length: 16 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: 40 + i * 124, top: DECK + 30, width: 24, height: 130, background: C.woodDark }} />
      ))}
      <div style={{ position: "absolute", left: 0, top: DECK, width: 1920, height: 36, background: C.wood, boxShadow: `0 -6px 0 0 ${C.ink}, 0 6px 0 0 ${C.ink}` }} />
      {Array.from({ length: 40 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: i * 48, top: DECK + 6, width: 4, height: 24, background: C.woodDark }} />
      ))}

      {HOUSES.map((h, i) => (
        <HouseBuild key={h.x} house={h} v={v} i={i} frame={frame} />
      ))}

      {/* lantern string across the square */}
      {Array.from({ length: 14 }, (_, i) => {
        const x = 660 + i * 46;
        const sag = Math.round(Math.sin((i / 13) * Math.PI) * 40);
        const lit = v > 170 + i * 4;
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: x, top: 470 + sag, width: 46, height: 4, background: C.ink }} />
            <div style={{ position: "absolute", left: x + 16, top: 476 + sag, width: 14, height: 18, background: lit ? (i % 3 === 0 ? C.red : i % 3 === 1 ? C.sun : C.leaf) : C.steelDeep, boxShadow: lit ? `0 0 0 4px ${C.ink}, 0 0 24px 6px rgba(255, 213, 74, 0.45)` : `0 0 0 4px ${C.ink}` }} />
          </div>
        );
      })}

      {/* noticeboard */}
      <div style={{ position: "absolute", left: 1050, top: DECK - 170, opacity: ramp(v, 120, 16) }}>
        <div style={{ position: "absolute", left: 20, top: 120, width: 12, height: 52, background: C.woodDark }} />
        <div style={{ position: "absolute", left: 128, top: 120, width: 12, height: 52, background: C.woodDark }} />
        <div style={{ width: 160, height: 120, background: C.wood, boxShadow: ring(5) }}>
          <div style={{ position: "absolute", left: 14, top: 14, width: 64, height: 46, background: C.white, rotate: "-4deg" }} />
          <div style={{ position: "absolute", left: 86, top: 22, width: 58, height: 70, background: C.sunPale, rotate: "5deg" }} />
          <div style={{ position: "absolute", left: 18, top: 66, width: 56, height: 40, background: C.redLight, rotate: "3deg" }} />
        </div>
      </div>

      {/* campfire in the square */}
      {v > 150 && (
        <div style={{ position: "absolute", left: 930, top: DECK - 78 }}>
          <Spr rows={Math.floor(frame / 7) % 2 ? flameB : flameA} palette={flamePalette} scale={6} x={0} y={0} />
        </div>
      )}
      <div style={{ position: "absolute", left: 914, top: DECK - 14, width: 92, height: 14, background: C.woodDark, boxShadow: `0 0 0 4px ${C.ink}` }} />

      {CREW.map((c, i) => (
        <Walker key={c.tag} c={c} v={v} frame={frame} i={i} tags={1 - dim} />
      ))}

      {CHAT.map((m) => {
        const c = CREW[m.who];
        const k = ramp(v, m.at, 12, pop);
        const gone = ramp(v, m.at + 60, 8);
        if (v < m.at || gone >= 1) return null;
        return (
          <div key={m.text} style={{ position: "absolute", left: c.to - 30, top: DECK - 300, scale: String(k), opacity: (1 - gone) * (1 - dim), transformOrigin: "30% 100%" }}>
            <Chip size={30} bg={C.white}>
              {m.text}
            </Chip>
          </div>
        );
      })}

      {/* the closing card */}
      <div style={{ position: "absolute", inset: 0, background: C.ink, opacity: dim * 0.55 }} />
      {frame >= 600 && (
        <div style={{ position: "absolute", left: 0, top: 120, width: 1920, display: "flex", flexDirection: "column", alignItems: "center", gap: 26, scale: String(interpolate(title, [0, 1], [0.6, 1])), opacity: Math.min(1, title * 1.5) }}>
          <Title size={190} color={C.sun}>
            The Village
          </Title>
          <Title size={64} color={C.white} family={font.display}>
            Every rig. One home port.
          </Title>
          <Hazard frame={frame} />
        </div>
      )}
      {frame >= 620 && (
        <div style={{ position: "absolute", left: 0, bottom: 54, width: 1920, display: "flex", justifyContent: "center", alignItems: "center", gap: 22, opacity: ramp(frame, 620, 20) }}>
          <Spr rows={logo} palette={logoPalette} scale={3} style={{ boxShadow: ring(4, C.sun) }} />
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 34, color: C.sun, letterSpacing: 3, textShadow: `0 4px 0 ${C.ink}` }}>barrelroyale.io · @barrelroyale</span>
        </div>
      )}
    </AbsoluteFill>
  );
}

/** A house going up: scaffold, walls rising, the roof lowered by the crane, then lit windows. */
function HouseBuild({ house: h, v, i, frame }: { house: House; v: number; i: number; frame: number }) {
  const t0 = 8 + i * 28;
  const scaffold = ramp(v, t0, 10);
  const wall = ramp(v, t0 + 10, 40);
  const roofDrop = ramp(v, t0 + 50, 22);
  const done = ramp(v, t0 + 72, 1);
  const top = DECK - h.h;
  const wallH = snap(h.h * wall, 6);
  const steps = 5;
  const roofY = interpolate(roofDrop, [0, 1], [-260, 0]);
  const scaffoldGone = ramp(v, t0 + 90, 16);
  return (
    <div>
      {/* scaffold */}
      <div style={{ opacity: scaffold * (1 - scaffoldGone) }}>
        {[h.x - 24, h.x + h.w + 12].map((x) => (
          <div key={x} style={{ position: "absolute", left: x, top: top - 40, width: 12, height: h.h + 40, background: C.steelDeep }} />
        ))}
        {[0, 1, 2].map((r) => (
          <div key={r} style={{ position: "absolute", left: h.x - 24, top: top - 40 + r * ((h.h + 40) / 3), width: h.w + 48, height: 10, background: C.steel }} />
        ))}
      </div>
      {/* walls, rising from the deck */}
      <div style={{ position: "absolute", left: h.x, top: DECK - wallH, width: h.w, height: wallH, background: h.wall, boxShadow: `0 0 0 6px ${C.ink}` }}>
        {wall >= 1 &&
          [0, 1].map((r) =>
            [0, 1].map((c) => {
              const lit = v > t0 + 80 + (r * 2 + c) * 6;
              const flick = lit && (frame + i * 31 + r * 13 + c * 7) % 220 < 6;
              return (
                <div
                  key={`${r}${c}`}
                  style={{
                    position: "absolute",
                    left: 28 + c * (h.w - 112),
                    top: 30 + r * 74,
                    width: 56,
                    height: 48,
                    background: lit && !flick ? C.sun : C.stormSky,
                    boxShadow: `0 0 0 6px ${C.ink}${lit ? ", 0 0 30px 8px rgba(255, 213, 74, 0.5)" : ""}`,
                  }}
                />
              );
            }),
          )}
        {wall >= 1 && <div style={{ position: "absolute", left: h.w / 2 - 28, bottom: 0, width: 56, height: 84, background: C.woodDark, boxShadow: `0 0 0 6px ${C.ink}` }} />}
      </div>
      {/* the stepped roof, lowered from above */}
      {v > t0 + 50 &&
        Array.from({ length: steps }, (_, s) => {
          const w = h.w + 40 - s * ((h.w + 40) / steps);
          return (
            <div
              key={s}
              style={{
                position: "absolute",
                left: h.x - 20 + (h.w + 40 - w) / 2,
                top: top - 6 - (s + 1) * 22 + roofY,
                width: w,
                height: 22,
                background: s % 2 ? h.roof : h.wall,
                boxShadow: `0 0 0 6px ${C.ink}`,
                filter: "brightness(0.85)",
              }}
            />
          );
        })}
      {/* the crane cable while the roof comes down */}
      {roofDrop > 0 && roofDrop < 1 && <div style={{ position: "absolute", left: h.x + h.w / 2 - 3, top: 0, width: 6, height: Math.max(0, top - 6 - steps * 22 + roofY), background: C.ink }} />}
      {done > 0 && v < t0 + 110 && (
        <div style={{ position: "absolute", left: h.x + h.w / 2 - 70, top: top - 190, opacity: 1 - ramp(v, t0 + 96, 14) }}>
          <Chip size={26} bg={C.leaf} color={C.white}>
            Built
          </Chip>
        </div>
      )}
    </div>
  );
}

/** A roughneck from another rig walking to the square, rig number overhead. */
function Walker({ c, v, frame, i, tags }: { c: (typeof CREW)[number]; v: number; frame: number; i: number; tags: number }) {
  const k = ramp(v, c.at, 170, (x) => x);
  if (v < c.at) return null;
  const x = interpolate(k, [0, 1], [c.from, c.to]);
  const moving = k < 1;
  const step = moving ? (Math.floor((frame + i * 5) / 8) % 2) * 6 : 0;
  const left = c.from > c.to;
  return (
    <div style={{ position: "absolute", left: snap(x - 48, 6), top: DECK - 114 - step }}>
      <div style={{ transform: left ? "scaleX(-1)" : undefined }}>
        <Spr rows={roughneck} palette={{ ...base, H: c.hat, E: c.light, h: c.hat }} scale={6} />
      </div>
      <div style={{ position: "absolute", left: 48, top: i % 2 ? -100 : -56, transform: "translateX(-50%)", opacity: tags }}>
        <div style={{ padding: "4px 10px", background: C.ink, color: C.sunPale, fontFamily: font.logo, fontWeight: 700, fontSize: 17, whiteSpace: "nowrap", letterSpacing: 1 }}>{c.tag}</div>
      </div>
    </div>
  );
}

/** A hazard-striped "under construction" bar. */
function Hazard({ frame }: { frame: number }) {
  const shift = (frame * 2) % 56;
  return (
    <div style={{ position: "relative", width: 1240, height: 96, boxShadow: ring(8), overflow: "hidden", background: C.sun }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          left: -56 + shift,
          width: 1360,
          background: `repeating-linear-gradient(-45deg, ${C.ink} 0 28px, ${C.sun} 28px 56px)`,
          opacity: 0.9,
        }}
      />
      <div style={{ position: "absolute", left: 120, right: 120, top: 14, bottom: 14, background: C.white, boxShadow: `0 0 0 6px ${C.ink}`, display: "grid", placeItems: "center" }}>
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 34, color: C.ink, letterSpacing: 3, whiteSpace: "nowrap" }}>Under construction · Coming soon</span>
      </div>
    </div>
  );
}
