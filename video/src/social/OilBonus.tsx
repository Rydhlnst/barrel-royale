import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { base, logo, logoPalette, roughneck } from "@/components/pixel/sprites";
import { C, Chip, font, PixelWipe, ring, Spr, Sunburst, Title } from "../brand";

// Oil Bonus: a "take a number" ticket dispenser. The ticket comes out, then the real game in two shots (shown
// whole so the HUD stays in view): signing up puts the wallet in line, and a later round's claim sends the XOM
// to the wallet. A three-step tracker beside the footage lights each step as it happens.

export const OIL_BONUS_SECONDS = 18;
const s2f = (s: number) => Math.round(s * 60);
const RATE = 1.4;
const OPEN = 3.6;
const SIGN_FROM = 1.6;
const SIGN_TO = 8.4;
const END1 = OPEN + (SIGN_TO - SIGN_FROM) / RATE;
const ROUND = END1;
const OPEN2 = ROUND + 1.8;
const CLAIM_FROM = 1.4;
const CLAIM_TO = 7.8;
const END2 = OPEN2 + (CLAIM_TO - CLAIM_FROM) / RATE;
const CARD = END2;
/** When each step lands, from the marks in the footage. */
const QUEUED = OPEN + (5.864 - SIGN_FROM) / RATE;
const SENT = OPEN2 + (5.251 - CLAIM_FROM) / RATE;
const TICKET = 1.2;

function Ticket({ w, number = 1 }: { w: number; number?: number }) {
  const h = Math.round(w * 0.56);
  const notch = Math.round(w * 0.05);
  return (
    <div
      style={{
        width: w,
        height: h,
        background: "#fff6dc",
        boxShadow: ring(6),
        WebkitMaskImage: `radial-gradient(circle at 0 50%, transparent ${notch}px, #000 ${notch + 1}px), radial-gradient(circle at 100% 50%, transparent ${notch}px, #000 ${notch + 1}px)`,
        WebkitMaskComposite: "source-in",
        maskComposite: "intersect",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: w * 0.02,
      }}
    >
      <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: w * 0.075, color: C.red, letterSpacing: 3 }}>Oil Bonus</div>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: w * 0.2, color: C.ink, lineHeight: 1 }}>No. {number}</div>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: w * 0.07, color: C.leaf }}>$0.10 in XOM</div>
    </div>
  );
}

/** The dispenser, with the ticket sliding out at `at` seconds. */
function Dispenser({ t, frame, at }: { t: number; frame: number; at: number }) {
  const out = spring({ frame: frame - s2f(at), fps: 60, config: { damping: 14, stiffness: 120 } });
  return (
    <div style={{ position: "relative", width: 420, height: 560 }}>
      {/* the ticket comes out of the slot, under the machine's lip */}
      <div style={{ position: "absolute", left: 50, top: 120 + Math.round(out * 180), transform: `rotate(${-4 * out}deg)`, opacity: t >= at ? 1 : 0 }}>
        <Ticket w={320} />
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width: 420, height: 330, background: C.red, boxShadow: `${ring(8)}, inset 0 -18px 0 ${C.redDeep}` }}>
        <div style={{ position: "absolute", left: 40, top: 40, right: 40, padding: "16px 0", background: C.white, boxShadow: ring(5), textAlign: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: C.ink, letterSpacing: 2, whiteSpace: "nowrap" }}>
          Take a number
        </div>
        <div style={{ position: "absolute", left: 120, top: 150, width: 180, height: 90, background: C.sun, boxShadow: ring(5), display: "grid", placeItems: "center", fontFamily: font.display, fontWeight: 700, fontSize: 56, color: C.ink }}>
          {t >= at ? "01" : "00"}
        </div>
        <div style={{ position: "absolute", left: 40, bottom: 18, width: 340, height: 16, background: C.ink }} />
      </div>
    </div>
  );
}

const STEPS = [
  { at: QUEUED, n: "1", title: "Sign up", body: "A free signature" },
  { at: ROUND + 0.4, n: "2", title: "Weekly round", body: "Pays the line in order" },
  { at: SENT, n: "3", title: "Claim", body: "Straight to your wallet" },
];

/** The tracker beside the footage: each step lights when it happens. */
function Tracker({ t, frame }: { t: number; frame: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 420 }}>
      {STEPS.map((s) => {
        const on = t >= s.at;
        const k = on ? spring({ frame: frame - s2f(s.at), fps: 60, config: { damping: 10, stiffness: 220 } }) : 0;
        return (
          <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 18, padding: "16px 18px", background: on ? C.white : "#24324d", boxShadow: ring(6), scale: String(1 + (1 - k) * (on ? 0.12 : 0)) }}>
            <div style={{ width: 64, height: 64, flex: "none", display: "grid", placeItems: "center", background: on ? C.leaf : "#3a4766", color: C.white, fontFamily: font.display, fontWeight: 700, fontSize: 36, boxShadow: ring(4) }}>{on ? "✓" : s.n}</div>
            <div>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 30, color: on ? C.ink : "#93a0bd" }}>{s.title}</div>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20, color: on ? C.ink2 : "#6e7a96", marginTop: 4 }}>{s.body}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Frame({ src, from, to, start, end }: { src: string; from: number; to: number; start: number; end: number }) {
  const k = 0.72;
  const x = 500;
  const y = 150;
  const FW = Math.round(1920 * k);
  const FH = Math.round(1080 * k);
  void to;
  return (
    <>
      <div style={{ position: "absolute", left: x - 6, top: y - 6, width: FW + 12, height: FH + 12, background: C.ink, boxShadow: `${ring(6)}, 0 0 0 12px ${C.sun}, 0 0 0 18px ${C.ink}` }} />
      <div style={{ position: "absolute", left: x, top: y, width: 1920, height: 1080, overflow: "hidden", transformOrigin: "0 0", transform: `scale(${k})` }}>
        <Sequence from={s2f(start)} durationInFrames={s2f(end - start)} layout="none">
          <OffthreadVideo src={staticFile(src)} muted trimBefore={s2f(from)} playbackRate={RATE} style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }} />
        </Sequence>
      </div>
      <div style={{ position: "absolute", left: x, top: y + FH + 34, display: "flex", gap: 14 }}>
        {["500,000 $ROYAL holders", "Free sign-up", "Paid from the vault"].map((n) => (
          <Chip key={n} bg={C.sun} size={22}>
            <span style={{ fontFamily: font.logo }}>{n}</span>
          </Chip>
        ))}
      </div>
    </>
  );
}

export function OilBonus() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const end = spring({ frame: frame - s2f(CARD), fps, config: { damping: 11, stiffness: 180 } });
  const stamp = spring({ frame: frame - s2f(ROUND + 0.3), fps, config: { damping: 9, stiffness: 240 } });
  const paid = spring({ frame: frame - s2f(SENT), fps, config: { damping: 10, stiffness: 200 } });
  const inFootage = (t >= OPEN && t < END1) || (t >= OPEN2 && t < END2);
  return (
    <AbsoluteFill style={{ background: "#141c2e", overflow: "hidden" }}>
      <AbsoluteFill style={{ backgroundImage: "radial-gradient(#1f2a44 3px, transparent 4px)", backgroundSize: "48px 48px" }} />

      {/* the hook: take a number */}
      {t < OPEN && (
        <AbsoluteFill style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 110, paddingBottom: 60 }}>
          <Dispenser t={t} frame={frame} at={TICKET} />
          <div style={{ width: 660 }}>
            <Chip bg={C.red} color={C.white} size={24}>
              <span style={{ fontFamily: font.logo }}>Live on the rig</span>
            </Chip>
            <Title size={116} color={C.sun} style={{ marginTop: 22 }}>
              Oil Bonus
            </Title>
            <div style={{ marginTop: 18, fontFamily: font.display, fontWeight: 700, fontSize: 38, lineHeight: 1.4, color: C.sunPale, opacity: interpolate(t, [TICKET + 0.3, TICKET + 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
              $0.10 in XOM for every holder wallet, paid from the reward vault.
            </div>
          </div>
        </AbsoluteFill>
      )}

      {t >= OPEN && t < END1 && <Frame src="footage/oil-bonus-signup.mp4" from={SIGN_FROM} to={SIGN_TO} start={OPEN} end={END1} />}
      {t >= OPEN2 && t < END2 && <Frame src="footage/oil-bonus-claim.mp4" from={CLAIM_FROM} to={CLAIM_TO} start={OPEN2} end={END2} />}

      {/* between the shots: the weekly round */}
      {t >= ROUND && t < OPEN2 && (
        <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28 }}>
          <div style={{ padding: "26px 54px", background: C.sun, boxShadow: ring(10), transform: `rotate(-4deg) scale(${0.6 + stamp * 0.4})`, fontFamily: font.logo, fontWeight: 700, fontSize: 88, color: C.ink, letterSpacing: 4 }}>
            Round posted
          </div>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 40, color: C.sunPale, opacity: stamp }}>Claims open two days later</div>
        </AbsoluteFill>
      )}

      {inFootage && (
        <>
          <div style={{ position: "absolute", left: 50, top: 40 }}>
            <Title size={58} color={C.sun}>
              Oil Bonus
            </Title>
          </div>
          <div style={{ position: "absolute", left: 40, top: 150 }}>
            <Tracker t={t} frame={frame} />
          </div>
          {t >= SENT && (
            <div style={{ position: "absolute", left: 40, top: 620, width: 420, padding: "18px 20px", background: "#d8f3e6", boxShadow: ring(6), scale: String(0.7 + paid * 0.3) }}>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 40, color: C.leaf }}>+0.00055 XOM</div>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 22, color: C.ink, marginTop: 6 }}>sent to your wallet</div>
            </div>
          )}
        </>
      )}

      <PixelWipe frame={frame} start={s2f(OPEN) - 22} color="#141c2e" />
      <PixelWipe frame={frame} start={s2f(ROUND) - 22} color="#141c2e" />
      <PixelWipe frame={frame} start={s2f(OPEN2) - 22} color="#141c2e" />
      <PixelWipe frame={frame} start={s2f(CARD) - 22} />
      {t >= CARD && (
        <AbsoluteFill style={{ background: C.sun }}>
          <Sunburst turn={0.08} />
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, scale: String(end) }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 26 }}>
              <Spr rows={logo} palette={logoPalette} scale={6} style={{ boxShadow: ring(6) }} />
              <div style={{ transform: "rotate(-6deg)" }}>
                <Ticket w={260} />
              </div>
              <Spr rows={roughneck} palette={base} scale={12} />
            </div>
            <Title size={104}>Oil Bonus</Title>
            <Title size={104} color={C.red}>
              $0.10 in XOM
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
