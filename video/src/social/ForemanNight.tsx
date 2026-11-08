import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { barrel, base, hat, icons, logo, logoPalette, roughneck } from "@/components/pixel/sprites";
import { C, Chip, font, PixelWipe, ring, SeaScene, snap, Spr, Stars, Sunburst, Title } from "../brand";

// The Rig Foreman, as a night shift: you hire him in the real game, close the laptop, and the rig works
// through a pixel night with the green hard hat walking the pads on his rounds while a clock spins six
// hours ahead. Dawn wipes back to the real game, where his report waits. The footage is always shown
// whole in its frame (footage/foremanhire.mp4, foremanback.mp4 from scripts/record.mjs).

export const FOREMAN_NIGHT_SECONDS = 17;
const s2f = (s: number) => Math.round(s * 60);
const NIGHT = { from: 4.6, to: 10.4 };
const BACK = 10.4;
const END = 14.6;

const FRAME = { k: 0.74, x: 460, y: 140 };
const FW = Math.round(1920 * FRAME.k);
const FH = Math.round(1080 * FRAME.k);
const green = hat(C.leaf, "#4fd08f");

function Footage({ src, from, frame, start, end, rate = 1 }: { src: string; from: number; frame: number; start: number; end: number; rate?: number }) {
  if (frame < s2f(start) || frame >= s2f(end)) return null;
  return (
    <>
      <div style={{ position: "absolute", left: FRAME.x - 6, top: FRAME.y - 6, width: FW + 12, height: FH + 12, background: C.ink, boxShadow: `${ring(6)}, 0 0 0 12px ${C.sun}, 0 0 0 18px ${C.ink}` }} />
      <div style={{ position: "absolute", left: FRAME.x, top: FRAME.y, width: 1920, height: 1080, overflow: "hidden", transformOrigin: "0 0", transform: `scale(${FRAME.k})` }}>
        <Sequence from={s2f(start)} durationInFrames={s2f(end - start)} layout="none">
          <OffthreadVideo src={staticFile(`footage/${src}.mp4`)} muted trimBefore={s2f(from)} playbackRate={rate} style={{ width: 1920, height: 1080 }} />
        </Sequence>
      </div>
    </>
  );
}

/** A caption in the column left of the frame. */
function Side({ frame, at, until, kicker, title, sub }: { frame: number; at: number; until: number; kicker: string; title: string; sub: string }) {
  const { fps } = useVideoConfig();
  if (frame < s2f(at) || frame > s2f(until)) return null;
  const pop = spring({ frame: frame - s2f(at), fps, config: { damping: 12, stiffness: 200 } });
  return (
    <div style={{ position: "absolute", left: 40, top: 300, width: 380, opacity: Math.min(1, pop * 1.4), translate: `${(1 - pop) * -60}px 0` }}>
      <Chip bg={C.leaf} color={C.white} size={20}>
        <span style={{ fontFamily: font.logo }}>{kicker}</span>
      </Chip>
      <Title size={58} color={C.sun} style={{ whiteSpace: "normal", lineHeight: 1.1, marginTop: 18 }}>
        {title}
      </Title>
      <div style={{ marginTop: 18, padding: "10px 14px", background: C.white, boxShadow: ring(4), fontFamily: font.display, fontWeight: 700, fontSize: 25, lineHeight: 1.25, color: C.ink }}>{sub}</div>
    </div>
  );
}

/** The night: the rig under the stars, the foreman walking the pads and a clock running six hours. */
function Night({ frame }: { frame: number }) {
  const t = (frame - s2f(NIGHT.from)) / s2f(NIGHT.to - NIGHT.from);
  if (t < 0 || t > 1) return null;
  const hours = Math.min(6, t * 6.4);
  const rounds = Math.floor(hours * 6);
  const clock = 22 + hours;
  const hh = String(Math.floor(clock) % 24).padStart(2, "0");
  const mm = String(Math.floor((clock % 1) * 60 / 10) * 10).padStart(2, "0");
  // the foreman walks a loop along the deck in front of the rig
  const loop = (frame / 260) % 1;
  const leg = loop < 0.5 ? loop * 2 : 2 - loop * 2;
  const fx = snap(560 + leg * 760, 6);
  const step = Math.floor(frame / 8) % 2;
  const wells = [620, 860, 1100, 1340];
  const lastRound = (hours * 6) % 1;
  return (
    <AbsoluteFill style={{ background: "#0b1430" }}>
      <AbsoluteFill style={{ background: "linear-gradient(#0b1430, #1e2a4a 70%)" }} />
      <Stars frame={frame} count={70} h={520} seed="foreman" />
      {/* the moon */}
      <div style={{ position: "absolute", left: 1500, top: 110, width: 120, height: 120, background: C.sunPale, boxShadow: `0 0 0 8px ${C.ink}, 0 0 60px 20px rgba(255,241,194,0.25)` }} />
      <div style={{ position: "absolute", left: 1540, top: 130, width: 30, height: 30, background: "#e8dcae" }} />
      <div style={{ position: "absolute", inset: 0, filter: "brightness(0.55) saturate(0.8)" }}>
        <SeaScene frame={frame} y={420} crane={false} />
      </div>
      {/* the deck: a strip of pads with pumping wells, lit by lamps */}
      <div style={{ position: "absolute", left: 480, top: 760, width: 1000, height: 140, background: "#4b5468", boxShadow: ring(6) }} />
      {wells.map((x, i) => {
        const pumping = Math.floor((frame + i * 13) / 18) % 2;
        const fresh = Math.floor((hours * 6 + i * 0.25) % 1 * 10) === 0 && t > 0.08;
        return (
          <div key={x}>
            <div style={{ position: "absolute", left: x, top: 790 - pumping * 6, width: 90, height: 14, background: C.red, boxShadow: ring(3) }} />
            <div style={{ position: "absolute", left: x + 40, top: 800, width: 10, height: 60, background: C.steel, boxShadow: ring(3) }} />
            <div style={{ position: "absolute", left: x + 10, top: 856, width: 70, height: 20, background: C.steelDeep, boxShadow: ring(3) }} />
            {fresh && (
              <div style={{ position: "absolute", left: x + 6, top: 730, fontFamily: font.logo, fontWeight: 700, fontSize: 22, color: "#7dffb0", textShadow: `0 3px 0 ${C.ink}` }}>+15 bbl</div>
            )}
          </div>
        );
      })}
      {[520, 1440].map((x) => (
        <div key={x} style={{ position: "absolute", left: x, top: 690, width: 16, height: 70, background: C.ink }}>
          <div style={{ position: "absolute", left: -14, top: -20, width: 44, height: 24, background: C.sunPale, boxShadow: `0 0 0 4px ${C.ink}, 0 0 40px 14px rgba(255,213,74,0.35)` }} />
        </div>
      ))}
      {/* the foreman, with his tag */}
      <div style={{ position: "absolute", left: fx, top: 770 - step * 4, transform: loop < 0.5 ? undefined : "scaleX(-1)" }}>
        <Spr rows={roughneck} palette={green} scale={5} />
      </div>
      <div style={{ position: "absolute", left: fx - 30, top: 730, fontFamily: font.logo, fontWeight: 700, fontSize: 20, color: "#7dffb0", textShadow: `0 3px 0 ${C.ink}` }}>FOREMAN</div>

      {/* the closed laptop, top left, and the clock, top right */}
      <div style={{ position: "absolute", left: 70, top: 80, display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ width: 120, height: 14, background: C.steel, boxShadow: ring(4) }} />
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 24, color: C.steelLight, letterSpacing: 2 }}>Game closed</span>
      </div>
      <div style={{ position: "absolute", right: 70, top: 300, width: 300, padding: "20px 24px", background: C.ink, boxShadow: `${ring(6)}, 0 0 0 10px ${C.leaf}` }}>
        <div style={{ fontFamily: font.logo, fontSize: 18, color: "#7dffb0", letterSpacing: 2 }}>Night shift</div>
        <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 64, color: C.sunPale, marginTop: 6 }}>
          {hh}:{mm}
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Array.from({ length: 36 }, (_, i) => (
            <div key={i} style={{ width: 16, height: 16, background: i < rounds ? C.leaf : "#2b3a63", boxShadow: i === rounds - 1 && lastRound < 0.3 ? `0 0 0 3px ${C.sunPale}` : undefined }} />
          ))}
        </div>
        <div style={{ marginTop: 10, fontFamily: font.display, fontWeight: 700, fontSize: 22, color: C.white }}>{rounds} rounds, one every 10 minutes</div>
      </div>
      <div style={{ position: "absolute", left: 70, top: 300, width: 520 }}>
        <Title size={72} color={C.sun} style={{ whiteSpace: "normal", lineHeight: 1.05 }}>
          He keeps the rig running
        </Title>
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 14 }}>
          <Spr rows={barrel} palette={base} scale={4} />
          <Spr rows={icons.coin} palette={base} scale={4} />
          <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 28, color: C.white }}>Collects, sells, fills contracts</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export function ForemanNight() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const end = spring({ frame: frame - s2f(END), fps, config: { damping: 11, stiffness: 180 } });
  const dawn = interpolate(t, [BACK - 0.5, BACK + 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {/* day: hiring him in the real game */}
      <Footage src="foremanhire" from={3.6} rate={1.15} frame={frame} start={0} end={NIGHT.from} />
      <Side frame={frame} at={0.3} until={NIGHT.from - 0.3} kicker="New: Rig Foreman" title="Hire your foreman" sub="Pick his jobs, then let him run the rig." />

      <Night frame={frame} />
      {/* dawn: a sunrise sweep back to the game */}
      {t > BACK - 0.5 && t < BACK + 0.8 && <AbsoluteFill style={{ background: `linear-gradient(0deg, ${C.sun} ${dawn * 100}%, transparent ${dawn * 100 + 20}%)`, opacity: 1 - Math.max(0, (t - BACK) / 0.8) }} />}

      {/* morning: his report in the real game */}
      <Footage src="foremanback" from={2.6} frame={frame} start={BACK} end={END} />
      <Side frame={frame} at={BACK + 0.3} until={END - 0.2} kicker="Good morning" title="Read his report" sub="Barrels collected and coins earned while you slept." />

      <PixelWipe frame={frame} start={s2f(END) - 22} />
      {frame >= s2f(END) && (
        <AbsoluteFill style={{ background: C.sun }}>
          <Sunburst turn={0.08} />
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 26, scale: String(end) }}>
              <Spr rows={logo} palette={logoPalette} scale={6} style={{ boxShadow: ring(6) }} />
              <Spr rows={roughneck} palette={green} scale={12} />
            </div>
            <Title size={104} style={{ scale: String(end) }}>
              Your rig
            </Title>
            <Title size={104} color={C.red} style={{ scale: String(end) }}>
              never sleeps
            </Title>
            <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
              <Chip bg={C.white} size={34}>
                <span style={{ fontFamily: font.logo }}>barrelroyale.io/play</span>
              </Chip>
              <Chip bg={C.ink} color={C.sun} size={34}>
                <span style={{ fontFamily: font.logo }}>@barrelroyale</span>
              </Chip>
            </div>
            <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 24, color: C.ink, letterSpacing: 2 }}>Free from rig level 6</div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}
