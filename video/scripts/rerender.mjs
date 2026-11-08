// Re-renders a list of compositions with one bundle and copies each to Downloads as soon as it's done.
// Usage: PORT=3224 node scripts/rerender.mjs   (the list is below, in posting order)
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { override } from "./webpack.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "out", "rerender");
const downloads = process.env.DOWNLOADS ?? "C:/Users/LENOVO/Downloads";
mkdirSync(out, { recursive: true });
const port = Number(process.env.PORT ?? 3224);

/** [composition, file name without extension, cover frame or null] */
const JOBS = [
  ["Next01", "barrel-royale-next01-daily-shift", 300],
  ["ClipStorageLevels", "barrel-royale-clip-storage-levels", 150],
  ["How01", "barrel-royale-how01-drilling", null],
  ["How03", "barrel-royale-how03-blowout", null],
  ["ClipGetRoyal", "barrel-royale-clip-get-royal", 150],
  ["How04", "barrel-royale-how04-refinery-recipes", null],
  ["CalloutJet", "barrel-royale-callout-jet", null],
  ["How05", "barrel-royale-how05-benchmarks", null],
  ["How07", "barrel-royale-how07-dispatch-board", null],
  ["ClipWhatsLive", "barrel-royale-clip-whats-live", 150],
  ["How02", "barrel-royale-how02-choke", null],
  ["CalloutOverdrive", "barrel-royale-callout-overdrive", null],
  ["How08", "barrel-royale-how08-storm-brace", null],
  ["How10", "barrel-royale-how10-offline", null],
  ["RoadmapShip", "barrel-royale-roadmap-cargo", 700],
  ["ClipRigClasses", "barrel-royale-clip-rig-classes", 150],
  ["Next02", "barrel-royale-next02-streak", 600],
  ["Next03", "barrel-royale-next03-swap", 300],
  ["Next04", "barrel-royale-next04-royal-harbor", 450],
  ["Next05", "barrel-royale-next05-one-tap", 450],
  ["Next06", "barrel-royale-next06-rig-levels-6-8", 450],
  ["Next07", "barrel-royale-next07-mobile", 600],
  ["Next08", "barrel-royale-next08-live-chart", 300],
  ["Next09", "barrel-royale-next09-holder-pass", 600],
  ["Next10", "barrel-royale-next10-whats-next", 300],
  ["ClipCollectSell", "barrel-royale-clip-collect-sell", 150],
  ["ClipPhonePlay", "barrel-royale-clip-phone-play", 150],
  ["ClipVillage", "barrel-royale-clip-village", 900],
  ["CalloutDispatch", "barrel-royale-callout-dispatch", null],
  ["CalloutCapFree", "barrel-royale-callout-cap-free", null],
];

const only = process.argv.slice(2);
const serveUrl = await bundle({ entryPoint: join(root, "src", "index.ts"), webpackOverride: override, publicDir: join(root, "public") });
for (const [id, name, cover] of JOBS) {
  if (only.length && !only.includes(id)) continue;
  const composition = await selectComposition({ serveUrl, id, port });
  const mp4 = join(out, `${name}-1080p60.mp4`);
  await renderMedia({ composition, serveUrl, outputLocation: mp4, port, codec: "h264", crf: 16, pixelFormat: "yuv420p", colorSpace: "bt709", imageFormat: "jpeg", jpegQuality: 95 });
  copyFileSync(mp4, join(downloads, `${name}-1080p60.mp4`));
  if (cover !== null) {
    const png = join(out, `${name}.png`);
    await renderStill({ composition, serveUrl, output: png, frame: cover, port, scale: 1600 / 1920 });
    copyFileSync(png, join(downloads, `${name}.png`));
  }
  console.log(`done ${id} ${new Date().toLocaleTimeString()}`);
}
console.log("all done");
