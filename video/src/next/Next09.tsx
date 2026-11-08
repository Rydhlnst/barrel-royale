import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { base, icons, logo, logoPalette, roughneck } from "@/components/pixel/sprites";
import { C, Chip, ease, font, ring, SeaScene, Spr, Title } from "../brand";

// next09, holder pass: your wallet is a key card. It's swiped through the reader at the rig's gate, the
// reader ticks off the checks (connected, Robinhood Chain, 1,000,000 $ROYAL), stamps PASS, the hazard doors
// slide apart onto the real rig (the whole recording, scaled into the gate so its HUD stays in view), and
// a brass plaque beside it notes the rig is saved to your wallet address.

export const NEXT09_SECONDS = 15;

const s2f = (s: number) => Math.round(s * 60);
const ADDRESS = "0x7a3f…c91e";
const GATE = { x: 780, y: 200, w: 1056, h: 594 };
const READER = { x: 430, y: 330 };
const SWIPE = { from: s2f(1.4), to: s2f(2.4) };
const CHECKS = [
  { at: 2.7, label: "Wallet connected", sub: "Free, no transaction" },
  { at: 3.7, label: "Robinhood Chain", sub: "Right network" },
  { at: 4.7, label: "1,000,000 $ROYAL", sub: "Holder pass", count: true },
];
const STAMP = s2f(6.3);
const OPEN = { from: s2f(6.9), to: s2f(7.9) };
const PLAQUE = s2f(8.4);
const END = s2f(12.7);

function KeyCard({ w = 520, flip = 0 }: { w?: number; flip?: number }) {
  const h = Math.round(w * 0.62);
  const back = flip > 0.5;
  return (
    <div style={{ width: w, height: h, position: "relative", transform: `scaleX(${Math.abs(Math.cos(flip * Math.PI))})` }}>
      <div style={{ position: "absolute", inset: 0, background: back ? C.ink : C.sun, boxShadow: `${ring(8)}, 0 14px 0 4px ${C.sunDeep}`, overflow: "hidden" }}>
        {!back ? (
          <>
            <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.62, height: h * 0.12, background: "linear-gradient(90deg, #ff9ad5, #9ad8ff, #a6ffcb, #ffe98a)" }} />
            <div style={{ position: "absolute", left: w * 0.06, top: h * 0.1, fontFamily: font.logo, fontWeight: 700, fontSize: w * 0.05, color: C.ink, letterSpacing: 3 }}>Wallet pass</div>
            <div style={{ position: "absolute", left: w * 0.06, top: h * 0.28, width: w * 0.16, height: h * 0.2, background: C.sunPale, boxShadow: ring(4) }}>
              <div style={{ position: "absolute", left: "30%", top: 0, bottom: 0, width: 4, background: C.sunDeep }} />
              <div style={{ position: "absolute", top: "45%", left: 0, right: 0, height: 4, background: C.sunDeep }} />
            </div>
            <div style={{ position: "absolute", right: w * 0.06, top: h * 0.08 }}>
              <Spr rows={logo} palette={logoPalette} scale={Math.max(1, Math.round(w / 260))} style={{ boxShadow: ring(4) }} />
            </div>
            <div style={{ position: "absolute", right: w * 0.08, top: h * 0.3 }}>
              <Spr rows={roughneck} palette={base} scale={Math.max(2, Math.round(w / 110))} />
            </div>
            <div style={{ position: "absolute", left: w * 0.06, bottom: h * 0.08, fontFamily: font.display, fontWeight: 700, fontSize: w * 0.075, color: C.ink }}>{ADDRESS}</div>
          </>
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: h * 0.06 }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.1, height: h * 0.14, background: C.ink2 }} />
            <span style={{ marginTop: h * 0.12, fontFamily: font.logo, fontWeight: 700, fontSize: w * 0.06, color: C.sun }}>barrelroyale.io/play</span>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: w * 0.05, color: C.white }}>@barrelroyale</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Reader({ frame, fps }: { frame: number; fps: number }) {
  const t = frame / fps;
  const passed = frame >= STAMP;
  return (
    <div style={{ position: "absolute", left: READER.x, top: READER.y }}>
      <div style={{ position: "absolute", left: 60, top: 560, width: 80, height: 300, background: C.steelDeep, boxShadow: ring(6) }} />
      <div style={{ position: "relative", width: 300, height: 580, background: C.steel, boxShadow: `${ring(8)}, 0 0 0 14px ${C.steelDeep}, 0 0 0 20px ${C.ink}` }}>
        {/* the card slot */}
        <div style={{ position: "absolute", left: 270, top: 30, width: 16, height: 300, background: C.ink }} />
        {/* the screen */}
        <div style={{ position: "absolute", left: 22, top: 26, width: 230, height: 360, background: "#0b1a14", boxShadow: ring(5), padding: "16px 12px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 14 }}>
          {CHECKS.map((c) => {
            const on = t >= c.at + 0.5;
            const show = t >= c.at;
            const n = c.count ? Math.round(interpolate(t, [c.at, c.at + 1.2], [0, 1_000_000], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })) : 0;
            return (
              <div key={c.label} style={{ opacity: show ? 1 : 0.15, display: "flex", gap: 10 }}>
                <div style={{ flex: "none", width: 24, height: 24, background: on ? "#3dff9a" : C.ink2, boxShadow: `0 0 0 3px ${C.ink}`, display: "grid", placeItems: "center", fontFamily: font.logo, fontSize: 18, color: C.ink }}>{on ? "✓" : ""}</div>
                <div>
                  <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20, lineHeight: 1.1, color: "#7dffb0" }}>{c.count && show && !on ? `${n.toLocaleString("en-US")} $ROYAL` : c.label}</div>
                  <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: "#3c8d63" }}>{c.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
        {/* the light */}
        <div style={{ position: "absolute", left: 100, top: 420, width: 76, height: 76, background: passed ? "#3dff9a" : frame >= SWIPE.to ? C.sun : C.redLight, boxShadow: `${ring(6)}, 0 0 ${passed ? 40 : 0}px 10px rgba(61,255,154,0.6)` }} />
        {passed && (
          <div style={{ position: "absolute", left: -40, top: 140, rotate: "-14deg", scale: String(interpolate(spring({ frame: frame - STAMP, fps, config: { damping: 8, stiffness: 260 } }), [0, 1], [2.4, 1], { extrapolateRight: "clamp" })), padding: "8px 30px", background: C.leaf, boxShadow: `${ring(6)}, 0 0 0 12px ${C.white}, 0 0 0 16px ${C.ink}`, fontFamily: font.logo, fontWeight: 700, fontSize: 72, color: C.white, letterSpacing: 8 }}>
            Pass
          </div>
        )}
      </div>
    </div>
  );
}

export function Next09() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - 6, fps, config: { damping: 13, stiffness: 140 } });
  // the card: in from the left, then down through the reader's slot
  const swipe = interpolate(frame, [SWIPE.from, SWIPE.to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const cardW = interpolate(swipe, [0, 0.35, 1], [560, 300, 300]);
  const cardX = interpolate(swipe, [0, 0.35, 1], [140 + (1 - enter) * -900, READER.x + 300 - 30, READER.x + 300 - 30]);
  const cardY = interpolate(swipe, [0, 0.35, 1], [520, READER.y - 60, READER.y + 360]);
  const cardRot = interpolate(swipe, [0, 0.35], [-8, 90], { extrapolateRight: "clamp" });
  const open = interpolate(frame, [OPEN.from, OPEN.to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const plaque = spring({ frame: frame - PLAQUE, fps, config: { damping: 12 } });
  const endIn = spring({ frame: frame - END, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ background: C.foam, overflow: "hidden" }}>
      {/* the harbor behind the gate */}
      <AbsoluteFill style={{ background: `linear-gradient(${C.sunPale}, ${C.foam} 55%)` }} />
      <div style={{ position: "absolute", left: 0, top: -60 }}>
        <SeaScene frame={frame} y={420} boatX={40} />
      </div>
      <div style={{ position: "absolute", left: 0, top: 960, width: 1920, height: 120, background: C.steelDeep, boxShadow: `0 -8px 0 ${C.ink}` }} />

      {/* the gate: the rig behind two hazard doors that slide apart inside the frame */}
      <div style={{ position: "absolute", left: GATE.x, top: GATE.y, width: GATE.w, height: GATE.h, overflow: "hidden", background: C.ink, boxShadow: `0 0 0 30px ${C.steel}, 0 0 0 36px ${C.ink}, 0 0 0 42px ${C.steelDeep}`, zIndex: 2 }}>
        {frame >= OPEN.from - 2 && (
          <Sequence from={OPEN.from - 2} layout="none">
            <OffthreadVideo src={staticFile("footage/play.mp4")} muted trimBefore={s2f(0.5)} style={{ position: "absolute", left: 0, top: 0, width: GATE.w, height: GATE.h }} />
          </Sequence>
        )}
        {open < 1 &&
          [0, 1].map((side) => (
            <div
              key={side}
              style={{
                position: "absolute",
                top: 0,
                left: side ? GATE.w / 2 : 0,
                width: GATE.w / 2,
                height: GATE.h,
                translate: `${(side ? 1 : -1) * open * (GATE.w / 2)}px 0`,
                background: `repeating-linear-gradient(${side ? 45 : -45}deg, ${C.sun} 0 40px, ${C.ink} 40px 80px)`,
                boxShadow: `inset 0 0 0 8px ${C.ink}`,
              }}
            >
              <div style={{ position: "absolute", left: side ? 30 : GATE.w / 2 - 110, top: GATE.h / 2 - 50, width: 80, height: 100, background: C.steel, boxShadow: ring(5) }} />
            </div>
          ))}
      </div>

      {frame < PLAQUE + 10 && (
        <div style={{ position: "absolute", inset: 0, translate: `0 ${interpolate(frame, [PLAQUE - 20, PLAQUE + 10], [0, 1100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease })}px` }}>
          <Reader frame={frame} fps={fps} />
        </div>
      )}

      {/* the card */}
      {frame < SWIPE.to + 4 && (
        <div style={{ position: "absolute", left: cardX, top: cardY, rotate: `${cardRot}deg`, transformOrigin: "0 0", zIndex: 3 }}>
          <KeyCard w={cardW} />
        </div>
      )}

      {/* the copy */}
      {frame < END && (
        <div style={{ position: "absolute", left: 70, top: 60, zIndex: 4 }}>
          <Title size={70} color={C.sun}>
            Your wallet
          </Title>
          <Title size={70}>is your key</Title>
        </div>
      )}

      {/* the plaque: your rig is saved to your address */}
      {frame >= PLAQUE && frame < END && (
        <div style={{ position: "absolute", left: 60, top: 520, width: 620, boxSizing: "border-box", zIndex: 30, translate: `${(1 - plaque) * -900}px 0`, padding: "24px 28px", background: "#c9932f", boxShadow: `${ring(8)}, inset 0 0 0 8px #e8b452, inset 0 0 0 12px #8a5a1c`, display: "flex", alignItems: "center", gap: 26 }}>
          <Spr rows={icons.hardHat} palette={base} scale={5} />
          <div>
            <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: C.ink, letterSpacing: 2 }}>Rig saved to</div>
            <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.ink, letterSpacing: 2 }}>{ADDRESS}</div>
            <div style={{ marginTop: 6, fontFamily: font.display, fontWeight: 700, fontSize: 26, color: "#4a2f0e" }}>Ready whenever you come back</div>
          </div>
        </div>
      )}
      {frame >= PLAQUE && frame < END && (
        <div style={{ position: "absolute", left: 70, top: 380, zIndex: 30, scale: String(plaque), transformOrigin: "0 50%" }}>
          <Chip bg={C.leaf} color={C.white} size={40}>
            <span style={{ fontFamily: font.logo }}>Welcome aboard</span>
          </Chip>
        </div>
      )}

      {frame >= END && (
        <AbsoluteFill style={{ zIndex: 40, background: C.sun, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40 }}>
          <AbsoluteFill style={{ background: `repeating-linear-gradient(-45deg, rgba(30,42,74,0.07) 0 40px, transparent 40px 80px)` }} />
          <div style={{ scale: String(endIn) }}>
            <KeyCard w={720} flip={interpolate(frame, [END + 30, END + 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
          </div>
          <Title size={66}>Hold 1,000,000 $ROYAL to play</Title>
          <div style={{ display: "flex", gap: 18 }}>
            <Chip bg={C.white} size={36}>
              <span style={{ fontFamily: font.logo }}>barrelroyale.io/play</span>
            </Chip>
            <Chip bg={C.ink} color={C.sun} size={36}>
              <span style={{ fontFamily: font.logo }}>@barrelroyale</span>
            </Chip>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}
