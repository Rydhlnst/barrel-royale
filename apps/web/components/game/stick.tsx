"use client";

import { useRef, useState } from "react";
import type { GameStore } from "@/lib/game/store";

// The on-screen joystick for phones, shared by the rig and the village.

export function Stick({ store }: { store: GameStore }) {
  const pad = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const move = (e: React.PointerEvent) => {
    const r = pad.current!.getBoundingClientRect();
    const max = r.width / 2;
    let x = e.clientX - (r.left + max);
    let y = e.clientY - (r.top + max);
    const d = Math.hypot(x, y);
    if (d > max) {
      x = (x / d) * max;
      y = (y / d) * max;
    }
    setKnob({ x, y });
    store.setStick(x / max, y / max);
  };
  const stop = () => {
    setKnob({ x: 0, y: 0 });
    store.setStick(0, 0);
  };
  return (
    <div
      ref={pad}
      className="pixel relative h-32 w-32 touch-none rounded-none bg-white/40"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e);
      }}
      onPointerMove={(e) => e.buttons && move(e)}
      onPointerUp={stop}
      onPointerCancel={stop}
      aria-label="Move"
      role="group"
    >
      <span className="pixel absolute left-1/2 top-1/2 h-12 w-12 bg-brand-sun" style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }} />
    </div>
  );
}
