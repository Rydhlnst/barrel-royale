import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { icons, valve } from "@/components/pixel/sprites";
import { POINTS } from "@/lib/game/content";
import { Burst, C, font, Pointer, SeaScene, Spr, Title, ring, snap } from "../brand";
import { Dissolve, dissolved, EpEnd, Popup, Shutter } from "./kit";

// EP 3 · Storm incoming. A weather radar sweeps while the storm cell closes in
// and the sirens count down from five. A lightning flash cuts to the rig in the
// rain: the player holds BRACE, the valves shut one by one, the rig shakes and
// holds, the sky clears and the bonus lands.

export const EP3_SECONDS = 12;
const END = 610;
const CUT = 300;
const CLEAR = 480;

export function Ep3Storm() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {dissolved(frame, END) ? <EpEnd frame={frame - END - 20} fps={fps} ep={3} line="Storm incoming" color={C.rain} /> : frame < CUT ? <Radar frame={frame} fps={fps} /> : <Rig frame={frame - CUT} fps={fps} />}
      {/* lightning flash on the cut */}
      {frame >= CUT && frame < CUT + 10 && <AbsoluteFill style={{ background: C.white, opacity: 1 - (frame - CUT) / 10, zIndex: 120 }} />}
      <Shutter frame={frame} fps={fps} ep={3} title="Storm incoming" color={C.rain} />
      <Dissolve frame={frame} start={END} color={C.storm} />
    </AbsoluteFill>
  );
}

function Radar({ frame, fps }: { frame: number; fps: number }) {
  const R = 380;
  const cx = 760;
  const cy = 560;
  const sweep = (frame * 4) % 360;
  // the storm cell moves in from the upper right toward the rig in the middle
  const p = interpolate(frame, [80, CUT], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sx = cx + interpolate(p, [0, 1], [300, 70]);
  const sy = cy + interpolate(p, [0, 1], [-260, -50]);
  const count = Math.max(1, 5 - Math.floor((frame - 110) / 36));
  const counting = frame >= 110;
  const local = (frame - 110) % 36;
  const siren = frame % 20 < 10;
  return (
    <AbsoluteFill style={{ background: "#07140f" }}>
      {/* sirens */}
      {[60, 1740].map((x, i) => (
        <div key={x} style={{ position: "absolute", left: x, top: 40, width: 120, height: 120, background: (siren ? i === 0 : i === 1) ? C.red : C.redDeep, boxShadow: ring(8) }} />
      ))}
      {/* the radar disc, drawn as pixel rings */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} shapeRendering="crispEdges">
        <circle cx={cx} cy={cy} r={R + 16} fill={C.ink} />
        <circle cx={cx} cy={cy} r={R} fill="#0b2a1c" />
        {[1, 2, 3].map((k) => (
          <circle key={k} cx={cx} cy={cy} r={(R * k) / 3} fill="none" stroke="#1f6b45" strokeWidth={4} />
        ))}
        <line x1={cx - R} y1={cy} x2={cx + R} y2={cy} stroke="#1f6b45" strokeWidth={4} />
        <line x1={cx} y1={cy - R} x2={cx} y2={cy + R} stroke="#1f6b45" strokeWidth={4} />
        {/* the sweep and its trail */}
        {Array.from({ length: 14 }, (_, i) => {
          const a = ((sweep - i * 3) * Math.PI) / 180;
          return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a) * R} y2={cy + Math.sin(a) * R} stroke="#3dff9a" strokeWidth={8} opacity={(14 - i) / 20} />;
        })}
      </svg>
      {/* the storm cell: a pixel blob that boils */}
      {Array.from({ length: 70 }, (_, i) => {
        const a = random(`cell${i}`) * Math.PI * 2;
        const d = Math.sqrt(random(`celld${i}`)) * 120;
        const wob = Math.floor((frame + i * 7) / 8) % 2 ? 6 : 0;
        const x = snap(sx + Math.cos(a) * d * 1.3, 18);
        const y = snap(sy + Math.sin(a) * d + wob, 18);
        const core = d < 50;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 18, height: 18, background: core ? C.red : d < 90 ? C.sunDeep : "#3dff9a", opacity: 0.9 }} />;
      })}
      {/* the rig blip */}
      <div style={{ position: "absolute", left: cx - 14, top: cy - 14, width: 28, height: 28, background: C.white, boxShadow: `0 0 0 5px ${C.ink}`, opacity: frame % 30 < 20 ? 1 : 0.5 }} />
      <div style={{ position: "absolute", left: cx + 26, top: cy + 14, fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: C.white }}>Your rig</div>

      {/* the readout on the right */}
      <div style={{ position: "absolute", left: 1220, top: 220, width: 620, display: "flex", flexDirection: "column", gap: 26 }}>
        <div style={{ padding: "16px 24px", background: C.red, boxShadow: ring(7), fontFamily: font.logo, fontWeight: 700, fontSize: 44, color: C.white, opacity: siren ? 1 : 0.75 }}>Storm warning</div>
        {counting && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 52, color: C.sunPale, whiteSpace: "nowrap" }}>Storm in</span>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 220, lineHeight: 1, color: count <= 2 ? C.red : C.sun, scale: String(interpolate(local, [0, 8], [1.6, 1], { extrapolateRight: "clamp" })) }}>{count}</span>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 60, color: C.sunPale }}>s</span>
          </div>
        )}
        <div style={{ padding: "14px 22px", background: C.ink, boxShadow: ring(6, "#1f6b45"), fontFamily: font.logo, fontWeight: 700, fontSize: 32, color: "#3dff9a" }}>All hands: brace the rig</div>
      </div>
      <AbsoluteFill style={{ alignItems: "flex-start", padding: "40px 220px", pointerEvents: "none" }}>
        <Title size={64} color="#3dff9a" style={{ scale: String(spring({ frame: frame - 80, fps, config: { damping: 10 } })) }}>
          Weather radar
        </Title>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function Rig({ frame, fps }: { frame: number; fps: number }) {
  const clear = frame >= CLEAR - CUT;
  const hold = interpolate(frame, [30, 150], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const valves = [60, 100, 140];
  const shake = !clear ? snap(Math.sin(frame * 1.9) * (frame < 160 ? 8 : 14), 2) : 0;
  const bolt = !clear && [40, 110, 165].some((b) => frame >= b && frame < b + 6);
  const sky = clear ? [C.foam, "#bfe0ff", C.sky] : bolt ? [C.white, C.sky, C.foam] : [C.stormShade, C.storm, C.stormSky];
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, translate: `${shake}px ${shake / 3}px` }}>
        {sky.map((c, i) => (
          <div key={i} style={{ position: "absolute", left: 0, top: i * 300, width: 1920, height: 300, background: c }} />
        ))}
        <div style={{ position: "absolute", inset: 0, filter: clear ? undefined : "brightness(0.6) saturate(0.7)" }}>
          <SeaScene frame={frame * (clear ? 1 : 3)} y={480} />
        </div>
        {/* rain, in slanted pixel streaks */}
        {!clear &&
          Array.from({ length: 90 }, (_, i) => {
            const x = (random(`rx${i}`) * 2100 + frame * 9) % 2100 - 100;
            const y = (random(`ry${i}`) * 1200 + frame * 30) % 1200 - 100;
            return <div key={i} style={{ position: "absolute", left: snap(x, 6), top: snap(y, 6), width: 6, height: 36, background: C.rain, rotate: "14deg", opacity: 0.8 }} />;
          })}
        {bolt && (
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} shapeRendering="crispEdges">
            <polyline points="1400,0 1340,160 1400,170 1300,380 1360,390 1250,600" fill="none" stroke={C.sunPale} strokeWidth={18} />
          </svg>
        )}
      </div>

      {/* the brace panel */}
      {!clear && (
        <div style={{ position: "absolute", left: 560, top: 760, width: 800, padding: "22px 30px", background: C.white, boxShadow: ring(8), display: "flex", alignItems: "center", gap: 30, zIndex: 50 }}>
          <div style={{ position: "relative", width: 200, height: 200, flexShrink: 0 }}>
            {/* the hold ring, filling in twelve blocks */}
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
              return <div key={i} style={{ position: "absolute", left: 100 + Math.cos(a) * 82 - 14, top: 100 + Math.sin(a) * 82 - 14, width: 28, height: 28, background: i / 12 < hold ? C.leaf : C.steelLight, boxShadow: `0 0 0 4px ${C.ink}` }} />;
            })}
            <div style={{ position: "absolute", left: 42, top: 62, width: 116, height: 76, background: hold >= 1 ? C.leaf : C.red, boxShadow: ring(5), display: "grid", placeItems: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 28, color: C.white, translate: frame >= 30 && hold < 1 ? "0 5px" : undefined }}>Brace</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 38, color: C.ink }}>{hold >= 1 ? "Braced!" : "Hold to brace"}</span>
            <div style={{ display: "flex", gap: 22 }}>
              {valves.map((v, i) => (
                <div key={i} style={{ padding: 10, background: frame >= v ? C.leaf : C.sunPale, boxShadow: `0 0 0 5px ${C.ink}` }}>
                  <Spr rows={valve} scale={6} style={{ rotate: frame >= v ? "90deg" : undefined }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {!clear && frame < 170 && <Pointer x={700} y={890} down={frame >= 30 && frame < 150} scale={8} />}
      {valves.map((v, i) => (
        <Popup key={i} frame={frame} at={v} x={1050 + i * 120} y={760} size={36} life={36} color={C.leaf}>
          Shut!
        </Popup>
      ))}
      {!clear && frame >= 30 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 50, display: "flex", justifyContent: "center", zIndex: 60 }}>
          <Title size={86} color={frame % 16 < 8 ? C.white : C.sun}>
            Hold on!
          </Title>
        </div>
      )}

      {clear && (
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 110, gap: 26, zIndex: 60 }}>
          <div style={{ padding: "22px 60px", background: C.leaf, boxShadow: ring(10), rotate: "-4deg", scale: String(interpolate(spring({ frame: frame - (CLEAR - CUT), fps, config: { damping: 7, stiffness: 240 } }), [0, 1], [3, 1])) }}>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 104, color: C.white }}>Storm survived!</span>
          </div>
        </AbsoluteFill>
      )}
      <Popup frame={frame} at={CLEAR - CUT + 20} x={960} y={420} size={80} life={90}>
        +{POINTS.storm} points
      </Popup>
      <Burst frame={frame} start={CLEAR - CUT + 4} x={960} y={300} rows={icons.coin} scale={6} count={22} speed={18} seed="survived" />
    </AbsoluteFill>
  );
}
