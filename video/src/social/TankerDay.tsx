import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { base, logo, logoPalette, roughneck } from "@/components/pixel/sprites";
import { C, Chip, font, PixelWipe, ring, Spr, Sunburst, Title } from "../brand";

// Tanker Day: the harbor radar picks up a ship on its way in, then the real game (footage/tanker.mp4, shown
// whole so the HUD stays in view) with a bill of lading beside it that fills as the rig loads and gets
// stamped FILLED, and the ship sails off. The order in the footage: 190 bbl light crude at 2.19x.

export const TANKER_DAY_SECONDS = 19;
const s2f = (s: number) => Math.round(s * 60);
const ORDER = { ship: "MT Black Pearl", qty: 190, product: "light crude", premium: 2.19, perBbl: 3.66 };
const PAID = Math.round(ORDER.qty * ORDER.perBbl);
const BONUS = Math.round(ORDER.qty * ORDER.perBbl * 0.25);

const RADAR = 4.2;
/** [video start, video from, rate, length] */
const SHOTS: [number, number, number, number][] = [
  [RADAR, 2.4, 1.6, 4.6],
  [RADAR + 4.6, 10.2, 1, 5.4],
  [RADAR + 10, 17.2, 2.4, 4.6],
];
const FILLED_AT = RADAR + 4.6 + (12.63 - 10.2);
const END = RADAR + 14.6;

const FRAME = { k: 0.72, x: 500, y: 150 };
const FW = Math.round(1920 * FRAME.k);
const FH = Math.round(1080 * FRAME.k);

function Radar({ frame }: { frame: number }) {
  if (frame >= s2f(RADAR)) return null;
  const sweep = (frame * 3) % 360;
  const t = frame / s2f(RADAR);
  // the blip comes in from the edge toward the rig in the middle
  const r = 330 * (1 - t * 0.75);
  const bx = 960 + Math.cos(-0.9) * r;
  const by = 540 + Math.sin(-0.9) * r;
  const lit = ((sweep - ((-0.9 * 180) / Math.PI + 360)) % 360 + 360) % 360 < 60;
  return (
    <AbsoluteFill style={{ background: "#071a12" }}>
      {[110, 220, 330, 440].map((rr) => (
        <div key={rr} style={{ position: "absolute", left: 960 - rr, top: 540 - rr, width: rr * 2, height: rr * 2, borderRadius: "50%", border: "4px solid rgba(61,255,154,0.25)" }} />
      ))}
      <div style={{ position: "absolute", left: 960 - 440, top: 538, width: 880, height: 4, background: "rgba(61,255,154,0.2)" }} />
      <div style={{ position: "absolute", left: 958, top: 100, width: 4, height: 880, background: "rgba(61,255,154,0.2)" }} />
      <div style={{ position: "absolute", left: 960 - 440, top: 540 - 440, width: 880, height: 880, borderRadius: "50%", background: `conic-gradient(from ${sweep}deg, rgba(61,255,154,0.45), rgba(61,255,154,0) 60deg, rgba(61,255,154,0) 360deg)` }} />
      {/* the rig, and the ship */}
      <div style={{ position: "absolute", left: 944, top: 524, width: 32, height: 32, background: C.sun, boxShadow: ring(4, "#071a12") }} />
      <div style={{ position: "absolute", left: bx - 14, top: by - 14, width: 28, height: 28, background: lit ? "#3dff9a" : "#1d7a4c", boxShadow: "0 0 24px #3dff9a" }} />
      <div style={{ position: "absolute", left: bx + 30, top: by - 50, fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: "#7dffb0", letterSpacing: 2 }}>{ORDER.ship}</div>
      <div style={{ position: "absolute", left: 70, top: 70, display: "flex", alignItems: "center", gap: 16 }}>
        <Spr rows={logo} palette={logoPalette} scale={2} style={{ boxShadow: ring(4, "#3dff9a") }} />
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: "#7dffb0", letterSpacing: 3 }}>Harbor radar</span>
      </div>
      <div style={{ position: "absolute", left: 70, top: 380, width: 420 }}>
        <Chip bg={C.red} color={C.white} size={24}>
          <span style={{ fontFamily: font.logo }}>Incoming</span>
        </Chip>
        <Title size={84} color="#7dffb0" style={{ marginTop: 24 }}>
          Tanker
        </Title>
        <Title size={84} color={C.sun}>
          Day
        </Title>
      </div>
      <div style={{ position: "absolute", right: 70, top: 380, width: 420, fontFamily: font.display, fontWeight: 700, fontSize: 32, lineHeight: 1.5, color: "#7dffb0", textAlign: "right" }}>
        A tanker berths at every rig every 4 hours.
        <br />
        Same ship for everyone.
      </div>
    </AbsoluteFill>
  );
}

/** The bill of lading in the column: the order, filling as the rig loads, stamped when it's full. */
function Ticket({ frame }: { frame: number }) {
  const { fps } = useVideoConfig();
  if (frame < s2f(RADAR) || frame >= s2f(END)) return null;
  const t = frame / fps;
  const loaded = t >= FILLED_AT ? ORDER.qty : 0;
  const fill = interpolate(t, [FILLED_AT, FILLED_AT + 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stamp = spring({ frame: frame - s2f(FILLED_AT + 0.5), fps, config: { damping: 8, stiffness: 260 } });
  const come = spring({ frame: frame - s2f(RADAR), fps, config: { damping: 13, stiffness: 180 } });
  const sailing = t >= RADAR + 10;
  return (
    <div style={{ position: "absolute", left: 40, top: 150, width: 410, translate: `${(1 - come) * -500}px 0` }}>
      <div style={{ position: "relative", padding: "26px 26px 110px", background: "#fff7e3", boxShadow: `${ring(6)}, 8px 10px 0 rgba(0,0,0,0.25)`, rotate: "-1.5deg" }}>
        <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 20, color: C.red, letterSpacing: 2 }}>Bill of lading</div>
        <div style={{ marginTop: 8, fontFamily: font.display, fontWeight: 700, fontSize: 34, color: C.ink }}>{ORDER.ship}</div>
        <div style={{ marginTop: 14, height: 3, background: C.ink }} />
        {[
          ["Wants", `${ORDER.qty} bbl ${ORDER.product}`],
          ["Price", `${ORDER.premium}x base`],
          ["Per barrel", `${ORDER.perBbl}`],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontFamily: font.display, fontWeight: 700, fontSize: 24, color: C.ink2 }}>
            <span>{k}</span>
            <span style={{ color: C.ink }}>{v}</span>
          </div>
        ))}
        <div style={{ marginTop: 18, fontFamily: font.display, fontWeight: 700, fontSize: 22, color: C.ink2 }}>
          Loaded {Math.round(loaded * fill)}/{ORDER.qty} bbl
        </div>
        <div style={{ marginTop: 6, height: 22, background: C.white, boxShadow: ring(3) }}>
          <div style={{ width: `${fill * 100}%`, height: "100%", background: C.leaf }} />
        </div>
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 6, fontFamily: font.display, fontWeight: 700, fontSize: 26, color: C.ink, opacity: fill }}>
          <span>+{PAID} coins</span>
          <span style={{ color: C.leaf }}>+{BONUS} full-order bonus</span>
        </div>
        {t >= FILLED_AT + 0.5 && (
          <div style={{ position: "absolute", right: 24, bottom: 24, rotate: "-10deg", scale: String(interpolate(stamp, [0, 1], [2.4, 1], { extrapolateRight: "clamp" })), opacity: Math.min(1, stamp * 2) }}>
            <div style={{ padding: "8px 18px", border: `6px solid ${C.red}`, fontFamily: font.logo, fontWeight: 700, fontSize: 40, color: C.red, letterSpacing: 4, background: "rgba(255,247,227,0.8)" }}>FILLED</div>
          </div>
        )}
      </div>
      <div style={{ marginTop: 34, fontFamily: font.logo, fontWeight: 700, fontSize: 24, color: C.sun, letterSpacing: 2 }}>{sailing ? "She sails with your barrels" : "Walk to the west rail and load"}</div>
    </div>
  );
}

export function TankerDay() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const end = spring({ frame: frame - s2f(END), fps, config: { damping: 11, stiffness: 180 } });
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {frame >= s2f(RADAR) && frame < s2f(END) && (
        <>
          <div style={{ position: "absolute", left: FRAME.x - 6, top: FRAME.y - 6, width: FW + 12, height: FH + 12, background: C.ink, boxShadow: `${ring(6)}, 0 0 0 12px ${C.sun}, 0 0 0 18px ${C.ink}` }} />
          <div style={{ position: "absolute", left: FRAME.x, top: FRAME.y, width: 1920, height: 1080, overflow: "hidden", transformOrigin: "0 0", transform: `scale(${FRAME.k})` }}>
            {SHOTS.map(([at, from, rate, len]) => (
              <Sequence key={at} from={s2f(at)} durationInFrames={s2f(len)} layout="none">
                <OffthreadVideo src={staticFile("footage/tanker.mp4")} muted trimBefore={s2f(from)} playbackRate={rate} style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }} />
              </Sequence>
            ))}
          </div>
          <div style={{ position: "absolute", left: FRAME.x, top: FRAME.y + FH + 34, display: "flex", gap: 14 }}>
            <Chip bg={C.sun} size={24}>
              <span style={{ fontFamily: font.logo }}>Every 4 hours</span>
            </Chip>
            <Chip bg={C.white} size={24}>
              <span style={{ fontFamily: font.logo }}>2x to 2.5x base price</span>
            </Chip>
            <Chip bg={C.leaf} color={C.white} size={24}>
              <span style={{ fontFamily: font.logo }}>Fill it: +25% bonus</span>
            </Chip>
          </div>
        </>
      )}
      <Ticket frame={frame} />
      <Radar frame={frame} />
      <PixelWipe frame={frame} start={s2f(RADAR) - 22} color="#071a12" />
      <PixelWipe frame={frame} start={s2f(END) - 22} />
      {frame >= s2f(END) && (
        <AbsoluteFill style={{ background: C.sun }}>
          <Sunburst turn={0.08} />
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, scale: String(end) }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 26 }}>
              <Spr rows={logo} palette={logoPalette} scale={6} style={{ boxShadow: ring(6) }} />
              <Spr rows={roughneck} palette={base} scale={12} />
            </div>
            <Title size={104}>Tanker</Title>
            <Title size={104} color={C.red}>
              Day
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
