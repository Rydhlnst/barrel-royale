// Draws the sunburst as a tiny square PNG (one image pixel per art pixel) with the
// rays meeting in the middle. The page scales it up with image-rendering:
// pixelated so the rays keep stepped edges, and centres it on the rig.
// Run: node scripts/sunburst.mjs
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const W = 300;
const H = 300;
const CX = W / 2;
const CY = H / 2;
const RAYS = 36;
const LIGHT = [0xff, 0xd5, 0x4a];
const DEEP = [0xff, 0xb2, 0x2e];

const raw = Buffer.alloc((W * 3 + 1) * H);
let o = 0;
for (let y = 0; y < H; y++) {
  raw[o++] = 0; // no filter
  for (let x = 0; x < W; x++) {
    const a = Math.atan2(y + 0.5 - CY, x + 0.5 - CX) + Math.PI;
    const c = Math.floor((a / (2 * Math.PI)) * RAYS) % 2 ? LIGHT : DEEP;
    raw[o++] = c[0];
    raw[o++] = c[1];
    raw[o++] = c[2];
  }
}

const table = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const sum = Buffer.alloc(4);
  sum.writeUInt32BE(crc(body));
  return Buffer.concat([len, body, sum]);
};

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // truecolour

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw)),
  chunk("IEND", Buffer.alloc(0)),
]);
writeFileSync(new URL("../public/sunburst.png", import.meta.url), png);
console.log(`public/sunburst.png ${W}×${H}, ${png.length} bytes`);
