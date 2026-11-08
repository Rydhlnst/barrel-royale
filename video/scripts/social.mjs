// Renders the social kit to out/social/: the announcement cards and the
// roadmap map and update card as 1600x900 PNGs, and the gameplay callouts and
// the roadmap update as 1080p60 videos.
// Usage: node scripts/social.mjs                 everything
//        node scripts/social.mjs roadmap         just the roadmap visuals
//        node scripts/social.mjs cards callouts  any of: roadmap, cards, callouts, features, clips
import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { override } from "./webpack.mjs";

const stills = { FeatureLiveChart: 560, FeaturePhonePlay: 215, FeatureRigClasses: 560, FeatureGetRoyal: 360, FeatureWhatsLive: 230 }; // FEATURES[id].still

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "out", "social");
mkdirSync(out, { recursive: true });

const groups = process.argv.slice(2);
const want = (g) => !groups.length || groups.includes(g);
const serveUrl = await bundle({ entryPoint: join(root, "src", "index.ts"), webpackOverride: override, publicDir: join(root, "public") });
const port = Number(process.env.PORT ?? 3157);
const ids = (await getCompositions(serveUrl, { port })).map((c) => c.id);

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const still = async (id, file, frame = 0) => {
  const composition = await selectComposition({ serveUrl, id, port });
  const output = join(out, file);
  await renderStill({ composition, serveUrl, output, frame, port, scale: 1600 / 1920 });
  console.log(output);
};
const video = async (id, file) => {
  const composition = await selectComposition({ serveUrl, id, port });
  const outputLocation = join(out, file);
  await renderMedia({ composition, serveUrl, outputLocation, port, codec: "h264", crf: 16, pixelFormat: "yuv420p", colorSpace: "bt709", imageFormat: "jpeg", jpegQuality: 95, onProgress: ({ progress }) => process.stdout.write(`\r${id} ${(progress * 100).toFixed(0)}%   `) });
  console.log(`\n${outputLocation}`);
};

if (want("roadmap")) {
  await still("RoadmapMap", "barrel-royale-roadmap-map.png", 30);
  await still("RoadmapUpdate", "barrel-royale-roadmap-update.png", 579); // ROADMAP_CARD_FRAME
  await video("RoadmapUpdate", "barrel-royale-roadmap-update-1080p60.mp4");
}
if (want("cards")) {
  for (const id of ids.filter((i) => i.startsWith("Card"))) await still(id, `barrel-royale-card-${kebab(id.slice(4))}.png`);
}
if (want("features")) {
  for (const id of ids.filter((i) => i.startsWith("Feature"))) {
    const name = `barrel-royale-feature-${kebab(id.slice(7))}`;
    await still(id, `${name}.png`, stills[id] ?? 560);
    await video(id, `${name}-1080p60.mp4`);
  }
}
if (want("clips")) {
  // the card is cut from the first beat, once its callout has landed
  for (const id of ids.filter((i) => i.startsWith("Clip"))) {
    const name = `barrel-royale-clip-${kebab(id.slice(4))}`;
    await still(id, `${name}.png`, 150);
    await video(id, `${name}-1080p60.mp4`);
  }
}
if (want("callouts")) {
  for (const id of ids.filter((i) => i.startsWith("Callout"))) await video(id, `barrel-royale-callout-${kebab(id.slice(7))}-1080p60.mp4`);
}
