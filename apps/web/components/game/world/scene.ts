import type * as PhaserNS from "phaser";
import { C } from "@/lib/palette";
import { PRODUCT_ORDER, UNITS, WELLS, BLOWOUT_AT, WARN_AT } from "@/lib/game/content";
import * as E from "@/lib/game/engine";
import type { GameStore } from "@/lib/game/store";
import { barrelPicture, blownFrames, boatPicture, characterFrames, deckPicture, lockedPicture, palettes, rainTile, swellTile, unitPicture, waterFrames, wellFrames } from "./art";
import { BOARD, BOAT, DECK, DOCK, KIOSK, LEGS, PADS, SPAWN, SPOTS, TILE, WORLD_H, WORLD_W, gap, isBlocked, type Box } from "./map";

// The walkable rig. Phaser draws the world and moves the roughneck; the game
// rules stay in the engine, reached through the store. React draws everything
// on top (HUD, prompts, panels), so this scene only reports where you are.

type Phaser = typeof PhaserNS;
type Sprite = PhaserNS.GameObjects.Sprite;

const SPEED = 72;
const FEET = { w: 5, h: 4 };

type PadView = { obj: Sprite; bar: PhaserNS.GameObjects.Graphics; held: PhaserNS.GameObjects.Text; tag: PhaserNS.GameObjects.Image; sig: string };

export function rigScene(Phaser: Phaser, store: GameStore) {
  return class RigScene extends Phaser.Scene {
    private player!: Sprite;
    private feet!: PhaserNS.GameObjects.Ellipse;
    private tag!: PhaserNS.GameObjects.Text;
    private keys!: Record<string, PhaserNS.Input.Keyboard.Key>;
    private water!: PhaserNS.GameObjects.TileSprite;
    private swell!: PhaserNS.GameObjects.TileSprite;
    private foam!: PhaserNS.GameObjects.Graphics;
    private waterFrame = 0;
    private rain!: PhaserNS.GameObjects.TileSprite;
    private dim!: PhaserNS.GameObjects.Rectangle;
    private ring!: PhaserNS.GameObjects.Graphics;
    private pads: PadView[] = [];
    private facing: "down" | "up" | "side" = "down";
    private font = "monospace";

    constructor() {
      super("rig");
    }

    private sheet(key: string, c: HTMLCanvasElement, fw: number, fh: number) {
      const t = this.textures.addCanvas(key, c)!;
      for (let i = 0; i < c.width / fw; i++) t.add(i, 0, i * fw, 0, fw, fh);
    }

    create() {
      this.font = getComputedStyle(document.documentElement).getPropertyValue("--font-silkscreen").trim() || "monospace";

      // textures, all drawn in art.ts
      this.textures.addCanvas("deck", deckPicture());
      waterFrames().forEach((c, i) => this.textures.addCanvas(`water${i}`, c));
      this.textures.addCanvas("swell", swellTile());
      this.textures.addCanvas("rain", rainTile());
      this.textures.addCanvas("locked", lockedPicture());
      this.textures.addCanvas("boat", boatPicture());
      this.sheet("well", wellFrames(), 32, 32);
      this.sheet("blown", blownFrames(), 32, 32);
      for (const [k, p] of Object.entries(palettes)) this.sheet(k, characterFrames(p), 16, 19);
      for (const p of PRODUCT_ORDER) this.textures.addCanvas(`barrel-${p}`, barrelPicture(p));

      this.water = this.add.tileSprite(0, 0, WORLD_W, WORLD_H, "water0").setOrigin(0).setDepth(-10);
      this.swell = this.add.tileSprite(0, 0, WORLD_W, WORLD_H, "swell").setOrigin(0).setDepth(-9).setAlpha(0.6);
      this.foam = this.add.graphics().setDepth(0.5);
      this.add.image(0, 0, "deck").setOrigin(0).setDepth(0);
      const boat = this.add.image(BOAT.x * TILE, BOAT.y * TILE + 6, "boat").setOrigin(0).setDepth(1);
      this.tweens.add({ targets: boat, y: boat.y + 1, duration: 900, yoyo: true, repeat: -1, ease: "Stepped" });

      PADS.forEach((b) => {
        const x = b.x * TILE;
        const bottom = (b.y + b.h) * TILE;
        const obj = this.add.sprite(x, bottom, "locked").setOrigin(0, 1).setDepth(bottom);
        const bar = this.add.graphics().setDepth(bottom + 1);
        const held = this.add
          .text(x + 30, bottom - 30, "", { fontFamily: this.font, fontSize: "8px", color: "#ffffff", stroke: C.ink, strokeThickness: 3 })
          .setOrigin(1, 1)
          .setDepth(bottom + 2)
          .setResolution(4);
        const tag = this.add.image(x + 22, bottom - 2, "barrel-light").setOrigin(0, 1).setDepth(bottom + 1).setVisible(false);
        this.pads.push({ obj, bar, held, tag, sig: "" });
      });

      const dispatcher = this.add.sprite((BOARD.x - 1) * TILE + 6, (BOARD.y + 2) * TILE - 2, "dispatcher", 0).setOrigin(0.5, 1);
      const trader = this.add.sprite((KIOSK.x + 2) * TILE + 9, (KIOSK.y + 2) * TILE - 2, "trader", 6).setOrigin(0.5, 1).setFlipX(true);
      for (const npc of [dispatcher, trader]) {
        npc.setDepth(npc.y);
        this.tweens.add({ targets: npc, y: npc.y - 1, duration: 600, yoyo: true, repeat: -1, ease: "Stepped" });
      }

      // the roughneck, with a shadow at his feet and a name tag so he never gets lost on a busy deck
      this.feet = this.add.ellipse(SPAWN.x, SPAWN.y, 14, 5, 0x10162c, 0.45);
      this.player = this.add.sprite(SPAWN.x, SPAWN.y, "player", 0).setOrigin(0.5, 1);
      this.tag = this.add
        .text(SPAWN.x, SPAWN.y - 22, "YOU", { fontFamily: this.font, fontSize: "8px", color: "#ffd54a", stroke: "#1e2a4a", strokeThickness: 3 })
        .setOrigin(0.5, 1)
        .setResolution(4)
        .setDepth(9100);
      this.ring = this.add.graphics().setDepth(9000);

      this.dim = this.add.rectangle(0, 0, 10, 10, 0x1e2a4a, 0).setOrigin(0).setScrollFactor(0).setDepth(9500);
      this.rain = this.add.tileSprite(0, 0, 10, 10, "rain").setOrigin(0).setScrollFactor(0).setDepth(9501).setVisible(false);

      const cam = this.cameras.main;
      cam.setBounds(0, 0, WORLD_W, WORLD_H).setRoundPixels(true);
      cam.centerOn(this.player.x, this.player.y);
      cam.startFollow(this.player, true, 0.2, 0.2);
      this.fit();
      this.scale.on("resize", () => this.fit());

      this.keys = this.input.keyboard!.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT") as Record<string, PhaserNS.Input.Keyboard.Key>;
    }

    /** Whole-number zoom so pixels stay square: about 20 × 12 tiles on a laptop, fewer on a phone. */
    private fit() {
      const { width, height } = this.scale;
      const zoom = Math.max(2, Math.min(5, Math.floor(Math.min(width / 240, height / 170))));
      this.cameras.main.setZoom(zoom);
      // overlays fixed to the screen are sized in world pixels at this zoom
      this.dim.setSize(width / zoom + 2, height / zoom + 2);
      this.rain.setSize(width / zoom + 2, height / zoom + 2);
    }

    update(time: number, delta: number) {
      const game = store.game;
      const now = Date.now();
      this.animateSea(time);

      this.move(time, delta);
      this.drawPads(game, time);
      this.findNearby(time);

      const storm = !!game.storm;
      const warning = E.stormWarning(game, now);
      this.dim.setFillStyle(0x1e2a4a, storm ? 0.4 : warning ? 0.15 : 0);
      this.rain.setVisible(storm || warning);
      if (storm || warning) {
        this.rain.tilePositionX -= delta * 0.03;
        this.rain.tilePositionY -= delta * 0.2;
      }
    }

    private move(time: number, delta: number) {
      const k = this.keys;
      let dx = 0;
      let dy = 0;
      if (!store.input.paused) {
        dx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0) + store.input.dx;
        dy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0) + store.input.dy;
      }
      const len = Math.hypot(dx, dy);
      const p = this.player;
      if (len > 0.1) {
        const step = (SPEED * delta) / 1000 / Math.max(1, len);
        const nx = p.x + dx * step;
        if (!this.hits(nx, p.y)) p.x = nx;
        const ny = p.y + dy * step;
        if (!this.hits(p.x, ny)) p.y = ny;
        this.facing = Math.abs(dx) > Math.abs(dy) ? "side" : dy < 0 ? "up" : "down";
        if (this.facing === "side") p.setFlipX(dx < 0);
      }
      const base = this.facing === "down" ? 0 : this.facing === "up" ? 3 : 6;
      p.setFrame(base + (len > 0.1 ? 1 + (Math.floor(time / 140) % 2) : 0));
      p.setDepth(p.y);
      this.feet.setPosition(Math.round(p.x), Math.round(p.y) - 1).setDepth(p.y - 0.5);
      this.tag.setPosition(Math.round(p.x), Math.round(p.y) - 21 - (Math.floor(time / 500) % 2));
    }

    /** Does the roughneck's footprint at (x, y) touch a blocked tile? */
    private hits(x: number, y: number) {
      return (
        isBlocked(x - FEET.w, y - 1) || isBlocked(x + FEET.w, y - 1) || isBlocked(x - FEET.w, y - FEET.h) || isBlocked(x + FEET.w, y - FEET.h)
      );
    }

    /** The closest thing within reach of the roughneck's feet, highlighted with pixel corner brackets. */
    private findNearby(time: number) {
      const p = this.player;
      let best: (typeof SPOTS)[number] | null = null;
      let bestD = Infinity;
      for (const s of SPOTS) {
        const d = gap(s.box, p.x, p.y - 2);
        if (d <= s.reach && d < bestD) {
          best = s;
          bestD = d;
        }
      }
      store.setNearby(best ? best.id : null);
      this.ring.clear();
      if (best) this.brackets(best.box, Math.floor(time / 320) % 2);
    }

    private brackets(b: Box, pulse: number) {
      const g = this.ring;
      const o = 3 + pulse;
      const x0 = b.x - o;
      const y0 = b.y - o;
      const x1 = b.x + b.w + o;
      const y1 = b.y + b.h + o;
      const arm = 6;
      // each corner: an ink L with a white L inside it
      for (const [cx, cy, sx, sy] of [
        [x0, y0, 1, 1],
        [x1, y0, -1, 1],
        [x0, y1, 1, -1],
        [x1, y1, -1, -1],
      ]) {
        const L = (t: number, color: number) => {
          g.fillStyle(color);
          g.fillRect(sx > 0 ? cx - t : cx - arm - t + 1, sy > 0 ? cy - t : cy - 1 - t, arm + 2 * t, 2 + 2 * t);
          g.fillRect(sx > 0 ? cx - t : cx - 1 - t, sy > 0 ? cy - t : cy - arm - t + 1, 2 + 2 * t, arm + 2 * t);
        };
        L(1, 0x1e2a4a);
        L(0, 0xffffff);
      }
      // a small bobbing arrow over the top
      const ax = Math.round(b.x + b.w / 2);
      const ay = y0 - 8 - pulse;
      g.fillStyle(0x1e2a4a).fillRect(ax - 4, ay - 1, 9, 2).fillRect(ax - 3, ay + 1, 7, 2).fillRect(ax - 2, ay + 3, 5, 2).fillRect(ax - 1, ay + 5, 3, 2);
      g.fillStyle(0xffd54a).fillRect(ax - 3, ay, 7, 1).fillRect(ax - 2, ay + 1, 5, 2).fillRect(ax - 1, ay + 3, 3, 2).fillRect(ax, ay + 5, 1, 1);
    }

    /** Swap the sea's frames, drift the swell, and redraw the foam at the legs and the dock. */
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

      const g = this.foam;
      g.clear();
      const ripple = (x: number, y: number, seed: number, half: number) => {
        // a tight white collar and a ring that spreads out and fades
        const wob = Math.round(Math.sin(time / 260 + seed) * 1.5);
        g.fillStyle(0xffffff, 1).fillRect(x - half - 2 - wob, y, half * 2 + 4 + wob * 2, 2);
        g.fillStyle(0x96c8ff, 1).fillRect(x - half - 3, y + 2, half * 2 + 6, 1);
        const t = ((time / 1600 + seed * 0.37) % 1 + 1) % 1;
        const r = Math.round(half + 3 + t * 12);
        g.fillStyle(0xd3e8ff, 1 - t);
        g.fillRect(x - r - 3, y + 1 + Math.round(t * 3), 4, 1).fillRect(x + r, y + 1 + Math.round(t * 3), 4, 1);
      };
      LEGS.forEach((l, i) => ripple(l.x, l.y, i * 1.7, 5));
      const dockBottom = (DOCK.y + DOCK.h) * TILE;
      ripple(DOCK.x * TILE + 5, dockBottom + 4, 4.1, 3);
      ripple((DOCK.x + DOCK.w) * TILE - 5, dockBottom + 4, 5.3, 3);

      // water lapping along the deck's shadow line
      const shadowY = (DECK.y + DECK.h) * TILE + 6;
      const shift = Math.floor(time / 300) % 12;
      g.fillStyle(0xd3e8ff, 0.9);
      for (let x = DECK.x * TILE + 6 + shift; x < (DECK.x + DECK.w) * TILE - 6; x += 12) {
        if (x > DOCK.x * TILE - 4 && x < (DOCK.x + DOCK.w) * TILE + 4) continue;
        g.fillRect(x, shadowY, 5, 1);
      }
    }

    private drawPads(game: E.Game, time: number) {
      const open = E.levelInfo(game).slots;
      this.pads.forEach((v, i) => {
        const s = game.slots[i];
        const b = PADS[i];
        const x = b.x * TILE;
        const bottom = (b.y + b.h) * TILE;
        const locked = i >= open;
        let sig = locked ? "locked" : s.kind;
        if (!locked && s.kind === "well") sig += `|${s.blown}`;
        if (!locked && s.kind === "unit") sig += `|${s.unit}|${s.recipe}|${s.level}`;

        if (sig !== v.sig) {
          v.sig = sig;
          v.obj.setVisible(true);
          if (locked) v.obj.setTexture("locked");
          else if (s.kind === "empty") v.obj.setVisible(false);
          else if (s.kind === "well") v.obj.setTexture(s.blown ? "blown" : "well", 0);
          else {
            const out = UNITS[s.unit].recipes[s.recipe].output;
            const key = `unit-${out}-${s.level}`;
            if (!this.textures.exists(key)) {
              const band = { diesel: "#2f9e57", jet: "#d0442f", lng: "#7a4fc0" }[out as "diesel" | "jet" | "lng"] ?? C.sea;
              this.textures.addCanvas(key, unitPicture(band, s.level));
            }
            v.obj.setTexture(key);
          }
        }

        v.bar.clear();
        v.held.setText("");
        v.tag.setVisible(false);
        if (locked) return;
        if (s.kind === "well") {
          const running = !s.blown && s.held < WELLS[s.product].holds;
          v.obj.setFrame(Math.floor(time / (s.blown ? 120 : running ? 350 : 100000)) % 2);
          if (!s.blown) {
            // pressure bar above the pad, with a tick at the warning line
            const w = 28;
            const fill = Math.min(1, s.pressure / BLOWOUT_AT);
            const color = s.pressure >= WARN_AT ? 0xe8453c : s.pressure >= 65 ? 0xffb22e : 0x15905f;
            v.bar.fillStyle(0x1e2a4a).fillRect(x + 2, bottom - 36, w, 5);
            v.bar.fillStyle(0xffffff).fillRect(x + 3, bottom - 35, w - 2, 3);
            v.bar.fillStyle(color).fillRect(x + 3, bottom - 35, Math.round((w - 2) * fill), 3);
            v.bar.fillStyle(0x1e2a4a).fillRect(x + 3 + Math.round((w - 2) * (WARN_AT / BLOWOUT_AT)), bottom - 36, 1, 5);
          }
          const held = Math.floor(s.held);
          v.tag.setTexture(`barrel-${s.product}`).setVisible(true);
          if (held > 0) v.held.setText(String(held));
        }
        if (s.kind === "unit" && s.progress > 0) {
          v.bar.fillStyle(0x1e2a4a).fillRect(x + 2, bottom - 50, 28, 5);
          v.bar.fillStyle(0xffffff).fillRect(x + 3, bottom - 49, 26, 3);
          v.bar.fillStyle(0x1a73d9).fillRect(x + 3, bottom - 49, Math.round(26 * s.progress), 3);
        }
      });
    }
  };
}
