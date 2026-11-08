import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { base, logo, logoPalette, roughneck } from "@/components/pixel/sprites";
import { C, Chip, font, PixelWipe, ring, Spr, Sunburst, Title } from "../brand";

// Tanker times: the harbour's 24-hour clock. A hand sweeps one day and a brass ship's bell rings at each of
// the six berths (every 4 hours, UTC). Then the real game (footage/tanker.mp4, shown whole so the HUD stays
// in view) beside a 20-minute berth countdown, and an alarm clock to set for the next ship.

export const FRESH04_SECONDS = 17;
const s2f = (s: number) => Math.round(s * 60);
const TIMES = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];
const CLOCK = 4.6;
/** [start, footage from, rate, length] */
const SHOTS: [number, number, number, number][] = [
  [CLOCK, 3.0, 1.6, 3.6],
  [CLOCK + 3.6, 10.3, 1, 3.4],
  [CLOCK + 7.0, 17.0, 2.4, 2.4],
];
const ALARM = CLOCK + 9.4;
const END = ALARM + 2.4;

const FRAME = { k: 0.72, x: 500, y: 150 };
const FW = Math.round(1920 * FRAME.k);
const FH = Math.round(1080 * FRAME.k);

/** The brass bell; it swings when rung (`swing` runs 0 → 1 after each strike). */
function Bell({ swing, size }: { swing: number; size: number }) {
  const angle = Math.sin(swing * 18) * 22 * Math.max(0, 1 - swing);
  return (
    <div style={{ width: size, height: size * 1.1, rotate: `${angle}deg`, transformOrigin: "50% 0" }}>
      <div style={{ margin: "0 auto", width: size * 0.18, height: size * 0.16, background: C.ink }} />
      <div style={{ margin: "0 auto", width: size * 0.7, height: size * 0.62, background: C.sunDeep, boxShadow: `0 0 0 ${size / 18}px ${C.ink}`, borderRadius: `${size * 0.35}px ${size * 0.35}px 0 0` }} />
      <div style={{ margin: "0 auto", width: size * 0.95, height: size * 0.14, background: C.sun, boxShadow: `0 0 0 ${size / 18}px ${C.ink}` }} />
      <div style={{ margin: `${size * 0.04}px auto 0`, width: size * 0.16, height: size * 0.12, background: C.ink }} />
    </div>
  );
}

function HarbourClock({ frame }: { frame: number }) {
  if (frame >= s2f(CLOCK)) return null;
  const t = frame / 60;
  // the hand sweeps a whole day between 0.6 s and 4.0 s
  const day = interpolate(t, [0.6, 4.0], [0, 23.99], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const R = 300;
  const cx = 600;
  const cy = 580;
  const lastBerth = Math.floor(day / 4);
  const swing = t > 0.6 ? (day % 4) / 4 : 1;
  return (
    <AbsoluteFill style={{ background: C.seaDeep }}>
      <div style={{ position: "absolute", left: 70, top: 60, display: "flex", alignItems: "center", gap: 16 }}>
        <Spr rows={logo} palette={logoPalette} scale={2} style={{ boxShadow: ring(4, C.sun) }} />
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: C.sunPale, letterSpacing: 3 }}>Harbour clock · UTC</span>
      </div>
      <div style={{ position: "absolute", left: cx - R - 24, top: cy - R - 24, width: (R + 24) * 2, height: (R + 24) * 2, borderRadius: "50%", background: "#fff7e3", boxShadow: `0 0 0 14px ${C.ink}, 0 0 0 30px ${C.sunDeep}, 0 0 0 38px ${C.ink}` }} />
      {Array.from({ length: 24 }, (_, h) => {
        const a = (h / 24) * Math.PI * 2 - Math.PI / 2;
        const berth = h % 4 === 0;
        const lit = berth && t > 0.6 && day >= h;
        const r = R - (berth ? 52 : 18);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        return berth ? (
          <div key={h} style={{ position: "absolute", left: x - 64, top: y - 26, width: 128, height: 52, display: "grid", placeItems: "center", background: lit ? C.sun : C.white, boxShadow: ring(4), fontFamily: font.logo, fontWeight: 700, fontSize: 24, color: C.ink }}>
            {String(h).padStart(2, "0")}:00
          </div>
        ) : (
          <div key={h} style={{ position: "absolute", left: x - 4, top: y - 4, width: 8, height: 8, background: C.ink2 }} />
        );
      })}
      <div style={{ position: "absolute", left: cx - 8, top: cy - R + 110, width: 16, height: R - 110, background: C.red, boxShadow: `0 0 0 4px ${C.ink}`, transformOrigin: "50% 100%", rotate: `${(day / 24) * 360}deg` }} />
      <div style={{ position: "absolute", left: cx - 22, top: cy - 22, width: 44, height: 44, background: C.ink, borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 1210, top: 120 }}>
        <Bell swing={swing} size={200} />
      </div>
      <div style={{ position: "absolute", left: 1060, top: 400, width: 800 }}>
        <Title size={66} color={C.sun}>
          Ding! A tanker
        </Title>
        <Title size={66}>every 4 hours</Title>
        <div style={{ marginTop: 30, display: "flex", flexWrap: "wrap", gap: 14 }}>
          {TIMES.map((tm, i) => (
            <Chip key={tm} bg={t > 0.6 && i <= lastBerth ? C.sun : C.white} size={28}>
              <span style={{ fontFamily: font.logo }}>{tm}</span>
            </Chip>
          ))}
        </div>
        <div style={{ marginTop: 22, fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: C.sunPale, letterSpacing: 3 }}>UTC, every day</div>
      </div>
    </AbsoluteFill>
  );
}

function Side({ frame }: { frame: number }) {
  const { fps } = useVideoConfig();
  if (frame < s2f(CLOCK) || frame >= s2f(ALARM)) return null;
  const t = frame / fps;
  const come = spring({ frame: frame - s2f(CLOCK), fps, config: { damping: 13, stiffness: 180 } });
  // the berth timer runs its 20 minutes down over the footage
  const left = interpolate(t, [CLOCK, ALARM], [20 * 60, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(Math.floor(left % 60)).padStart(2, "0");
  const lines = [
    { at: CLOCK + 0.4, text: "Stays 20 minutes" },
    { at: CLOCK + 2.0, text: "Buys one product in bulk" },
    { at: CLOCK + 3.8, text: "Same ship for every rig" },
  ];
  return (
    <div style={{ position: "absolute", left: 40, top: 150, width: 420, translate: `${(1 - come) * -500}px 0` }}>
      <div style={{ padding: "22px 24px", background: C.stormSky, boxShadow: `${ring(6)}, 0 0 0 10px ${C.sun}` }}>
        <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 20, color: C.steelLight, letterSpacing: 2 }}>At the berth</div>
        <Title size={88} color={C.sunPale}>
          {mm}:{ss}
        </Title>
      </div>
      <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 18 }}>
        {lines.map((l) => {
          const pop = spring({ frame: frame - s2f(l.at), fps, config: { damping: 12, stiffness: 200 } });
          return t >= l.at ? (
            <div key={l.text} style={{ display: "flex", alignItems: "center", gap: 14, opacity: pop, translate: `${(1 - pop) * -40}px 0` }}>
              <div style={{ flex: "none", width: 22, height: 22, background: C.sun, boxShadow: ring(3) }} />
              <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 30, color: C.white }}>{l.text}</span>
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}

function Alarm({ frame }: { frame: number }) {
  if (frame < s2f(ALARM) || frame >= s2f(END)) return null;
  const local = frame - s2f(ALARM);
  const shake = Math.round(Math.sin(local * 1.9) * 7);
  return (
    <AbsoluteFill style={{ background: C.sunPale, display: "flex", alignItems: "center", justifyContent: "center", gap: 90 }}>
      <div style={{ position: "relative", width: 300, height: 340, translate: `${shake}px 0`, rotate: `${shake / 2}deg` }}>
        {[0, 1].map((s) => (
          <div key={s} style={{ position: "absolute", top: 0, left: s ? 190 : 20, width: 90, height: 60, background: C.sunDeep, boxShadow: ring(6), borderRadius: "45px 45px 0 0" }} />
        ))}
        <div style={{ position: "absolute", left: 10, top: 40, width: 280, height: 280, borderRadius: "50%", background: C.red, boxShadow: ring(8), display: "grid", placeItems: "center" }}>
          <div style={{ width: 210, height: 210, borderRadius: "50%", background: C.white, boxShadow: ring(5), display: "grid", placeItems: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 44, color: C.ink }}>04:00</div>
        </div>
      </div>
      <div style={{ width: 820 }}>
        <Title size={92} color={C.red} style={{ textShadow: "none" }}>
          Set an alarm
        </Title>
        <Title size={92} color={C.ink} style={{ textShadow: "none" }}>
          Fill your tanks
        </Title>
        <div style={{ marginTop: 26, fontFamily: font.logo, fontWeight: 700, fontSize: 22, color: C.ink, letterSpacing: 1, whiteSpace: "nowrap" }}>{TIMES.join(" · ")} UTC</div>
      </div>
    </AbsoluteFill>
  );
}

export function Fresh04() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const end = spring({ frame: frame - s2f(END), fps, config: { damping: 11, stiffness: 180 } });
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {frame >= s2f(CLOCK) && frame < s2f(ALARM) && (
        <>
          <div style={{ position: "absolute", left: FRAME.x - 6, top: FRAME.y - 6, width: FW + 12, height: FH + 12, background: C.ink, boxShadow: `${ring(6)}, 0 0 0 12px ${C.sun}, 0 0 0 18px ${C.ink}` }} />
          <div style={{ position: "absolute", left: FRAME.x, top: FRAME.y, width: 1920, height: 1080, overflow: "hidden", transformOrigin: "0 0", transform: `scale(${FRAME.k})` }}>
            {SHOTS.map(([at, from, rate, len]) => (
              <Sequence key={at} from={s2f(at)} durationInFrames={s2f(len)} layout="none">
                <OffthreadVideo src={staticFile("footage/tanker.mp4")} muted trimBefore={s2f(from)} playbackRate={rate} style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }} />
              </Sequence>
            ))}
          </div>
          <div style={{ position: "absolute", left: FRAME.x, top: FRAME.y + FH + 34, display: "flex", gap: 12 }}>
            {TIMES.map((tm) => (
              <Chip key={tm} bg={C.sun} size={22}>
                <span style={{ fontFamily: font.logo }}>{tm}</span>
              </Chip>
            ))}
            <Chip bg={C.white} size={22}>
              <span style={{ fontFamily: font.logo }}>UTC</span>
            </Chip>
          </div>
        </>
      )}
      <Side frame={frame} />
      <HarbourClock frame={frame} />
      <Alarm frame={frame} />
      <PixelWipe frame={frame} start={s2f(CLOCK) - 22} />
      <PixelWipe frame={frame} start={s2f(ALARM) - 22} color={C.sunPale} />
      <PixelWipe frame={frame} start={s2f(END) - 22} />
      {frame >= s2f(END) && (
        <AbsoluteFill style={{ background: C.sun }}>
          <Sunburst turn={0.08} />
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, scale: String(end) }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 26 }}>
              <Spr rows={logo} palette={logoPalette} scale={6} style={{ boxShadow: ring(6) }} />
              <Bell swing={1} size={110} />
              <Spr rows={roughneck} palette={base} scale={12} />
            </div>
            <Title size={104}>Next ship</Title>
            <Title size={104} color={C.red}>
              is coming
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
