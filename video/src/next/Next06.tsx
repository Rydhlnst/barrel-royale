import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { base, icons, logo, logoPalette, roughneck } from "@/components/pixel/sprites";
import { C, Chip, ease, font, ring, Spr, Title } from "../brand";

// next06, rig levels 6–8: a storage tank built ring by ring on a blueprint, a crane hook lowering each
// level's ring while the bbl gauge climbs to 540 and a staircase of coin costs shoots up beside it.
// Oil then floods the tank and the screen, and drains to reveal the real upgrade panel going to level 8.

export const NEXT06_SECONDS = 16;

const LEVELS = [
  { storage: 60, cost: 0 },
  { storage: 100, cost: 250 },
  { storage: 140, cost: 1_100 },
  { storage: 180, cost: 4_500 },
  { storage: 240, cost: 15_000 },
  { storage: 320, cost: 40_000 },
  { storage: 420, cost: 90_000 },
  { storage: 540, cost: 180_000 },
];
const PX_PER_BBL = 1.32;
const TANK = { x: 330, w: 440, base: 960 };
// when each ring lands: the first five quickly, the new three slowly
const LAND = [0.9, 1.3, 1.7, 2.1, 2.5, 3.6, 5.0, 6.4].map((s) => Math.round(s * 60));
const FLOOD = Math.round(8.3 * 60);
const REVEAL = Math.round(9.1 * 60);
const END = Math.round(13.8 * 60);
const fmt = (n: number) => n.toLocaleString("en-US");
/** Where the recording plays: the full 16:9 frame, scaled down. */
const W = { x: 640, y: 110, w: 1200, h: 675 };

const ringTop = (i: number) => TANK.base - LEVELS[i].storage * PX_PER_BBL;

function Tank({ frame, fps }: { frame: number; fps: number }) {
  const n = LAND.filter((t) => frame >= t).length;
  return (
    <>
      {/* the pad it stands on */}
      <div style={{ position: "absolute", left: TANK.x - 50, top: TANK.base, width: TANK.w + 100, height: 24, background: C.steelDeep, boxShadow: ring(5) }} />
      {LEVELS.map((l, i) => {
        const land = LAND[i];
        if (frame < land - 40) return null;
        const prev = i ? LEVELS[i - 1].storage : 0;
        const h = (l.storage - prev) * PX_PER_BBL;
        const top = ringTop(i);
        const drop = interpolate(frame, [land - 40, land], [-420, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
        const fresh = i >= 5;
        const bounce = spring({ frame: frame - land, fps, config: { damping: 9, stiffness: 260 } });
        const band = fresh ? C.red : i % 2 ? C.steelLight : C.white;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: TANK.x,
              top: top + drop,
              width: TANK.w,
              height: h,
              boxSizing: "border-box",
              border: `6px solid ${C.ink}`,
              borderBottom: i === 0 ? `6px solid ${C.ink}` : "none",
              background: `linear-gradient(90deg, ${band} 0 18%, ${C.white} 18% 38%, ${band} 38% 100%)`,
            }}
          >
            {[0.25, 0.75].map((x) => (
              <div key={x} style={{ position: "absolute", left: `${x * 100}%`, top: 8, width: 8, height: 8, background: C.ink }} />
            ))}
            <div
              style={{
                position: "absolute",
                right: -150,
                top: h / 2 - 20,
                display: "flex",
                alignItems: "center",
                gap: 10,
                opacity: frame >= land ? 1 : 0,
                scale: String(frame >= land ? 0.6 + 0.4 * bounce : 0),
                transformOrigin: "0 50%",
              }}
            >
              <div style={{ width: 24, height: 6, background: C.ink }} />
              <Chip bg={fresh ? C.red : C.white} color={fresh ? C.white : C.ink} size={20}>
                <span style={{ fontFamily: font.logo }}>Lv {i + 1}</span>
              </Chip>
            </div>
          </div>
        );
      })}
      {n > 0 && <div style={{ position: "absolute", left: TANK.x - 10, top: ringTop(n - 1) - 30, width: TANK.w + 20, height: 36, background: C.steel, boxShadow: ring(6), borderRadius: "40px 40px 0 0" }} />}
    </>
  );
}

function Crane({ frame }: { frame: number }) {
  // the hook rides down with each ring and back up
  const i = LAND.findIndex((t) => frame < t + 20);
  if (i < 0) return null;
  const land = LAND[i];
  const top = ringTop(i);
  const y = interpolate(frame, [land - 40, land, land + 20], [-420 + top, top, top - 160], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const x = TANK.x + TANK.w / 2;
  return (
    <>
      <div style={{ position: "absolute", left: x - 3, top: 0, width: 6, height: Math.max(0, y - 10), background: C.ink }} />
      <div style={{ position: "absolute", left: x - 22, top: y - 26, width: 44, height: 22, background: C.sun, boxShadow: ring(5) }} />
    </>
  );
}

function Gauge({ frame }: { frame: number }) {
  const n = LAND.filter((t) => frame >= t).length;
  const target = n ? LEVELS[n - 1].storage : 0;
  const prevT = n > 1 ? LEVELS[n - 2].storage : 0;
  const since = n ? frame - LAND[n - 1] : 0;
  const shown = Math.round(interpolate(since, [0, 14], [prevT, target], { extrapolateRight: "clamp" }));
  return (
    <div style={{ position: "absolute", left: 80, top: 60, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
      <Chip bg={C.ink} color={C.sun} size={24}>
        <span style={{ fontFamily: font.logo }}>Rig storage</span>
      </Chip>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
        <Title size={110} color={n >= 6 ? C.red : C.sun}>
          {shown}
        </Title>
        <Title size={46}>bbl</Title>
      </div>
    </div>
  );
}

/** The planning board: one coin column per level, steeply taller each time. */
function Costs({ frame, fps }: { frame: number; fps: number }) {
  const max = Math.log10(LEVELS[7].cost);
  return (
    <div style={{ position: "absolute", left: 1090, top: 170, width: 740, height: 760, background: C.white, boxShadow: `${ring(8)}, 0 0 0 14px ${C.sunPale}, 0 0 0 20px ${C.ink}` }}>
      <div style={{ position: "absolute", left: 30, top: 24, fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.ink }}>Upgrade costs</div>
      <div style={{ position: "absolute", left: 30, top: 66, fontFamily: font.display, fontWeight: 700, fontSize: 26, color: C.ink2 }}>Every level takes more planning</div>
      <div style={{ position: "absolute", left: 30, right: 30, bottom: 70, height: 4, background: C.ink }} />
      {LEVELS.slice(1).map((l, k) => {
        const i = k + 1;
        const at = LAND[i];
        const grow = frame >= at ? spring({ frame: frame - at, fps, config: { damping: 14, stiffness: 120 } }) : 0;
        const h = (Math.log10(l.cost) / max) * 470 * grow;
        const fresh = i >= 5;
        const x = 40 + k * 98;
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: x, bottom: 74, width: 70, height: h, background: fresh ? C.red : C.sun, boxShadow: ring(5), overflow: "hidden" }}>
              {Array.from({ length: Math.max(0, Math.floor(h / 22)) }, (_, j) => (
                <div key={j} style={{ position: "absolute", left: 6, right: 6, bottom: 6 + j * 22, height: 4, background: fresh ? C.redDeep : C.sunDeep }} />
              ))}
            </div>
            {frame >= at && (
              <div style={{ position: "absolute", left: x - 25, width: 120, bottom: 84 + h, textAlign: "center", fontFamily: font.display, fontWeight: 700, fontSize: fresh ? 24 : 20, color: fresh ? C.red : C.ink, opacity: grow }}>
                {fmt(l.cost)}
              </div>
            )}
            <div style={{ position: "absolute", left: x - 10, width: 90, bottom: 30, textAlign: "center", fontFamily: font.logo, fontSize: 20, color: C.ink }}>Lv {i + 1}</div>
          </div>
        );
      })}
      <div style={{ position: "absolute", right: 30, top: 26 }}>
        <Spr rows={icons.coin} palette={base} scale={4} />
      </div>
    </div>
  );
}

export function Next06() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // the flood: oil rises over everything, then drains away downward
  const rise = interpolate(frame, [FLOOD, REVEAL], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const drain = interpolate(frame, [REVEAL, REVEAL + 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const showFootage = frame >= REVEAL;
  const wobble = (x: number) => Math.round(Math.sin(x / 90 + frame / 6) * 14);
  const panel = spring({ frame: frame - REVEAL, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill style={{ background: "#dfeefc", overflow: "hidden" }}>
      {!showFootage && (
        <>
          {/* blueprint grid */}
          <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(26,115,217,0.16) 2px, transparent 2px), linear-gradient(90deg, rgba(26,115,217,0.16) 2px, transparent 2px)", backgroundSize: "48px 48px" }} />
          <Crane frame={frame} />
          <Tank frame={frame} fps={fps} />
          <Gauge frame={frame} />
          <Costs frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 60, top: TANK.base - 133 }}>
            <Spr rows={roughneck} palette={base} scale={7} />
          </div>
          {frame >= LAND[5] - 10 && (
            <div style={{ position: "absolute", left: 1090, top: 70, scale: String(spring({ frame: frame - LAND[5] + 10, fps, config: { damping: 9 } })), transformOrigin: "0 50%" }}>
              <Chip bg={C.red} color={C.white} size={30}>
                <span style={{ fontFamily: font.logo }}>New: levels 6, 7 and 8</span>
              </Chip>
            </div>
          )}
        </>
      )}

      {showFootage && frame < END && (
        <AbsoluteFill style={{ background: C.ink }}>
          <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(255,213,74,0.12) 2px, transparent 2px)", backgroundSize: "36px 36px" }} />
          {/* the real game, the whole frame scaled down so the HUD stays in view */}
          <div style={{ position: "absolute", left: W.x, top: W.y, width: W.w, height: W.h, overflow: "hidden", background: C.white, boxShadow: `${ring(8)}, 0 0 0 16px ${C.steelDeep}, 0 0 0 22px ${C.ink}`, scale: String(0.9 + 0.1 * panel) }}>
            <Sequence from={REVEAL} layout="none">
              <OffthreadVideo src={staticFile("footage/levels.mp4")} muted trimBefore={Math.round(13.9 * 60)} style={{ position: "absolute", left: 0, top: 0, width: W.w, height: W.h }} />
            </Sequence>
          </div>
          <div style={{ position: "absolute", left: 70, top: 300, width: 500, display: "flex", flexDirection: "column", gap: 18, opacity: panel }}>
            <Title size={72} color={C.sun}>
              Plan it
            </Title>
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 34, color: C.white, lineHeight: 1.3 }}>Every level up takes more coins. Level 8 holds 540 bbl.</div>
          </div>
          <div style={{ position: "absolute", left: W.x, top: W.y + W.h + 50, width: W.w, display: "flex", justifyContent: "center", gap: 26 }}>
            {[6, 7, 8].map((lv, k) => (
              <div
                key={lv}
                style={{
                  display: "flex",
                  gap: 26,
                  padding: "12px 22px",
                  background: C.white,
                  boxShadow: ring(5),
                  fontFamily: font.display,
                  fontWeight: 700,
                  fontSize: 32,
                  color: C.ink,
                  translate: `0 ${(1 - spring({ frame: frame - REVEAL - 10 - k * 8, fps, config: { damping: 12 } })) * 300}px`,
                }}
              >
                <span>Lv {lv}</span>
                <span style={{ color: C.red }}>{LEVELS[lv - 1].storage} bbl</span>
              </div>
            ))}
          </div>
        </AbsoluteFill>
      )}

      {/* the oil flood between the two halves */}
      {rise > 0 && drain < 1 && (
        <div style={{ position: "absolute", left: 0, width: 1920, top: 1080 - rise * 1140 + drain * 1260, height: 1200, background: C.oil, zIndex: 50 }}>
          <div style={{ position: "absolute", left: 0, top: -30, width: 1920, height: 30, display: "flex", alignItems: "flex-end" }}>
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} style={{ width: 80, height: 16 + wobble(i * 80), background: C.oil }} />
            ))}
          </div>
          <div style={{ position: "absolute", left: 0, top: 10, width: 1920, height: 8, background: C.oilShine, opacity: 0.6 }} />
        </div>
      )}

      {frame >= END && (
        <AbsoluteFill style={{ background: C.sun, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 24 }}>
          <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(30,42,74,0.08) 2px, transparent 2px), linear-gradient(90deg, rgba(30,42,74,0.08) 2px, transparent 2px)", backgroundSize: "48px 48px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 24, scale: String(spring({ frame: frame - END, fps, config: { damping: 10 } })) }}>
            <Spr rows={logo} palette={logoPalette} scale={5} style={{ boxShadow: ring(6) }} />
            <Title size={110}>540 bbl</Title>
          </div>
          <Title size={58} color={C.white}>
            Rig levels 6 to 8 are live
          </Title>
          <div style={{ display: "flex", gap: 20, marginTop: 10, scale: String(spring({ frame: frame - END - 12, fps, config: { damping: 11 } })) }}>
            <Chip bg={C.white} size={40}>
              <span style={{ fontFamily: font.logo }}>barrelroyale.io/play</span>
            </Chip>
            <Chip bg={C.ink} color={C.sun} size={40}>
              <span style={{ fontFamily: font.logo }}>@barrelroyale</span>
            </Chip>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}
