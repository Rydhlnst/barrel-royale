import { AbsoluteFill, interpolate, OffthreadVideo, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { base, flameA, flameB, flamePalette, icons, logo, logoPalette, roughneck } from "@/components/pixel/sprites";
import { RigClassScene, type RigClass } from "@/components/scenes/small-scenes";
import { Bands, C, Chip, Embers, font, PixelWipe, Spr, Sunburst, Title, Window, ramp, ring, snap, wiped } from "./brand";

// 4 · Token Burn. A furnace on the rig: $ROYAL coins rain into the flare. Then
// the class ladder, where holders burn $ROYAL to raise a rig's class and pay
// only the difference, and the buyback, where the treasury
// buys $ROYAL and feeds the same fire. The docs close it.

export const TOKEN_BURN_SECONDS = 18;

const CLASSES: { kind: RigClass; name: string; mult: string; total: number }[] = [
  { kind: "jackup", name: "Jack-up", mult: "1.00×", total: 0 },
  { kind: "semisub", name: "Semi-sub", mult: "1.25×", total: 2000 },
  { kind: "drillship", name: "Drillship", mult: "1.50×", total: 5000 },
  { kind: "ultra", name: "Ultra-deepwater", mult: "2.00×", total: 12000 },
];

// what the treasury does with revenue, as the docs put it (no shares on the site)
const SPLIT = [
  { label: "XOM for the reward vault", color: C.sun, ink: C.ink, burn: false },
  { label: "Buyback & burn $ROYAL", color: C.red, ink: C.white, burn: true },
];

const n = (v: number) => v.toLocaleString("en-US");

export function TokenBurn() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ladderAt = 3.6 * fps;
  const buybackAt = 10.4 * fps;
  const docsAt = 14.5 * fps;
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      <Furnace frame={frame} fps={fps} ladderAt={ladderAt} buybackAt={buybackAt} />
      {wiped(frame, ladderAt) && frame < buybackAt + 22 && <Ladder frame={frame - (ladderAt + 22)} fps={fps} />}
      {wiped(frame, buybackAt) && frame < docsAt + 22 && <Buyback frame={frame - (buybackAt + 22)} fps={fps} />}
      {wiped(frame, docsAt) && <Docs frame={frame - (docsAt + 22)} fps={fps} at={docsAt + 22} />}
      <PixelWipe frame={frame} start={ladderAt} color={C.redDeep} />
      <PixelWipe frame={frame} start={buybackAt} color={C.ink} />
      <PixelWipe frame={frame} start={docsAt} color={C.sun} />
    </AbsoluteFill>
  );
}

/** The big flare with coins falling into it, used behind the opening and the buyback. */
export function Fire({ frame, x, y, scale, rain = 0, seed }: { frame: number; x: number; y: number; scale: number; rain?: number; seed: string }) {
  const w = 9 * scale;
  return (
    <>
      <Embers frame={frame} count={46} area={{ x: x - w, y: y - 700, w: w * 3, h: 760 }} size={Math.max(6, Math.round(scale / 2))} seed={seed} />
      {Array.from({ length: rain }, (_, i) => {
        const period = 50 + Math.floor(random(`${seed}rp${i}`) * 30);
        const t = (frame + Math.floor(random(`${seed}ro${i}`) * period)) % period;
        const p = t / period;
        const sx = x + (random(`${seed}rx${i}`) - 0.5) * w * 2.4;
        const cy = interpolate(p, [0, 1], [-80, y + 3 * scale]);
        const cx = interpolate(p, [0, 1], [sx, x + (random(`${seed}rx${i}`) - 0.5) * w * 0.5]);
        return <Spr key={i} rows={icons.coin} scale={Math.max(4, Math.round(scale / 4))} x={snap(cx, 4)} y={snap(cy, 4)} style={{ opacity: p > 0.85 ? 0 : 1 }} />;
      })}
      <Spr rows={Math.floor(frame / 5) % 2 ? flameB : flameA} palette={flamePalette} scale={scale} x={x - w / 2} y={y} />
      <div style={{ position: "absolute", left: x - w * 0.8, top: y + 11 * scale - 4, width: w * 1.6, height: scale * 2, background: C.steel, boxShadow: ring(Math.round(scale / 4)) }} />
    </>
  );
}

function Furnace({ frame, fps, ladderAt, buybackAt }: { frame: number; fps: number; ladderAt: number; buybackAt: number }) {
  if (frame > ladderAt + 30 && frame < buybackAt) return null;
  if (frame >= buybackAt) return null;
  const t = spring({ frame: frame - 8, fps, config: { damping: 9, stiffness: 160 } });
  return (
    <AbsoluteFill>
      <Bands colors={[C.ink, C.stormShade, "#3a2340", C.redDeep]} heights={[300, 300, 260, 220]} />
      <Fire frame={frame} x={960} y={600} scale={28} rain={9} seed="open" />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 96 }}>
        <Title size={148} style={{ scale: String(t) }}>
          $ROYAL <span style={{ color: C.flame }}>burns</span>
        </Title>
        <Title size={50} family={font.display} style={{ marginTop: 26, opacity: ramp(frame, 30, 20) }}>
          Every upgrade and every buyback feeds the fire
        </Title>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function Ladder({ frame, fps }: { frame: number; fps: number }) {
  // the marker climbs one class every `step` frames
  const step = 1.25 * fps;
  const at = Math.max(0, Math.min(3, Math.floor((frame - 30) / step)));
  const s = (d: number) => spring({ frame: frame - d, fps, config: { damping: 12, stiffness: 150 } });
  const cardW = 360;
  const gap = 70;
  const left0 = (1920 - (cardW * 4 + gap * 3)) / 2;
  return (
    <AbsoluteFill>
      <Bands colors={[C.redDeep, "#a32b25", C.red]} heights={[380, 360, 340]} />
      <Embers frame={frame} count={40} colors={[C.flameCore, C.flame, C.white]} size={8} seed="ladder" />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 70 }}>
        <Title size={72} style={{ scale: String(s(0)) }}>
          Burn $ROYAL, raise your rig
        </Title>
        <Title size={46} family={font.display} color={C.sunPale} style={{ marginTop: 16, scale: String(s(8)) }}>
          Costs count from Jack-up, so you only pay the difference
        </Title>
      </AbsoluteFill>
      {CLASSES.map((c, i) => {
        const x = left0 + i * (cardW + gap);
        const y = 560 - i * 50;
        const active = i <= at && frame >= 30;
        const current = i === at && frame >= 30;
        const lift = current ? snap(Math.sin(frame / 8) * 6, 3) : 0;
        const cost = i > 0 ? c.total - CLASSES[i - 1].total : 0;
        const reached = 30 + i * step;
        const pop = spring({ frame: frame - reached, fps, config: { damping: 8, stiffness: 200 } });
        return (
          <div key={c.kind} style={{ position: "absolute", left: x, top: y + lift, width: cardW, scale: String(s(12 + i * 6)) }}>
            <div style={{ background: C.white, boxShadow: ring(8, C.ink, "rgba(30,42,74,0.4)"), filter: active ? undefined : "saturate(0.35) brightness(0.8)" }}>
              <div style={{ width: cardW, height: (cardW * 40) / 64 }}>
                <RigClassScene kind={c.kind} label={c.name} />
              </div>
              <div style={{ padding: "14px 18px", borderTop: `6px solid ${C.ink}`, background: current ? C.sun : C.white }}>
                <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 36, color: C.ink }}>{c.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: font.body, fontWeight: 800, fontSize: 26, color: C.ink2, marginTop: 4 }}>
                  <span>{c.mult} output</span>
                  <span>{i === 0 ? "Start" : `${n(c.total)}`}</span>
                </div>
              </div>
            </div>
            {/* what this step burns */}
            {i > 0 && frame >= reached && (
              <div style={{ position: "absolute", left: -gap / 2 - 90, top: -96, display: "flex", alignItems: "center", gap: 8, scale: String(pop) }}>
                <Chip bg={C.ink} color={C.sun} size={34}>
                  <Spr rows={flameA} palette={flamePalette} scale={3} />+{n(cost)}
                </Chip>
              </div>
            )}
            {current && <Spr rows={roughneck} scale={6} x={cardW / 2 - 48} y={-130 - snap(Math.abs(Math.sin(frame / 9)) * 24, 6)} />}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 64, display: "flex", justifyContent: "center", gap: 26, scale: String(s(30 + 3 * step + 20)) }}>
        <Chip size={40}>Semi-sub 2,000</Chip>
        <Chip size={40}>Drillship 5,000</Chip>
        <Chip size={40}>Ultra-deepwater 12,000 $ROYAL total</Chip>
      </div>
    </AbsoluteFill>
  );
}

function Buyback({ frame, fps }: { frame: number; fps: number }) {
  const s = (d: number) => spring({ frame: frame - d, fps, config: { damping: 12, stiffness: 150 } });
  const grow = ramp(frame, 14, 40);
  const burnAt = 70;
  const lifted = ramp(frame, burnAt, 20);
  const barW = 1500;
  const barX = 210;
  const barY = 330;
  let x = 0;
  return (
    <AbsoluteFill>
      <Bands colors={[C.ink, C.stormShade, "#3a2340", C.redDeep]} heights={[300, 300, 260, 220]} />
      <Fire frame={frame} x={960} y={640} scale={26} rain={frame > burnAt ? 10 : 0} seed="buy" />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 70 }}>
        <Title size={92} style={{ scale: String(s(0)) }}>
          Buyback and burn
        </Title>
        <Title size={44} family={font.display} color={C.sunPale} style={{ marginTop: 16, scale: String(s(8)) }}>
          Revenue funds the treasury, and the treasury feeds the fire
        </Title>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: barX, top: barY, width: barW * grow, height: 120, overflow: "visible" }}>
        {SPLIT.map((p) => {
          const w = barW / SPLIT.length;
          const left = x;
          x += w;
          const burn = p.burn;
          return (
            <div
              key={p.label}
              style={{
                position: "absolute",
                left,
                top: burn ? -Math.round(lifted * 40) : 0,
                width: w,
                height: 120,
                background: p.color,
                boxShadow: ring(6, C.ink, "rgba(0,0,0,0.3)"),
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "0 30px",
                boxSizing: "border-box",
                overflow: "hidden",
                scale: burn ? String(1 + lifted * 0.08) : undefined,
                zIndex: burn ? 2 : 1,
              }}
            >
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 52, color: p.ink, lineHeight: 1, whiteSpace: "nowrap" }}>{p.label}</div>
            </div>
          );
        })}
      </div>
      {frame > burnAt && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 520, display: "flex", justifyContent: "center", scale: String(s(burnAt + 10)) }}>
          <Chip bg={C.red} color={C.white} size={42}>
            The treasury buys $ROYAL on the market and burns it
          </Chip>
        </div>
      )}
    </AbsoluteFill>
  );
}

function Docs({ frame, fps, at }: { frame: number; fps: number; at: number }) {
  const s = (d: number) => spring({ frame: frame - d, fps, config: { damping: 11, stiffness: 150 } });
  return (
    <AbsoluteFill>
      <Sunburst cx={0.72} cy={0.5} turn={0.12} />
      <Window width={960} height={540} url="barrelroyale.io/docs" style={{ left: 110, top: 200, scale: String(s(0)), rotate: "-1.5deg" }}>
        <Sequence from={at} layout="none">
          <OffthreadVideo src={staticFile("footage/docs.mp4")} muted trimBefore={Math.round(6.2 * fps)} playbackRate={1.3} style={{ width: 960, height: 540, display: "block" }} />
        </Sequence>
      </Window>
      <div style={{ position: "absolute", left: 1170, top: 260, display: "flex", flexDirection: "column", gap: 28, alignItems: "flex-start" }}>
        <Spr rows={logo} palette={logoPalette} scale={5} style={{ boxShadow: ring(6), scale: String(s(6)) }} />
        <Title size={86} family={font.display} style={{ scale: String(s(10)), transformOrigin: "0 50%" }}>
          Fixed supply.
        </Title>
        <Title size={86} family={font.display} color={C.red} style={{ scale: String(s(16)), transformOrigin: "0 50%" }}>
          Burned for good.
        </Title>
        <Chip size={38} style={{ scale: String(s(24)), transformOrigin: "0 50%" }}>
          Tokenomics at barrelroyale.io/docs
        </Chip>
      </div>
      <Spr rows={roughneck} palette={base} scale={6} x={1700} y={900} />
    </AbsoluteFill>
  );
}
