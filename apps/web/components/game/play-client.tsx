"use client";

import dynamic from "next/dynamic";

// The game reads the browser's save and runs Phaser, so it renders only on the client.
const Play = dynamic(() => import("./play"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 grid place-items-center bg-brand-sea">
      <p className="outlined-sm font-logo text-2xl font-bold uppercase">Rowing out to your rig…</p>
    </div>
  ),
});

export function PlayClient() {
  return <Play />;
}
