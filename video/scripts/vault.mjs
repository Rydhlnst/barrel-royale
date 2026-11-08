// Reads the XOM reward vault on Robinhood Chain and renders the "vault grew"
// video and still with the real numbers.
// Usage: node scripts/vault.mjs                 latest deposit
//        node scripts/vault.mjs --price 115.4   also show the dollar value
//        node scripts/vault.mjs --source "30% of creator fees"   change the on-screen source (default 20%)
// Output: out/barrel-royale-vault-<total>-1080p60.mp4 and .png
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { override } from "./webpack.mjs";

const RPC = "https://rpc.mainnet.chain.robinhood.com";
const VAULT = "0x2B858234005FaD8f044CBad3bD7De8F89e6239F7";
const TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
// the RPC allows at most 10M blocks per log query
const SPAN = 9_999_999;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const priceAt = args.indexOf("--price");
const price = priceAt >= 0 ? Number(args[priceAt + 1]) : undefined;
const sourceAt = args.indexOf("--source");
const source = sourceAt >= 0 ? args[sourceAt + 1] : undefined;

let id = 0;
async function rpc(method, params) {
  const res = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }) });
  const j = await res.json();
  if (j.error) throw new Error(`${method}: ${j.error.message}`);
  return j.result;
}
const word = (addr) => "0x" + addr.slice(2).toLowerCase().padStart(64, "0");
const units = (hex) => Number(BigInt(hex)) / 1e18;

// the vault's token, its balance, and the latest transfer into it
// xom() on the vault
const token = "0x" + (await rpc("eth_call", [{ to: VAULT, data: "0xb452e985" }, "latest"])).slice(26);
const total = units(await rpc("eth_call", [{ to: token, data: "0x70a08231" + word(VAULT).slice(2) }, "latest"]));
const head = parseInt(await rpc("eth_blockNumber", []), 16);

let last;
for (let to = head; to > 0 && !last; to -= SPAN + 1) {
  const from = Math.max(0, to - SPAN);
  const logs = await rpc("eth_getLogs", [{ address: token, fromBlock: "0x" + from.toString(16), toBlock: "0x" + to.toString(16), topics: [TRANSFER, null, word(VAULT)] }]);
  if (logs.length) last = logs[logs.length - 1];
  if (head - from > 40_000_000) break;
}
if (!last) throw new Error("no deposit into the vault found");

const props = { total, added: units(last.data), tx: last.transactionHash, ...(price ? { price } : {}), ...(source ? { source } : {}) };
console.log(props);

const serveUrl = await bundle({ entryPoint: join(root, "src", "index.ts"), webpackOverride: override, publicDir: join(root, "public") });
const port = 3157;
const composition = await selectComposition({ serveUrl, id: "VaultUp", port, inputProps: props });
const name = `barrel-royale-vault-${total.toFixed(4).replace(".", "_")}`;
const still = join(root, "out", `${name}.png`);
await renderStill({ composition, serveUrl, output: still, frame: composition.durationInFrames - 1, port, inputProps: props });
console.log(still);
const video = join(root, "out", `${name}-1080p60.mp4`);
await renderMedia({
  composition,
  serveUrl,
  outputLocation: video,
  port,
  inputProps: props,
  codec: "h264",
  crf: 16,
  pixelFormat: "yuv420p",
  colorSpace: "bt709",
  imageFormat: "jpeg",
  jpegQuality: 95,
  onProgress: ({ progress }) => process.stdout.write(`\rVaultUp ${(progress * 100).toFixed(0)}%   `),
});
console.log(`\n${video}`);
