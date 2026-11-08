import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Pixels, rect, type Px } from "@/components/pixel/sprite";
import { base, crownBarrel, icons, roughneck } from "@/components/pixel/sprites";
import { Burst, C, Chip, Embers, font, mono, Spr, Sunburst, Title, ring, snap } from "./brand";

// 9 · Vault Up. Posted whenever the XOM reward vault grows: coins pour into a
// pixel vault, its window fills, and the balance rolls up from the last total.
// The numbers are props, filled from the chain by scripts/vault.mjs.

export const VAULT_UP_SECONDS = 10;

export type VaultUpProps = {
  /** XOM in the vault now */
  total: number;
  /** XOM added by the latest deposit */
  added: number;
  /** the deposit's tx hash, shown shortened */
  tx: string;
  /** optional XOM price in USD, to show the dollar value */
  price?: number;
  /** where the deposit came from, said on screen */
  source?: string;
};

export const vaultUpDefaults: VaultUpProps = {
  total: 0.260667636630394268,
  added: 0.260667636630394268,
  tx: "0x966442fcaee7da8de34964b950c45ec073ffc9c426c8571e706953c5eb5495ce",
};

const VAULT_ADDRESS = "0x2B85…39F7";
const fmt = (v: number) => (v >= 100 ? v.toLocaleString("en-US", { maximumFractionDigits: 2 }) : v.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 }));
const usd = (v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const short = (h: string) => `${h.slice(0, 6)}…${h.slice(-4)}`;

// the vault, 64 × 56 art px: a steel safe with a round door, bolts, a dial and a window
const VW = 64;
const VH = 56;
function vaultArt(fill: number, frame: number): Px[] {
  const out: Px[] = [
    rect(2, 6, 60, 48, C.ink),
    rect(3, 7, 58, 46, C.steel),
    rect(3, 7, 58, 2, C.steelLight),
    rect(3, 51, 58, 2, C.steelDeep),
    // feet
    rect(6, 54, 8, 2, C.ink),
    rect(50, 54, 8, 2, C.ink),
    // coin slot on top
    rect(24, 4, 16, 3, C.ink),
    rect(26, 5, 12, 1, C.oil),
    // door
    rect(8, 11, 48, 38, C.ink),
    rect(9, 12, 46, 36, C.steelLight),
    rect(10, 13, 44, 34, C.steel),
  ];
  // bolts
  for (const [x, y] of [[11, 14], [51, 14], [11, 44], [51, 44]]) out.push(rect(x, y, 2, 2, C.steelDeep));
  // the window, filling with gold from the bottom
  const wx = 14;
  const wy = 17;
  const ww = 22;
  const wh = 26;
  out.push(rect(wx - 1, wy - 1, ww + 2, wh + 2, C.ink), rect(wx, wy, ww, wh, C.stormSky));
  const h = Math.round(wh * fill);
  if (h > 0) {
    out.push(rect(wx, wy + wh - h, ww, h, C.sunDeep));
    for (let y = wy + wh - h; y < wy + wh; y += 3) out.push(rect(wx, y, ww, 1, C.sun));
    out.push(rect(wx, wy + wh - h, ww, 1, C.flameCore));
  }
  // glint across the glass
  const g = (Math.floor(frame / 3) % 40) - 6;
  if (g >= 0 && g < ww - 2) out.push(rect(wx + g, wy + 2, 2, wh - 4, "rgba(255,255,255,0.35)"));
  // the dial and the handle
  out.push(rect(41, 20, 10, 10, C.ink), rect(42, 21, 8, 8, C.sunPale), rect(45, 21, 2, 4, C.red), rect(45, 24, 2, 2, C.ink));
  out.push(rect(43, 34, 6, 2, C.ink), rect(45, 32, 2, 6, C.ink));
  return out;
}

export function VaultUp({ total, added, tx, price, source = "20% of creator fees" }: VaultUpProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (d: number) => spring({ frame: frame - d, fps, config: { damping: 11, stiffness: 160 } });
  const prev = Math.max(0, total - added);
  const pourAt = 40;
  const pourEnd = 5.2 * fps;
  const roll = interpolate(frame, [pourAt, pourEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
  const shown = prev + added * roll;
  // the window starts from the share the last total held and ends nearly full
  const fill = interpolate(roll, [0, 1], [total > 0 ? Math.min(0.75, (prev / total) * 0.85) : 0, 0.85]);
  const done = frame >= pourEnd;
  const thud = done && frame < pourEnd + 16 ? snap(Math.sin((frame - pourEnd) * 2.4) * (8 - (frame - pourEnd) / 2), 2) : 0;

  const V = { x: 150, y: 330, scale: 10 };
  const slotX = V.x + 32 * V.scale;
  const slotY = V.y + 4 * V.scale;

  return (
    <AbsoluteFill style={{ background: C.sun, overflow: "hidden" }}>
      <Sunburst cx={0.27} cy={0.62} turn={0.1} />
      <Embers frame={frame} count={24} colors={[C.white, C.sunPale]} size={8} seed="vault" />

      {/* coins pouring into the slot */}
      {frame >= pourAt &&
        !done &&
        Array.from({ length: 10 }, (_, i) => {
          const period = 34 + Math.floor(random(`vp${i}`) * 16);
          const t = (frame - pourAt + Math.floor(random(`vo${i}`) * period)) % period;
          const p = t / period;
          const x = slotX - 24 + (random(`vx${i}`) - 0.5) * 120 * (1 - p);
          const y = interpolate(p, [0, 1], [-60, slotY - 10]);
          return <Spr key={i} rows={icons.coin} scale={5} x={snap(x, 5)} y={snap(y, 5)} style={{ opacity: p > 0.9 ? 0 : 1 }} />;
        })}

      <svg viewBox={`0 0 ${VW} ${VH}`} width={VW * V.scale} height={VH * V.scale} shapeRendering="crispEdges" style={{ position: "absolute", left: V.x, top: V.y, translate: `${thud}px 0`, scale: String(s(0)) }}>
        <Pixels items={vaultArt(fill, frame)} />
      </svg>
      <div style={{ position: "absolute", left: V.x + 40, top: V.y + VH * V.scale + 18, width: VW * V.scale - 80, display: "flex", justifyContent: "center", scale: String(s(10)) }}>
        <Chip bg={C.ink} color={C.sun} size={34}>
          XOM reward vault · {VAULT_ADDRESS}
        </Chip>
      </div>
      <Burst frame={frame} start={pourEnd} x={slotX - 20} y={slotY} rows={icons.coin} scale={5} count={18} speed={16} seed="vaultdone" />

      {/* the numbers, on the right */}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28, scale: String(s(4)) }}>
          <Spr rows={crownBarrel} scale={6} />
          <Title size={104}>The vault grew</Title>
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 840, top: 250, right: 80, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22, scale: String(s(pourAt)), transformOrigin: "0 50%" }}>
          <Chip bg={C.leaf} color={C.white} size={44}>
            <span style={{ fontFamily: font.logo }}>+{fmt(added)} XOM</span>
          </Chip>
          <Chip bg={C.red} color={C.white} size={30} style={{ rotate: "-2deg" }}>
            <span style={{ fontFamily: font.logo }}>{source}</span>
          </Chip>
        </div>
        <div style={{ marginTop: 10, background: C.white, boxShadow: ring(8, C.ink, "rgba(30,42,74,0.35)"), padding: "24px 34px", minWidth: 820, scale: String(s(14)), transformOrigin: "0 50%" }}>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 34, color: C.ink2 }}>Now in the vault</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginTop: 4 }}>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 104, color: C.red, lineHeight: 1.1 }}>{fmt(shown)}</span>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 56, color: C.ink }}>XOM</span>
          </div>
          {price ? <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 38, color: C.leaf }}>≈ {usd(shown * price)} in Exxon stock</div> : <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 38, color: C.leaf }}>Real Exxon, on Robinhood Chain</div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 8 }}>
          <Chip size={36} style={{ scale: String(s(pourEnd + 4)), transformOrigin: "0 50%" }}>
            <Spr rows={icons.coin} scale={3} />
            <span style={{ fontFamily: font.logo, fontSize: 30 }}>{source}</span> added to the vault again
          </Chip>
          <Chip size={36} style={{ scale: String(s(pourEnd + 10)), transformOrigin: "0 50%" }}>
            <Spr rows={roughneck} palette={base} scale={2} />
            Paid out to players every week
          </Chip>
          <Chip size={30} bg={C.sunPale} style={{ scale: String(s(pourEnd + 16)), transformOrigin: "0 50%" }}>
            Deposit tx <span style={{ fontFamily: mono, fontWeight: 700 }}>{short(tx)}</span>
          </Chip>
        </div>
      </div>

      <div style={{ position: "absolute", right: 80, bottom: 40, opacity: done ? 1 : 0 }}>
        <Title size={40} family={font.display}>
          barrelroyale.io/play
        </Title>
      </div>
    </AbsoluteFill>
  );
}
