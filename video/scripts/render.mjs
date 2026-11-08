// Renders the launch videos to out/, or stills to check them.
// Usage: node scripts/render.mjs                      every video
//        node scripts/render.mjs WebLive CaLive       some of them
//        node scripts/render.mjs --stills WebLive:40 CaLive:300   frames as PNGs in out/stills/
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { override } from "./webpack.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILES = {
  WebLive: "barrel-royale-web-live",
  LaunchingSoon: "barrel-royale-launching-soon",
  CaLive: "barrel-royale-ca-live",
  TokenBurn: "barrel-royale-token-burn",
  HowToPlay: "barrel-royale-how-to-play",
  DevBurn: "barrel-royale-dev-burn",
  Overdrive: "barrel-royale-overdrive",
  CrudeToXom: "barrel-royale-crude-to-xom",
  RigOpen: "barrel-royale-rig-open",
  Ep1HowToPlay: "barrel-royale-ep1-how-to-play",
  Ep2Pressure: "barrel-royale-ep2-pressure",
  Ep3Storm: "barrel-royale-ep3-storm",
  Ep4Refinery: "barrel-royale-ep4-refinery",
  Ep5Dispatch: "barrel-royale-ep5-dispatch",
  Ep6Export: "barrel-royale-ep6-export",
  PaidDex: "barrel-royale-paid-dex-coming",
  PaidDexLive: "barrel-royale-dex-paid",
  How01: "barrel-royale-how01-drilling",
  How02: "barrel-royale-how02-choke",
  How03: "barrel-royale-how03-blowout",
  How04: "barrel-royale-how04-refinery-recipes",
  How05: "barrel-royale-how05-benchmarks",
  How06: "barrel-royale-how06-three-ways-to-sell",
  How07: "barrel-royale-how07-dispatch-board",
  How08: "barrel-royale-how08-storm-brace",
  How09: "barrel-royale-how09-rig-levels",
  How10: "barrel-royale-how10-offline",
  MobileHowToPlay: "barrel-royale-how-to-play-mobile",
  RoadmapShip: "barrel-royale-roadmap-cargo",
  ForemanNight: "barrel-royale-rig-foreman",
  StoryRecap: "barrel-royale-story-recap",
  GusherQuake: "barrel-royale-gusher",
  MedalCabinet: "barrel-royale-medals",
  DoublePay: "barrel-royale-double-pay",
  OilBonus: "barrel-royale-oil-bonus",
  Fresh01: "barrel-royale-gusher-tanker-combo",
  Fresh02: "barrel-royale-day-on-the-rig",
  Fresh03: "barrel-royale-medal-count",
  Fresh04: "barrel-royale-tanker-times",
  Fresh05: "barrel-royale-foreman-busy-day",
  TankerDay: "barrel-royale-tanker-day",
  Next01: "barrel-royale-next01-daily-shift",
  Next02: "barrel-royale-next02-streak",
  Next03: "barrel-royale-next03-swap",
  Next04: "barrel-royale-next04-royal-harbor",
  Next05: "barrel-royale-next05-one-tap",
  Next06: "barrel-royale-next06-rig-levels-6-8",
  Next07: "barrel-royale-next07-mobile",
  Next08: "barrel-royale-next08-live-chart",
  Next09: "barrel-royale-next09-holder-pass",
  Next10: "barrel-royale-next10-whats-next",
};

const args = process.argv.slice(2);
const stills = args[0] === "--stills";
const serveUrl = await bundle({ entryPoint: join(root, "src", "index.ts"), webpackOverride: override, publicDir: join(root, "public") });
const port = Number(process.env.PORT ?? 3157);

if (stills) {
  mkdirSync(join(root, "out", "stills"), { recursive: true });
  for (const pair of args.slice(1)) {
    const [id, f] = pair.split(":");
    const composition = await selectComposition({ serveUrl, id, port });
    const output = join(root, "out", "stills", `${id}-${f}.png`);
    await renderStill({ composition, serveUrl, output, frame: Number(f), port });
    console.log(output);
  }
} else {
  for (const id of args.length ? args : Object.keys(FILES)) {
    const composition = await selectComposition({ serveUrl, id, port });
    const outputLocation = join(root, "out", `${FILES[id]}-1080p60.mp4`);
    await renderMedia({
      composition,
      serveUrl,
      outputLocation,
      port,
      codec: "h264",
      crf: 16,
      pixelFormat: "yuv420p",
      colorSpace: "bt709",
      imageFormat: "jpeg",
      jpegQuality: 95,
      onProgress: ({ progress }) => process.stdout.write(`\r${id} ${(progress * 100).toFixed(0)}%   `),
    });
    console.log(`\n${outputLocation}`);
  }
}
