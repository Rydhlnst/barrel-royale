import { C } from "@/lib/palette";
import { Pixels, Sprite, line, rect, type Px } from "@/components/pixel/sprite";
import { barrel, base, boat, cloudBig, crate, hat, icons, roughneck } from "@/components/pixel/sprites";

// Small 96 × 64 scenes for the gameplay frames, and 64 × 40 scenes for the rig
// classes. They stand in for game screenshots until the game client exists.

function Scene({ w, h, children, label }: { w: number; h: number; children: React.ReactNode; label: string }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" className="block h-auto w-full" role="img" aria-label={label}>
      {children}
    </svg>
  );
}

/** Steel deck plating with a hazard-striped edge, as in the prototype. */
function deck(): Px[] {
  const out: Px[] = [rect(0, 0, 96, 64, C.steel)];
  for (let y = 2; y < 58; y += 4) for (let x = 2; x < 96; x += 4) out.push(rect(x, y, 1, 1, C.steelDeep));
  for (let x = 0; x < 96; x += 4) out.push(rect(x, 58, 2, 6, C.sun), rect(x + 2, 58, 2, 6, C.ink));
  return out;
}

export function pumpjack(x: number, y: number, up: boolean): Px[] {
  const out: Px[] = [];
  out.push(rect(x, y + 18, 30, 3, C.ink), rect(x + 1, y + 18, 28, 1, C.steelDeep));
  out.push(...line(x + 8, y + 18, x + 15, y + 4, C.ink), ...line(x + 22, y + 18, x + 15, y + 4, C.ink));
  const l = up ? y : y + 6;
  const r = up ? y + 6 : y;
  out.push(...line(x + 2, l, x + 28, r, C.red), ...line(x + 2, l + 1, x + 28, r + 1, C.redDeep));
  out.push(rect(x, l - 1, 3, 7, C.red), rect(x + 1, l + 6, 1, y + 18 - (l + 6), C.ink));
  out.push(rect(x + 24, r + 3, 6, 6, C.ink), rect(x + 25, r + 4, 4, 4, C.steelDeep));
  return out;
}

/** A pressure gauge on a stand; the needle swings into the red and back. */
function Gauge({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <Pixels items={[rect(x + 7, y + 15, 2, 12, C.ink)]} />
      <Sprite rows={icons.gauge} palette={base} x={x} y={y} />
      <g className="frame-a needle">
        <Pixels items={line(x + 7, y + 8, x + 4, y + 4, C.ink)} />
      </g>
      <g className="frame-b needle">
        <Pixels items={line(x + 8, y + 8, x + 12, y + 3, C.red)} />
      </g>
    </g>
  );
}

export function PressureScene() {
  return (
    <Scene w={96} h={64} label="A pumpjack nodding beside a pressure gauge that swings into the red">
      <Pixels items={deck()} />
      <Pixels items={pumpjack(8, 26, true)} className="frame-a pump" />
      <Pixels items={pumpjack(8, 26, false)} className="frame-b pump" />
      <Gauge x={44} y={14} />
      <Sprite rows={roughneck} palette={base} x={66} y={30} />
      <Sprite rows={barrel} palette={base} x={78} y={6} />
    </Scene>
  );
}

function tower(x: number, h: number, color: string): Px[] {
  const top = 56 - h;
  const out: Px[] = [rect(x, top, 12, h, C.ink), rect(x + 1, top + 1, 10, h - 1, C.white)];
  for (let y = top + 5; y < 56; y += 6) out.push(rect(x + 1, y, 10, 2, color));
  out.push(rect(x + 3, top - 3, 6, 3, C.ink));
  return out;
}

export function RefineScene() {
  const pipes: Px[] = [
    rect(4, 46, 88, 3, C.ink),
    rect(4, 47, 88, 1, C.steelDeep),
    rect(20, 30, 3, 16, C.ink),
    rect(48, 22, 3, 24, C.ink),
  ];
  return (
    <Scene w={96} h={64} label="Refinery towers turning crude into diesel, jet fuel and LNG, with barrels ready to ship">
      <Pixels items={deck()} />
      <Pixels items={pipes} />
      <Pixels items={tower(14, 30, C.sunDeep)} />
      <Pixels items={tower(42, 40, C.red)} />
      <Pixels items={tower(60, 22, C.sea)} />
      <g className="smoke">
        <Pixels items={[rect(46, 6, 3, 3, C.steelLight), rect(50, 2, 4, 3, C.steelLight)]} />
      </g>
      <Sprite rows={barrel} palette={base} x={76} y={34} />
      <Sprite rows={barrel} palette={{ ...base, R: C.sea, r: C.seaDeep }} x={76} y={20} />
      <Sprite rows={crate} palette={base} x={2} y={36} />
    </Scene>
  );
}

export function StormScene() {
  const storm = { W: C.storm, w: C.stormShade };
  const rain: Px[] = [];
  for (let y = -16; y < 64; y += 8) {
    for (let x = (y / 8) % 2 === 0 ? 0 : 6; x < 104; x += 12) rain.push(rect(x, y, 1, 3, C.rain));
  }
  const sea: Px[] = [rect(0, 44, 96, 20, C.seaDeep), rect(0, 44, 96, 1, C.sea)];
  for (let x = 0; x < 96; x += 16) {
    sea.push(rect(x, 42, 6, 2, C.sea), rect(x + 2, 41, 3, 1, C.foam), rect(x + 8, 50, 6, 1, C.foam), rect(x + 3, 57, 5, 1, C.sea));
  }
  const bolt: Px[] = [...line(64, 10, 60, 20, C.sun), ...line(61, 20, 66, 20, C.sun), ...line(66, 20, 61, 32, C.sun)];
  return (
    <Scene w={96} h={64} label="A rig riding out a storm with rain and lightning while the roughneck holds on">
      <rect width={96} height={64} fill={C.stormSky} />
      <rect width={96} height={64} fill={C.sky} className="flash" />
      <Sprite rows={cloudBig} palette={storm} x={2} y={2} />
      <Sprite rows={cloudBig} palette={storm} x={50} y={0} />
      <Pixels items={bolt} className="flash-bolt" />
      <Sprite rows={icons.derrick} palette={base} x={18} y={26} />
      <rect x={25} y={25} width={2} height={1} fill={C.red} className="blink" />
      <Pixels items={rain} className="rain" />
      <Pixels items={sea} />
      <g className="bob">
        <Sprite rows={boat} palette={base} x={58} y={38} />
      </g>
    </Scene>
  );
}

export function CrewScene() {
  return (
    <Scene w={96} h={64} label="Three crew members in different hard hats on a rig deck">
      <Pixels items={deck()} />
      <Sprite rows={crate} palette={base} x={6} y={44} />
      <Sprite rows={crate} palette={base} x={16} y={44} />
      <Sprite rows={crate} palette={base} x={11} y={34} />
      <Sprite rows={roughneck} palette={hat(C.red, C.redDeep)} x={30} y={34} />
      <Sprite rows={roughneck} palette={base} x={46} y={28} />
      <Sprite rows={roughneck} palette={hat(C.white, C.steelLight)} x={62} y={36} />
      <Sprite rows={icons.coin} palette={base} x={78} y={10} className="bob" />
    </Scene>
  );
}

export type RigClass = "jackup" | "semisub" | "drillship" | "ultra";

/** One silhouette per rig class, on open water. */
export function RigClassScene({ kind, label }: { kind: RigClass; label: string }) {
  const water = 28;
  const out: Px[] = [rect(0, 0, 64, water, C.sky), rect(0, water, 64, 40 - water, C.sea), rect(0, water, 64, 1, C.foam)];
  for (let x = 2; x < 64; x += 12) out.push(rect(x, 33, 5, 1, C.foam));
  const derrick = (x: number, y: number, h: number, color: string) => {
    out.push(...line(x, y, x + 4, y - h, color), ...line(x + 9, y, x + 5, y - h, color), rect(x + 2, y - h - 2, 6, 2, C.ink));
    for (let k = 4; k < h; k += 5) out.push(rect(x + Math.round(k / 3), y - k, 9 - Math.round((2 * k) / 3), 1, color));
  };
  if (kind === "jackup") {
    for (const x of [14, 46]) out.push(rect(x, 4, 3, 36, C.ink), rect(x + 1, 4, 1, 36, C.steelDeep));
    out.push(rect(10, 18, 42, 5, C.ink), rect(11, 19, 40, 3, C.steel));
    derrick(26, 18, 12, C.red);
  }
  if (kind === "semisub") {
    out.push(rect(8, 30, 48, 4, C.ink), rect(9, 31, 46, 2, C.redDeep));
    for (const x of [12, 46]) out.push(rect(x, 20, 5, 11, C.ink), rect(x + 1, 20, 3, 11, C.steel));
    out.push(rect(8, 16, 48, 5, C.ink), rect(9, 17, 46, 3, C.steel));
    derrick(28, 16, 12, C.red);
  }
  if (kind === "drillship") {
    out.push(rect(4, 24, 56, 6, C.ink), rect(5, 25, 54, 4, C.red), rect(7, 29, 50, 2, C.ink));
    out.push(rect(48, 16, 9, 8, C.ink), rect(49, 17, 7, 6, C.white), rect(50, 18, 2, 2, C.sea), rect(53, 18, 2, 2, C.sea));
    derrick(24, 24, 16, C.red);
  }
  if (kind === "ultra") {
    out.push(rect(4, 30, 56, 4, C.ink), rect(5, 31, 54, 2, C.redDeep));
    for (const x of [8, 28, 50]) out.push(rect(x, 18, 6, 13, C.ink), rect(x + 1, 18, 4, 13, C.steel));
    out.push(rect(4, 13, 56, 6, C.ink), rect(5, 14, 54, 4, C.steel));
    derrick(26, 13, 12, C.sunDeep);
    out.push(rect(46, 9, 10, 4, C.ink), rect(47, 10, 8, 2, C.sun));
  }
  return (
    <Scene w={64} h={40} label={label}>
      <Pixels items={out} />
    </Scene>
  );
}
