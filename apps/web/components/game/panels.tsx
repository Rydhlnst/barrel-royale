"use client";

import { useState } from "react";
import { C } from "@/lib/palette";
import { site } from "@/lib/site";
import {
  BLOWOUT_AT,
  CAP_COST,
  CHOKES,
  FOREMAN_AWAY_CAP,
  FOREMAN_FREE_LEVEL,
  FOREMAN_ROUND,
  FOREMAN_ROUND_AWAY,
  LEVELS,
  PRODUCTS,
  PRODUCT_ORDER,
  EXPORT_DAILY_BBL,
  RAWS,
  UNITS,
  UNIT_UPGRADE_COST,
  WARN_AT,
  WELLS,
  type Choke,
  type Product,
  type UnitKind,
} from "@/lib/game/content";
import * as E from "@/lib/game/engine";
import type { GameStore } from "@/lib/game/store";
import { PixelIcon } from "@/components/pixel/sprite";
import { barrel, base, valve } from "@/components/pixel/sprites";

// The panels that open when the roughneck uses something on the rig.

export const LETTERS = ["A", "B", "C", "D"];

export const fmt = (n: number) => Math.floor(n).toLocaleString("en-US");
export const secs = (ms: number) => `${Math.max(0, Math.ceil(ms / 1000))}s`;
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
export const pressureColor = (p: number) => (p >= WARN_AT ? C.red : p >= 65 ? C.sunDeep : C.leaf);

export function BarrelIcon({ p, scale = 3 }: { p: Product; scale?: number }) {
  return <PixelIcon rows={barrel} palette={{ ...base, R: PRODUCTS[p].color, r: C.ink, W: PRODUCTS[p].shine }} scale={scale} />;
}

export function Bar({ value, max, color, marks }: { value: number; max: number; color: string; marks?: number[] }) {
  return (
    <div className="pixel-sm relative h-3 w-full bg-white">
      <div className="h-full" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
      {marks?.map((m) => (
        <span key={m} className="absolute inset-y-0 w-0.5 bg-brand-ink" style={{ left: `${(m / max) * 100}%` }} />
      ))}
    </div>
  );
}

function Spark({ values }: { values: number[] }) {
  const y = (v: number) => (28 - ((v - 0.5) / 1.5) * 26).toFixed(1);
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * 70 + 1).toFixed(1)},${y(v)}`).join(" ");
  return (
    <svg viewBox="0 0 72 30" className="h-8 w-[72px] shrink-0" aria-hidden>
      <line x1="0" x2="72" y1={y(1)} y2={y(1)} stroke="#b8c7da" strokeDasharray="2 2" />
      <polyline points={pts} fill="none" stroke={values[values.length - 1] >= 1 ? C.leaf : C.red} strokeWidth="2" />
    </svg>
  );
}

/** A quick valve sequence, shared by the storm brace and the capping drill. */
export function ValveDrill({ order, step, onValve }: { order: number[]; step: number; onValve: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <ol className="flex gap-2" aria-label="Valve order">
        {order.map((v, i) => (
          <li
            key={i}
            className={`pixel-sm grid h-10 w-10 place-items-center font-display text-xl font-bold ${i < step ? "bg-brand-leaf text-white" : i === step ? "bg-brand-sun" : "bg-white"}`}
          >
            {LETTERS[v]}
          </li>
        ))}
      </ol>
      <div className="grid grid-cols-4 gap-3">
        {LETTERS.map((l, v) => (
          <button key={l} type="button" onClick={() => onValve(v)} className="btn btn-white h-auto flex-col px-3! py-2" aria-label={`Valve ${l}`}>
            <PixelIcon rows={valve} palette={base} scale={4} />
            <span>{l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const option = "btn btn-white h-auto! flex-col px-2! py-2 text-sm! sm:text-base!";

export function SlotPanel({ store, game, now, i }: { store: GameStore; game: E.Game; now: number; i: number }) {
  const [drill, setDrill] = useState<{ order: number[]; step: number; endsAt: number } | null>(null);
  const slot = game.slots[i];
  const run = store.run;

  if (i >= E.levelInfo(game).slots) {
    const need = LEVELS.findIndex((l) => l.slots > i) + 1;
    return <p>This pad opens at rig level {need}. Upgrade the rig at the storage tanks.</p>;
  }

  if (slot.kind === "empty") {
    return (
      <>
        <h3 className="font-display text-xl font-bold">Strike a well</h3>
        <div className="grid grid-cols-3 gap-3">
          {RAWS.map((p) => (
            <button key={p} type="button" className={option} onClick={() => run((g, t) => E.drill(g, t, i, p))}>
              <BarrelIcon p={p} />
              <span>{PRODUCTS[p].name}</span>
              <span className="text-sm opacity-70">{WELLS[p].cost}</span>
            </button>
          ))}
        </div>
        <h3 className="font-display text-xl font-bold">Or build a refinery unit</h3>
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(UNITS) as UnitKind[]).map((u) => (
            <button key={u} type="button" className={option} onClick={() => run((g, t) => E.build(g, t, i, u))}>
              <span>{UNITS[u].name}</span>
              <span className="text-xs font-semibold opacity-70">
                {PRODUCTS[UNITS[u].recipes[0].input].name.split(" ")[0]} → {PRODUCTS[UNITS[u].recipes[0].output].name}
              </span>
              <span className="text-sm opacity-70">{UNITS[u].cost}</span>
            </button>
          ))}
        </div>
      </>
    );
  }

  if (slot.kind === "well") {
    const capValve = (v: number) => {
      if (!drill) return;
      if (Date.now() > drill.endsAt) {
        setDrill(null);
        return store.say("Too slow. Try the drill again or pay to cap it.", "bad");
      }
      if (drill.order[drill.step] !== v) return store.say("Wrong valve!", "bad");
      if (drill.step + 1 === drill.order.length) {
        setDrill(null);
        run((g, t) => E.cap(g, t, i, true));
      } else setDrill({ ...drill, step: drill.step + 1 });
    };
    return (
      <>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 font-bold">
            <BarrelIcon p={slot.product} scale={2} /> {PRODUCTS[slot.product].name}
          </span>
          <span className="pixel-sm bg-white px-2 text-sm font-extrabold">
            {Math.floor(slot.held)}/{WELLS[slot.product].holds} bbl
          </span>
        </div>
        {slot.blown ? (
          <>
            <p className="pixel-sm bg-[#ffd9d4] px-3 py-2 font-bold text-[#a22118]">Blowout! The well is down until you cap it.</p>
            {drill ? (
              <>
                <p className="text-sm font-bold">Close the valves in order. {secs(drill.endsAt - now)} left.</p>
                <ValveDrill order={drill.order} step={drill.step} onValve={capValve} />
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-red"
                  onClick={() => setDrill({ order: [0, 1, 2, 3].sort(() => Math.random() - 0.5), step: 0, endsAt: Date.now() + 6000 })}
                >
                  Capping drill (free)
                </button>
                <button type="button" className="btn btn-white" onClick={() => run((g, t) => E.cap(g, t, i, false))}>
                  Pay {CAP_COST} to cap
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm font-extrabold">
                <span>Pressure</span>
                <span style={{ color: pressureColor(slot.pressure) }}>{Math.round(slot.pressure)}%</span>
              </div>
              <Bar value={slot.pressure} max={BLOWOUT_AT} color={pressureColor(slot.pressure)} marks={[WARN_AT]} />
              <p className="text-sm text-brand-ink-2">Overdrive pumps 1.5× but climbs fast. Back off before the red line or the well blows.</p>
            </div>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Choke">
              {(Object.keys(CHOKES) as Choke[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={slot.choke === c}
                  onClick={() => run((g, t) => E.setChoke(g, t, i, c))}
                  className={`btn h-auto! flex-col px-2! py-2 text-base! ${slot.choke === c ? (c === "overdrive" ? "btn-red" : "btn-sun") : "btn-white"}`}
                >
                  <span>{CHOKES[c].label}</span>
                  <span className="text-sm opacity-80">{CHOKES[c].output}×</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-sun" disabled={slot.held < 1} onClick={() => run((g, t) => E.collect(g, t, i))}>
                Collect {Math.floor(slot.held)} bbl
              </button>
              <button type="button" className="btn btn-white" onClick={() => run((g, t) => E.scrap(g, t, i))}>
                Remove well
              </button>
            </div>
          </>
        )}
      </>
    );
  }

  const r = UNITS[slot.unit].recipes[slot.recipe];
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="font-bold">{UNITS[slot.unit].name}</span>
        <span className="pixel-sm bg-white px-2 text-sm font-extrabold">Level {slot.level}</span>
      </div>
      <div className="flex flex-col gap-2">
        {UNITS[slot.unit].recipes.map((rc, ri) => (
          <button
            key={ri}
            type="button"
            onClick={() => run((g, t) => E.setRecipe(g, t, i, ri))}
            className={`pixel-sm flex items-center justify-between gap-3 px-3 py-2 text-left ${slot.recipe === ri ? "bg-brand-sun" : "bg-white"}`}
          >
            <span className="font-bold">
              {rc.inQty} {PRODUCTS[rc.input].name} → 1 {PRODUCTS[rc.output].name}
            </span>
            <span className="text-sm opacity-70">{rc.minLevel > slot.level ? `Level ${rc.minLevel}` : `${rc.seconds}s`}</span>
          </button>
        ))}
      </div>
      <Bar value={slot.progress} max={1} color={C.sea} />
      <p className="text-sm text-brand-ink-2">
        {game.storage[r.input] < r.inQty ? `Waiting for ${PRODUCTS[r.input].name.toLowerCase()} in storage.` : "Refining from storage automatically."}
      </p>
      <div className="flex flex-wrap gap-2">
        {slot.level < 3 && (
          <button type="button" className="btn btn-sun" onClick={() => run((g, t) => E.upgradeUnit(g, t, i))}>
            Upgrade · {UNIT_UPGRADE_COST[slot.level + 1]}
          </button>
        )}
        <button type="button" className="btn btn-white" onClick={() => run((g, t) => E.scrap(g, t, i))}>
          Remove unit
        </button>
      </div>
    </>
  );
}

export function MarketPanel({ store, game, now }: { store: GameStore; game: E.Game; now: number }) {
  return (
    <>
      <p className="text-sm text-brand-ink-2">
        Sell for coins at each product&apos;s index, between 0.5× and 2×; prices move every few seconds. Or export them for{" "}
        {site.reward}, up to a daily quota per rig.
      </p>
      <div className="pixel-sm flex flex-col gap-1.5 bg-brand-sun px-3 py-2 text-sm font-bold">
        <div className="flex items-center justify-between">
          <span>Export quota left today</span>
          <span className="font-display tabular-nums">{Math.round((E.exportLeft(game, now) / EXPORT_DAILY_BBL) * 100)}%</span>
        </div>
        <Bar value={E.exportLeft(game, now)} max={EXPORT_DAILY_BBL} color={C.leaf} />
      </div>
      <button type="button" className="btn btn-red self-start" disabled={!E.storageUsed(game)} onClick={() => store.run((g, t) => E.sellAll(g, t))}>
        Sell everything · {E.storageValue(game)}
      </button>
      <ul className="flex flex-col gap-2">
        {PRODUCT_ORDER.map((p) => {
          const h = game.history[p];
          const up = h[h.length - 1] >= (h[h.length - 2] ?? 1);
          return (
            <li key={p} className="pixel-sm flex flex-wrap items-center gap-3 bg-white px-3 py-2">
              <BarrelIcon p={p} scale={2} />
              <div className="flex min-w-[100px] flex-1 flex-col">
                <span className="font-bold">{PRODUCTS[p].name}</span>
                <span className="text-xs text-brand-ink-2">
                  {game.storage[p]} bbl · {E.price(game, p).toFixed(2)} each
                </span>
              </div>
              <Spark values={h} />
              <span className={`w-16 text-right font-display font-bold tabular-nums ${game.index[p] >= 1 ? "text-brand-leaf" : "text-brand-red"}`}>
                {up ? "▲" : "▼"} {game.index[p].toFixed(2)}×
              </span>
              <button type="button" className="btn btn-sun min-h-10! px-3! text-base!" disabled={!game.storage[p]} onClick={() => store.run((g, t) => E.sell(g, t, p))}>
                Sell
              </button>
              <button
                type="button"
                className="btn btn-white min-h-10! px-3! text-base!"
                disabled={!game.storage[p] || E.exportLeft(game, now) <= 0}
                onClick={() => store.run((g, t) => E.exportBarrels(g, t, p))}
              >
                Export
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function DispatchPanel({ store, game, now }: { store: GameStore; game: E.Game; now: number }) {
  return (
    <>
      <p className="text-sm text-brand-ink-2">Fixed-price tanker contracts, 10 to 30% above base. A new one arrives every 45 seconds.</p>
      {game.contracts.length === 0 && <p className="pixel-sm bg-white px-3 py-3 text-center">No contracts right now. Check back shortly.</p>}
      <ul className="flex flex-col gap-2">
        {game.contracts.map((c) => {
          const have = game.storage[c.product];
          return (
            <li key={c.id} className="pixel-sm flex flex-wrap items-center gap-3 bg-white px-3 py-2">
              <BarrelIcon p={c.product} scale={2} />
              <div className="flex flex-1 flex-col">
                <span className="font-bold">
                  {c.qty} bbl {PRODUCTS[c.product].name}
                </span>
                <span className="text-xs text-brand-ink-2">
                  You have {have} · {mmss(Math.max(0, (c.expiresAt - now) / 1000))} left
                </span>
              </div>
              <span className="font-display font-bold">+{c.reward}</span>
              <button type="button" className="btn btn-red min-h-10! px-3! text-base!" disabled={have < c.qty} onClick={() => store.run((g, t) => E.fill(g, t, c.id))}>
                Fill
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function StoragePanel({ store, game }: { store: GameStore; game: E.Game }) {
  const info = E.levelInfo(game);
  return (
    <>
      <p>
        Rig level {game.level} · {info.slots} pads · {E.storageUsed(game)}/{info.storage} bbl stored
      </p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PRODUCT_ORDER.map((p) => (
          <li key={p} className="pixel-sm flex items-center gap-2 bg-white px-2 py-1.5">
            <BarrelIcon p={p} scale={2} />
            <span className="text-sm font-bold">{PRODUCTS[p].name}</span>
            <span className="ml-auto font-display font-bold tabular-nums">{game.storage[p]}</span>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn-red self-start" disabled={E.barrelsWaiting(game) < 1} onClick={() => store.run((g, t) => E.collectAll(g, t))}>
        Collect from every well · {E.barrelsWaiting(game)} bbl
      </button>
      {game.level < LEVELS.length ? (
        <button type="button" className="btn btn-sun self-start" onClick={() => store.run((g, t) => E.upgradeRig(g, t))}>
          Upgrade rig to level {game.level + 1} · {LEVELS[game.level].cost}
        </button>
      ) : (
        <p className="pixel-sm bg-brand-sun-pale px-3 py-2 font-bold">Top level reached. Nice rig!</p>
      )}
      <dl className="grid grid-cols-3 gap-3 text-center">
        {[
          ["Points", game.points],
          ["Contracts", game.contractsFilled],
          ["Storms held", game.stormsHeld],
        ].map(([k, v]) => (
          <div key={k} className="pixel-sm bg-brand-sun-pale p-2">
            <dt className="text-xs font-extrabold uppercase text-brand-ink-2">{k}</dt>
            <dd className="font-display text-2xl font-bold">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-brand-ink-2">Points come from barrels, contracts and storms held. From Season 1 they count toward your crew score.</p>
    </>
  );
}

export function QuartersPanel({ store, game }: { store: GameStore; game: E.Game }) {
  return (
    <>
      <p className="text-sm text-brand-ink-2">The crew log. Everything that happened on your rig.</p>
      <ul className="flex max-h-[45vh] flex-col gap-1.5 overflow-y-auto text-sm" aria-live="polite">
        {game.log.map((l, i) => (
          <li key={i} className="flex gap-2">
            <time className="shrink-0 font-bold tabular-nums text-brand-ink-2">
              {new Date(l.at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
            </time>
            <span>{l.text}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="btn btn-white self-start"
        onClick={() => {
          if (window.confirm("Start a brand-new rig? Your current progress will be lost.")) store.reset();
        }}
      >
        Start over
      </button>
    </>
  );
}

const hhmm = (s: number) => `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m`;

/** Daily Shift: five random tasks a day, each paying coins, and a bonus for the full shift that grows with the streak. */
export function ShiftPanel({ store, game, now }: { store: GameStore; game: E.Game; now: number }) {
  const s = game.shift;
  if (!s) return <p className="pixel-sm bg-white px-3 py-3 text-center">Dealing today&apos;s shift…</p>;
  const reward = E.shiftReward(game);
  const bonus = E.shiftBonus(game, now);
  const streak = E.shiftStreak(game, now);
  const claimed = s.tasks.filter((t) => t.claimed).length;
  const all = claimed === s.tasks.length;
  return (
    <>
      <p className="text-sm text-brand-ink-2">
        Five random tasks, new every day at 00:00 UTC. Next shift in {hhmm(E.shiftResetIn(now))}.
      </p>
      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          ["Done", `${claimed}/${s.tasks.length}`],
          ["Streak", `${streak} day${streak === 1 ? "" : "s"}`],
          ["Per task", `+${fmt(reward)}`],
        ].map(([k, v]) => (
          <div key={k} className="pixel-sm bg-brand-sun-pale p-2">
            <dt className="text-xs font-extrabold uppercase text-brand-ink-2">{k}</dt>
            <dd className="font-display text-xl font-bold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      <ul className="flex flex-col gap-2">
        {s.tasks.map((t, i) => {
          const done = E.taskDone(t);
          return (
            <li key={`${t.kind}-${i}`} className={`pixel-sm flex flex-col gap-2 px-3 py-2 ${t.claimed ? "bg-[#d8f3e6]" : "bg-white"}`}>
              <div className="flex items-start gap-2">
                <span className="flex-1 font-bold leading-snug">{E.taskLabel(t)}</span>
                <span className="font-display font-bold tabular-nums">+{fmt(reward)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Bar value={t.progress} max={t.target} color={t.claimed ? C.leaf : done ? C.sunDeep : C.sea} />
                </div>
                <span className="w-20 text-right text-xs font-bold tabular-nums text-brand-ink-2">
                  {fmt(t.progress)}/{fmt(t.target)}
                </span>
                {t.claimed ? (
                  <span className="w-[76px] text-center text-sm font-extrabold text-brand-leaf">Done</span>
                ) : done ? (
                  <button type="button" className="btn btn-red min-h-9! w-[76px] px-2! text-sm!" onClick={() => store.run((g, n) => E.claimTask(g, n, i))}>
                    Claim
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-white min-h-9! w-[76px] px-2! text-sm!"
                    disabled={s.swaps < 1}
                    title={s.swaps < 1 ? "No swaps left today" : "Swap this task for another one, once a day"}
                    onClick={() => store.run((g, n) => E.swapTask(g, n, i))}
                  >
                    Swap
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {s.bonusClaimed ? (
        <p className="pixel-sm bg-[#d8f3e6] px-3 py-2 text-center font-bold">Full shift done. Day {s.streak} streak. See you tomorrow, roughneck.</p>
      ) : (
        <button type="button" className="btn btn-sun self-stretch justify-center" disabled={!all} onClick={() => store.run((g, n) => E.claimShift(g, n))}>
          Full shift bonus · +{fmt(bonus.coins)} ({bonus.streak}-day streak, +{bonus.pct}%)
        </button>
      )}
      <p className="text-xs text-brand-ink-2">
        {s.swaps > 0 ? "You can swap one unfinished task today. " : ""}Finish every task on consecutive days to grow your streak: +10% on the bonus per day, up to +100%.
      </p>
    </>
  );
}

const FOREMAN_JOBS: { job: E.ForemanJob; label: string }[] = [
  { job: "collect", label: "Collect from every well" },
  { job: "sell", label: "Sell when storage fills up" },
  { job: "contracts", label: "Fill Dispatch contracts he has barrels for" },
  { job: "cap", label: "Cap blowouts with the capping drill" },
  { job: "brace", label: "Brace the rig in storms" },
];

export function ForemanPanel({ store, game, now }: { store: GameStore; game: E.Game; now: number }) {
  const free = E.foremanFree(game);
  const on = E.foremanOn(game, now);
  const f = game.foreman;
  const price = E.foremanPrice(game);
  const jobs = f?.jobs ?? { collect: true, sell: true, contracts: true, cap: true, brace: true };
  const sellAt = f?.sellAt ?? 0.8;
  const r = f?.report;
  const news = r && (r.bbl || r.coins || r.contracts || r.storms || r.capped);
  return (
    <>
      <div className={`pixel-sm flex items-center gap-3 px-3 py-2 ${on ? "bg-[#d8f3e6]" : "bg-brand-sun-pale"}`}>
        <span className={`inline-block h-3 w-3 ${on ? "bg-brand-leaf" : "bg-brand-ink-2"}`} />
        <p className="text-sm font-bold">
          {free
            ? `On duty for free: your rig is level ${game.level}.`
            : on
              ? `On duty for another ${hhmm(((f?.until ?? now) - now) / 1000)}.`
              : `Not on the rig. He works for free from rig level ${FOREMAN_FREE_LEVEL}.`}
        </p>
      </div>
      <p className="text-sm text-brand-ink-2">
        He runs your rig on rounds: every {FOREMAN_ROUND / 60} minutes while you play, and every {FOREMAN_ROUND_AWAY / 60} minutes while the game is
        closed, for up to {FOREMAN_AWAY_CAP / 3600} hours with the wells on Safe.
      </p>
      {!free && (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-red" onClick={() => store.run((g, n) => E.hireForeman(g, n, 1))}>
            {on ? "Add a day" : "Hire for a day"} · {fmt(price.day)}
          </button>
          <button type="button" className="btn btn-white" onClick={() => store.run((g, n) => E.hireForeman(g, n, 3))}>
            {on ? "Add 3 days" : "3 days"} · {fmt(price.three)}
          </button>
        </div>
      )}

      {news ? (
        <div className="pixel-sm flex flex-col gap-2 bg-white p-3">
          <p className="font-display text-lg font-bold">{r.away ? "While you were away" : "His latest rounds"}</p>
          <dl className="grid grid-cols-2 gap-2 text-center sm:grid-cols-3">
            {[
              ["Barrels collected", fmt(r.bbl)],
              ["Coins earned", `+${fmt(r.coins)}`],
              ["Contracts filled", fmt(r.contracts)],
              ["Storms held", fmt(r.storms)],
              ["Wells capped", fmt(r.capped)],
            ].map(([k, v]) => (
              <div key={k} className="pixel-sm bg-brand-sun-pale p-2">
                <dt className="text-[10px] font-extrabold uppercase text-brand-ink-2">{k}</dt>
                <dd className="font-display text-lg font-bold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          <button type="button" className="btn btn-white self-start" onClick={() => store.run((g, n) => E.readForemanReport(g, n))}>
            Got it
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <p className="text-xs font-extrabold uppercase tracking-wide text-brand-ink-2">His jobs</p>
        {FOREMAN_JOBS.map(({ job, label }) => (
          <label key={job} className="pixel-sm flex items-center gap-3 bg-white px-3 py-2 text-sm font-bold">
            <input type="checkbox" className="h-4 w-4 accent-[#15905f]" checked={jobs[job]} onChange={(e) => store.run((g, n) => E.setForeman(g, n, { jobs: { [job]: e.target.checked } }))} />
            <span className="flex-1">{label}</span>
            {job === "sell" && (
              <select
                aria-label="Sell when storage is this full"
                className="pixel-sm bg-brand-sun-pale px-1 py-0.5 text-sm"
                value={sellAt}
                onChange={(e) => store.run((g, n) => E.setForeman(g, n, { sellAt: Number(e.target.value) }))}
              >
                {[0.5, 0.8, 1].map((v) => (
                  <option key={v} value={v}>
                    at {Math.round(v * 100)}%
                  </option>
                ))}
              </select>
            )}
          </label>
        ))}
        <label className="flex items-center gap-3 px-1 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[#15905f]" checked={f?.keepForUnits ?? true} onChange={(e) => store.run((g, n) => E.setForeman(g, n, { keepForUnits: e.target.checked }))} />
          Keep enough crude for the refinery units when he sells
        </label>
      </div>
      <p className="text-xs text-brand-ink-2">
        He plays by your rules: the same storage, prices and contracts, and he misses a valve now and then like anyone. His work earns no points and
        doesn&apos;t count toward your Daily Shift.
      </p>
    </>
  );
}
