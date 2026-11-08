import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { base, logo, logoPalette, roughneck } from "@/components/pixel/sprites";
import { C, Chip, font, PixelWipe, ring, Spr, Sunburst, Title } from "../brand";

// Gushers: a seismograph on the rig scratches along quietly until the needle jumps off the paper, then the
// real game (footage/gusher.mp4, shown whole so the HUD stays in view) with a haul counter beside it as the
// roughneck collects +41 and +16 bbl, and the gusher dies down.

export const GUSHER_QUAKE_SECONDS = 17;
const s2f = (s: number) => Math.round(s * 60);
const QUAKE = 3.8;
/** [start, footage from, length] */
const SHOTS: [number, number, number][] = [
  [QUAKE, 0.4, 3.4],
  [QUAKE + 3.4, 15.4, 4.4],
  [QUAKE + 7.8, 26.2, 2.2],
  [QUAKE + 10.0, 33.4, 3.0],
];
const HAULS = [
  { at: QUAKE + 3.4 + (18.15 - 15.4), bbl: 41 },
  { at: QUAKE + 7.8 + (27.19 - 26.2), bbl: 16 },
];
const END = QUAKE + 13;

const FRAME = { k: 0.72, x: 500, y: 150 };
const FW = Math.round(1920 * FRAME.k);
const FH = Math.round(1080 * FRAME.k);

function Seismograph({ frame }: { frame: number }) {
  if (frame >= s2f(QUAKE)) return null;
  const t = frame / 60;
  const spikeAt = 2.0;
  // the trace: calm wobble, then a burst that runs off the paper
  const pts: string[] = [];
  for (let x = 0; x <= 1300; x += 6) {
    const age = (1300 - x) / 400; // seconds ago at this point of the paper
    const tt = t - age;
    const calm = Math.sin(tt * 23) * 6 + Math.sin(tt * 51) * 3;
    const burst = tt > spikeAt ? Math.sin(tt * 70) * Math.min(260, (tt - spikeAt) * 900) : 0;
    pts.push(`${x},${300 + (tt < 0 ? 0 : calm + burst)}`);
  }
  const shake = t > spikeAt ? Math.round(Math.sin(frame * 2.3) * 6) : 0;
  const stamp = spring({ frame: frame - s2f(spikeAt + 0.4), fps: 60, config: { damping: 8, stiffness: 260 } });
  return (
    <AbsoluteFill style={{ background: "#2b2f3a", translate: `${shake}px ${-shake}px` }}>
      <div style={{ position: "absolute", left: 70, top: 60, display: "flex", alignItems: "center", gap: 16 }}>
        <Spr rows={logo} palette={logoPalette} scale={2} style={{ boxShadow: ring(4, C.sun) }} />
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: C.sun, letterSpacing: 3 }}>Rig seismograph</span>
      </div>
      {/* the paper strip and the drum */}
      <div style={{ position: "absolute", left: 120, top: 240, width: 1300, height: 600, background: "#fff7e3", boxShadow: ring(8) }}>
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 50 * i + 25, height: 2, background: "rgba(232,69,60,0.15)" }} />
        ))}
        <svg width={1300} height={600} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <polyline points={pts.join(" ")} fill="none" stroke={C.ink} strokeWidth={5} />
        </svg>
      </div>
      <div style={{ position: "absolute", left: 1400, top: 220, width: 90, height: 640, background: C.steel, boxShadow: ring(8) }} />
      <div style={{ position: "absolute", left: 1380, top: 534, width: 160, height: 12, background: C.ink, rotate: `${t > spikeAt ? Math.sin(frame * 1.7) * 18 : Math.sin(frame / 7) * 2}deg`, transformOrigin: "100% 50%" }} />
      <div style={{ position: "absolute", left: 1560, top: 360, width: 300 }}>
        <Title size={64} color={C.sunPale}>
          Calm
        </Title>
        <Title size={64} color={t > spikeAt ? C.red : "#4b5468"}>
          deck...
        </Title>
      </div>
      {t > spikeAt + 0.4 && (
        <div style={{ position: "absolute", left: 420, top: 380, rotate: "-8deg", scale: String(interpolate(stamp, [0, 1], [3, 1], { extrapolateRight: "clamp" })) }}>
          <div style={{ padding: "14px 40px", border: `10px solid ${C.red}`, background: "rgba(255,247,227,0.9)", fontFamily: font.logo, fontWeight: 700, fontSize: 130, color: C.red, letterSpacing: 10 }}>GUSHER!</div>
        </div>
      )}
    </AbsoluteFill>
  );
}

function Side({ frame }: { frame: number }) {
  const { fps } = useVideoConfig();
  if (frame < s2f(QUAKE) || frame >= s2f(END)) return null;
  const t = frame / fps;
  const come = spring({ frame: frame - s2f(QUAKE), fps, config: { damping: 13, stiffness: 180 } });
  const total = HAULS.filter((h) => t >= h.at).reduce((n, h) => n + h.bbl, 0);
  const last = [...HAULS].reverse().find((h) => t >= h.at);
  const pop = last ? spring({ frame: frame - s2f(last.at), fps, config: { damping: 8, stiffness: 260 } }) : 0;
  const over = t >= QUAKE + 10.6;
  return (
    <div style={{ position: "absolute", left: 40, top: 150, width: 420, display: "flex", flexDirection: "column", gap: 22, translate: `${(1 - come) * -500}px 0` }}>
      <Chip bg={C.red} color={C.white} size={22}>
        <span style={{ fontFamily: font.logo }}>{over ? "Died down" : "Gusher in slot 2"}</span>
      </Chip>
      {[
        ["10x", "output"],
        ["90 s", "of gushing"],
        ["150", "bbl wellhead"],
      ].map(([big, small]) => (
        <div key={big} style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <Title size={64} color={C.sun}>
            {big}
          </Title>
          <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 30, color: C.white }}>{small}</span>
        </div>
      ))}
      <div style={{ marginTop: 10, padding: "20px 24px", background: C.ink, boxShadow: `${ring(6)}, 0 0 0 10px ${C.sun}` }}>
        <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 20, color: C.steelLight, letterSpacing: 2 }}>Hauled in</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, scale: String(1 + (1 - pop) * 0.3), transformOrigin: "0 50%" }}>
          <Title size={86} color="#7dffb0">
            +{total}
          </Title>
          <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 30, color: C.white }}>bbl</span>
        </div>
      </div>
    </div>
  );
}

export function GusherQuake() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const end = spring({ frame: frame - s2f(END), fps, config: { damping: 11, stiffness: 180 } });
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {frame >= s2f(QUAKE) && frame < s2f(END) && (
        <>
          <div style={{ position: "absolute", left: FRAME.x - 6, top: FRAME.y - 6, width: FW + 12, height: FH + 12, background: C.ink, boxShadow: `${ring(6)}, 0 0 0 12px ${C.sun}, 0 0 0 18px ${C.ink}` }} />
          <div style={{ position: "absolute", left: FRAME.x, top: FRAME.y, width: 1920, height: 1080, overflow: "hidden", transformOrigin: "0 0", transform: `scale(${FRAME.k})` }}>
            {SHOTS.map(([at, from, len]) => (
              <Sequence key={at} from={s2f(at)} durationInFrames={s2f(len)} layout="none">
                <OffthreadVideo src={staticFile("footage/gusher.mp4")} muted trimBefore={s2f(from)} style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }} />
              </Sequence>
            ))}
          </div>
          <div style={{ position: "absolute", left: FRAME.x, top: FRAME.y + FH + 34, display: "flex", gap: 14 }}>
            <Chip bg={C.sun} size={24}>
              <span style={{ fontFamily: font.logo }}>Every 15 to 35 min of play</span>
            </Chip>
            <Chip bg={C.white} size={24}>
              <span style={{ fontFamily: font.logo }}>Collect it before it dies down</span>
            </Chip>
          </div>
        </>
      )}
      <Side frame={frame} />
      <Seismograph frame={frame} />
      <PixelWipe frame={frame} start={s2f(QUAKE) - 22} />
      <PixelWipe frame={frame} start={s2f(END) - 22} />
      {frame >= s2f(END) && (
        <AbsoluteFill style={{ background: C.sun }}>
          <Sunburst turn={0.08} />
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, scale: String(end) }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 26 }}>
              <Spr rows={logo} palette={logoPalette} scale={6} style={{ boxShadow: ring(6) }} />
              <Spr rows={roughneck} palette={base} scale={12} />
            </div>
            <Title size={104}>Strike a</Title>
            <Title size={104} color={C.red}>
              gusher
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
