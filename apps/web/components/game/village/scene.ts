import type * as PhaserNS from "phaser";
import { C } from "@/lib/palette";
import { hat } from "@/components/pixel/sprites";
import type { GameStore } from "@/lib/game/store";
import { VILLAGE } from "@/lib/village-rules";
import { characterFrames, palettes, swellTile, waterFrames } from "../world/art";
import { villagePicture } from "./art";
import { BOAT_SPOT, FIRE, SPAWN, TILE, WORLD_H, WORLD_W, gap, isBlocked } from "./map";
import type { VillageNet } from "./net";

// The village scene. You walk the boardwalk like on the rig; everyone else is drawn where the server last
// saw them, slid there smoothly, with a name tag and a bubble for what they last said. React draws the HUD
// and the chat on top.

type Phaser = typeof PhaserNS;
type Sprite = PhaserNS.GameObjects.Sprite;
type Text = PhaserNS.GameObjects.Text;

const SPEED = 72;
const FEET = { w: 5, h: 4 };

/** Hard hat colours for other players, picked from their wallet so each keeps theirs. */
const HATS: [string, string][] = [
  [C.red, C.redLight],
  [C.sea, C.foam],
  [C.leaf, "#4fd08f"],
  ["#7a4fc0", "#b9a3e8"],
  [C.white, C.sky],
  ["#e8743c", "#ffb48a"],
  [C.ink2, C.steelLight],
  ["#d64f9a", "#f7a6d3"],
];
const hatFor = (wallet: string) => parseInt(wallet.slice(-4), 16) % HATS.length;
const shortName = (w: string) => `${w.slice(0, 6)}…${w.slice(-4)}`;

type View = { sprite: Sprite; feet: PhaserNS.GameObjects.Ellipse; tag: Text; bubble: Text; x: number; y: number };

/** facing on the wire: 0 down, 1 up, 2 left, 3 right */
const frameBase = (facing: number) => (facing === 0 ? 0 : facing === 1 ? 3 : 6);

export function villageScene(Phaser: Phaser, store: GameStore, net: VillageNet) {
  return class VillageScene extends Phaser.Scene {
    private player!: Sprite;
    private feet!: PhaserNS.GameObjects.Ellipse;
    private tag!: Text;
    private bubble!: Text;
    private keys!: Record<string, PhaserNS.Input.Keyboard.Key>;
    private water!: PhaserNS.GameObjects.TileSprite;
    private swell!: PhaserNS.GameObjects.TileSprite;
    private fire!: PhaserNS.GameObjects.Graphics;
    private ring!: PhaserNS.GameObjects.Graphics;
    private views = new Map<string, View>();
    private facing = 0;
    private waterFrame = 0;
    private font = "monospace";

    constructor() {
      super("village");
    }

    private sheet(key: string, c: HTMLCanvasElement, fw: number, fh: number) {
      const t = this.textures.addCanvas(key, c)!;
      for (let i = 0; i < c.width / fw; i++) t.add(i, 0, i * fw, 0, fw, fh);
    }

    private label(text: string, color: string) {
      return this.add
        .text(0, 0, text, { fontFamily: this.font, fontSize: "8px", color, stroke: C.ink, strokeThickness: 3 })
        .setOrigin(0.5, 1)
        .setResolution(4);
    }

    private speech() {
      return this.add
        .text(0, 0, "", {
          fontFamily: "Nunito, sans-serif",
          fontSize: "9px",
          fontStyle: "bold",
          color: C.ink,
          backgroundColor: "#ffffff",
          padding: { x: 4, y: 2 },
          wordWrap: { width: 120 },
          align: "center",
        })
        .setOrigin(0.5, 1)
        .setResolution(4)
        .setVisible(false);
    }

    create() {
      this.font = getComputedStyle(document.documentElement).getPropertyValue("--font-silkscreen").trim() || "monospace";

      waterFrames().forEach((c, i) => this.textures.addCanvas(`water${i}`, c));
      this.textures.addCanvas("swell", swellTile());
      this.textures.addCanvas("village", villagePicture());
      this.sheet("player", characterFrames(palettes.player), 16, 19);
      HATS.forEach(([h, e], i) => this.sheet(`hat${i}`, characterFrames(hat(h, e)), 16, 19));

      this.water = this.add.tileSprite(0, 0, WORLD_W, WORLD_H, "water0").setOrigin(0).setDepth(-10);
      this.swell = this.add.tileSprite(0, 0, WORLD_W, WORLD_H, "swell").setOrigin(0).setDepth(-9).setAlpha(0.6);
      this.add.image(0, 0, "village").setOrigin(0).setDepth(0);
      this.fire = this.add.graphics().setDepth(FIRE.y * TILE + 30);
      this.add
        .text(5 * TILE + 80, 2 * TILE + 7, "THE GUSHER", { fontFamily: this.font, fontSize: "8px", color: C.ink })
        .setOrigin(0.5)
        .setResolution(4)
        .setDepth(1);
      this.ring = this.add.graphics().setDepth(9000);

      this.feet = this.add.ellipse(SPAWN.x, SPAWN.y, 14, 5, 0x10162c, 0.45);
      this.player = this.add.sprite(SPAWN.x, SPAWN.y, "player", 3).setOrigin(0.5, 1);
      this.tag = this.label("YOU", "#ffd54a").setDepth(9100);
      this.bubble = this.speech().setDepth(9200);
      this.facing = 1;

      const cam = this.cameras.main;
      cam.setBounds(0, 0, WORLD_W, WORLD_H).setRoundPixels(true);
      cam.centerOn(this.player.x, this.player.y);
      cam.startFollow(this.player, true, 0.2, 0.2);
      this.fit();
      this.scale.on("resize", () => this.fit());

      // no key capture, so typing in the chat box isn't swallowed by the game
      this.keys = this.input.keyboard!.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT", false) as Record<string, PhaserNS.Input.Keyboard.Key>;
    }

    private fit() {
      const { width, height } = this.scale;
      this.cameras.main.setZoom(Math.max(2, Math.min(5, Math.floor(Math.min(width / 240, height / 170)))));
    }

    update(time: number, delta: number) {
      this.animateSea(time);
      this.drawFire(time);
      this.move(time, delta);
      this.drawOthers(time, delta);
      this.findBoat(time);
    }

    private typing() {
      const el = document.activeElement;
      return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
    }

    private move(time: number, delta: number) {
      const k = this.keys;
      let dx = 0;
      let dy = 0;
      if (!store.input.paused) {
        if (!this.typing()) {
          dx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
          dy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
        }
        dx += store.input.dx;
        dy += store.input.dy;
      }
      const len = Math.hypot(dx, dy);
      const p = this.player;
      const moving = len > 0.1;
      if (moving) {
        const step = (SPEED * delta) / 1000 / Math.max(1, len);
        const nx = p.x + dx * step;
        if (!this.hits(nx, p.y)) p.x = nx;
        const ny = p.y + dy * step;
        if (!this.hits(p.x, ny)) p.y = ny;
        this.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : dy < 0 ? 1 : 0;
      }
      this.pose(p, this.facing, moving, time);
      this.feet.setPosition(Math.round(p.x), Math.round(p.y) - 1).setDepth(p.y - 0.5);
      this.tag.setPosition(Math.round(p.x), Math.round(p.y) - 21 - (Math.floor(time / 500) % 2));
      this.showBubble(this.bubble, net.wallet.toLowerCase(), p.x, p.y);

      Object.assign(net.me, { x: Math.round(p.x), y: Math.round(p.y), facing: this.facing, moving, level: store.game.level });
    }

    private pose(s: Sprite, facing: number, moving: boolean, time: number) {
      if (facing >= 2) s.setFlipX(facing === 2);
      s.setFrame(frameBase(facing) + (moving ? 1 + (Math.floor(time / 140) % 2) : 0));
      s.setDepth(s.y);
    }

    private hits(x: number, y: number) {
      return isBlocked(x - FEET.w, y - 1) || isBlocked(x + FEET.w, y - 1) || isBlocked(x - FEET.w, y - FEET.h) || isBlocked(x + FEET.w, y - FEET.h);
    }

    private showBubble(t: Text, wallet: string, x: number, y: number) {
      const b = net.bubbles.get(wallet);
      const on = b && Date.now() - b.at < VILLAGE.bubbleMs;
      t.setVisible(Boolean(on));
      if (on && t.text !== b.body) t.setText(b.body);
      if (on) t.setPosition(Math.round(x), Math.round(y) - 32);
    }

    /** Everyone else, slid toward where the server last saw them. */
    private drawOthers(time: number, delta: number) {
      for (const [wallet, o] of net.others) {
        let v = this.views.get(wallet);
        if (!v) {
          const sprite = this.add.sprite(o.x, o.y, `hat${hatFor(wallet)}`, 0).setOrigin(0.5, 1);
          const feet = this.add.ellipse(o.x, o.y, 14, 5, 0x10162c, 0.4);
          const tag = this.label("", "#ffffff").setDepth(9050);
          const bubble = this.speech().setDepth(9150);
          v = { sprite, feet, tag, bubble, x: o.x, y: o.y };
          this.views.set(wallet, v);
        }
        const dx = o.x - v.x;
        const dy = o.y - v.y;
        const d = Math.hypot(dx, dy);
        if (d > 160) {
          v.x = o.x;
          v.y = o.y;
        } else if (d > 0.5) {
          // a bit quicker than walking, so a late report still catches up
          const step = Math.min(d, ((SPEED * 1.25 * delta) / 1000));
          v.x += (dx / d) * step;
          v.y += (dy / d) * step;
        }
        const walking = d > 1 || o.moving;
        v.sprite.setPosition(Math.round(v.x), Math.round(v.y));
        this.pose(v.sprite, o.facing, walking, time + wallet.length * 37);
        v.feet.setPosition(Math.round(v.x), Math.round(v.y) - 1).setDepth(v.y - 0.5);
        v.tag.setText(`${shortName(wallet)} · Lv ${o.level}`).setPosition(Math.round(v.x), Math.round(v.y) - 21);
        this.showBubble(v.bubble, wallet, v.x, v.y);
      }
      for (const [wallet, v] of this.views) {
        if (net.others.has(wallet)) continue;
        v.sprite.destroy();
        v.feet.destroy();
        v.tag.destroy();
        v.bubble.destroy();
        this.views.delete(wallet);
      }
    }

    private findBoat(time: number) {
      const near = gap(BOAT_SPOT, this.player.x, this.player.y - 2) <= 6;
      net.nearBoat = near;
      this.ring.clear();
      if (!near) return;
      const g = this.ring;
      const ax = BOAT_SPOT.x + BOAT_SPOT.w / 2 + 40;
      const ay = BOAT_SPOT.y - 14 - (Math.floor(time / 320) % 2);
      g.fillStyle(0x1e2a4a).fillRect(ax - 4, ay - 1, 9, 2).fillRect(ax - 3, ay + 1, 7, 2).fillRect(ax - 2, ay + 3, 5, 2).fillRect(ax - 1, ay + 5, 3, 2);
      g.fillStyle(0xffd54a).fillRect(ax - 3, ay, 7, 1).fillRect(ax - 2, ay + 1, 5, 2).fillRect(ax - 1, ay + 3, 3, 2).fillRect(ax, ay + 5, 1, 1);
    }

    private drawFire(time: number) {
      const g = this.fire;
      g.clear();
      const cx = FIRE.x * TILE + FIRE.w * TILE / 2;
      const base = FIRE.y * TILE + FIRE.h * TILE / 2 + 2;
      const f = Math.floor(time / 110);
      const tongues: [number, number, number][] = [
        [-6, 9, 0],
        [-1, 14, 1],
        [4, 10, 2],
      ];
      for (const [ox, h, seed] of tongues) {
        const hh = h + ((f + seed) % 3) - 1;
        const sway = ((f + seed) % 4 < 2 ? 0 : 1) * (seed % 2 ? 1 : -1);
        g.fillStyle(0xe8453c).fillRect(cx + ox - 3 + sway, base - hh, 6, hh);
        g.fillStyle(0xff9a3c).fillRect(cx + ox - 2 + sway, base - hh + 3, 4, hh - 3);
        g.fillStyle(0xffe98a).fillRect(cx + ox - 1 + sway, base - hh + 6, 2, Math.max(1, hh - 7));
      }
      // sparks rising from the pit
      for (let i = 0; i < 4; i++) {
        const t = ((time / 900 + i * 0.27) % 1 + 1) % 1;
        g.fillStyle(0xffd54a, 1 - t).fillRect(cx - 6 + ((i * 5 + f) % 12), base - 14 - Math.round(t * 22), 1, 1);
      }
      // a warm glow on the boards around it
      g.fillStyle(0xffb22e, 0.08 + 0.03 * (f % 2)).fillEllipse(cx, base + 2, 64, 26);
    }

    private animateSea(time: number) {
      const frame = Math.floor(time / 240) % 4;
      if (frame !== this.waterFrame) {
        this.waterFrame = frame;
        this.water.setTexture(`water${frame}`);
      }
      this.water.tilePositionX = Math.round(time / 140);
      this.water.tilePositionY = Math.round(Math.sin(time / 1800) * 2);
      this.swell.tilePositionX = -Math.round(time / 220);
      this.swell.tilePositionY = -Math.round(time / 400);
    }
  };
}
