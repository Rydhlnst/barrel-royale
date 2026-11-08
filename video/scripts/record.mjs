// Films the live site and game for the launch videos.
// Usage: node scripts/record.mjs [home|play|whitelist|docs ...]   (default: all four)
//
// Headless Chrome, filmed from inside the browser (scripts/screencast.mjs), so
// the desktop is never captured. Needs the full FFmpeg build on PATH or in FFMPEG.
// Writes public/footage/<name>.mp4 and <name>.json: when each step happened, in
// seconds from the first frame.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { screencast } from "./screencast.mjs";

const SITE = process.env.SITE ?? "https://barrelroyale.io";
const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "footage");
mkdirSync(out, { recursive: true });
const ffmpeg = process.env.FFMPEG ?? "ffmpeg";
const W = 1920;
const H = 1080;
const only = process.argv.slice(2);
const want = (name) => !only.length || only.includes(name);

// The GPU, not SwiftShader: the game holds 60 fps only with it.
const browser = await chromium.launch({ args: ["--hide-scrollbars", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu"] });

// A phone: 390x844 CSS px at 2x, filmed at 780x1688, with a tap dot in place of the arrow.
const PHONE = { width: 390, height: 844, scale: 2 };

/** A page with a plain arrow pointer that follows the mouse; `zoom` draws a laptop-sized layout at 1080p. */
async function open(path, { zoom = 1, setup, phone = false, before } = {}) {
  const context = await browser.newContext(
    phone
      ? { viewport: { width: PHONE.width, height: PHONE.height }, deviceScaleFactor: PHONE.scale, isMobile: true, hasTouch: true }
      : { viewport: { width: W, height: H } },
  );
  if (setup) for (const x of [setup].flat()) await context.addInitScript(x.fn, x.arg);
  if (before) await before(context);
  const page = await context.newPage();
  await page.goto(SITE + path, { waitUntil: "networkidle" });
  // the "$ROYAL contract · posted at launch" chip is for before the token exists; the videos announce it
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("span")) {
      if (el.textContent?.includes("posted at launch")) el.closest(".pixel")?.setAttribute("style", "visibility: hidden");
    }
  });
  // the pointer lives in the page, so it goes again after a navigation
  const addCursor = async () => {
    await page.addStyleTag({
      content: `
        ${zoom !== 1 ? `html { zoom: ${zoom}; }` : ""}
        .rec-cursor { position: fixed; left: -100px; top: -100px; width: 26px; height: 32px; pointer-events: none; z-index: 2147483647;
          transform-origin: 2px 2px; transition: transform .1s ease-out; }
        .rec-cursor.down { transform: scale(.86); }`,
    });
    await page.evaluate(([zoom, phone]) => {
      const c = document.createElement("div");
      c.className = "rec-cursor";
      if (phone) c.style.cssText = "width: 34px; height: 34px; margin: -17px 0 0 -17px; border-radius: 50%; background: rgba(30,42,74,.35); border: 3px solid #fff; box-shadow: 0 0 0 3px #1e2a4a; transform-origin: 50% 50%;";
      // a pixel arrow, to match the art
      if (!phone) c.innerHTML = `<svg viewBox="0 0 13 16" width="26" height="32" shape-rendering="crispEdges"><path d="M0 0h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h-4v1h1v1h1v1h-1v1h-2v-1h-1v-1h-1v-1h-1v1h-1v1h-1v1h-1Z" fill="#1e2a4a"/><path d="M1 2h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h-4v1h1v1h1v1h-1v-1h-1v-1h-1v-1h-1v1h-1v1h-1v1h-1Z" fill="#fff"/></svg>`;
      document.body.appendChild(c);
      addEventListener("mousemove", (e) => ((c.style.left = e.clientX / zoom + "px"), (c.style.top = e.clientY / zoom + "px")));
      addEventListener("mousedown", () => c.classList.add("down"));
      addEventListener("mouseup", () => c.classList.remove("down"));
    }, [zoom, phone]);
  };
  await addCursor();
  const wait = (ms) => page.waitForTimeout(ms);

  // Hand-like movement: eased in and out over real time, on a slight arc.
  let at = phone ? { x: PHONE.width * 0.7, y: PHONE.height * 0.8 } : { x: W * 0.7, y: H * 0.55 };
  await page.mouse.move(at.x, at.y);
  async function glide(locator, dwell = 300, fast = false) {
    const b = await locator.boundingBox({ timeout: 5000 });
    const to = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    const dist = Math.hypot(to.x - at.x, to.y - at.y);
    const ms = Math.min(900, 360 + dist * 0.55);
    const n = fast ? 5 : Math.max(12, Math.round(ms / 16));
    const bend = Math.min(60, dist * 0.12);
    for (let i = 1; i <= n; i++) {
      const p = i / n;
      const e = p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
      await page.mouse.move(at.x + (to.x - at.x) * e, at.y + (to.y - at.y) * e - Math.sin(Math.PI * e) * bend);
      await wait(16);
    }
    at = to;
    await wait(dwell);
  }
  async function click(locator, dwell, fast) {
    await glide(locator, dwell, fast);
    await page.mouse.down();
    await wait(110);
    await page.mouse.up();
  }
  /** Scrolls the window to `y` (CSS px of the page) over `ms`, eased, frame by frame. */
  const scrollTo = (y, ms) =>
    page.evaluate(
      ([y, ms]) =>
        new Promise((done) => {
          const from = scrollY;
          const t0 = performance.now();
          const step = (t) => {
            const p = Math.min(1, (t - t0) / ms);
            const e = p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
            scrollTo(0, from + (y - from) * e);
            p < 1 ? requestAnimationFrame(step) : done();
          };
          requestAnimationFrame(step);
        }),
      [y, ms],
    );
  /** Page y of an element, in the unzoomed page's CSS px. */
  const top = (locator) => locator.evaluate((el) => el.getBoundingClientRect().top + scrollY);

  const size = phone ? { width: PHONE.width * PHONE.scale, height: PHONE.height * PHONE.scale } : { width: W, height: H };
  return { context, page, wait, glide, click, scrollTo, top, size, addCursor };
}

async function film(name, s, run) {
  const file = join(out, `${name}.mp4`);
  const cast = await screencast(s.context, s.page, { file, ffmpeg, ...s.size });
  const marks = {};
  const mark = (k) => (marks[k] = +((Date.now() - cast.t0) / 1000).toFixed(3));
  await run(mark);
  mark("end");
  const shot = await cast.stop();
  await s.context.close();
  writeFileSync(join(out, `${name}.json`), JSON.stringify({ marks }, null, 2) + "\n");
  console.log(name, { marks, ...shot });
}

// ---------------- the landing page ----------------
if (want("home")) {
  const s = await open("/", { zoom: W / 1440 });
  await s.wait(1200);
  await film("home", s, async (mark) => {
    mark("hero");
    await s.wait(3200);
    for (const id of ["how", "gameplay", "xom", "fleet", "whitelist", "roadmap-preview"]) {
      const y = await s.top(s.page.locator(`#${id}`));
      mark(id);
      await s.scrollTo(y, 1500);
      await s.wait(2000);
    }
    mark("back");
    await s.scrollTo(0, 2000);
    await s.wait(1500);
  });
}

// ---------------- the whitelist ----------------
if (want("whitelist")) {
  const s = await open("/whitelist", { zoom: W / 1440 });
  await s.wait(1200);
  await film("whitelist", s, async (mark) => {
    mark("top");
    await s.wait(3000);
    mark("scroll");
    await s.scrollTo(820, 2400);
    await s.wait(2200);
    await s.scrollTo(1700, 2400);
    await s.wait(2000);
  });
}

// ---------------- the docs: tokenomics ----------------
if (want("docs")) {
  const s = await open("/docs", { zoom: W / 1440 });
  await s.wait(1200);
  await film("docs", s, async (mark) => {
    mark("top");
    await s.wait(1600);
    const y = await s.top(s.page.locator("#tokenomics"));
    mark("tokenomics");
    await s.scrollTo(y - 40, 2600);
    await s.wait(2600);
    mark("classes");
    await s.scrollTo(y + 560, 2200);
    await s.wait(3000);
    mark("flow");
    await s.scrollTo(y + 980, 2000);
    await s.wait(2600);
  });
}

// ---------------- feature clips: Get $ROYAL, then into the rig ----------------
if (want("getroyal")) {
  const s = await open("/", { zoom: W / 1440 });
  await s.context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: SITE });
  await s.wait(1200);
  const hero = s.page.locator("section").first();
  await film("getroyal", s, async (mark) => {
    mark("hero");
    await s.wait(1800);
    mark("get");
    await s.glide(hero.getByRole("link", { name: /^Get / }), 1500);
    mark("copy");
    await s.click(hero.getByRole("button", { name: /Copy/ }), 200);
    await s.wait(1700);
    mark("enter");
    await s.click(hero.getByRole("link", { name: "Enter the rig" }), 300);
    await s.page.waitForURL("**/play");
    mark("play");
    await s.wait(4000);
  });
}

// ---------------- feature clips: the docs' "What's live today" table ----------------
if (want("live")) {
  const s = await open("/docs", { zoom: W / 1440 });
  await s.wait(1200);
  const rows = s.page.locator("#status tr");
  await film("live", s, async (mark) => {
    mark("top");
    await s.wait(1000);
    const y = await s.top(s.page.locator("#status"));
    mark("status");
    await s.scrollTo(y - 30, 1800);
    await s.wait(800);
    mark("rows");
    for (const i of [1, 4, 8]) await s.glide(rows.nth(i).locator("td").last(), 650);
    mark("next");
    await s.scrollTo(y + 420, 2200);
    await s.wait(500);
    await s.glide(rows.filter({ hasText: "Rig class upgrades" }).locator("td").last(), 900);
    await s.glide(rows.filter({ hasText: "Crews, seasons" }).locator("td").last(), 1400);
  });
}

// ---------------- feature clips: the rig classes in the docs ----------------
if (want("rigs")) {
  const s = await open("/docs", { zoom: W / 1440 });
  await s.wait(1200);
  await film("rigs", s, async (mark) => {
    mark("top");
    await s.wait(600);
    const y = await s.top(s.page.locator("#rigs"));
    mark("rigs");
    await s.scrollTo(y - 30, 1800);
    await s.wait(700);
    mark("rows");
    const rows = s.page.locator("#rigs tr");
    for (const i of [1, 2, 3, 4]) await s.glide(rows.nth(i).locator("td").last(), 700);
    await s.wait(1200);
  });
}

// ---------------- feature clips: the site on a phone, into the wallet picker ----------------
if (want("phone")) {
  const s = await open("/", { phone: true });
  await s.wait(1200);
  await film("phone", s, async (mark) => {
    mark("home");
    await s.wait(1800);
    mark("enter");
    await s.click(s.page.locator("section").first().getByRole("link", { name: "Enter the rig" }), 300);
    await s.page.waitForURL("**/play");
    await s.addCursor();
    mark("play");
    await s.page.getByText("MetaMask", { exact: true }).first().waitFor({ timeout: 15_000 });
    mark("wallets");
    await s.wait(900);
    for (const w of ["MetaMask", "Coinbase Wallet", "Trust Wallet"]) await s.glide(s.page.getByText(w, { exact: true }).first(), 900);
    await s.wait(800);
  });
}

// ---------------- the game ----------------
// A rig a few minutes in: level 3, wells pumping, units refining, barrels in
// the tanks and contracts on the board, so every step has something to show.
const seed = () => {
  if (localStorage.getItem("__seeded")) return;
  localStorage.setItem("__seeded", "1");
  const now = Date.now();
  const day = Math.floor(now / 86_400_000);
  const P = ["light", "gas", "heavy", "diesel", "jet", "lng"];
  const wave = (k) => Array.from({ length: 30 }, (_, i) => +(1 + 0.12 * Math.sin(i / 3 + k) + 0.05 * Math.sin(i * 1.7 + k * 2)).toFixed(2));
  const history = Object.fromEntries(P.map((p, k) => [p, wave(k)]));
  const index = Object.fromEntries(P.map((p) => [p, history[p][29]]));
  const well = (product, choke, pressure, held) => ({ kind: "well", product, choke, pressure, held, blown: false });
  const unit = (unit, level, progress) => ({ kind: "unit", unit, level, recipe: 0, progress });
  const game = {
    version: 1,
    savedAt: now,
    coins: 214,
    xom: (1200 / 300) * 0.001 / 115,
    exported: { day, bbl: 1200 },
    level: 3,
    slots: [
      well("gas", "normal", 58, 10),
      unit("distillation", 2, 0.5),
      { kind: "empty" },
      well("light", "normal", 60, 12),
      unit("cracker", 1, 0.3),
      well("light", "normal", 55, 14),
      unit("liquefier", 1, 0.2),
      well("heavy", "safe", 30, 7),
      { kind: "empty" },
      { kind: "empty" },
      { kind: "empty" },
      { kind: "empty" },
    ],
    storage: { light: 30, gas: 12, heavy: 40, diesel: 16, jet: 4, lng: 3 },
    index,
    history,
    contracts: [
      { id: 1, product: "diesel", qty: 8, reward: 64, expiresAt: now + 300_000 },
      { id: 2, product: "lng", qty: 6, reward: 114, expiresAt: now + 260_000 },
    ],
    nextContractAt: now + 120_000,
    nextMarketAt: now + 4_000,
    nextStormAt: now + 900_000,
    storm: null,
    points: 380,
    stormsHeld: 2,
    contractsFilled: 3,
    nextId: 3,
    log: [{ at: now, text: "Welcome aboard, roughneck." }],
  };
  localStorage.setItem("barrel-royale-game-v1", JSON.stringify(game));
};

if (want("play")) {
  const s = await open("/play", { setup: { fn: seed } });
  const { page, wait } = s;
  await page.locator("canvas").waitFor();
  await wait(2500);

  const prompt = (label) => page.getByText(label, { exact: true });
  /** Holds the keys until the prompt for `label` shows up. */
  async function walk(keys, label, timeout = 8000) {
    for (const k of keys) await page.keyboard.down(k);
    const t0 = Date.now();
    try {
      while (!(await prompt(label).isVisible().catch(() => false))) {
        if (Date.now() - t0 > timeout) throw new Error(`never reached ${label}`);
        await wait(15);
      }
    } finally {
      for (const k of keys) await page.keyboard.up(k);
    }
  }
  async function hold(keys, ms) {
    for (const k of keys) await page.keyboard.down(k);
    await wait(ms);
    for (const k of keys) await page.keyboard.up(k);
  }
  const panel = page.locator("section[aria-label]");

  await film("play", s, async (mark) => {
    mark("deck");
    await wait(1500);
    await hold(["ArrowRight"], 500);
    await hold(["ArrowLeft"], 500);

    // 1. drill a light crude well on the empty pad
    mark("walk-pad");
    await walk(["ArrowLeft"], "Slot 3");
    await wait(700);
    mark("open-pad");
    await page.keyboard.press("e");
    await wait(1400);
    await s.click(panel.getByRole("button", { name: /Light crude/ }), 300);
    mark("drilled");
    await wait(1800);
    await page.keyboard.press("Escape");
    await wait(500);

    // 2. collect from the well next door, then push its choke to Overdrive
    mark("walk-well");
    await walk(["ArrowRight"], "Slot 4");
    await wait(600);
    mark("collect");
    await page.keyboard.press("e");
    await wait(1500);
    mark("manage");
    await page.keyboard.press("f");
    await wait(1400);
    await s.click(panel.getByRole("radio", { name: /Overdrive/ }), 200);
    mark("overdrive");
    await panel.getByText("Blowout!", { exact: false }).waitFor({ timeout: 30_000 });
    mark("blowout");
    await wait(1600);
    await s.click(panel.getByRole("button", { name: /Capping drill/ }), 300);
    mark("drill");
    await wait(400);
    const order = await panel.locator('ol[aria-label="Valve order"] li').allTextContents();
    console.log("valves", order);
    try {
      for (const l of order) await s.click(panel.getByRole("button", { name: `Valve ${l.trim()}` }), 40, true);
    } catch (e) {
      await page.screenshot({ path: join(out, "debug.png") });
      throw e;
    }
    mark("capped");
    await wait(2000);
    await page.keyboard.press("Escape");
    await wait(400);

    // 3. sell at the market terminal: bump into the derrick, then walk left along it
    mark("walk-market");
    await hold(["ArrowUp"], 700);
    await walk(["ArrowLeft"], "Market terminal");
    await wait(500);
    mark("market");
    await page.keyboard.press("e");
    await wait(1800);
    await s.click(panel.locator("li", { hasText: "LNG" }).getByRole("button", { name: "Sell" }), 300);
    mark("sold");
    await wait(1800);
    await s.click(panel.locator("li", { hasText: "Heavy crude" }).getByRole("button", { name: "Export" }), 300);
    mark("exported");
    await wait(2600);
    await page.keyboard.press("Escape");
    await wait(400);

    // 4. the refinery under the kiosk: switch the distillation unit to jet fuel
    mark("walk-unit");
    await hold(["ArrowLeft"], 300);
    await walk(["ArrowDown"], "Slot 2");
    await wait(500);
    mark("refinery");
    await page.keyboard.press("e");
    await wait(1400);
    await s.click(panel.getByRole("button", { name: /Jet fuel/ }), 300);
    mark("jet");
    await wait(2600);
    await page.keyboard.press("Escape");
    await wait(400);

    // 5. fill a contract on the Dispatch board, down by the dock
    mark("walk-dispatch");
    await hold(["ArrowLeft"], 600);
    await hold(["ArrowDown"], 2600);
    await walk(["ArrowRight"], "Dispatch board", 10_000);
    await wait(500);
    mark("dispatch");
    await page.keyboard.press("e");
    await wait(1800);
    await s.click(panel.locator("li", { hasText: "Diesel" }).getByRole("button", { name: "Fill" }), 300);
    mark("filled");
    await wait(2400);
    await page.keyboard.press("Escape");
    await wait(1500);
  });
}

// ---------------- the game on a phone ----------------
// The rig opens for wallets holding $ROYAL, so the recorder brings its own: a
// stand-in wallet in the page and the balance check answered inside this
// browser. Nothing is sent to a wallet or to the chain.
const DEMO = "0x7a3f5e2b9c4d81a6f0e3b7c2d9a1e4f6b8c0c91e";
const demoWallet = (account) => {
  window.ethereum = {
    isMetaMask: true,
    on() {},
    removeListener() {},
    async request({ method }) {
      if (method === "eth_accounts" || method === "eth_requestAccounts") return [account];
      if (method === "eth_chainId") return "0x1237";
      return null;
    },
  };
};
/** Answers the $ROYAL balance check: 5,000,000 tokens with 18 decimals. */
async function demoChain(context) {
  await context.route("https://rpc.mainnet.chain.robinhood.com/**", async (route) => {
    const { id, params } = route.request().postDataJSON();
    const data = params?.[0]?.data ?? "";
    const result = data.startsWith("0x313ce567") ? "0x" + (18).toString(16).padStart(64, "0") : "0x" + (5_000_000n * 10n ** 18n).toString(16).padStart(64, "0");
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ jsonrpc: "2.0", id, result }) });
  });
}

// The market panel's export quota lines stay out of the posts.
const hideQuota = () => {
  new MutationObserver(() => {
    for (const el of document.querySelectorAll("section[aria-label] p, section[aria-label] .pixel-sm")) {
      if (el.textContent.includes("quota")) el.style.display = "none";
    }
  }).observe(document, { childList: true, subtree: true });
};

if (want("mplay")) {
  const s = await open("/play", { phone: true, setup: [{ fn: seed }, { fn: demoWallet, arg: DEMO }, { fn: hideQuota }], before: demoChain });
  const { page, wait } = s;
  const panel = page.locator("section[aria-label]");
  const stick = page.locator("[aria-label=\"Move\"]");
  const chip = (label) => page.getByText(label, { exact: true });
  /** Holds the thumb on the stick, pushed toward (dx, dy), until `label` shows or for `ms`. */
  async function push(dx, dy, { label, ms = 8000 } = {}) {
    await s.glide(stick, 150);
    const b = await stick.boundingBox();
    const c = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    await page.mouse.down();
    for (let i = 1; i <= 8; i++) {
      await page.mouse.move(c.x + dx * 48 * (i / 8), c.y + dy * 48 * (i / 8));
      await wait(16);
    }
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      if (label && (await chip(label).isVisible().catch(() => false))) break;
      await wait(15);
    }
    if (label && !(await chip(label).isVisible().catch(() => false))) throw new Error(`never reached ${label}`);
    await page.mouse.move(c.x, c.y);
    await page.mouse.up();
  }
  const action = () => page.locator("button.btn-red").first();
  const close = () => s.click(panel.getByRole("button", { name: "Close" }), 400);

  await film("mplay", s, async (mark) => {
    mark("picker");
    await wait(1500);
    mark("connect");
    await s.click(page.getByRole("button", { name: /MetaMask/ }).first(), 300);
    await page.locator("canvas").waitFor({ timeout: 20_000 });
    mark("deck");
    await wait(2200);

    // 1. drill a light crude well on the empty pad
    mark("walk-pad");
    await push(-1, 0, { label: "Slot 3" });
    await wait(500);
    mark("open-pad");
    await s.click(action(), 900);
    await s.click(panel.getByRole("button", { name: /Light crude/ }), 300);
    mark("drilled");
    await wait(1800);
    await close();

    // 2. collect from the well next door, then set its choke
    mark("walk-well");
    await push(1, 0, { label: "Slot 4" });
    await wait(500);
    mark("collect");
    await s.click(action(), 1300);
    mark("manage");
    // with the barrels collected, the same button opens the well
    await s.click(action(), 900);
    await s.click(panel.getByRole("radio", { name: /Overdrive/ }), 300);
    mark("overdrive");
    await wait(1800);
    await close();

    // 3. sell and export at the market terminal
    mark("walk-market");
    await push(0, -1, { ms: 700 });
    await push(-1, 0, { label: "Market terminal" });
    await wait(500);
    mark("market");
    await s.click(action(), 1300);
    await s.click(panel.locator("li", { hasText: "Light crude" }).getByRole("button", { name: "Sell" }), 300);
    mark("sold");
    await wait(1400);
    await s.click(panel.locator("li", { hasText: "Natural gas" }).getByRole("button", { name: "Sell" }), 300);
    mark("sold-gas");
    await wait(2000);
    await close();
    await wait(1200);
  });
}
// ---------------- rig levels 6 to 8, on a local server ----------------
// A level 5 rig with full tanks and the coins for three upgrades, with the
// live chart folded away (GMGN turns away automated browsers). Run the web
// app locally with NEXT_PUBLIC_DEV_OPEN_PLAY=1 and point SITE at it, e.g.
// SITE=http://localhost:3240 node scripts/record.mjs levels
const levelSeed = () => {
  if (localStorage.getItem("__seeded")) return;
  localStorage.setItem("__seeded", "1");
  localStorage.setItem("barrel-royale-chart-open", "0");
  const now = Date.now();
  const P = ["light", "gas", "heavy", "diesel", "jet", "lng"];
  const flat = Object.fromEntries(P.map((p) => [p, Array.from({ length: 30 }, () => 1)]));
  const well = (product) => ({ kind: "well", product, choke: "normal", pressure: 50, held: 6, blown: false });
  const game = {
    version: 1,
    savedAt: now,
    coins: 312_450,
    xom: 0.0004,
    exported: { day: 0, bbl: 0 },
    level: 5,
    slots: [well("light"), well("gas"), well("heavy"), well("light"), well("light"), well("heavy"), well("gas"), well("light"), well("heavy"), well("light"), well("gas"), well("light")],
    storage: { light: 70, gas: 40, heavy: 60, diesel: 30, jet: 16, lng: 12 },
    index: Object.fromEntries(P.map((p) => [p, 1])),
    history: flat,
    contracts: [],
    nextContractAt: now + 600_000,
    nextMarketAt: now + 4_000,
    nextStormAt: now + 900_000,
    storm: null,
    points: 2400,
    stormsHeld: 9,
    contractsFilled: 14,
    nextId: 1,
    log: [{ at: now, text: "Welcome aboard, roughneck." }],
  };
  localStorage.setItem("barrel-royale-game-v1", JSON.stringify(game));
};

if (want("levels")) {
  const s = await open("/play", { setup: [{ fn: levelSeed }, { fn: demoWallet, arg: DEMO }] });
  const { page, wait } = s;
  const panel = page.locator("section[aria-label]");
  const seen = (label) => page.getByText(label, { exact: true }).isVisible().catch(() => false);
  /** Holds the keys for up to `ms`, stopping early once `label` shows. */
  async function hold(keys, ms, label) {
    for (const k of keys) await page.keyboard.down(k);
    const t0 = Date.now();
    while (Date.now() - t0 < ms && !(label && (await seen(label)))) await wait(15);
    for (const k of keys) await page.keyboard.up(k);
    return label ? seen(label) : true;
  }
  await s.click(page.getByRole("button", { name: /MetaMask/ }).first(), 200);
  await page.locator("canvas").waitFor({ timeout: 60_000 });
  await wait(2500);
  await film("levels", s, async (mark) => {
    mark("deck");
    await wait(1200);
    mark("walk");
    if (!(await hold(["ArrowRight"], 5000, "Storage tanks"))) {
      await hold(["ArrowDown"], 400);
      if (!(await hold(["ArrowRight"], 3000, "Storage tanks"))) throw new Error("never reached the tanks");
    }
    await wait(600);
    mark("open");
    await page.keyboard.press("e");
    await wait(1800);
    for (const lv of [6, 7, 8]) {
      mark(`up${lv}`);
      await s.click(panel.getByRole("button", { name: new RegExp(`Upgrade rig to level ${lv}`) }), 200);
      await wait(1900);
    }
    mark("top");
    await wait(2500);
  });
}

// ---------------- collect from every well, sell everything (local server) ----------------
// SITE=http://localhost:3240 node scripts/record.mjs qol
const qolSeed = () => {
  if (localStorage.getItem("__seeded")) return;
  localStorage.setItem("__seeded", "1");
  localStorage.setItem("barrel-royale-chart-open", "0");
  const now = Date.now();
  const P = ["light", "gas", "heavy", "diesel", "jet", "lng"];
  const wave = (k) => Array.from({ length: 30 }, (_, i) => +(1.1 + 0.15 * Math.sin(i / 3 + k)).toFixed(2));
  const history = Object.fromEntries(P.map((p, k) => [p, wave(k)]));
  const well = (product, held) => ({ kind: "well", product, choke: "normal", pressure: 50, held, blown: false });
  const game = {
    version: 1,
    savedAt: now,
    coins: 3_820,
    xom: 0.0004,
    exported: { day: 0, bbl: 0 },
    level: 5,
    slots: [well("light", 14), well("gas", 13), well("heavy", 12), well("light", 14), well("light", 13), well("heavy", 11), well("gas", 12), well("light", 14), well("heavy", 12), well("light", 13), well("gas", 12), well("heavy", 11)],
    storage: { light: 12, gas: 6, heavy: 8, diesel: 10, jet: 4, lng: 2 },
    index: Object.fromEntries(P.map((p) => [p, history[p][29]])),
    history,
    contracts: [],
    nextContractAt: now + 600_000,
    nextMarketAt: now + 60_000,
    nextStormAt: now + 900_000,
    storm: null,
    points: 2400,
    stormsHeld: 9,
    contractsFilled: 14,
    nextId: 1,
    log: [{ at: now, text: "Welcome aboard, roughneck." }],
  };
  localStorage.setItem("barrel-royale-game-v1", JSON.stringify(game));
};

if (want("qol")) {
  const s = await open("/play", { setup: [{ fn: qolSeed }, { fn: demoWallet, arg: DEMO }, { fn: hideQuota }] });
  const { page, wait } = s;
  const panel = page.locator("section[aria-label]");
  const seen = (label) => page.getByText(label, { exact: true }).isVisible().catch(() => false);
  async function hold(keys, ms, label) {
    for (const k of keys) await page.keyboard.down(k);
    const t0 = Date.now();
    while (Date.now() - t0 < ms && !(label && (await seen(label)))) await wait(15);
    for (const k of keys) await page.keyboard.up(k);
    return label ? seen(label) : true;
  }
  await s.click(page.getByRole("button", { name: /MetaMask/ }).first(), 200);
  await page.locator("canvas").waitFor({ timeout: 60_000 });
  await wait(2500);
  await film("qol", s, async (mark) => {
    mark("deck");
    await wait(1000);
    mark("walk-tanks");
    if (!(await hold(["ArrowRight"], 5000, "Storage tanks"))) {
      await hold(["ArrowDown"], 400);
      if (!(await hold(["ArrowRight"], 3000, "Storage tanks"))) throw new Error("never reached the tanks");
    }
    await wait(500);
    mark("tanks");
    await page.keyboard.press("e");
    await wait(1500);
    mark("collect");
    await s.click(panel.getByRole("button", { name: /Collect from every well/ }), 300);
    mark("collected");
    await wait(2200);
    await page.keyboard.press("Escape");
    await wait(400);
    mark("walk-market");
    // left along the lane above the pads until under the kiosk, then up to it
    let atMarket = await hold(["ArrowLeft"], 3800, "Market terminal");
    for (let i = 0; i < 8 && !atMarket; i++) {
      atMarket = await hold(["ArrowUp"], 500, "Market terminal");
      if (!atMarket) {
        await hold(["ArrowDown"], 500);
        atMarket = await hold(["ArrowLeft"], 300, "Market terminal");
      }
    }
    if (!atMarket) {
      await page.screenshot({ path: join(out, "debug.png") });
      throw new Error("never reached the market");
    }
    await wait(500);
    mark("market");
    await page.keyboard.press("e");
    await wait(1600);
    mark("sell");
    await s.click(panel.getByRole("button", { name: /Sell everything/ }), 300);
    mark("sold");
    await wait(2600);
  });
}

// ---------------- Royal Harbor, the village, with a few players (local server) ----------------
// SITE=http://localhost:3243 node scripts/record.mjs village   (DATABASE_URL set, NEXT_PUBLIC_DEV_OPEN_PLAY=1)
// Four other roughnecks are already on the boardwalk; the filmed player rows over from the rig and joins them.
const harborSeed = (level) => {
  if (localStorage.getItem("__seeded")) return;
  localStorage.setItem("__seeded", "1");
  localStorage.setItem("barrel-royale-chart-open", "0");
  const now = Date.now();
  const P = ["light", "gas", "heavy", "diesel", "jet", "lng"];
  const flat = Object.fromEntries(P.map((p) => [p, Array.from({ length: 30 }, () => 1)]));
  const well = (product) => ({ kind: "well", product, choke: "normal", pressure: 50, held: 4, blown: false });
  const game = {
    version: 1, savedAt: now, coins: 2_400, xom: 0.0004, exported: { day: 0, bbl: 0 }, level,
    slots: Array.from({ length: 12 }, (_, i) => (i < 6 ? well(i % 2 ? "light" : "heavy") : { kind: "empty" })),
    storage: { light: 10, gas: 4, heavy: 6, diesel: 2, jet: 0, lng: 0 },
    index: Object.fromEntries(P.map((p) => [p, 1])), history: flat, contracts: [],
    nextContractAt: now + 600_000, nextMarketAt: now + 60_000, nextStormAt: now + 3_600_000, storm: null,
    points: 900, stormsHeld: 3, contractsFilled: 5, nextId: 1, log: [{ at: now, text: "Welcome aboard, roughneck." }],
  };
  localStorage.setItem("barrel-royale-game-v1", JSON.stringify(game));
};

if (want("village")) {
  const crew = [
    { wallet: "0x5a1e00000000000000000000000000000000b000", level: 6, path: [["ArrowLeft", 1500], ["ArrowUp", 1400]] },
    { wallet: "0x7c3d00000000000000000000000000000000a002", level: 8, path: [["ArrowRight", 1500], ["ArrowUp", 1800]] },
    { wallet: "0x91fa00000000000000000000000000000000c003", level: 4, path: [["ArrowLeft", 700], ["ArrowUp", 2600]] },
    { wallet: "0x2b8e00000000000000000000000000000000d004", level: 7, path: [["ArrowRight", 2400], ["ArrowUp", 800]] },
  ];
  const hold = async (page, key, ms) => {
    await page.keyboard.down(key);
    await page.waitForTimeout(ms);
    await page.keyboard.up(key);
  };
  const others = [];
  for (const c of crew) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 760 } });
    await context.addInitScript(harborSeed, c.level);
    await context.addInitScript(demoWallet, c.wallet);
    const page = await context.newPage();
    await page.goto(SITE + "/play", { waitUntil: "networkidle", timeout: 120_000 });
    await page.getByRole("button", { name: /MetaMask/ }).first().click();
    await page.locator("canvas").waitFor({ timeout: 60_000 });
    await page.getByRole("button", { name: "Village", exact: true }).click();
    await page.getByText("Royal Harbor", { exact: true }).waitFor({ timeout: 30_000 });
    await page.waitForTimeout(800);
    others.push({ ...c, page });
  }
  // everyone walks to their spot around the fire
  await Promise.all(others.map(async (o) => { for (const [k, ms] of o.path) await hold(o.page, k, ms); }));
  const say = async (page, text) => {
    await page.getByLabel("Chat message").fill(text);
    await page.getByRole("button", { name: "Send" }).click();
  };

  const s = await open("/play", { setup: [{ fn: harborSeed, arg: 5 }, { fn: demoWallet, arg: DEMO }] });
  const { page, wait } = s;
  await s.click(page.getByRole("button", { name: /MetaMask/ }).first(), 200);
  await page.locator("canvas").waitFor({ timeout: 60_000 });
  await wait(2000);
  await film("village", s, async (mark) => {
    mark("rig");
    await wait(1200);
    mark("button");
    await s.click(page.getByRole("button", { name: "Village", exact: true }), 300);
    await page.getByText("Royal Harbor", { exact: true }).waitFor({ timeout: 30_000 });
    mark("harbor");
    await wait(1400);
    void say(others[0].page, "GM roughnecks!");
    await wait(700);
    mark("walk");
    await page.keyboard.down("ArrowUp");
    await wait(900);
    void say(others[1].page, "Just hit level 8, storage feels huge");
    await wait(900);
    await page.keyboard.up("ArrowUp");
    await wait(900);
    void say(others[3].page, "Anyone running Overdrive on light crude?");
    await wait(1600);
    void hold(others[2].page, "ArrowRight", 500);
    mark("type");
    await s.click(page.getByLabel("Chat message"), 200);
    await page.keyboard.type("Meet by the fire, crew", { delay: 55 });
    await wait(300);
    await s.click(page.getByRole("button", { name: "Send" }), 200);
    mark("sent");
    await wait(1600);
    void say(others[2].page, "On my way");
    await wait(2600);
    mark("end-scene");
  });
  for (const o of others) await o.page.context().close();
}

// ---------------- Daily Shift (local server) ----------------
// SITE=http://localhost:3243 node scripts/record.mjs shift shiftfull
// shift: four tasks done, claimed one by one, then the fifth swapped. shiftfull: all five done, claimed, then the full-shift bonus.
const shiftSeed = (allDone) => {
  if (localStorage.getItem("__seeded")) return;
  localStorage.setItem("__seeded", "1");
  localStorage.setItem("barrel-royale-chart-open", "0");
  const now = Date.now();
  const day = Math.floor(now / 86_400_000);
  const P = ["light", "gas", "heavy", "diesel", "jet", "lng"];
  const flat = Object.fromEntries(P.map((p) => [p, Array.from({ length: 30 }, () => 1)]));
  const well = (product) => ({ kind: "well", product, choke: "normal", pressure: 50, held: 6, blown: false });
  const t = (kind, target, progress, product) => ({ kind, target, progress, claimed: false, ...(product ? { product } : {}) });
  const game = {
    version: 1, savedAt: now, coins: 8_420, xom: 0.0004, exported: { day: 0, bbl: 0 }, level: 5,
    slots: Array.from({ length: 12 }, (_, i) => well(["light", "gas", "heavy"][i % 3])),
    storage: { light: 40, gas: 20, heavy: 30, diesel: 12, jet: 4, lng: 3 },
    index: Object.fromEntries(P.map((p) => [p, 1])), history: flat, contracts: [],
    nextContractAt: now + 600_000, nextMarketAt: now + 60_000, nextStormAt: now + 3_600_000, storm: null,
    points: 5200, stormsHeld: 12, contractsFilled: 31, nextId: 1, log: [{ at: now, text: "Welcome aboard, roughneck." }],
    shift: {
      day, swaps: 1, bonusClaimed: false, streak: 4, lastFull: day - 1,
      tasks: [t("collect", 170, 170), t("sell", 170, 170), t("earn", 1500, 1500), t("contract", 3, 3), allDone ? t("refine", 19, 19) : t("overdrive", 135, 40)],
    },
  };
  localStorage.setItem("barrel-royale-game-v1", JSON.stringify(game));
};

for (const name of ["shift", "shiftfull"]) {
  if (!want(name)) continue;
  const full = name === "shiftfull";
  const s = await open("/play", { setup: [{ fn: shiftSeed, arg: full }, { fn: demoWallet, arg: DEMO }] });
  const { page, wait } = s;
  await s.click(page.getByRole("button", { name: /MetaMask/ }).first(), 200);
  await page.locator("canvas").waitFor({ timeout: 60_000 });
  await wait(2000);
  const panel = page.locator('section[aria-label="Daily shift"]');
  await film(name, s, async (mark) => {
    mark("rig");
    await wait(1500);
    mark("open");
    await s.click(page.getByRole("button", { name: /^Daily shift/ }), 300);
    await panel.waitFor();
    await wait(1200);
    const claims = full ? 5 : 4;
    for (let i = 0; i < claims; i++) {
      mark(`claim${i + 1}`);
      await s.click(panel.getByRole("button", { name: "Claim" }).first(), 250, i > 0);
      await wait(full ? 450 : 750);
    }
    if (full) {
      await wait(600);
      mark("bonus");
      await s.click(panel.getByRole("button", { name: /Full shift bonus/ }), 400);
      await wait(3000);
    } else {
      await wait(500);
      mark("swap");
      await s.click(panel.getByRole("button", { name: "Swap" }), 400);
      mark("swapped");
      await wait(2800);
    }
  });
}

// ---------------- Rig Foreman (local server) ----------------
// SITE=http://localhost:3240 node scripts/record.mjs foremanhire foremanback
// foremanhire: a level 4 rig opens the panel, hires him for a day, and he starts walking the deck.
// foremanback: the same rig after 6 hours away, opening his report.
const foremanSeed = ([away]) => {
  if (localStorage.getItem("__seeded")) return;
  localStorage.setItem("__seeded", "1");
  localStorage.setItem("barrel-royale-chart-open", "0");
  const now = Date.now();
  const P = ["light", "gas", "heavy", "diesel", "jet", "lng"];
  const flat = Object.fromEntries(P.map((p) => [p, Array.from({ length: 30 }, () => 1)]));
  const well = (product) => ({ kind: "well", product, choke: "normal", pressure: 40, held: away ? 15 : 6, blown: false });
  const game = {
    version: 1, savedAt: now, coins: 6_250, xom: 0.0004, exported: { day: 0, bbl: 0 }, level: 4,
    slots: Array.from({ length: 12 }, (_, i) => well(P[i % 3])),
    storage: { light: 30, gas: 14, heavy: 22, diesel: 6, jet: 2, lng: 1 },
    index: Object.fromEntries(P.map((p) => [p, 1])), history: flat, contracts: [],
    nextContractAt: now + 600_000, nextMarketAt: now + 60_000, nextStormAt: now + 3_600_000, storm: null,
    points: 2100, stormsHeld: 6, contractsFilled: 12, nextId: 1, log: [{ at: now, text: "Welcome aboard, roughneck." }],
  };
  if (away) {
    // hired yesterday, back now after six hours: the next load runs his rounds for the whole gap
    const back = 6 * 3600_000;
    game.savedAt = now - back;
    game.coins = 3_850;
    game.foreman = {
      until: now + 16 * 3600_000, jobs: { collect: true, sell: true, contracts: true, cap: true, brace: true }, sellAt: 0.8, keepForUnits: true,
      nextAt: now - back + 600_000, report: { since: now - back, bbl: 0, coins: 0, contracts: 0, storms: 0, capped: 0, away: false }, unseen: false,
    };
  }
  localStorage.setItem("barrel-royale-game-v1", JSON.stringify(game));
};

for (const name of ["foremanhire", "foremanback"]) {
  if (!want(name)) continue;
  const away = name === "foremanback";
  const s = await open("/play", { setup: [{ fn: foremanSeed, arg: [away] }, { fn: demoWallet, arg: DEMO }] });
  const { page, wait } = s;
  await s.click(page.getByRole("button", { name: /MetaMask/ }).first(), 200);
  await page.locator("canvas").waitFor({ timeout: 60_000 });
  await wait(1500);
  const panel = page.locator('section[aria-label="Rig foreman"]');
  await film(name, s, async (mark) => {
    mark("rig");
    await wait(1600);
    mark("open");
    await s.click(page.getByRole("button", { name: /^Rig foreman/ }), 300);
    await panel.waitFor();
    if (away) {
      await wait(4200);
      mark("got-it");
      await s.click(panel.getByRole("button", { name: "Got it" }), 400);
      await wait(1200);
      await s.click(page.getByRole("button", { name: "Close" }), 300);
      await wait(3000);
    } else {
      await wait(1800);
      mark("hire");
      await s.click(panel.getByRole("button", { name: /Hire for a day/ }), 500);
      mark("hired");
      await wait(1600);
      await s.click(page.getByRole("button", { name: "Close" }), 300);
      mark("walk");
      await wait(5000);
    }
  });
}

await browser.close();
