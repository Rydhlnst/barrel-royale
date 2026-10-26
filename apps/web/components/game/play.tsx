"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { C } from "@/lib/palette";
import { site } from "@/lib/site";
import { UNITS, BRACE_SECONDS } from "@/lib/game/content";
import * as E from "@/lib/game/engine";
import { GameStore, type Target } from "@/lib/game/store";
import { PixelIcon } from "@/components/pixel/sprite";
import { logo, logoPalette } from "@/components/pixel/sprites";
import { Bar, DispatchPanel, MarketPanel, QuartersPanel, SlotPanel, StoragePanel, ValveDrill, fmt, mmss, secs } from "./panels";
import { World } from "./world/world";
import { SPOTS } from "./world/map";

// The play screen: the walkable rig fills the window, and the HUD, the prompt
// for whatever you're standing at, the panels and the phone controls sit on top.

const labelFor = (t: Target) => SPOTS.find((s) => s.id === t)?.label ?? "";
const padIndex = (t: Target) => (t.startsWith("pad:") ? Number(t.slice(4)) : -1);

/** What pressing E does at a spot, and what it's called. */
function primaryFor(t: Target, g: E.Game): { label: string; quick?: (store: GameStore) => void } {
  const i = padIndex(t);
  if (i < 0) return { label: { market: "Trade", dispatch: "Contracts", storage: "Storage & upgrades", quarters: "Crew log" }[t as "market"] ?? "Use" };
  if (i >= E.levelInfo(g).slots) return { label: "Locked" };
  const s = g.slots[i];
  if (s.kind === "empty") return { label: "Drill or build" };
  if (s.kind === "unit") return { label: UNITS[s.unit].name };
  if (s.blown) return { label: "Cap the blowout" };
  const held = Math.floor(s.held);
  if (held >= 1) return { label: `Collect ${held} bbl`, quick: (store) => store.run((gg, t2) => E.collect(gg, t2, i)) };
  return { label: "Check the well" };
}

function Stick({ store }: { store: GameStore }) {
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

export default function Play() {
  const [store] = useState(() => new GameStore());
  const snap = useSyncExternalStore(store.subscribe, store.get, store.get);
  const [panel, setPanel] = useState<Target | null>(null);
  const { game, now, nearby, toast } = snap;

  useEffect(() => store.start(), [store]);
  useEffect(() => {
    store.setPaused(panel !== null || game.storm !== null);
  }, [store, panel, game.storm]);

  // walking away closes the panel for what you were standing at
  const shown = panel && nearby === panel ? panel : null;

  const interact = useCallback(
    (t: Target | null, manage = false) => {
      if (!t) return;
      const p = primaryFor(t, store.game);
      if (!manage && p.quick) p.quick(store);
      else setPanel(t);
    },
    [store],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === "Escape") setPanel(null);
      if (store.game.storm) return;
      if (e.key === "e" || e.key === "E" || e.key === "Enter") interact(store.get().nearby);
      if (e.key === "f" || e.key === "F") interact(store.get().nearby, true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [store, interact]);

  const info = E.levelInfo(game);
  const used = E.storageUsed(game);
  const stormIn = E.stormIn(game, now);
  const warning = E.stormWarning(game, now);
  const prompt = nearby ? primaryFor(nearby, game) : null;
  const nearPad = nearby ? padIndex(nearby) : -1;
  const nearSlot = nearPad >= 0 ? game.slots[nearPad] : null;

  const stats = [
    { label: site.token, value: game.royal.toFixed(2), tone: "bg-brand-sun" },
    { label: "Coins", value: fmt(game.coins), tone: "bg-white" },
    { label: "Storage", value: `${used}/${info.storage}`, tone: used >= info.storage ? "bg-[#ffd9d4]" : "bg-white" },
    { label: "Rig", value: `Lv ${game.level}`, tone: "bg-white" },
    { label: "Points", value: fmt(game.points), tone: "bg-white" },
    { label: game.storm ? "Storm" : "Storm in", value: game.storm ? "NOW" : mmss(stormIn), tone: game.storm || warning ? "bg-brand-red text-white" : "bg-white" },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden bg-brand-sea">
      <World store={store} className="absolute inset-0" />

      {/* HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-start gap-2 p-3 sm:gap-3 sm:p-4">
        <Link href="/" className="pointer-events-auto mr-auto flex items-center gap-2" aria-label={`${site.name} home`}>
          <PixelIcon rows={logo} palette={logoPalette} scale={2} className="pixel-sm m-[3px] h-12 w-12 shrink-0 sm:h-16 sm:w-16" />
          <span className="outlined-sm hidden font-logo text-lg font-bold uppercase sm:inline">
            Rig <span className="text-brand-sun">#0417</span>
          </span>
        </Link>
        <dl className="pointer-events-auto flex flex-wrap justify-end gap-2 sm:gap-3">
          {stats.map((s) => (
            <div key={s.label} className={`pixel-sm flex min-w-[64px] flex-col px-2 py-0.5 sm:min-w-[80px] sm:px-3 ${s.tone}`}>
              <dt className="text-[10px] font-extrabold uppercase tracking-wide opacity-70">{s.label}</dt>
              <dd className="font-display text-base font-bold leading-tight tabular-nums sm:text-lg">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {warning && (
        <p role="status" className="pixel absolute left-1/2 top-[108px] z-10 w-max max-w-[calc(100%-32px)] -translate-x-1/2 bg-brand-red px-4 py-2 text-center font-display font-bold text-white sm:top-20">
          Storm in {Math.ceil(stormIn)}s! Get ready to close the valves.
        </p>
      )}

      {/* what you're standing at */}
      {nearby && !shown && !game.storm && (
        <div className="absolute bottom-40 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 lg:bottom-8">
          <span className="pixel-sm bg-white px-3 py-1 font-display text-sm font-bold">{labelFor(nearby)}</span>
          <div className="flex gap-2">
            <button type="button" className="btn btn-red" onClick={() => interact(nearby)} disabled={prompt?.label === "Locked"}>
              {prompt?.label}
              <kbd className="hidden rounded-none border-2 border-white/60 px-1 text-xs lg:inline">E</kbd>
            </button>
            {nearSlot && nearSlot.kind === "well" && prompt?.quick && (
              <button type="button" className="btn btn-white" onClick={() => interact(nearby, true)}>
                Manage
                <kbd className="hidden border-2 border-brand-ink/40 px-1 text-xs lg:inline">F</kbd>
              </button>
            )}
          </div>
        </div>
      )}

      {!nearby && !shown && (
        <p className="pixel-sm absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 bg-white/90 px-3 py-1 text-sm font-bold lg:block">
          WASD or arrows to walk · E to use · F to manage · walk up to a pad, the kiosk, the board or the tanks
        </p>
      )}

      {/* phone controls */}
      <div className="absolute bottom-6 left-6 z-10 lg:hidden">
        <Stick store={store} />
      </div>

      {/* panel for what you're using */}
      {shown && (
        <section
          aria-label={labelFor(shown)}
          className="box absolute inset-x-3 bottom-3 z-20 flex max-h-[68vh] flex-col overflow-hidden lg:inset-x-auto lg:bottom-auto lg:right-4 lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:w-[440px]"
        >
          <header className="flex items-center justify-between gap-3 border-b-[3px] border-brand-ink bg-brand-sun-pale px-4 py-2">
            <h2 className="font-display text-xl font-bold">{labelFor(shown)}</h2>
            <button type="button" className="btn btn-white min-h-9! px-3! text-base!" onClick={() => setPanel(null)} aria-label="Close">
              ✕
            </button>
          </header>
          <div className="flex flex-col gap-4 overflow-y-auto p-4">
            {padIndex(shown) >= 0 && <SlotPanel key={shown} store={store} game={game} now={now} i={padIndex(shown)} />}
            {shown === "market" && <MarketPanel store={store} game={game} now={now} />}
            {shown === "dispatch" && <DispatchPanel store={store} game={game} now={now} />}
            {shown === "storage" && <StoragePanel store={store} game={game} />}
            {shown === "quarters" && <QuartersPanel store={store} game={game} />}
          </div>
        </section>
      )}

      {game.storm && (
        <div role="dialog" aria-modal="true" aria-labelledby="storm-title" className="absolute inset-0 z-30 grid place-items-center bg-brand-ink/50 p-4">
          <div className="box flex w-full max-w-md flex-col gap-4 p-6 text-center">
            <h2 id="storm-title" className="font-display text-3xl font-bold text-brand-red">
              Storm! Brace the rig
            </h2>
            <p className="font-bold">Close the valves in this order. {secs(game.storm.endsAt - now)} left.</p>
            <Bar value={Math.max(0, game.storm.endsAt - now)} max={BRACE_SECONDS * 1000} color={C.red} />
            <ValveDrill order={game.storm.order} step={game.storm.step} onValve={(v) => store.run((g, t) => E.brace(g, t, v))} />
          </div>
        </div>
      )}

      {toast && (
        <p
          key={toast.id}
          role="status"
          className={`pixel absolute left-1/2 top-[164px] z-40 w-max max-w-[calc(100%-32px)] -translate-x-1/2 px-4 py-2 text-center font-bold sm:top-32 ${toast.tone === "bad" ? "bg-[#ffd9d4] text-[#a22118]" : "bg-brand-sun"}`}
        >
          {toast.text}
        </p>
      )}
    </div>
  );
}
