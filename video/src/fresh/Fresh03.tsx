import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { logo, logoPalette } from "@/components/pixel/sprites";
import { C, Chip, font, PixelWipe, ring, Spr, Title } from "../brand";
import { EndCard, FH, FRAME, Framed, s2f } from "./Fresh01";

// Medal count, as a reply-bait poll: a big odometer rolls up to 41 tiers, then the real game (footage/medals.mp4,
// shown whole so the HUD stays in view) claims tier after tier beside a pixel poll card asking how many medals
// are in your cabinet, its options lighting up one by one. It ends asking viewers to reply with their count.

export const FRESH03_SECONDS = 17;
const ODO = 3.2;
const FROM = 3.0;
const RATE = 1.4;
const END = ODO + 9.6;

const OPTIONS = [
  { label: "Just started", range: "0 to 5" },
  { label: "Getting there", range: "6 to 15" },
  { label: "Cabinet's filling up", range: "16 to 30" },
  { label: "All 41 tiers", range: "31 to 41" },
];

function Odometer({ frame }: { frame: number }) {
  const { fps } = useVideoConfig();
  if (frame >= s2f(ODO)) return null;
  const t = frame / fps;
  const n = Math.round(interpolate(t, [0.4, 2.2], [0, 41], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const done = t >= 2.2;
  const pop = spring({ frame: frame - s2f(2.2), fps, config: { damping: 7, stiffness: 260 } });
  return (
    <AbsoluteFill style={{ background: C.sea, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}>
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 4px, transparent 4px 60px), repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 4px, transparent 4px 60px)" }} />
      <div style={{ position: "absolute", left: 70, top: 60, display: "flex", alignItems: "center", gap: 16 }}>
        <Spr rows={logo} palette={logoPalette} scale={2} style={{ boxShadow: ring(4, C.sun) }} />
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: C.white, letterSpacing: 3 }}>Medal check</span>
      </div>
      <div style={{ display: "flex", gap: 18, scale: String(done ? 1 + (1 - pop) * 0.2 : 1) }}>
        {String(n).padStart(2, "0").split("").map((d, i) => (
          <div key={i} style={{ width: 200, height: 260, display: "grid", placeItems: "center", background: C.ink, boxShadow: `${ring(8)}, 0 0 0 14px ${C.sun}, inset 0 -110px 0 rgba(255,255,255,0.05)` }}>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 200, color: done ? C.sun : C.white }}>{d}</span>
          </div>
        ))}
      </div>
      <Title size={80}>Medal tiers to claim</Title>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 38, color: C.sunPale }}>13 medals · Platinum pays 12,000 coins</div>
    </AbsoluteFill>
  );
}

function Poll({ frame }: { frame: number }) {
  const { fps } = useVideoConfig();
  if (frame < s2f(ODO) || frame >= s2f(END)) return null;
  const t = frame / fps;
  const come = spring({ frame: frame - s2f(ODO), fps, config: { damping: 13, stiffness: 180 } });
  // the options light up one at a time, round and round, like someone picking theirs
  const lit = t < ODO + 1 ? -1 : Math.floor((t - ODO - 1) / 0.9) % OPTIONS.length;
  return (
    <div style={{ position: "absolute", left: 36, top: 150, width: 430, padding: "24px 22px", background: C.white, boxShadow: `${ring(6)}, 0 0 0 12px ${C.sun}`, translate: `${(1 - come) * -520}px 0` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Spr rows={logo} palette={logoPalette} scale={2} />
        <div>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 22, color: C.ink }}>Barrel Royale</div>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 18, color: C.ink2 }}>@barrelroyale</div>
        </div>
      </div>
      <div style={{ marginTop: 18, fontFamily: font.display, fontWeight: 700, fontSize: 32, lineHeight: 1.25, color: C.ink }}>How many medals are in your cabinet?</div>
      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
        {OPTIONS.map((o, k) => (
          <div key={o.label} style={{ height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", background: k === lit ? C.sun : C.sunPale, boxShadow: ring(3) }}>
            <div>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 22, color: C.ink }}>{o.label}</div>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 17, color: C.ink2 }}>{o.range} medals</div>
            </div>
            <div style={{ width: 26, height: 26, background: k === lit ? C.ink : C.white, boxShadow: ring(3) }} />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, fontFamily: font.logo, fontWeight: 700, fontSize: 18, color: C.red, letterSpacing: 2 }}>Reply with your count</div>
    </div>
  );
}

export function Fresh03() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {frame >= s2f(ODO) && frame < s2f(END) && (
        <>
          <Framed src="medals" shots={[[ODO, FROM, END - ODO, RATE]]} />
          <div style={{ position: "absolute", left: FRAME.x, top: FRAME.y + FH + 34, display: "flex", gap: 14 }}>
            <Chip bg="#c47a3a" color={C.white} size={22}>
              <span style={{ fontFamily: font.logo }}>Bronze 150</span>
            </Chip>
            <Chip bg="#c7ced8" size={22}>
              <span style={{ fontFamily: font.logo }}>Silver 750</span>
            </Chip>
            <Chip bg={C.sun} size={22}>
              <span style={{ fontFamily: font.logo }}>Gold 3,000</span>
            </Chip>
            <Chip bg="#9be7ff" size={22}>
              <span style={{ fontFamily: font.logo }}>Platinum 12,000</span>
            </Chip>
          </div>
        </>
      )}
      <Poll frame={frame} />
      <Odometer frame={frame} />
      <PixelWipe frame={frame} start={s2f(ODO) - 22} />
      <PixelWipe frame={frame} start={s2f(END) - 22} />
      <EndCard start={END} top="Drop your" bottom="count below" />
    </AbsoluteFill>
  );
}
