import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { base, logo, logoPalette, roughneck } from "@/components/pixel/sprites";
import { C, Chip, font, PixelWipe, ring, Spr, Sunburst, Title } from "../brand";

// Medals: a trophy cabinet. It opens empty, then the real game (footage/medals.mp4, shown whole so the HUD
// stays in view) plays beside a smaller cabinet whose medals light up tier by tier in step with each claim
// in the footage, with the count and the coins adding up.

export const MEDAL_CABINET_SECONDS = 18;
const s2f = (s: number) => Math.round(s * 60);
const OPEN = 3.4;
const FROM = 1.0;
const RATE = 1.5;
const END = OPEN + (18.6 - FROM) / RATE;

const NAMES = ["Roughneck", "Trader", "Driller", "Steady hands", "Refiner", "Dispatcher", "Storm chaser", "Exporter", "Harbor master", "Gusher hunter", "Shift worker", "Iron streak", "Rig master"];
const START = [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
/** The claims in the footage: [footage second, medal index, coins]. */
const CLAIMS: [number, number, number][] = [
  [3.85, 0, 750],
  [5.41, 0, 3000],
  [6.97, 1, 750],
  [8.6, 1, 3000],
  [10.16, 2, 750],
  [11.67, 3, 150],
  [13.21, 3, 750],
  [14.79, 4, 150],
  [16.42, 4, 750],
].map(([t, i, c]) => [OPEN + (t + 0.2 - FROM) / RATE, i, c]);
const TIER = ["#c47a3a", "#c7ced8", "#ffd54a", "#9be7ff"];

function Medal({ tier, size, pop }: { tier: number; size: number; pop: number }) {
  const face = tier > 0 ? TIER[tier - 1] : "#3a3f52";
  return (
    <div style={{ position: "relative", width: size, height: size * 1.25, scale: String(1 + pop * 0.4) }}>
      <div style={{ position: "absolute", left: size * 0.12, top: 0, width: size * 0.3, height: size * 0.5, background: tier ? C.red : "#2b2f3a" }} />
      <div style={{ position: "absolute", right: size * 0.12, top: 0, width: size * 0.3, height: size * 0.5, background: tier ? C.sea : "#2b2f3a" }} />
      <div style={{ position: "absolute", left: 0, bottom: 0, width: size, height: size, borderRadius: "50%", background: face, boxShadow: `0 0 0 ${Math.max(3, size / 16)}px ${C.ink}${tier ? `, 0 0 ${pop * 30}px ${TIER[tier - 1]}` : ""}`, display: "grid", placeItems: "center", fontFamily: font.display, fontWeight: 700, fontSize: size * 0.45, color: tier ? C.ink : "#5d6880" }}>
        {tier ? "★" : "?"}
      </div>
    </div>
  );
}

/** The cabinet: 13 medals on velvet shelves, each in the colour of its best claimed tier at time \`t\`. */
function Cabinet({ t, frame, cols, size, gap, title }: { t: number; frame: number; cols: number; size: number; gap: number; title: number }) {
  const tiers = [...START];
  let last = -1;
  for (const [at, i] of CLAIMS)
    if (t >= at) {
      tiers[i]++;
      last = at;
    }
  return (
    <div style={{ padding: gap, background: "#4a2410", boxShadow: `${ring(8)}, inset 0 0 0 10px #6b3a1a` }}>
      <div style={{ textAlign: "center", fontFamily: font.logo, fontWeight: 700, fontSize: title, color: C.sun, letterSpacing: 4, marginBottom: gap }}>Medals</div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${size}px)`, gap, padding: gap, background: "#5c1f2a", boxShadow: "inset 0 8px 0 rgba(0,0,0,0.3)" }}>
        {NAMES.map((n, i) => {
          const claim = CLAIMS.filter(([at, k]) => k === i && t >= at).pop();
          const pop = claim ? Math.max(0, 1 - (frame - s2f(claim[0])) / 20) : 0;
          return <Medal key={n} tier={tiers[i]} size={size} pop={pop} />;
        })}
      </div>
      {last >= 0 ? null : null}
    </div>
  );
}

export function MedalCabinet() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const doors = interpolate(t, [0.8, 2.0], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const claimed = 3 + CLAIMS.filter(([at]) => t >= at).length;
  const coins = CLAIMS.filter(([at]) => t >= at).reduce((n, [, , c]) => n + c, 0);
  const lastAt = CLAIMS.filter(([at]) => t >= at).pop()?.[0] ?? -9;
  const bump = Math.max(0, 1 - (t - lastAt) / 0.35);
  const end = spring({ frame: frame - s2f(END), fps, config: { damping: 11, stiffness: 180 } });
  const FRAME = { k: 0.72, x: 500, y: 150 };
  const FW = Math.round(1920 * FRAME.k);
  const FH = Math.round(1080 * FRAME.k);
  return (
    <AbsoluteFill style={{ background: "#2b1608", overflow: "hidden" }}>
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(90deg, #3a1f0c 0 90px, #2b1608 90px 94px)" }} />

      {/* the cabinet opens */}
      {t < OPEN && (
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 80 }}>
          <div style={{ position: "relative" }}>
            <Cabinet t={0} frame={frame} cols={5} size={96} gap={22} title={44} />
            {/* glass doors swinging open */}
            {[0, 1].map((side) => (
              <div key={side} style={{ position: "absolute", top: 0, bottom: 0, width: "50%", left: side ? "50%" : 0, background: "rgba(150,200,255,0.18)", boxShadow: `inset 0 0 0 8px #6b3a1a`, transformOrigin: side ? "100% 50%" : "0 50%", transform: `perspective(1600px) rotateY(${side ? doors * 100 : -doors * 100}deg)` }} />
            ))}
          </div>
          <div style={{ width: 520 }}>
            <Chip bg={C.red} color={C.white} size={24}>
              <span style={{ fontFamily: font.logo }}>New on the rig</span>
            </Chip>
            <Title size={96} color={C.sun} style={{ marginTop: 22 }}>
              Medals
            </Title>
            <div style={{ marginTop: 18, fontFamily: font.display, fontWeight: 700, fontSize: 36, lineHeight: 1.4, color: C.sunPale }}>13 medals, 41 tiers. Fill your cabinet.</div>
          </div>
        </AbsoluteFill>
      )}

      {t >= OPEN && t < END && (
        <>
          <div style={{ position: "absolute", left: FRAME.x - 6, top: FRAME.y - 6, width: FW + 12, height: FH + 12, background: C.ink, boxShadow: `${ring(6)}, 0 0 0 12px ${C.sun}, 0 0 0 18px ${C.ink}` }} />
          <div style={{ position: "absolute", left: FRAME.x, top: FRAME.y, width: 1920, height: 1080, overflow: "hidden", transformOrigin: "0 0", transform: `scale(${FRAME.k})` }}>
            <Sequence from={s2f(OPEN)} durationInFrames={s2f(END - OPEN)} layout="none">
              <OffthreadVideo src={staticFile("footage/medals.mp4")} muted trimBefore={s2f(FROM)} playbackRate={RATE} style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }} />
            </Sequence>
          </div>
          <div style={{ position: "absolute", left: 30, top: 150 }}>
            <Cabinet t={t} frame={frame} cols={3} size={74} gap={14} title={26} />
          </div>
          <div style={{ position: "absolute", left: 40, top: 760, width: 420 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, scale: String(1 + bump * 0.2), transformOrigin: "0 50%" }}>
              <Title size={60} color={C.sun}>
                {claimed}/41
              </Title>
              <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 26, color: C.white }}>claimed</span>
            </div>
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 32, color: "#7dffb0", marginTop: 8 }}>+{coins.toLocaleString("en-US")} coins</div>
          </div>
          <div style={{ position: "absolute", left: FRAME.x, top: FRAME.y + FH + 34, display: "flex", gap: 14 }}>
            <Chip bg="#c47a3a" color={C.white} size={22}>
              <span style={{ fontFamily: font.logo }}>Bronze 150</span>
            </Chip>
            <Chip bg="#c7ced8" size={22}>
              <span style={{ fontFamily: font.logo }}>Silver 750</span>
            </Chip>
            <Chip bg={C.sun} size={22}>
              <span style={{ fontFamily: font.logo }}>Gold 3,000</span>
            </Chip>
            <Chip bg="#9be7ff" size={22}>
              <span style={{ fontFamily: font.logo }}>Platinum 12,000</span>
            </Chip>
          </div>
        </>
      )}

      <PixelWipe frame={frame} start={s2f(OPEN) - 22} color="#2b1608" />
      <PixelWipe frame={frame} start={s2f(END) - 22} />
      {t >= END && (
        <AbsoluteFill style={{ background: C.sun }}>
          <Sunburst turn={0.08} />
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, scale: String(end) }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 26 }}>
              <Spr rows={logo} palette={logoPalette} scale={6} style={{ boxShadow: ring(6) }} />
              <Medal tier={3} size={110} pop={0} />
              <Spr rows={roughneck} palette={base} scale={12} />
            </div>
            <Title size={104}>Fill your</Title>
            <Title size={104} color={C.red}>
              cabinet
            </Title>
            <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
              <Chip bg={C.white} size={34}>
                <span style={{ fontFamily: font.logo }}>barrelroyale.io/play</span>
              </Chip>
              <Chip bg={C.ink} color={C.sun} size={34}>
                <span style={{ fontFamily: font.logo }}>@barrelroyale</span>
              </Chip>
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}
