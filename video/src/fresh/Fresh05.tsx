import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { hat, logo, logoPalette, roughneck } from "@/components/pixel/sprites";
import { C, Chip, font, PixelWipe, ring, Spr, Sunburst, Title } from "../brand";

// Busy day: a day planner fills up with meetings, errands and pickups. Beside the real game (foremanhire.mp4
// and foremanback.mp4, shown whole so the HUD stays in view) the planner's clock runs on while the Rig
// Foreman's jobs tick off, and six hours later his report is waiting.

export const FRESH05_SECONDS = 16;
const s2f = (s: number) => Math.round(s * 60);
const HOOK = 3.6;
const HIRE = { at: HOOK, from: 4.6, rate: 1.2, len: 4.0 };
const BACK = { at: HOOK + 4.0, from: 1.2, rate: 1, len: 5.8 };
const END = BACK.at + BACK.len;
const green = hat(C.leaf, "#4fd08f");

const SLOTS: [string, string, string][] = [
  ["09:00", "Standup", C.sea],
  ["10:00", "Client call", C.red],
  ["11:00", "Dentist", "#7a4fc0"],
  ["12:00", "Lunch run", C.sunDeep],
  ["13:00", "Report due", C.red],
  ["14:00", "School pickup", C.leaf],
  ["15:00", "Gym", C.sea],
];
const JOBS = ["Collects every well", "Sells when storage fills", "Fills Dispatch contracts", "Braces the rig in storms"];

const FRAME = { k: 0.72, x: 500, y: 150 };
const FW = Math.round(1920 * FRAME.k);
const FH = Math.round(1080 * FRAME.k);

/** The planner page: one row per hour, entries popping in from `from` seconds, `every` apart. */
function Planner({ frame, from, every, rowH, font: size, width }: { frame: number; from: number; every: number; rowH: number; font: number; width: number }) {
  const { fps } = useVideoConfig();
  return (
    <div style={{ width, padding: "20px 22px 24px", background: "#fff7e3", boxShadow: `${ring(6)}, 8px 10px 0 rgba(0,0,0,0.25)` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: `4px solid ${C.ink}`, paddingBottom: 8 }}>
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: size * 0.9, color: C.red, letterSpacing: 2 }}>Thursday</span>
        <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: size * 0.75, color: C.ink2 }}>Fully booked</span>
      </div>
      {SLOTS.map(([time, what, col], i) => {
        const at = from + i * every;
        const pop = spring({ frame: frame - s2f(at), fps, config: { damping: 11, stiffness: 220 } });
        return (
          <div key={time} style={{ display: "flex", alignItems: "center", gap: 12, height: rowH, borderBottom: "2px solid rgba(26,115,217,0.18)" }}>
            <span style={{ width: size * 3.1, fontFamily: font.display, fontWeight: 700, fontSize: size * 0.8, color: C.ink2 }}>{time}</span>
            {frame >= s2f(at) && (
              <span style={{ padding: "2px 10px", background: col, boxShadow: ring(3), fontFamily: font.display, fontWeight: 700, fontSize: size * 0.8, color: C.white, scale: String(pop), transformOrigin: "0 50%" }}>{what}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Hook({ frame }: { frame: number }) {
  if (frame >= s2f(HOOK)) return null;
  const { fps } = useVideoConfig();
  const title = spring({ frame: frame - s2f(2.0), fps, config: { damping: 11, stiffness: 200 } });
  return (
    <AbsoluteFill style={{ background: C.sunPale, display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 100 }}>
      <div style={{ rotate: "-2deg" }}>
        <Planner frame={frame} from={0.3} every={0.24} rowH={78} font={34} width={620} />
      </div>
      <div style={{ width: 700 }}>
        <Title size={110} color={C.red} style={{ textShadow: "none" }}>
          Busy day?
        </Title>
        <div style={{ scale: String(title), transformOrigin: "0 50%", marginTop: 16 }}>
          <Title size={64} color={C.ink} style={{ textShadow: "none", whiteSpace: "normal", lineHeight: 1.15 }}>
            Your rig doesn&apos;t have to wait
          </Title>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Side({ frame }: { frame: number }) {
  const { fps } = useVideoConfig();
  if (frame < s2f(HOOK) || frame >= s2f(END)) return null;
  const t = frame / fps;
  const come = spring({ frame: frame - s2f(HOOK), fps, config: { damping: 13, stiffness: 180 } });
  // the planner's clock runs from 09:00 to 15:00 over the footage
  const hour = interpolate(t, [HOOK, END - 0.4], [9, 15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const clock = `${String(Math.floor(hour)).padStart(2, "0")}:${String(Math.floor((hour % 1) * 6) * 10).padStart(2, "0")}`;
  const away = t >= BACK.at;
  return (
    <div style={{ position: "absolute", left: 36, top: 150, width: 430, translate: `${(1 - come) * -500}px 0` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ padding: "8px 14px", background: C.ink, boxShadow: `${ring(5)}, 0 0 0 9px ${C.sun}`, fontFamily: font.logo, fontWeight: 700, fontSize: 40, color: C.sunPale }}>{clock}</div>
        <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 26, color: C.white }}>{away ? "You: in meetings" : "You: hiring him"}</span>
      </div>
      <div style={{ marginTop: 34 }}>
        <Chip bg={C.leaf} color={C.white} size={22}>
          <span style={{ fontFamily: font.logo }}>Rig Foreman on duty</span>
        </Chip>
      </div>
      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 16 }}>
        {JOBS.map((j, i) => {
          const at = BACK.at + 0.4 + i * 0.7;
          const done = t >= at;
          const pop = spring({ frame: frame - s2f(at), fps, config: { damping: 9, stiffness: 240 } });
          return (
            <div key={j} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ flex: "none", width: 34, height: 34, display: "grid", placeItems: "center", background: done ? C.leaf : C.ink2, boxShadow: ring(3, C.white, "transparent"), fontFamily: font.logo, fontSize: 22, color: C.white, scale: String(done ? 0.6 + pop * 0.4 : 1) }}>{done ? "✓" : ""}</div>
              <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 28, color: done ? C.white : C.steelLight }}>{j}</span>
            </div>
          );
        })}
      </div>
      {t >= BACK.at + 3.4 && (
        <div style={{ marginTop: 34, fontFamily: font.display, fontWeight: 700, fontSize: 28, lineHeight: 1.35, color: C.sunPale }}>Up to 6 hours, even with the game closed. His report waits for you.</div>
      )}
    </div>
  );
}

export function Fresh05() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const end = spring({ frame: frame - s2f(END), fps, config: { damping: 11, stiffness: 180 } });
  const later = spring({ frame: frame - s2f(BACK.at), fps, config: { damping: 9, stiffness: 240 } });
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {t >= HOOK && t < END && (
        <>
          <div style={{ position: "absolute", left: FRAME.x - 6, top: FRAME.y - 6, width: FW + 12, height: FH + 12, background: C.ink, boxShadow: `${ring(6)}, 0 0 0 12px ${C.sun}, 0 0 0 18px ${C.ink}` }} />
          <div style={{ position: "absolute", left: FRAME.x, top: FRAME.y, width: 1920, height: 1080, overflow: "hidden", transformOrigin: "0 0", transform: `scale(${FRAME.k})` }}>
            {[
              ["foremanhire", HIRE],
              ["foremanback", BACK],
            ].map(([src, s]) => {
              const shot = s as typeof HIRE;
              return (
                <Sequence key={src as string} from={s2f(shot.at)} durationInFrames={s2f(shot.len)} layout="none">
                  <OffthreadVideo src={staticFile(`footage/${src}.mp4`)} muted trimBefore={s2f(shot.from)} playbackRate={shot.rate} style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }} />
                </Sequence>
              );
            })}
          </div>
          {/* the "later" tab under the frame when the footage jumps ahead */}
          <div style={{ position: "absolute", left: FRAME.x, top: FRAME.y + FH + 34, display: "flex", gap: 14 }}>
            {t >= BACK.at ? (
              <div style={{ scale: String(later), transformOrigin: "0 50%" }}>
                <Chip bg={C.red} color={C.white} size={24}>
                  <span style={{ fontFamily: font.logo }}>6 hours later</span>
                </Chip>
              </div>
            ) : (
              <Chip bg={C.sun} size={24}>
                <span style={{ fontFamily: font.logo }}>Hire him from the Foreman button</span>
              </Chip>
            )}
            <Chip bg={C.white} size={24}>
              <span style={{ fontFamily: font.logo }}>Free from rig level 6</span>
            </Chip>
          </div>
        </>
      )}
      <Side frame={frame} />
      <Hook frame={frame} />
      <PixelWipe frame={frame} start={s2f(HOOK) - 22} color={C.sunPale} />
      <PixelWipe frame={frame} start={s2f(BACK.at) - 22} />
      <PixelWipe frame={frame} start={s2f(END) - 22} />
      {t >= END && (
        <AbsoluteFill style={{ background: C.sun }}>
          <Sunburst turn={0.08} />
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, scale: String(end) }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 26 }}>
              <Spr rows={logo} palette={logoPalette} scale={6} style={{ boxShadow: ring(6) }} />
              <Spr rows={roughneck} palette={green} scale={12} />
            </div>
            <Title size={100}>You&apos;re busy.</Title>
            <Title size={100} color={C.red}>
              He&apos;s on it.
            </Title>
            <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
              <Chip bg={C.white} size={34}>
                <span style={{ fontFamily: font.logo }}>barrelroyale.io/play</span>
              </Chip>
              <Chip bg={C.ink} color={C.sun} size={34}>
                <span style={{ fontFamily: font.logo }}>@barrelroyale</span>
              </Chip>
            </div>
            <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 24, color: C.ink, letterSpacing: 2 }}>Rig Foreman · free from rig level 6</div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}
