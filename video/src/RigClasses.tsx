import { AbsoluteFill } from "remotion";
import { base, crownBarrel, flameA, flamePalette, roughneck } from "@/components/pixel/sprites";
import { RigClassScene, type RigClass } from "@/components/scenes/small-scenes";
import { C, Chip, font, Spr, Sunburst, Title, ring } from "./brand";

// The rig classes post's image: four cards from Jack-up to Ultra-deepwater,
// what each one pumps, and the $ROYAL each step burns. Rendered as a still.

const CLASSES: { kind: RigClass; name: string; mult: string; total: number }[] = [
  { kind: "jackup", name: "Jack-up", mult: "1.00×", total: 0 },
  { kind: "semisub", name: "Semi-sub", mult: "1.25×", total: 2000 },
  { kind: "drillship", name: "Drillship", mult: "1.50×", total: 5000 },
  { kind: "ultra", name: "Ultra-deepwater", mult: "2.00×", total: 12000 },
];

const n = (v: number) => v.toLocaleString("en-US");

export function RigClasses() {
  const cardW = 380;
  const gap = 56;
  const left0 = (1920 - (cardW * 4 + gap * 3)) / 2;
  return (
    <AbsoluteFill style={{ background: C.sun, overflow: "hidden" }}>
      <Sunburst cy={0.95} turn={0} rays={30} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 60 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <Spr rows={crownBarrel} scale={6} />
          <Title size={108}>Pick your rig</Title>
        </div>
        <Title size={48} family={font.display} color={C.sunPale} style={{ marginTop: 18 }}>
          Burn $ROYAL to climb a class
        </Title>
      </AbsoluteFill>
      {CLASSES.map((c, i) => {
        const x = left0 + i * (cardW + gap);
        const y = 520 - i * 36;
        const step = i > 0 ? c.total - CLASSES[i - 1].total : 0;
        const top = i === 3;
        return (
          <div key={c.kind} style={{ position: "absolute", left: x, top: y, width: cardW }}>
            {i > 0 && (
              <div style={{ position: "absolute", left: -gap / 2 - 80, top: -84 }}>
                <Chip bg={C.ink} color={C.sun} size={32}>
                  <Spr rows={flameA} palette={flamePalette} scale={3} />
                  <span style={{ fontFamily: font.logo }}>+{n(step)}</span>
                </Chip>
              </div>
            )}
            <div style={{ background: C.white, boxShadow: ring(8, C.ink, "rgba(30,42,74,0.4)") }}>
              <div style={{ width: cardW, height: (cardW * 40) / 64 }}>
                <RigClassScene kind={c.kind} label={c.name} />
              </div>
              <div style={{ padding: "16px 20px", borderTop: `6px solid ${C.ink}`, background: top ? C.red : C.white }}>
                <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 38, color: top ? C.white : C.ink }}>{c.name}</div>
                <div style={{ fontFamily: font.body, fontWeight: 800, fontSize: 28, color: top ? C.sunPale : C.ink2, marginTop: 4, lineHeight: 1.3 }}>
                  {c.mult} output
                  <br />
                  {i === 0 ? "Start here" : `${n(c.total)} $ROYAL total`}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <Spr rows={roughneck} palette={base} scale={6} x={left0 + 3 * (cardW + gap) + cardW / 2 - 48} y={520 - 3 * 36 - 136} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 56, display: "flex", justifyContent: "center", gap: 26 }}>
        <Chip size={38}>Totals count from Jack-up, you pay only the difference</Chip>
        <Chip size={38} bg={C.red} color={C.white}>
          barrelroyale.io
        </Chip>
      </div>
    </AbsoluteFill>
  );
}
