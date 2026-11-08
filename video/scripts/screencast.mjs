// Films a Playwright page from inside the browser with the DevTools screencast,
// never from the screen, so nothing else on the desktop can end up in a video.
// Chrome sends a frame whenever the page changes (up to 60 a second); stop()
// lays them on a constant 60 fps timeline with FFmpeg (the full build).
import { execSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Starts filming; resolves once the first frame is in. `t0` is that frame's time in ms. */
export async function screencast(context, page, { file, ffmpeg = "ffmpeg", width = 1920, height = 1080 }) {
  const dir = `${file}.frames`;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const frames = [];
  let stopped = false;
  const cdp = await context.newCDPSession(page);
  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    // Chrome can still deliver a frame or two after stopScreencast.
    if (stopped) return;
    const f = join(dir, `f${String(frames.length).padStart(6, "0")}.jpg`);
    writeFileSync(f, Buffer.from(data, "base64"));
    frames.push({ f, at: metadata.timestamp });
    void cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: width, maxHeight: height, everyNthFrame: 1 });
  while (!frames.length) await new Promise((r) => setTimeout(r, 50));

  return {
    t0: frames[0].at * 1000,
    /** Stops filming and writes the video; each frame holds until the next, the last until now. */
    async stop() {
      const end = Date.now() / 1000;
      stopped = true;
      await cdp.send("Page.stopScreencast");
      const list = frames.map((x, i) => `file '${x.f.replace(/\\/g, "/")}'\nduration ${((frames[i + 1]?.at ?? end) - x.at).toFixed(4)}`).join("\n");
      writeFileSync(join(dir, "frames.txt"), `ffconcat version 1.0\n${list}\nfile '${frames.at(-1).f.replace(/\\/g, "/")}'\n`);
      execSync(`"${ffmpeg}" -v error -y -f concat -safe 0 -i "${join(dir, "frames.txt")}" -fps_mode cfr -r 60 -vf "scale=${width}:${height}" -c:v libx264 -preset slow -crf 16 -g 30 -pix_fmt yuv420p -movflags +faststart "${file}"`);
      rmSync(dir, { recursive: true, force: true });
      return { frames: frames.length, seconds: end - frames[0].at };
    },
  };
}
