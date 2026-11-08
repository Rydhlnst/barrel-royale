import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { logo, logoPalette } from "@/components/pixel/sprites";
import { C, Chip, ease, font, ring, Spr, Title } from "../brand";
import { PHASES, currentPhase } from "./roadmap-data";

// The roadmap update as a cargo run: a crane loads one crate per shipped item of the
// current phase onto a tanker while the manifest on the left ticks them off. Crates for
// items new in this update are red, and each opens a screen with real footage of it.
// Then the tanker sails and what's next takes its place. Items come from roadmap-data.ts.

export const ROADMAP_SHIP_SECONDS = 19;

/** Short crate labels for the phase's items, in the same order. */
const SHORT = ["Contracts live", "XOM vault running", "Addresses in docs", "Whitelist snapshot", "$ROYAL live", "Game open to holders", "Play on your phone", "Rig levels 6-8", "Royal Harbor", "Rig mint"];

/** Items new in this update, with the footage their screen plays. */
const FRESH: Record<string, { src: string; from: number; phone?: boolean; crop?: { x: number; y: number; w: number } }> = {
  "Royal Harbor": { src: "village", from: 7.0 },
};

const phase = PHASES[currentPhase()];
const ITEMS = phase.items.map((it, i) => ({ ...it, short: SHORT[i] ?? it.text }));
const SHIPPED = ITEMS.filter((it) => it.ok);
const PENDING = ITEMS.filter((it) => !it.ok);

// crate drops: plain ones quickly, fresh ones with time for their screen
const DROPS = (() => {
  let t = 1.6;
  return SHIPPED.map((it) => {
    const at = t;
    t += FRESH[it.short] ? 3.6 : 0.9;
    return { ...it, at, fresh: Boolean(FRESH[it.short]) };
  });
})();
const LOADED = DROPS[DROPS.length - 1].at + 1.2;
const SAIL = Math.max(LOADED + 0.8, 14.6);

// crate spots on deck: four on the bottom row, three on top
const CRATE = { w: 190, h: 110 };
const DECK_Y = 760;
const SPOTS = [0, 1, 2, 3].map((i) => ({ x: 1040 + i * 200, y: DECK_Y - CRATE.h })).concat([0, 1, 2, 3].map((i) => ({ x: 1040 + i * 200, y: DECK_Y - 2 * CRATE.h })));

const s2f = (s: number, fps: number) => Math.round(s * fps);

function Crate({ label, fresh, stamp }: { label: string; fresh: boolean; stamp: number }) {
  return (
    <div style={{ position: "relative", width: CRATE.w, height: CRATE.h, background: fresh ? C.red : "#a8692e", boxShadow: ring(5) }}>
      {[0.33, 0.66].map((y) => (
        <div key={y} style={{ position: "absolute", left: 0, right: 0, top: CRATE.h * y, height: 4, background: fresh ? "#b8322a" : "#7c4a1e" }} />
      ))}
      <div style={{ position: "absolute", left: 12, right: 12, top: 26, padding: "6px 4px", background: C.white, boxShadow: ring(3), textAlign: "center", fontFamily: font.display, fontWeight: 700, fontSize: 20, lineHeight: 1.05, color: C.ink }}>{label}</div>
      {fresh && (
        <div style={{ position: "absolute", right: -10, top: -16 }}>
          <Chip bg={C.sun} size={16}>
            <span style={{ fontFamily: font.logo }}>New</span>
          </Chip>
        </div>
      )}
      {stamp > 0 && (
        <div style={{ position: "absolute", left: 10, bottom: -14, rotate: "-6deg", scale: String(stamp), padding: "2px 10px", background: C.leaf, boxShadow: ring(3), fontFamily: font.logo, fontSize: 15, color: C.white, letterSpacing: 1 }}>Shipped</div>
      )}
    </div>
  );
}

function Screen({ fresh, start, fps, frame }: { fresh: (typeof FRESH)[string]; start: number; fps: number; frame: number }) {
  const IN = s2f(start, fps);
  const OUT = IN + s2f(2.7, fps);
  if (frame < IN || frame > OUT) return null;
  const pop = spring({ frame: frame - IN, fps, config: { damping: 12, stiffness: 200 } });
  const out = interpolate(frame, [OUT - 10, OUT], [1, 0], { extrapolateLeft: "clamp" });
  const box = fresh.phone ? { w: 194, h: 420 } : { w: 576, h: 324 };
  const k = fresh.crop ? box.w / fresh.crop.w : box.w / 1920;
  return (
    <div style={{ position: "absolute", left: 1380 - box.w / 2, top: 110, scale: String(pop * out), transformOrigin: "50% 100%" }}>
      <div style={{ padding: fresh.phone ? 14 : 10, background: C.ink, boxShadow: `${ring(6)}, 0 0 0 12px ${C.sun}, 0 0 0 17px ${C.ink}`, borderRadius: fresh.phone ? 6 : 0 }}>
        <div style={{ position: "relative", width: box.w, height: box.h, overflow: "hidden", background: C.white }}>
          <Sequence from={IN} durationInFrames={OUT - IN} layout="none">
            {fresh.crop ? (
              <OffthreadVideo src={staticFile(`footage/${fresh.src}.mp4`)} muted trimBefore={s2f(fresh.from, fps)} style={{ position: "absolute", left: -fresh.crop.x * k, top: -fresh.crop.y * k, width: 1920 * k, height: 1080 * k }} />
            ) : (
              <OffthreadVideo src={staticFile(`footage/${fresh.src}.mp4`)} muted trimBefore={s2f(fresh.from, fps)} style={{ width: box.w, height: box.h, display: "block" }} />
            )}
          </Sequence>
        </div>
      </div>
      <div style={{ position: "absolute", left: "50%", bottom: -30, width: 0, height: 0, translate: "-50% 0", borderLeft: "16px solid transparent", borderRight: "16px solid transparent", borderTop: `20px solid ${C.ink}` }} />
    </div>
  );
}

function Manifest({ frame, fps }: { frame: number; fps: number }) {
  const t = frame / fps;
  const landed = (short: string) => {
    const d = DROPS.find((x) => x.short === short);
    return d ? t >= d.at + 0.75 : false;
  };
  const count = DROPS.filter((d) => t >= d.at + 0.75).length;
  const done = t >= LOADED;
  const big = spring({ frame: frame - s2f(LOADED, fps), fps, config: { damping: 9, stiffness: 200 } });
  return (
    <div style={{ position: "absolute", left: 70, top: 120, width: 740, height: 900, background: "#8a5a2b", boxShadow: ring(7), rotate: "-1.5deg" }}>
      <div style={{ position: "absolute", left: 270, top: -26, width: 200, height: 52, background: C.steel, boxShadow: ring(5) }} />
      <div style={{ position: "absolute", left: 26, top: 40, right: 26, bottom: 26, background: "#fffaf0", boxShadow: ring(4), padding: "26px 30px", boxSizing: "border-box" }}>
        <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.ink, letterSpacing: 2 }}>Cargo manifest</div>
        <div style={{ marginTop: 6, fontFamily: font.display, fontWeight: 700, fontSize: 26, color: C.red }}>
          {phase.when} · {phase.title}
        </div>
        <div style={{ marginTop: 18, height: 4, background: C.ink }} />
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {ITEMS.map((it) => {
            const on = it.ok && landed(it.short);
            const fresh = Boolean(FRESH[it.short]);
            return (
              <div key={it.short} style={{ display: "flex", alignItems: "center", gap: 16, padding: "6px 8px", background: fresh && on ? "#ffe9a8" : "transparent" }}>
                <div style={{ flex: "none", width: 38, height: 38, display: "grid", placeItems: "center", background: on ? C.leaf : C.white, boxShadow: ring(3), fontFamily: font.logo, fontSize: 22, color: C.white }}>{on ? "✓" : ""}</div>
                <div style={{ flex: 1, fontFamily: font.display, fontWeight: 700, fontSize: 30, color: it.ok ? C.ink : C.ink2 }}>{it.short}</div>
                {fresh && on && (
                  <Chip bg={C.red} color={C.white} size={16}>
                    <span style={{ fontFamily: font.logo }}>New</span>
                  </Chip>
                )}
                {!it.ok && (
                  <Chip bg={C.sunPale} size={16}>
                    <span style={{ fontFamily: font.logo }}>Next</span>
                  </Chip>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 30, right: 30, bottom: 24, display: "flex", alignItems: "baseline", gap: 14 }}>
          <Title size={done ? 64 : 54} color={done ? C.leaf : C.ink} style={{ scale: String(done ? interpolate(big, [0, 1], [1.3, 1], { extrapolateRight: "clamp" }) : 1), transformOrigin: "0 100%" }}>
            {count}/{ITEMS.length}
          </Title>
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: C.ink, letterSpacing: 2 }}>shipped</span>
        </div>
      </div>
    </div>
  );
}

export function RoadmapShip() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const sail = interpolate(t, [SAIL, SAIL + 2.2], [0, 1300], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const bob = Math.round(Math.sin(frame / 22) * 4);
  // where the trolley is: over the crate being dropped, else parked at the right
  const live = DROPS.find((d) => t >= d.at - 0.45 && t < d.at + 0.9);
  const head = spring({ frame: frame - 4, fps, config: { damping: 12 } });
  const next = spring({ frame: frame - s2f(SAIL + 1.6, fps), fps, config: { damping: 11, stiffness: 180 } });

  return (
    <AbsoluteFill style={{ background: C.foam, overflow: "hidden" }}>
      {/* sky and sea */}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(${C.sunPale}, ${C.foam} 70%)` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 820, bottom: 0, background: C.sea }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 940, bottom: 0, background: C.seaDeep }} />
      {Array.from({ length: 14 }, (_, i) => (
        <div key={i} style={{ position: "absolute", top: 850 + (i % 4) * 50, left: ((i * 260 + frame * (1 + (i % 3))) % 2200) - 140, width: 70 + (i % 3) * 30, height: 6, background: C.foam, opacity: 0.6 }} />
      ))}

      {/* the tanker and its cargo */}
      <div style={{ position: "absolute", inset: 0, translate: `${sail}px ${bob}px` }}>
        <div style={{ position: "absolute", left: 960, top: DECK_Y, width: 940, height: 120, background: C.ink, clipPath: "polygon(0 0, 100% 0, 96% 100%, 3% 100%)" }} />
        <div style={{ position: "absolute", left: 960, top: DECK_Y + 6, width: 940, height: 26, background: C.red }} />
        <div style={{ position: "absolute", left: 1000, top: DECK_Y + 54, fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.sun, letterSpacing: 4 }}>ROYAL TANKER</div>
        <div style={{ position: "absolute", left: 970, top: DECK_Y - 200, width: 60, height: 200, background: C.white, boxShadow: ring(5) }}>
          {[30, 80, 130].map((y) => (
            <div key={y} style={{ position: "absolute", left: 14, top: y, width: 32, height: 22, background: C.sea, boxShadow: ring(3) }} />
          ))}
        </div>
        {DROPS.map((d, i) => {
          if (t < d.at - 0.45) return null;
          const spot = SPOTS[i];
          const x = interpolate(t, [d.at - 0.45, d.at], [1960, spot.x], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
          const drop = interpolate(t, [d.at, d.at + 0.75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (v) => v * v });
          const y = interpolate(drop, [0, 1], [130, spot.y]);
          const stamp = spring({ frame: frame - s2f(d.at + 0.8, fps), fps, config: { damping: 9, stiffness: 240 } });
          return (
            <div key={d.short} style={{ position: "absolute", left: x, top: y }}>
              <Crate label={d.short} fresh={d.fresh} stamp={t >= d.at + 0.8 ? stamp : 0} />
            </div>
          );
        })}
      </div>

      {/* the crane: a beam across the top, a trolley and its cable */}
      <div style={{ position: "absolute", left: 960, top: 70, width: 1000, height: 30, background: C.sun, boxShadow: ring(5) }} />
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: 980 + i * 82, top: 76, width: 6, height: 18, background: C.sunDeep, rotate: "35deg" }} />
      ))}
      {live && (() => {
        const i = DROPS.indexOf(live);
        const spot = SPOTS[i];
        const x = interpolate(t, [live.at - 0.45, live.at], [1960, spot.x], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }) + CRATE.w / 2;
        const drop = interpolate(t, [live.at, live.at + 0.75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (v) => v * v });
        const crateTop = t < live.at + 0.75 ? interpolate(drop, [0, 1], [130, spot.y]) : interpolate(t, [live.at + 0.75, live.at + 0.9], [spot.y, 110], { extrapolateRight: "clamp" });
        return (
          <>
            <div style={{ position: "absolute", left: x - 30, top: 96, width: 60, height: 26, background: C.ink }} />
            <div style={{ position: "absolute", left: x - 3, top: 120, width: 6, height: Math.max(0, crateTop - 120 + bob), background: C.ink }} />
          </>
        );
      })()}

      {/* footage for what's new */}
      {DROPS.filter((d) => d.fresh).map((d) => (
        <Screen key={d.short} fresh={FRESH[d.short]} start={d.at + 0.85} fps={fps} frame={frame} />
      ))}

      <Manifest frame={frame} fps={fps} />

      {/* the header */}
      <div style={{ position: "absolute", left: 70, top: 30, display: "flex", alignItems: "center", gap: 16, scale: String(head), transformOrigin: "0 50%" }}>
        <Spr rows={logo} palette={logoPalette} scale={2} style={{ boxShadow: ring(4) }} />
        <Chip bg={C.red} color={C.white} size={24}>
          <span style={{ fontFamily: font.logo }}>Roadmap update</span>
        </Chip>
      </div>

      {/* once the tanker sails: what's next */}
      {t >= SAIL + 1.6 && (
        <div style={{ position: "absolute", left: 960, top: 230, width: 880, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 22, scale: String(next), transformOrigin: "0 0" }}>
          <Title size={86}>Next load</Title>
          {PENDING.map((p) => (
            <div key={p.short} style={{ display: "flex", alignItems: "center", gap: 18, padding: "14px 24px", background: C.white, boxShadow: ring(5) }}>
              <div style={{ width: 22, height: 22, background: Math.floor(frame / 20) % 2 ? C.sun : C.sunDeep, boxShadow: ring(3) }} />
              <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 40, color: C.ink }}>{p.short}</span>
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <Chip bg={C.sun} size={34}>
              <span style={{ fontFamily: font.logo }}>barrelroyale.io/roadmap</span>
            </Chip>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}
