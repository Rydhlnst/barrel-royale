"use client";

import { useEffect, useRef } from "react";
import type { GameStore } from "@/lib/game/store";

/** Mounts the Phaser world into a div. Phaser touches `window`, so it loads only in the browser. */
export function World({ store, className }: { store: GameStore; className?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let game: import("phaser").Game | null = null;
    let cancelled = false;
    (async () => {
      const Phaser = await import("phaser");
      const { rigScene } = await import("./scene");
      if (cancelled || !host.current) return;
      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: host.current,
        backgroundColor: "#1a73d9",
        pixelArt: true,
        roundPixels: true,
        scale: { mode: Phaser.Scale.RESIZE, width: host.current.clientWidth, height: host.current.clientHeight },
        scene: [rigScene(Phaser, store)],
        banner: false,
        // no sound yet; Phaser's audio context also throws when the page tears the game down
        audio: { noAudio: true },
      });
      // handy for poking at the scene from the console while developing
      if (process.env.NODE_ENV !== "production") (window as unknown as { rig?: unknown }).rig = game;
    })();
    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, [store]);

  return <div ref={host} className={className} aria-label="The rig. Walk with WASD or the arrow keys, or the stick on a phone." role="application" />;
}
