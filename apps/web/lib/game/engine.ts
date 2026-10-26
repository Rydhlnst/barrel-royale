import {
  BLOWOUT_AT,
  BRACE_SECONDS,
  CAP_COST,
  CHOKES,
  CONTRACT_EVERY,
  CONTRACT_SLOTS,
  LEVELS,
  MARKET_EVERY,
  OFFLINE_CAP,
  POINTS,
  PRODUCTS,
  PRODUCT_ORDER,
  ROYAL_DAILY_CAP,
  ROYAL_PER_BARREL,
  START_COINS,
  STORM_EVERY,
  STORM_WARNING,
  UNITS,
  UNIT_UPGRADE_COST,
  WELLS,
  type Choke,
  type Product,
  type Raw,
  type UnitKind,
} from "./content";

// The game rules as plain functions over a plain state object, with no DOM and
// no clock of its own: every call takes `now` in milliseconds. The browser runs
// it today; the same module can run on the game server later, which is what
// keeps the server authoritative.

export type Slot =
  | { kind: "empty" }
  | { kind: "well"; product: Raw; choke: Choke; pressure: number; held: number; blown: boolean }
  | { kind: "unit"; unit: UnitKind; level: number; recipe: number; progress: number };

export type Contract = { id: number; product: Product; qty: number; reward: number; expiresAt: number };

export type Storm = { phase: "brace"; endsAt: number; order: number[]; step: number } | null;

export type Game = {
  version: 1;
  savedAt: number;
  /** In-game money for drilling, units and upgrades. It never leaves the game. */
  coins: number;
  /** $ROYAL earned by exporting barrels, and how much of the daily quota is used today. */
  royal: number;
  exported: { day: number; royal: number };
  level: number;
  slots: Slot[];
  storage: Record<Product, number>;
  index: Record<Product, number>;
  history: Record<Product, number[]>;
  contracts: Contract[];
  nextContractAt: number;
  nextMarketAt: number;
  nextStormAt: number;
  storm: Storm;
  points: number;
  stormsHeld: number;
  contractsFilled: number;
  nextId: number;
  log: { at: number; text: string }[];
};

type Rng = () => number;

const zeroes = () => Object.fromEntries(PRODUCT_ORDER.map((p) => [p, 0])) as Record<Product, number>;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const round = (v: number) => Math.round(v * 100) / 100;
const dayOf = (now: number) => Math.floor(now / 86_400_000);

export const levelInfo = (g: Game) => LEVELS[g.level - 1];
export const storageUsed = (g: Game) => PRODUCT_ORDER.reduce((sum, p) => sum + g.storage[p], 0);
export const storageFree = (g: Game) => levelInfo(g).storage - storageUsed(g);
export const price = (g: Game, p: Product) => round(PRODUCTS[p].base * g.index[p]);

function log(g: Game, now: number, text: string) {
  g.log.unshift({ at: now, text });
  g.log.length = Math.min(g.log.length, 40);
}

export function newGame(now: number): Game {
  const slots: Slot[] = Array.from({ length: LEVELS[LEVELS.length - 1].slots }, () => ({ kind: "empty" }) as Slot);
  return {
    version: 1,
    savedAt: now,
    coins: START_COINS,
    royal: 0,
    exported: { day: dayOf(now), royal: 0 },
    level: 1,
    slots,
    storage: zeroes(),
    index: Object.fromEntries(PRODUCT_ORDER.map((p) => [p, 1])) as Record<Product, number>,
    history: Object.fromEntries(PRODUCT_ORDER.map((p) => [p, Array(30).fill(1)])) as Record<Product, number[]>,
    contracts: [],
    nextContractAt: now + 5_000,
    nextMarketAt: now + MARKET_EVERY * 1000,
    nextStormAt: now + STORM_EVERY * 1000,
    storm: null,
    points: 0,
    stormsHeld: 0,
    contractsFilled: 0,
    nextId: 1,
    log: [{ at: now, text: "Welcome aboard, roughneck. Tap an empty slot and strike light crude." }],
  };
}

/* ---------------- simulation ---------------- */

function gauss(rng: Rng) {
  let u = 0;
  let v = 0;
  while (!u) u = rng();
  while (!v) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Wells and refinery units for `dt` seconds. `live` is false during offline catch-up, which never blows a well. */
function runDeck(g: Game, dt: number, now: number, live: boolean) {
  g.slots.forEach((s, i) => {
    if (i >= levelInfo(g).slots) return;
    if (s.kind === "well") {
      if (s.blown) return;
      const choke = CHOKES[live ? s.choke : "safe"];
      const w = WELLS[s.product];
      s.held = Math.min(w.holds, s.held + w.rate * choke.output * dt);
      const step = choke.speed * dt;
      s.pressure = s.pressure < choke.target ? Math.min(choke.target, s.pressure + step) : Math.max(choke.target, s.pressure - step);
      if (live && s.pressure >= BLOWOUT_AT) {
        s.blown = true;
        s.held = 0;
        s.pressure = BLOWOUT_AT;
        log(g, now, `Blowout on the ${PRODUCTS[s.product].name.toLowerCase()} well in slot ${i + 1}! Cap it to get it running again.`);
      }
    }
    if (s.kind === "unit") {
      const r = UNITS[s.unit].recipes[s.recipe];
      let left = dt;
      while (left > 0) {
        if (g.storage[r.input] < r.inQty) {
          s.progress = 0;
          break;
        }
        const need = r.seconds * (1 - s.progress);
        const speed = 1 + 0.25 * (s.level - 1);
        if (left * speed >= need) {
          left -= need / speed;
          g.storage[r.input] -= r.inQty;
          g.storage[r.output] += 1;
          s.progress = 0;
        } else {
          s.progress += (left * speed) / r.seconds;
          left = 0;
        }
      }
    }
  });
}

function runMarket(g: Game, now: number, rng: Rng) {
  while (now >= g.nextMarketAt) {
    for (const p of PRODUCT_ORDER) {
      const i = g.index[p];
      const next = clamp(i * (1 + (1 - i) * 0.05 + gauss(rng) * 0.04), 0.5, 2);
      g.index[p] = round(next);
      g.history[p].push(g.index[p]);
      if (g.history[p].length > 30) g.history[p].shift();
    }
    g.nextMarketAt += MARKET_EVERY * 1000;
  }
}

function runContracts(g: Game, now: number, rng: Rng) {
  const before = g.contracts.length;
  g.contracts = g.contracts.filter((c) => c.expiresAt > now);
  if (g.contracts.length < before) log(g, now, "A contract expired. New ones are on the Dispatch board.");
  while (now >= g.nextContractAt) {
    if (g.contracts.length < CONTRACT_SLOTS) {
      // early on, ask only for what the rig can already make
      const pool: Product[] = g.level === 1 && g.contractsFilled < 2 ? ["light", "diesel"] : PRODUCT_ORDER;
      const product = pool[Math.floor(rng() * pool.length)];
      const qty = Math.max(4, Math.round((24 / PRODUCTS[product].base) * (0.8 + rng() * 0.6) * (1 + 0.4 * (g.level - 1))));
      const premium = 1.1 + rng() * 0.2;
      g.contracts.push({
        id: g.nextId++,
        product,
        qty,
        reward: Math.round(qty * PRODUCTS[product].base * premium),
        expiresAt: now + (240 + Math.round(rng() * 180)) * 1000,
      });
    }
    g.nextContractAt += CONTRACT_EVERY * 1000;
  }
}

function startStorm(g: Game, now: number, rng: Rng) {
  const order = [0, 1, 2, 3];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  g.storm = { phase: "brace", endsAt: now + BRACE_SECONDS * 1000, order, step: 0 };
  log(g, now, "Storm's here! Close the valves in order.");
}

function endStorm(g: Game, now: number) {
  if (!g.storm) return;
  const held = g.storm.step / g.storm.order.length;
  if (held === 1) {
    const bonus = 10 + 10 * g.level;
    g.coins += bonus;
    g.points += POINTS.storm;
    g.stormsHeld++;
    log(g, now, `Rig held through the storm. Bonus +${bonus} coins.`);
  } else {
    const share = 0.3 * (1 - held);
    let lost = 0;
    for (const p of PRODUCT_ORDER) {
      const l = Math.ceil(g.storage[p] * share);
      g.storage[p] -= l;
      lost += l;
    }
    log(g, now, `The storm got through: ${lost} bbl washed overboard. Brace faster next time.`);
  }
  g.storm = null;
  g.nextStormAt = now + STORM_EVERY * 1000;
}

/** Advance the game to `now`. Long gaps (a closed tab) are caught up gently, without storms or blowouts. */
export function tick(prev: Game, now: number, rng: Rng = Math.random): Game {
  const g = structuredClone(prev);
  let dt = (now - g.savedAt) / 1000;
  if (dt <= 0) return prev;

  if (dt > 30) {
    // offline: production at Safe, capped, then pick up the clocks from now
    runDeck(g, Math.min(dt, OFFLINE_CAP), now, false);
    g.nextMarketAt = Math.max(g.nextMarketAt, now);
    g.nextContractAt = Math.max(g.nextContractAt, now);
    g.nextStormAt = Math.max(g.nextStormAt, now + 60_000);
    g.contracts = g.contracts.filter((c) => c.expiresAt > now);
    g.storm = null;
    log(g, now, "Welcome back. Your wells kept pumping on Safe while you were away.");
    dt = 0;
  }

  if (dt > 0) runDeck(g, dt, now, true);
  runMarket(g, now, rng);
  runContracts(g, now, rng);
  if (g.storm && now >= g.storm.endsAt) endStorm(g, now);
  if (!g.storm && now >= g.nextStormAt) startStorm(g, now, rng);
  g.savedAt = now;
  return g;
}

export const stormIn = (g: Game, now: number) => Math.max(0, (g.nextStormAt - now) / 1000);
export const stormWarning = (g: Game, now: number) => !g.storm && stormIn(g, now) <= STORM_WARNING;

/* ---------------- actions ---------------- */

export type Result = { game: Game; error?: string; note?: string };

function act(prev: Game, now: number, fn: (g: Game) => string | void): Result {
  const g = structuredClone(tick(prev, now));
  const out = fn(g);
  if (typeof out === "string" && out.startsWith("!")) return { game: prev, error: out.slice(1) };
  return { game: g, note: out || undefined };
}

const usable = (g: Game, i: number) => i >= 0 && i < levelInfo(g).slots;

export function drill(prev: Game, now: number, i: number, product: Raw): Result {
  return act(prev, now, (g) => {
    if (!usable(g, i) || g.slots[i].kind !== "empty") return "!That slot isn't free.";
    const cost = WELLS[product].cost;
    if (g.coins < cost) return `!Drilling ${PRODUCTS[product].name.toLowerCase()} costs ${cost} coins.`;
    g.coins -= cost;
    g.slots[i] = { kind: "well", product, choke: "normal", pressure: 20, held: 0, blown: false };
    log(g, now, `Struck ${PRODUCTS[product].name.toLowerCase()} in slot ${i + 1}.`);
    return `Struck ${PRODUCTS[product].name.toLowerCase()}!`;
  });
}

export function setChoke(prev: Game, now: number, i: number, choke: Choke): Result {
  return act(prev, now, (g) => {
    const s = g.slots[i];
    if (s.kind !== "well") return "!No well there.";
    s.choke = choke;
  });
}

export function collect(prev: Game, now: number, i: number): Result {
  return act(prev, now, (g) => {
    const s = g.slots[i];
    if (s.kind !== "well") return "!No well there.";
    const whole = Math.floor(s.held);
    if (whole < 1) return "!Nothing to collect yet.";
    const room = storageFree(g);
    if (room < 1) return "!Storage is full. Sell, refine or upgrade the rig.";
    const take = Math.min(whole, room);
    s.held -= take;
    g.storage[s.product] += take;
    g.points += take * POINTS.barrel;
    return `+${take} bbl ${PRODUCTS[s.product].name.toLowerCase()} to storage`;
  });
}

export function collectAll(prev: Game, now: number): Result {
  return act(prev, now, (g) => {
    let total = 0;
    for (const s of g.slots) {
      if (s.kind !== "well") continue;
      const take = Math.min(Math.floor(s.held), storageFree(g));
      if (take < 1) continue;
      s.held -= take;
      g.storage[s.product] += take;
      g.points += take * POINTS.barrel;
      total += take;
    }
    if (!total) return storageFree(g) < 1 ? "!Storage is full. Sell, refine or upgrade the rig." : "!Nothing to collect yet.";
    return `+${total} bbl to storage`;
  });
}

/** Cap a blown well: free when the capping drill is completed, otherwise for a fee. */
export function cap(prev: Game, now: number, i: number, drillDone: boolean): Result {
  return act(prev, now, (g) => {
    const s = g.slots[i];
    if (s.kind !== "well" || !s.blown) return "!That well is running fine.";
    if (!drillDone) {
      if (g.coins < CAP_COST) return `!Capping costs ${CAP_COST} coins, or run the capping drill.`;
      g.coins -= CAP_COST;
    }
    s.blown = false;
    s.pressure = 20;
    s.choke = "normal";
    log(g, now, `Well in slot ${i + 1} capped${drillDone ? " by hand" : ""} and back online.`);
    return "Well capped and back online";
  });
}

export function scrap(prev: Game, now: number, i: number): Result {
  return act(prev, now, (g) => {
    if (g.slots[i].kind === "empty") return "!Nothing to remove.";
    g.slots[i] = { kind: "empty" };
    log(g, now, `Slot ${i + 1} cleared.`);
  });
}

export function build(prev: Game, now: number, i: number, unit: UnitKind): Result {
  return act(prev, now, (g) => {
    if (!usable(g, i) || g.slots[i].kind !== "empty") return "!That slot isn't free.";
    const cost = UNITS[unit].cost;
    if (g.coins < cost) return `!A ${UNITS[unit].name.toLowerCase()} unit costs ${cost} coins.`;
    g.coins -= cost;
    g.slots[i] = { kind: "unit", unit, level: 1, recipe: 0, progress: 0 };
    log(g, now, `Built a ${UNITS[unit].name.toLowerCase()} unit in slot ${i + 1}.`);
    return `${UNITS[unit].name} unit built`;
  });
}

export function upgradeUnit(prev: Game, now: number, i: number): Result {
  return act(prev, now, (g) => {
    const s = g.slots[i];
    if (s.kind !== "unit") return "!No unit there.";
    if (s.level >= 3) return "!Already at the top level.";
    const cost = UNIT_UPGRADE_COST[s.level + 1];
    if (g.coins < cost) return `!The upgrade costs ${cost} coins.`;
    g.coins -= cost;
    s.level++;
    log(g, now, `${UNITS[s.unit].name} upgraded to level ${s.level}.`);
  });
}

export function setRecipe(prev: Game, now: number, i: number, recipe: number): Result {
  return act(prev, now, (g) => {
    const s = g.slots[i];
    if (s.kind !== "unit") return "!No unit there.";
    const r = UNITS[s.unit].recipes[recipe];
    if (!r) return "!Unknown recipe.";
    if (s.level < r.minLevel) return `!Needs a level ${r.minLevel} unit.`;
    s.recipe = recipe;
    s.progress = 0;
  });
}

export function sell(prev: Game, now: number, p: Product): Result {
  return act(prev, now, (g) => {
    const qty = g.storage[p];
    if (!qty) return "!Nothing to sell.";
    const value = Math.round(qty * price(g, p));
    g.storage[p] = 0;
    g.coins += value;
    log(g, now, `Sold ${qty} bbl ${PRODUCTS[p].name.toLowerCase()} at ${g.index[p].toFixed(2)}×: +${value} coins.`);
    return `Sold ${qty} bbl for +${value} coins`;
  });
}

/** $ROYAL left in today's export quota (UTC day). */
export const exportLeft = (g: Game, now: number) => (g.exported.day === dayOf(now) ? round(ROYAL_DAILY_CAP - g.exported.royal) : ROYAL_DAILY_CAP);

/** Ship barrels out through the export terminal for $ROYAL, up to the daily quota. */
export function exportBarrels(prev: Game, now: number, p: Product): Result {
  return act(prev, now, (g) => {
    const have = g.storage[p];
    if (!have) return "!Nothing to export.";
    const left = exportLeft(g, now);
    if (left <= 0) return `!Today's export quota of ${ROYAL_DAILY_CAP} $ROYAL is full. It resets at 00:00 UTC.`;
    const qty = Math.min(have, Math.floor(left / ROYAL_PER_BARREL + 1e-9));
    const earned = round(qty * ROYAL_PER_BARREL);
    if (g.exported.day !== dayOf(now)) g.exported = { day: dayOf(now), royal: 0 };
    g.storage[p] -= qty;
    g.royal = round(g.royal + earned);
    g.exported.royal = round(g.exported.royal + earned);
    log(g, now, `Exported ${qty} bbl ${PRODUCTS[p].name.toLowerCase()}: +${earned.toFixed(2)} $ROYAL.`);
    return `Exported ${qty} bbl for +${earned.toFixed(2)} $ROYAL`;
  });
}

export function fill(prev: Game, now: number, id: number): Result {
  return act(prev, now, (g) => {
    const c = g.contracts.find((x) => x.id === id);
    if (!c) return "!That contract is gone.";
    if (g.storage[c.product] < c.qty) return `!You need ${c.qty} bbl ${PRODUCTS[c.product].name.toLowerCase()}.`;
    g.storage[c.product] -= c.qty;
    g.coins += c.reward;
    g.points += POINTS.contract;
    g.contractsFilled++;
    g.contracts = g.contracts.filter((x) => x.id !== id);
    log(g, now, `Contract filled: ${c.qty} bbl ${PRODUCTS[c.product].name.toLowerCase()} for +${c.reward} coins.`);
    return `Contract filled: +${c.reward} coins`;
  });
}

export function upgradeRig(prev: Game, now: number): Result {
  return act(prev, now, (g) => {
    if (g.level >= LEVELS.length) return "!Your rig is at the top level.";
    const next = LEVELS[g.level];
    if (g.coins < next.cost) return `!The next level costs ${next.cost} coins.`;
    g.coins -= next.cost;
    g.level++;
    log(g, now, `Rig upgraded to level ${g.level}: ${next.slots} deck slots, ${next.storage} bbl storage.`);
  });
}

/** One valve closed during a storm. Wrong valves cost a second. */
export function brace(prev: Game, now: number, valve: number): Result {
  return act(prev, now, (g) => {
    const s = g.storm;
    if (!s) return "!No storm right now.";
    if (s.order[s.step] === valve) {
      s.step++;
      if (s.step === s.order.length) endStorm(g, now);
    } else {
      s.endsAt -= 1000;
      return "Wrong valve! −1 second";
    }
  });
}
