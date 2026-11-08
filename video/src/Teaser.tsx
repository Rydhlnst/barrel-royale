import { AbsoluteFill, useCurrentFrame } from "remotion";
import { base, barrel, crate, crownBarrel, icons, xMark } from "@/components/pixel/sprites";
import { C, Chip, font, SeaScene, Spr, Sunburst, Title } from "./brand";

// The teaser tweet's image: the rig on the sea under the sunburst, the
// four steps of the game, and $ROYAL coming soon. Rendered as a still.

export const TEASER_FRAME = 10;

const STEPS = [
  { rows: icons.derrick, text: "Drill wells" },
  { rows: barrel, text: "Refine crude" },
  { rows: crate, text: "Export barrels" },
  { rows: icons.coin, text: "Earn real XOM" },
];

export function Teaser() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.sun, overflow: "hidden" }}>
      <Sunburst cy={0.66} turn={0} rays={30} />
      <SeaScene frame={frame} y={520} />

      <AbsoluteFill style={{ alignItems: "center", paddingTop: 64 }}>
        <Title size={96}>Something is pumping</Title>
        <Title size={60} family={font.display} color={C.sunPale} style={{ marginTop: 22 }}>
          on Robinhood Chain
        </Title>
        <div style={{ display: "flex", gap: 34, marginTop: 52 }}>
          {STEPS.map((s) => (
            <Chip key={s.text} size={34}>
              <Spr rows={s.rows} palette={base} scale={3} />
              {s.text}
            </Chip>
          ))}
        </div>
      </AbsoluteFill>

      {/* $ROYAL, coming soon, on the sea at the lower left */}
      <div style={{ position: "absolute", left: 96, bottom: 76, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 24 }}>
          <Spr rows={crownBarrel} scale={7} />
          <Title size={90} color={C.sun}>
            $ROYAL
          </Title>
        </div>
        <Chip bg={C.red} color={C.white} size={44}>
          <span style={{ fontFamily: font.logo }}>Coming soon</span>
        </Chip>
      </div>

      <div style={{ position: "absolute", right: 90, bottom: 92, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 24 }}>
        <Chip bg={C.sun} size={40}>
          barrelroyale.io
        </Chip>
        <Chip size={34}>
          <Spr rows={xMark} scale={3} />
          @barrelroyale
        </Chip>
      </div>
    </AbsoluteFill>
  );
}
