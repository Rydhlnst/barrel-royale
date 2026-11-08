import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { base, crownBarrel, flameA, flamePalette, icons, logo, logoPalette, roughneck } from "@/components/pixel/sprites";
import { Bands, Burst, C, Chip, Embers, font, mono, PixelWipe, Spr, Sunburst, Title, ramp, ring, snap, typed, wiped } from "./brand";
import { Fire } from "./TokenBurn";

// 6 · Dev Burn. The dev's wallet buys $ROYAL on the market, then sends every
// token to the dead address two minutes later. The numbers are the real ones,
// read from Robinhood Chain: buy 0x75f4…eb64, burn 0x7039…8437.

export const DEV_BURN_SECONDS = 15;

const BURN = {
  eth: "0.1105",
  amount: 59_834_799.54,
  supply: 1_000_000_000,
  buyTx: "0x75f4…eb64",
  burnTx: "0x70396fc412466f93f6ac17e753ed37eefcb4c68da93dc44d9230394c6faa8437",
  block: 99_293_755,
  buyTime: "13:53 UTC",
  burnTime: "13:55 UTC",
};

const n = (v: number, d = 0) => (Math.floor(v * 10 ** d) / 10 ** d).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

export function DevBurn() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fireAt = 4.6 * fps;
  const proofAt = 10 * fps;
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {!wiped(frame, fireAt) && <Buy frame={frame} fps={fps} />}
      {wiped(frame, fireAt) && !wiped(frame, proofAt) && <Burn frame={frame - (fireAt + 22)} fps={fps} />}
      {wiped(frame, proofAt) && <Proof frame={frame - (proofAt + 22)} fps={fps} />}
      <PixelWipe frame={frame} start={fireAt} color={C.red} />
      <PixelWipe frame={frame} start={proofAt} color={C.sun} />
    </AbsoluteFill>
  );
}

/** A receipt row: a label on the left, a value on the right. */
function Row({ label, children, accent }: { label: string; children: React.ReactNode; accent?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 40, padding: "16px 0", borderBottom: `4px dashed ${C.steelLight}` }}>
      <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 36, color: C.ink2 }}>{label}</span>
      <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 44, color: accent ?? C.ink }}>{children}</span>
    </div>
  );
}

function Buy({ frame, fps }: { frame: number; fps: number }) {
  const s = (d: number) => spring({ frame: frame - d, fps, config: { damping: 11, stiffness: 160 } });
  const count = interpolate(frame, [70, 150], [0, BURN.amount], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
  const stamp = spring({ frame: frame - 160, fps, config: { damping: 8, stiffness: 220 } });
  return (
    <AbsoluteFill>
      <Bands colors={[C.stormShade, C.storm, C.stormSky]} heights={[360, 360, 360]} />
      <Embers frame={frame} count={24} colors={[C.sun, C.white]} size={8} seed="buy" />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 70 }}>
        <Title size={104} style={{ scale: String(s(0)) }}>
          The dev bought <span style={{ color: C.sun }}>$ROYAL</span>
        </Title>
        <Title size={46} family={font.display} color={C.sunPale} style={{ marginTop: 18, scale: String(s(8)) }}>
          On the open market, from the dev wallet
        </Title>
      </AbsoluteFill>
      {/* the buy, as a receipt */}
      <div style={{ position: "absolute", left: 340, top: 340, width: 1240, background: C.white, boxShadow: ring(8, C.ink, "rgba(0,0,0,0.35)"), padding: "26px 44px 30px", scale: String(s(20)), rotate: "-1deg" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, paddingBottom: 14, borderBottom: `6px solid ${C.ink}` }}>
          <Spr rows={icons.coin} scale={4} />
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 40, color: C.ink }}>Market buy</span>
          <span style={{ marginLeft: "auto", fontFamily: font.display, fontWeight: 700, fontSize: 32, color: C.ink2 }}>{BURN.buyTime}</span>
        </div>
        <Row label="Paid">{BURN.eth} ETH</Row>
        <Row label="Received" accent={C.red}>
          {n(count, 2)} $ROYAL
        </Row>
        <Row label="Tx">
          <span style={{ fontFamily: mono, fontSize: 38 }}>{BURN.buyTx}</span>
        </Row>
      </div>
      {frame > 160 && (
        <div style={{ position: "absolute", left: 1290, top: 300, scale: String(stamp), rotate: "8deg" }}>
          <Chip bg={C.leaf} color={C.white} size={52}>
            <span style={{ fontFamily: font.logo }}>Bought</span>
          </Chip>
        </div>
      )}
      <Spr rows={roughneck} palette={base} scale={7} x={250} y={760 - snap(Math.abs(Math.sin(frame / 9)) * 21, 7)} />
    </AbsoluteFill>
  );
}

function Burn({ frame, fps }: { frame: number; fps: number }) {
  const s = (d: number) => spring({ frame: frame - d, fps, config: { damping: 10, stiffness: 160 } });
  const left = interpolate(frame, [30, 230], [BURN.amount, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shake = frame > 20 && frame < 240 ? snap(Math.sin(frame * 1.7) * 4, 2) : 0;
  return (
    <AbsoluteFill style={{ translate: `${shake}px 0` }}>
      <Bands colors={[C.ink, C.stormShade, "#3a2340", C.redDeep]} heights={[300, 300, 260, 220]} />
      <Fire frame={frame} x={960} y={560} scale={30} rain={14} seed="devburn" />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 70 }}>
        <Title size={60} family={font.display} color={C.sunPale} style={{ scale: String(s(0)) }}>
          Two minutes later
        </Title>
        <Title size={104} style={{ scale: String(s(6)) }}>
          <span style={{ color: C.flame }}>All of it burned</span>
        </Title>
      </AbsoluteFill>
      {/* what is left in the dev wallet, counting down to zero */}
      <div style={{ position: "absolute", left: 90, top: 330, display: "flex", flexDirection: "column", gap: 18, scale: String(s(14)), transformOrigin: "0 0" }}>
        <Chip bg={C.ink} color={C.sun} size={34}>
          Dev wallet
        </Chip>
        <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 68, color: C.white, textShadow: "0 6px 0 rgba(0,0,0,0.4)" }}>{n(left)}</div>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 36, color: C.sunPale }}>$ROYAL left</div>
      </div>
      <div style={{ position: "absolute", right: 90, top: 330, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 18, scale: String(s(20)), transformOrigin: "100% 0" }}>
        <Chip bg={C.red} color={C.white} size={34}>
          <Spr rows={flameA} palette={flamePalette} scale={3} />
          Burned
        </Chip>
        <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 68, color: C.flame, textShadow: "0 6px 0 rgba(0,0,0,0.4)" }}>{n(BURN.amount - left)}</div>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 36, color: C.sunPale }}>to the dead address</div>
      </div>
      {frame > 232 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 70 }}>
          <Chip bg={C.white} size={46} style={{ scale: String(s(232)) }}>
            Wallet balance after: <span style={{ color: C.red }}>0</span>
          </Chip>
        </AbsoluteFill>
      )}
      <Burst frame={frame} start={232} x={960} y={600} rows={icons.coin} scale={5} count={22} speed={18} seed="zero" />
    </AbsoluteFill>
  );
}

function Proof({ frame, fps }: { frame: number; fps: number }) {
  const s = (d: number) => spring({ frame: frame - d, fps, config: { damping: 11, stiffness: 150 } });
  const share = (BURN.amount / BURN.supply) * 100;
  return (
    <AbsoluteFill>
      <Sunburst cy={0.5} turn={0.1} />
      <Embers frame={frame} count={26} colors={[C.white, C.sunPale]} size={8} seed="proof" />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 80, gap: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 30, scale: String(s(0)) }}>
          <Spr rows={crownBarrel} scale={7} />
          <Title size={112}>Burned for good</Title>
        </div>
        <Title size={150} color={C.red} style={{ scale: String(s(8)) }}>
          {n(BURN.amount)}
        </Title>
        <Chip size={46} bg={C.ink} color={C.sun} style={{ scale: String(s(16)) }}>
          $ROYAL · nearly {Math.round(share)}% of the supply
        </Chip>
        <div style={{ marginTop: 26, background: C.white, boxShadow: ring(7), padding: "18px 30px", display: "flex", flexDirection: "column", gap: 8, scale: String(s(26)) }}>
          <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 30, color: C.ink2 }}>
            Burn tx · block {n(BURN.block)} · {BURN.burnTime}
          </span>
          <span style={{ fontFamily: mono, fontWeight: 700, fontSize: 27, color: C.ink }}>{typed(BURN.burnTx, frame, 30, 60)}</span>
        </div>
        <Chip size={36} style={{ scale: String(s(40)) }}>
          Check it on robinhoodchain.blockscout.com
        </Chip>
      </AbsoluteFill>
      <Spr rows={logo} palette={logoPalette} scale={3} x={1786} y={30} style={{ boxShadow: ring(4) }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 40, display: "flex", justifyContent: "center", opacity: ramp(frame, 60, 20) }}>
        <Title size={40} family={font.display}>
          barrelroyale.io
        </Title>
      </div>
    </AbsoluteFill>
  );
}
