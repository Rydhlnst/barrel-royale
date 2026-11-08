import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { base, icons, logo, logoPalette, roughneck } from "@/components/pixel/sprites";
import { C, Chip, font, PixelWipe, ring, Spr, Sunburst, Title } from "../brand";

// Double Pay: a pay envelope. A "2x" stamp slams onto it, then the real game (footage/double-pay.mp4, shown
// whole so the HUD stays in view) plays beside a pay slip that writes each payout in step with the toast in
// the footage. A gate card shows the rig opening at 500,000 $ROYAL, then the end card.

export const DOUBLE_PAY_SECONDS = 18;
const s2f = (s: number) => Math.round(s * 60);
const OPEN = 3.6;
const FROM = 0.4;
const RATE = 1.6;
const at = (footage: number) => OPEN + (footage - FROM) / RATE;
const END = at(12.6);
const GATE = END;
const CARD = GATE + 3.2;
const STAMP = 1.3;

/** The payouts, at the second their toast shows in the footage. */
const LINES = [
  { t: at(8.0), what: "Export 50 bbl heavy", pay: "+0.0000029 XOM" },
  { t: at(10.2), what: "Sell 174 bbl", pay: "+951 coins" },
];

function Stamp({ size, angle = -12 }: { size: number; angle?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size * 0.72,
        display: "grid",
        placeItems: "center",
        background: C.red,
        color: C.white,
        boxShadow: `inset 0 0 0 ${size * 0.05}px ${C.white}, 0 0 0 ${size * 0.04}px ${C.redDeep}`,
        transform: `rotate(${angle}deg)`,
        fontFamily: font.display,
        fontWeight: 700,
        fontSize: size * 0.48,
        lineHeight: 1,
      }}
    >
      2×
    </div>
  );
}

/** The pay envelope, with the 2x stamp landing at `stampAt` seconds. */
function Envelope({ t, frame, w, stampAt }: { t: number; frame: number; w: number; stampAt: number }) {
  const h = Math.round(w * 0.64);
  const k = spring({ frame: frame - s2f(stampAt), fps: 60, config: { damping: 9, stiffness: 260 } });
  const landed = t >= stampAt;
  const shake = landed ? Math.round(Math.sin((t - stampAt) * 60) * 8 * Math.max(0, 1 - (t - stampAt) / 0.3)) : 0;
  return (
    <div style={{ position: "relative", width: w, height: h, transform: `translate(${shake}px, ${-shake}px)` }}>
      <div style={{ position: "absolute", inset: 0, background: "#c9a368", boxShadow: `${ring(8)}, inset 0 -14px 0 #a8834c` }} />
      {/* the flap */}
      <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h * 0.5, background: "#b8935a", clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} />
      <div style={{ position: "absolute", left: w * 0.08, bottom: h * 0.12, fontFamily: font.logo, fontWeight: 700, fontSize: w * 0.075, color: C.ink, letterSpacing: 2 }}>Pay · Roughneck</div>
      <div style={{ position: "absolute", left: w * 0.08, bottom: h * 0.3, display: "flex", alignItems: "center", gap: 12, fontFamily: font.display, fontWeight: 700, fontSize: w * 0.09, color: landed ? "#8a6a3a" : C.ink }}>
        <Spr rows={icons.coin} palette={base} scale={Math.round(w / 90)} />
        <span style={{ textDecoration: landed ? "line-through" : "none", textDecorationThickness: 6 }}>1×</span>
      </div>
      {t >= stampAt - 0.25 && (
        <div style={{ position: "absolute", right: w * 0.03, top: h * 0.06, scale: String(landed ? 1 + (1 - k) * 0.3 : 3 - (t - (stampAt - 0.25)) * 8), opacity: landed ? 1 : 0.6 }}>
          <Stamp size={w * 0.42} />
        </div>
      )}
    </div>
  );
}

/** The pay slip beside the footage: one line per payout, stamped 2x as it lands. */
function Slip({ t, frame }: { t: number; frame: number }) {
  return (
    <div style={{ width: 430, padding: 24, background: "#fffaf0", boxShadow: ring(8), backgroundImage: "repeating-linear-gradient(0deg, transparent 0 46px, #e6dcc6 46px 48px)" }}>
      <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.ink, letterSpacing: 2 }}>Pay slip</div>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 22, color: C.red, marginTop: 6 }}>Double Pay · every line 2×</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 26 }}>
        {LINES.map((l) => {
          const on = t >= l.t;
          const k = on ? spring({ frame: frame - s2f(l.t), fps: 60, config: { damping: 10, stiffness: 220 } }) : 0;
          return (
            <div key={l.what} style={{ position: "relative", minHeight: 96, paddingRight: 100, opacity: on ? 1 : 0.25 }}>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 24, color: C.ink }}>{on ? l.what : "…"}</div>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 26, color: C.leaf, marginTop: 6, whiteSpace: "nowrap" }}>{on ? l.pay : ""}</div>
              {on && (
                <div style={{ position: "absolute", right: 0, top: 8, scale: String(0.6 + k * 0.4) }}>
                  <Stamp size={82} angle={-8} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DoublePay() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const FRAME = { k: 0.72, x: 500, y: 150 };
  const FW = Math.round(1920 * FRAME.k);
  const FH = Math.round(1080 * FRAME.k);
  const end = spring({ frame: frame - s2f(CARD), fps, config: { damping: 11, stiffness: 180 } });
  const gate = spring({ frame: frame - s2f(GATE + 0.3), fps, config: { damping: 12, stiffness: 170 } });
  const cut = interpolate(t, [GATE + 0.9, GATE + 1.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const half = spring({ frame: frame - s2f(GATE + 1.4), fps, config: { damping: 9, stiffness: 240 } });
  return (
    <AbsoluteFill style={{ background: "#173326", overflow: "hidden" }}>
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(0deg, #1c3d2d 0 4px, #173326 4px 64px), repeating-linear-gradient(90deg, #1c3d2d 0 4px, transparent 4px 64px)" }} />

      {/* the hook: the envelope gets stamped */}
      {t < OPEN && (
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 90 }}>
          <Envelope t={t} frame={frame} w={600} stampAt={STAMP} />
          <div style={{ width: 640 }}>
            <Chip bg={C.red} color={C.white} size={24}>
              <span style={{ fontFamily: font.logo }}>Live on the rig</span>
            </Chip>
            <Title size={110} color={C.sun} style={{ marginTop: 22 }}>
              Double Pay
            </Title>
            <div style={{ marginTop: 18, fontFamily: font.display, fontWeight: 700, fontSize: 38, lineHeight: 1.4, color: C.sunPale, opacity: t >= STAMP ? 1 : 0 }}>48 hours. Every sale and every export pays 2×.</div>
          </div>
        </AbsoluteFill>
      )}

      {/* the proof: the real game beside the pay slip */}
      {t >= OPEN && t < END && (
        <>
          <div style={{ position: "absolute", left: FRAME.x - 6, top: FRAME.y - 6, width: FW + 12, height: FH + 12, background: C.ink, boxShadow: `${ring(6)}, 0 0 0 12px ${C.sun}, 0 0 0 18px ${C.ink}` }} />
          <div style={{ position: "absolute", left: FRAME.x, top: FRAME.y, width: 1920, height: 1080, overflow: "hidden", transformOrigin: "0 0", transform: `scale(${FRAME.k})` }}>
            <Sequence from={s2f(OPEN)} durationInFrames={s2f(END - OPEN)} layout="none">
              <OffthreadVideo src={staticFile("footage/double-pay.mp4")} muted trimBefore={s2f(FROM)} playbackRate={RATE} style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }} />
            </Sequence>
          </div>
          <div style={{ position: "absolute", left: 34, top: 150 }}>
            <Slip t={t} frame={frame} />
          </div>
          <div style={{ position: "absolute", left: 60, top: 40, display: "flex", alignItems: "center", gap: 18 }}>
            <Stamp size={86} angle={-6} />
            <Title size={58} color={C.sun}>
              Double Pay
            </Title>
          </div>
          <div style={{ position: "absolute", left: FRAME.x, top: FRAME.y + FH + 34, display: "flex", gap: 14 }}>
            {["Market", "Dispatch", "Tankers", "Exports"].map((n) => (
              <Chip key={n} bg={C.sun} size={22}>
                <span style={{ fontFamily: font.logo }}>{n} 2×</span>
              </Chip>
            ))}
          </div>
        </>
      )}

      {/* the gate: the rig opens at 500,000 $ROYAL */}
      {t >= GATE && t < CARD && (
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 80 }}>
          <Spr rows={roughneck} palette={base} scale={16} style={{ scale: String(gate) }} />
          <div style={{ padding: "44px 60px", background: C.white, boxShadow: ring(10), scale: String(0.8 + gate * 0.2) }}>
            <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 34, color: C.ink, letterSpacing: 3 }}>Rig access</div>
            <div style={{ position: "relative", width: "fit-content", marginTop: 18, fontFamily: font.display, fontWeight: 700, fontSize: 64, color: "#7d8799" }}>
              1,000,000
              <div style={{ position: "absolute", left: -10, top: "48%", height: 12, width: `calc(${cut * 100}% + 20px)`, background: C.red }} />
            </div>
            <div style={{ marginTop: 10, fontFamily: font.display, fontWeight: 700, fontSize: 104, color: C.ink, scale: String(half), transformOrigin: "0 50%" }}>500,000</div>
            <div style={{ marginTop: 12, fontFamily: font.display, fontWeight: 700, fontSize: 36, color: C.leaf, opacity: half }}>$ROYAL opens the rig</div>
          </div>
        </AbsoluteFill>
      )}

      <PixelWipe frame={frame} start={s2f(OPEN) - 22} color="#173326" />
      <PixelWipe frame={frame} start={s2f(GATE) - 22} color="#173326" />
      <PixelWipe frame={frame} start={s2f(CARD) - 22} />
      {t >= CARD && (
        <AbsoluteFill style={{ background: C.sun }}>
          <Sunburst turn={0.08} />
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, scale: String(end) }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 26 }}>
              <Spr rows={logo} palette={logoPalette} scale={6} style={{ boxShadow: ring(6) }} />
              <Stamp size={150} />
              <Spr rows={roughneck} palette={base} scale={12} />
            </div>
            <Title size={104}>Double pay</Title>
            <Title size={104} color={C.red}>
              for 48 hours
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
