import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { barrel, base, icons, valve } from "@/components/pixel/sprites";
import { BRACE_SECONDS, LEVELS, POINTS, STORM_WARNING } from "@/lib/game/content";
import { C, Chip, font, Spr, Title, ring, snap } from "../brand";
import { Dissolve, dissolved, EpEnd, Popup, Shutter } from "../ep/kit";

// How 08 · The storm brace, as an arcade cabinet. The screen counts down the
// 15 second warning under siren lights, then the 8 second brace: four valves,
// in the order shown, pressed on the cabinet's A–D buttons. One wrong press
// knocks a second off the timer; the right order finishes the job, BRACED!
// lands, and the bonus table shows how it grows with the rig level.

export const HOW08_SECONDS = 14;
const END = 730;

const WARN = [94, 296];
const BRACE = 304;
const SEC = 34; // frames per brace second, a little time-lapsed
const ORDER = [2, 0, 3, 1];
const PRESSES = [{ at: 344, v: 2 }, { at: 384, v: 1, wrong: true }, { at: 424, v: 0 }, { at: 460, v: 3 }, { at: 494, v: 1 }];
const BRACED = 500;
const TABLE = 560;
const TIP = 650;

const LETTERS = ["A", "B", "C", "D"];
const BTN_COLORS = [C.red, C.sun, C.leaf, C.sea];
// the brace bonus: 10 coins plus 10 per rig level
const bonus = (level: number) => 10 + 10 * level;

const SCREEN = { x: 300, y: 150, w: 1320, h: 720 };

export function How08() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {dissolved(frame, END) ? <EpEnd frame={frame - END - 20} fps={fps} ep={8} tag="How it works" line="Brace for the storm" color={C.sea} /> : <Cabinet frame={frame} fps={fps} />}
      <Shutter frame={frame} fps={fps} ep={8} tag="How 08" title="Brace for the storm" color={C.sea} />
      <Dissolve frame={frame} start={END} color={C.sea} />
    </AbsoluteFill>
  );
}

function Cabinet({ frame, fps }: { frame: number; fps: number }) {
  const pressed = PRESSES.find((p) => frame >= p.at && frame < p.at + 8);
  const wrongShake = frame >= PRESSES[1].at && frame < PRESSES[1].at + 16 ? snap(Math.sin(frame * 3) * 10, 2) : 0;
  return (
    <AbsoluteFill style={{ background: "#2a1e4a" }}>
      {/* cabinet side art stripes */}
      {[0, 1].map((s) => (
        <div key={s} style={{ position: "absolute", left: s ? 1680 : 0, top: 0, width: 240, height: 1080, background: `repeating-linear-gradient(135deg, ${C.storm} 0 40px, #2a1e4a 40px 80px)` }} />
      ))}
      {/* the marquee */}
      <div style={{ position: "absolute", left: 260, top: 20, width: 1400, height: 110, background: C.ink, boxShadow: ring(8, C.sun), display: "grid", placeItems: "center" }}>
        <Title size={64} color={frame % 40 < 30 ? C.sun : C.sunDeep}>
          Storm brace
        </Title>
      </div>
      {/* the bezel and the screen */}
      <div style={{ position: "absolute", left: SCREEN.x - 30, top: SCREEN.y - 20, width: SCREEN.w + 60, height: SCREEN.h + 40, background: "#141a30", boxShadow: ring(8) }} />
      <div
        style={{
          position: "absolute",
          left: SCREEN.x,
          top: SCREEN.y,
          width: SCREEN.w,
          height: SCREEN.h,
          overflow: "hidden",
          background: "#0d1430",
          clipPath: "polygon(0 24px, 12px 24px, 12px 12px, 24px 12px, 24px 0, calc(100% - 24px) 0, calc(100% - 24px) 12px, calc(100% - 12px) 12px, calc(100% - 12px) 24px, 100% 24px, 100% calc(100% - 24px), calc(100% - 12px) calc(100% - 24px), calc(100% - 12px) calc(100% - 12px), calc(100% - 24px) calc(100% - 12px), calc(100% - 24px) 100%, 24px 100%, 24px calc(100% - 12px), 12px calc(100% - 12px), 12px calc(100% - 24px), 0 calc(100% - 24px))",
          translate: `${wrongShake}px 0`,
        }}
      >
        <Screen frame={frame} fps={fps} />
        {/* scanlines */}
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 3px, transparent 3px 6px)", pointerEvents: "none" }} />
      </div>

      {/* the control panel: joystick and the A–D buttons */}
      <div style={{ position: "absolute", left: 240, top: 900, width: 1440, height: 180, background: C.storm, boxShadow: ring(8) }} />
      <div style={{ position: "absolute", left: 380, top: 950, width: 30, height: 70, background: C.ink }} />
      <div style={{ position: "absolute", left: 360, top: 920, width: 70, height: 50, background: C.red, boxShadow: ring(5) }} />
      {LETTERS.map((l, v) => {
        const down = pressed?.v === v;
        return (
          <div key={l} style={{ position: "absolute", left: 760 + v * 150, top: 930 + (down ? 8 : 0), width: 110, height: 90, background: BTN_COLORS[v], boxShadow: down ? `0 0 0 6px ${C.ink}` : `0 0 0 6px ${C.ink}, 0 10px 0 6px ${C.ink}`, display: "grid", placeItems: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 44, color: v === 1 ? C.ink : C.white }}>
            {l}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 1420, top: 950, fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: C.sunPale, opacity: frame % 50 < 34 ? 1 : 0.3 }}>1 player</div>
    </AbsoluteFill>
  );
}

function Screen({ frame, fps }: { frame: number; fps: number }) {
  if (frame < BRACE) return <Warning frame={frame} fps={fps} />;
  if (frame < TABLE) return <Brace frame={frame} fps={fps} />;
  return <Table frame={frame} fps={fps} />;
}

function Rain({ frame, n = 50 }: { frame: number; n?: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const x = (random(`hr${i}`) * 1500 + frame * 6) % 1500 - 90;
        const y = (random(`hry${i}`) * 820 + frame * 22) % 820 - 60;
        return <div key={i} style={{ position: "absolute", left: snap(x, 6), top: snap(y, 6), width: 6, height: 30, background: C.rain, opacity: 0.5, rotate: "12deg" }} />;
      })}
    </>
  );
}

function Warning({ frame, fps }: { frame: number; fps: number }) {
  const secs = Math.max(0, Math.ceil(interpolate(frame, WARN, [STORM_WARNING, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
  const tick = Math.floor(interpolate(frame, WARN, [0, STORM_WARNING], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const sinceTick = frame - (WARN[0] + (tick * (WARN[1] - WARN[0])) / STORM_WARNING);
  const siren = frame % 20 < 10;
  return (
    <AbsoluteFill>
      <Rain frame={frame} n={Math.round(interpolate(frame, WARN, [8, 60], { extrapolateRight: "clamp" }))} />
      {[30, SCREEN.w - 130].map((x, i) => (
        <div key={x} style={{ position: "absolute", left: x, top: 40, width: 100, height: 60, background: (siren ? i === 0 : i === 1) ? C.red : C.redDeep, boxShadow: ring(5) }} />
      ))}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 50, gap: 12 }}>
        <div style={{ opacity: siren ? 1 : 0.6 }}>
          <Title size={64} color={C.red}>
            Storm warning
          </Title>
        </div>
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 280, lineHeight: 1, color: secs <= 3 ? C.red : C.sun, textShadow: `10px 10px 0 ${C.ink}`, scale: String(interpolate(sinceTick, [0, 6], [1.15, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })) }}>{secs}</span>
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 40, color: C.sunPale }}>{STORM_WARNING} seconds to get ready</span>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 40, display: "flex", justifyContent: "center", gap: 30 }}>
        <Spr rows={icons.storm} scale={6} />
        <Spr rows={icons.derrick} scale={6} />
      </div>
    </AbsoluteFill>
  );
}

function Brace({ frame, fps }: { frame: number; fps: number }) {
  const done = PRESSES.filter((p) => !p.wrong && frame >= p.at + 4).length;
  const penalty = frame >= PRESSES[1].at + 4 ? 1 : 0;
  const end = done === 4 ? PRESSES[4].at + 4 : frame;
  const left = Math.max(0, BRACE_SECONDS - (end - BRACE - 10) / SEC - penalty);
  const segs = 32;
  const braced = frame >= BRACED;
  const wrongFlash = frame >= PRESSES[1].at && frame < PRESSES[1].at + 20;
  return (
    <AbsoluteFill>
      <Rain frame={frame} n={70} />
      {wrongFlash && <AbsoluteFill style={{ background: C.red, opacity: 0.25 }} />}
      {/* the order */}
      <div style={{ position: "absolute", left: 60, top: 40, display: "flex", alignItems: "center", gap: 16 }}>
        <Title size={52} color={braced ? "#3dff9a" : C.white}>
          {braced ? "Braced!" : "Close in order"}
        </Title>
        <div style={{ display: "flex", gap: 12, marginLeft: 20 }}>
          {ORDER.map((v, i) => (
            <div key={i} style={{ width: 66, height: 66, display: "grid", placeItems: "center", background: i < done ? C.leaf : i === done ? C.sun : C.steelLight, boxShadow: `0 0 0 5px ${C.ink}`, fontFamily: font.logo, fontWeight: 700, fontSize: 38, color: i < done ? C.white : C.ink }}>
              {LETTERS[v]}
            </div>
          ))}
        </div>
      </div>

      {/* the timer ring */}
      <div style={{ position: "absolute", left: 90, top: 170, width: 440, height: 440 }}>
        {Array.from({ length: segs }, (_, i) => {
          const a = (i / segs) * Math.PI * 2 - Math.PI / 2;
          const on = i / segs < left / BRACE_SECONDS;
          return <div key={i} style={{ position: "absolute", left: snap(220 + Math.cos(a) * 180 - 16, 4), top: snap(220 + Math.sin(a) * 180 - 16, 4), width: 32, height: 32, background: on ? (left < 3 ? C.red : C.sun) : "#28325a" }} />;
        })}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 120, color: left < 3 ? C.red : C.white, lineHeight: 1 }}>{left.toFixed(1)}</span>
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.sunPale }}>seconds</span>
        </div>
      </div>
      <Popup frame={frame} at={PRESSES[1].at + 2} x={310} y={170} size={70} life={50} color={C.red}>
        −1 sec
      </Popup>

      {/* the valves */}
      <div style={{ position: "absolute", left: 640, top: 170, display: "grid", gridTemplateColumns: "repeat(2, 280px)", gap: 30 }}>
        {LETTERS.map((l, v) => {
          const ok = PRESSES.find((p) => p.v === v && !p.wrong);
          const closed = !!ok && frame >= ok.at + 4;
          const bad = wrongFlash && v === PRESSES[1].v;
          return (
            <div key={l} style={{ height: 190, display: "flex", alignItems: "center", justifyContent: "center", gap: 24, background: closed ? C.leaf : bad ? C.red : "#1c2448", boxShadow: `0 0 0 6px ${BTN_COLORS[v]}` }}>
              <Spr rows={valve} scale={8} style={{ rotate: closed ? "90deg" : undefined }} />
              <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 64, color: C.white }}>{l}</span>
            </div>
          );
        })}
      </div>
      {PRESSES.filter((p) => !p.wrong).map((p) => (
        <Popup key={p.at} frame={frame} at={p.at + 4} x={780 + (p.v % 2) * 310} y={150 + Math.floor(p.v / 2) * 220} size={40} life={34} color="#3dff9a">
          Shut!
        </Popup>
      ))}
      {frame >= PRESSES[1].at && frame < PRESSES[1].at + 40 && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, display: "flex", justifyContent: "center" }}>
          <Chip bg={C.red} color={C.white} size={34}>
            <span style={{ fontFamily: font.logo }}>Wrong valve: −1 second</span>
          </Chip>
        </div>
      )}
      {braced && <AbsoluteFill style={{ background: "#3dff9a", opacity: Math.max(0, 0.5 - (frame - BRACED) / 20) }} />}
    </AbsoluteFill>
  );
}

function Table({ frame, fps }: { frame: number; fps: number }) {
  const t = frame - TABLE;
  const levels = LEVELS.map((_, i) => i + 1);
  return (
    <AbsoluteFill style={{ background: "#0d1430" }}>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 36 }}>
        <Title size={56} color="#3dff9a">
          Brace bonus
        </Title>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 120, top: 140, width: 640, display: "flex", flexDirection: "column", gap: 12 }}>
        {levels.map((lv, i) => {
          const s = spring({ frame: t - 6 - i * 6, fps, config: { damping: 12, stiffness: 220 } });
          return (
            <div key={lv} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", background: i === 0 ? C.sun : "#1c2448", boxShadow: `0 0 0 4px ${i === 0 ? C.ink : C.storm}`, translate: `${snap((1 - Math.min(1, s)) * -400, 8)}px 0`, opacity: Math.min(1, s * 2) }}>
              <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 34, color: i === 0 ? C.ink : C.sunPale }}>Rig level {lv}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: font.logo, fontWeight: 700, fontSize: 38, color: i === 0 ? C.ink : C.sun }}>
                <Spr rows={icons.coin} scale={3} />+{bonus(lv)}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 830, top: 160, display: "flex", flexDirection: "column", alignItems: "center", gap: 26, scale: String(spring({ frame: t - 40, fps, config: { damping: 8, stiffness: 240 } })) }}>
        <div style={{ padding: "18px 30px", background: C.leaf, boxShadow: ring(6) }}>
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 52, color: C.white, whiteSpace: "nowrap" }}>+{POINTS.storm} points</span>
        </div>
        <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 32, color: C.sunPale, textAlign: "center", width: 380 }}>on every storm you hold</span>
      </div>
      {frame >= TIP && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 40, display: "flex", justifyContent: "center", scale: String(spring({ frame: frame - TIP, fps, config: { damping: 10, stiffness: 220 } })) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "14px 26px", background: C.ink, boxShadow: ring(5, C.sun) }}>
            <Spr rows={barrel} palette={base} scale={4} />
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 32, color: C.sun, whiteSpace: "nowrap" }}>Tip: sell often, keep storage light</span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}
