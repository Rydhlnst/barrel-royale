import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { barrel, base, crate, crownBarrel, icons, logo, logoPalette, roughneck } from "@/components/pixel/sprites";
import { Burst, C, Chip, ease, font, Pointer, ramp, ring, snap, Spr, Title } from "../brand";

// next01: Daily Shift. The real Shift button lights up and gets tapped, then the shift is dealt as a
// hand of five cards on a felt table, the bars fill and two cards are claimed; then the real panel
// claims a few in a row. Also home to the helpers next02–05 share: Footage and EndCard.

export const NEXT01_SECONDS = 15;

export const s2f = (s: number) => Math.round(s * 60);

type Box = { x: number; y: number; w: number; h: number };

/**
 * A window onto a 1920×1080 recording: `view` is the part of the recording (left, top, width) that
 * fills `box`, so a narrow view zooms in. The clip plays from `from` seconds while this frame is
 * between `start` and `start + dur`.
 */
export function Footage({ src, from, rate = 1, start, dur, box, view, style, children }: { src: string; from: number; rate?: number; start: number; dur: number; box: Box; view: { x: number; y: number; w: number }; style?: React.CSSProperties; children?: React.ReactNode }) {
  const k = box.w / view.w;
  return (
    <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, overflow: "hidden", background: C.ink, ...style }}>
      <Sequence from={start} durationInFrames={dur} layout="none">
        <OffthreadVideo src={staticFile(`footage/${src}.mp4`)} muted trimBefore={s2f(from)} playbackRate={rate} style={{ position: "absolute", left: -view.x * k, top: -view.y * k, width: 1920 * k, height: 1080 * k }} />
      </Sequence>
      {children}
    </div>
  );
}

/** The sign-off: logo and roughneck, a line, the play link and the X handle. */
export function EndCard({ frame, start, line, bg = C.sun, ink = C.ink, accent = C.red, text = C.ink }: { frame: number; start: number; line: [string, string]; bg?: string; ink?: string; accent?: string; text?: string }) {
  const { fps } = useVideoConfig();
  const t = frame - start;
  if (t < 0) return null;
  const s = (d: number, damping = 11) => spring({ frame: t - d, fps, config: { damping, stiffness: 200 } });
  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {/* stepped bands rising from the bottom */}
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: snap(interpolate(s(i * 3, 16), [0, 1], [0, 90 + i * 70]), 10), background: i % 2 ? accent : ink, opacity: 0.12 + i * 0.06 }} />
      ))}
      <div style={{ position: "absolute", left: 230, top: 300, display: "flex", alignItems: "flex-end", gap: 30, scale: String(s(4)), transformOrigin: "50% 100%" }}>
        <Spr rows={logo} palette={logoPalette} scale={9} style={{ boxShadow: ring(8) }} />
        <Spr rows={roughneck} palette={base} scale={16} />
      </div>
      <div style={{ position: "absolute", left: 900, top: 250, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
        <div style={{ translate: `${(1 - s(10)) * 600}px 0` }}>
          <Title size={104} color={C.white}>
            {line[0]}
          </Title>
        </div>
        <div style={{ translate: `${(1 - s(16)) * 600}px 0` }}>
          <Title size={104} color={accent}>
            {line[1]}
          </Title>
        </div>
        <div style={{ marginTop: 36, scale: String(s(26, 9)), transformOrigin: "0 50%" }}>
          <Chip bg={C.white} size={46}>
            <span style={{ fontFamily: font.logo }}>barrelroyale.io/play</span>
          </Chip>
        </div>
        <div style={{ marginTop: 22, opacity: s(34), fontFamily: font.logo, fontWeight: 700, fontSize: 34, color: text, letterSpacing: 4 }}>@barrelroyale · $ROYAL</div>
      </div>
    </AbsoluteFill>
  );
}

/** The five tasks on the recorded shift, at rig level 5. */
const TASKS = [
  { text: "Collect 170 bbl from your wells", target: 170, end: 1, icon: barrel, band: C.sea },
  { text: "Sell 170 bbl on the market", target: 170, end: 1, icon: icons.coin, band: C.sunDeep },
  { text: "Earn 1,500 coins from sales and contracts", target: 1500, end: 1, icon: crownBarrel, band: C.red },
  { text: "Fill 3 Dispatch contracts", target: 3, end: 1, icon: crate, band: C.leaf },
  { text: "Pump on Overdrive for 135 seconds", target: 135, end: 0.3, icon: icons.gauge, band: "#7a4fc0" },
];

const FELT = "#0d5236";
const TABLE = { start: 130, deal: 170, fill: 262, claims: [372, 432], leave: 500 };
const CARD = { w: 290, h: 410 };
const spot = (i: number) => ({ x: 960 + (i - 2) * 318, y: 580 + Math.abs(i - 2) * 26, rot: (i - 2) * 6 });

function Card({ i, frame, fps }: { i: number; frame: number; fps: number }) {
  const t = TASKS[i];
  const dealAt = TABLE.deal + i * 16;
  const fly = spring({ frame: frame - dealAt, fps, config: { damping: 15, stiffness: 140 } });
  const p = spot(i);
  // dealt from the deck at the bottom, then swept off to the right when the table clears
  const away = ramp(frame, TABLE.leave + i * 4, 26);
  const x = interpolate(fly, [0, 1], [960, p.x]) + away * 1500;
  const y = interpolate(fly, [0, 1], [1260, p.y]) - away * 120;
  const rot = interpolate(fly, [0, 1], [-30, p.rot]) + away * 30;
  const fill = ramp(frame, TABLE.fill + i * 10, 50) * t.end;
  const claimAt = TABLE.claims[i] ?? 100_000;
  const claimed = frame >= claimAt;
  const lift = claimed ? spring({ frame: frame - claimAt, fps, config: { damping: 9, stiffness: 220 } }) : 0;
  const stamp = claimed ? spring({ frame: frame - claimAt - 4, fps, config: { damping: 8, stiffness: 260 } }) : 0;
  const segs = 16;
  const shown = Math.round(t.target * fill);
  if (frame < dealAt) return null;
  return (
    <div style={{ position: "absolute", left: x - CARD.w / 2, top: y - CARD.h / 2 - lift * 30, width: CARD.w, height: CARD.h, rotate: `${rot}deg`, background: claimed ? "#d8f3e6" : C.white, boxShadow: `${ring(7)}, 10px 14px 0 rgba(0,0,0,0.3)`, overflow: "hidden" }}>
      <div style={{ height: 110, background: t.band, display: "grid", placeItems: "center", borderBottom: `6px solid ${C.ink}` }}>
        <Spr rows={t.icon} palette={base} scale={6} />
      </div>
      <div style={{ padding: "16px 18px 0", height: 150, fontFamily: font.display, fontWeight: 700, fontSize: 31, lineHeight: 1.12, color: C.ink }}>{t.text}</div>
      <div style={{ margin: "0 18px", display: "flex", gap: 3, height: 26, padding: 4, background: C.ink }}>
        {Array.from({ length: segs }, (_, s) => (
          <div key={s} style={{ flex: 1, background: s < Math.round(fill * segs) ? (t.end < 1 ? C.sea : C.sunDeep) : "#2b3a62" }} />
        ))}
      </div>
      <div style={{ margin: "8px 18px 0", display: "flex", justifyContent: "space-between", fontFamily: font.display, fontWeight: 700, fontSize: 20, gap: 8, color: C.ink2 }}>
        <span>
          {shown.toLocaleString("en-US")}/{t.target.toLocaleString("en-US")}
        </span>
        <span style={{ color: C.ink }}>+300</span>
      </div>
      {fill >= 1 && !claimed && (
        <div style={{ position: "absolute", left: 18, right: 18, bottom: 18, padding: "8px 0", textAlign: "center", background: C.red, boxShadow: ring(4), fontFamily: font.display, fontWeight: 700, fontSize: 30, color: C.white }}>Claim</div>
      )}
      {claimed && (
        <div style={{ position: "absolute", left: 30, bottom: 30, rotate: "-10deg", scale: String(interpolate(stamp, [0, 1], [2.4, 1], { extrapolateRight: "clamp" })), padding: "6px 18px", border: `6px solid ${C.leaf}`, fontFamily: font.logo, fontWeight: 700, fontSize: 40, color: C.leaf, background: "rgba(255,255,255,0.7)" }}>
          +300
        </div>
      )}
    </div>
  );
}

export function Next01() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // A: the whole real frame, scaled down, with an arrow from outside it to the Shift button (tap near frame 84)
  const A = { x: 240, y: 230, w: 1440, h: 810 };
  const btn = { x: A.x + 375 * (A.w / 1920), y: A.y };
  const flipOut = interpolate(frame, [104, 124], [0, 90], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flipIn = interpolate(frame, [124, 146], [-90, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

  // C: real claims (footage from 5.2 s at 1.5×: taps near 535, 671, 726)
  const C0 = 512;
  const claimsAt = [535, 671, 726];
  const claims = claimsAt.filter((c) => frame >= c).length;
  const enterC = spring({ frame: frame - C0, fps, config: { damping: 14, stiffness: 120 } });

  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden", perspective: 1800 }}>
      {frame < 126 && (
        <AbsoluteFill style={{ transform: `rotateY(${flipOut}deg)`, transformOrigin: "50% 50%" }}>
          <AbsoluteFill style={{ background: FELT }} />
          <Footage src="shift" from={0.2} start={0} dur={130} box={A} view={{ x: 0, y: 0, w: 1920 }} style={{ boxShadow: `${ring(8)}, 16px 20px 0 rgba(0,0,0,0.3)` }} />
          {/* an arrow from above the frame down to the Shift button */}
          {frame > 16 && frame < 100 && (
            <div style={{ position: "absolute", left: btn.x - 26, top: btn.y - 96 - (Math.floor(frame / 10) % 2) * 10, width: 52, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 22, height: 44, background: C.sun, boxShadow: `0 0 0 5px ${C.ink}` }} />
              <div style={{ width: 0, height: 0, borderLeft: "26px solid transparent", borderRight: "26px solid transparent", borderTop: `30px solid ${C.sun}`, filter: `drop-shadow(0 4px 0 ${C.ink})` }} />
            </div>
          )}
          <div style={{ position: "absolute", left: 640, top: 60, scale: String(spring({ frame: frame - 12, fps, config: { damping: 10 } })), transformOrigin: "0 50%" }}>
            <Chip bg={C.red} color={C.white} size={52}>
              <span style={{ fontFamily: font.logo }}>New: Daily Shift</span>
            </Chip>
          </div>
        </AbsoluteFill>
      )}

      {/* B: the felt table */}
      {frame >= 124 && frame < C0 + 30 && (
        <AbsoluteFill style={{ transform: `rotateY(${flipIn}deg)`, background: FELT, overflow: "hidden" }}>
          <AbsoluteFill style={{ backgroundImage: "repeating-conic-gradient(rgba(255,255,255,0.035) 0 25%, transparent 0 50%)", backgroundSize: "12px 12px" }} />
          <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 0 26px ${C.woodDark}, inset 0 0 0 34px ${C.ink}` }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 70, display: "flex", flexDirection: "column", alignItems: "center", gap: 18, opacity: 1 - ramp(frame, TABLE.leave, 20) }}>
            <Title size={104} color={C.sun}>
              Daily Shift
            </Title>
            <Chip bg={C.white} size={34}>
              5 random tasks · new every UTC day
            </Chip>
          </div>
          {/* the deck the cards come from */}
          <div style={{ position: "absolute", left: 960 - 80, top: 1000, width: 160, height: 220, background: C.red, boxShadow: ring(6), backgroundImage: `repeating-linear-gradient(45deg, transparent 0 10px, rgba(255,255,255,0.18) 10px 20px)` }} />
          {TASKS.map((_, i) => (
            <Card key={i} i={i} frame={frame} fps={fps} />
          ))}
          {TABLE.claims.map((c, i) => (
            <Burst key={c} frame={frame} start={c + 2} x={spot(i).x - 30} y={spot(i).y + 60} count={14} rows={icons.coin} scale={5} speed={15} seed={`n1c${i}`} />
          ))}
          {frame >= TABLE.claims[0] - 50 && frame < TABLE.claims[1] + 20 && (
            <Pointer
              x={interpolate(frame, [TABLE.claims[0] - 50, TABLE.claims[0], TABLE.claims[1] - 30, TABLE.claims[1]], [spot(0).x + 40, spot(0).x + 10, spot(0).x + 10, spot(1).x + 10], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
              y={interpolate(frame, [TABLE.claims[0] - 50, TABLE.claims[0]], [spot(0).y + 280, spot(0).y + 168], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
              down={Math.abs(frame - TABLE.claims[0]) < 6 || Math.abs(frame - TABLE.claims[1]) < 6}
              scale={6}
            />
          )}
          {/* the facts, along the rail */}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 64, display: "flex", justifyContent: "center", gap: 18, opacity: 1 - ramp(frame, TABLE.leave, 16) }}>
            {["Pool of 12 tasks", "Targets grow with your rig", "25 to 1,200 coins a task", "Full shift pays 3×"].map((f, i) => (
              <div key={f} style={{ scale: String(spring({ frame: frame - 300 - i * 10, fps, config: { damping: 11 } })) }}>
                <Chip bg={i === 3 ? C.sun : C.sunPale} size={28}>
                  {f}
                </Chip>
              </div>
            ))}
          </div>
        </AbsoluteFill>
      )}

      {/* C: the real panel, claim after claim */}
      {frame >= C0 && frame < 770 && (
        <AbsoluteFill style={{ background: FELT, translate: `${(1 - enterC) * 1920}px 0` }}>
          <AbsoluteFill style={{ backgroundImage: "repeating-conic-gradient(rgba(255,255,255,0.035) 0 25%, transparent 0 50%)", backgroundSize: "12px 12px" }} />
          <Footage src="shift" from={5.2} rate={1.5} start={C0} dur={260} box={{ x: 640, y: 222, w: 1200, h: 675 }} view={{ x: 0, y: 0, w: 1920 }} style={{ boxShadow: `${ring(9)}, 18px 22px 0 rgba(0,0,0,0.35)` }} />
          <div style={{ position: "absolute", left: 90, top: 230, display: "flex", flexDirection: "column", gap: 6 }}>
            {claimsAt.map((c, i) => (
              <div key={c} style={{ opacity: frame >= c ? 1 : 0, translate: `${frame >= c ? (1 - spring({ frame: frame - c, fps, config: { damping: 12 } })) * -300 : 0}px 0` }}>
                <Title size={100} color={i === 2 ? C.sun : C.white}>
                  Claim.
                </Title>
              </div>
            ))}
            <div style={{ marginTop: 30, display: "flex", alignItems: "baseline", gap: 18 }}>
              <Title size={76} color={C.sun}>
                +{(claims * 300).toLocaleString("en-US")}
              </Title>
              <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 40, color: C.white }}>coins</span>
            </div>
          </div>
        </AbsoluteFill>
      )}

      <EndCard frame={frame} start={770} line={["Clock in", "every day"]} bg={FELT} ink={C.ink} accent={C.sun} text={C.sunPale} />
    </AbsoluteFill>
  );
}
