import {
  BLOWOUT_AT,
  BRACE_SECONDS,
  CAP_COST,
  CHOKES,
  CONTRACT_EVERY,
  CONTRACT_SLOTS,
  EXPORT_BBL,
  EXPORT_DAILY_BBL,
  EXPORT_USD,
  FOREMAN_AWAY_CAP,
  FOREMAN_BRACE,
  FOREMAN_DAY,
  FOREMAN_FREE_LEVEL,
  FOREMAN_ROUND,
  FOREMAN_ROUND_AWAY,
  LEVELS,
  MARKET_EVERY,
  OFFLINE_CAP,
  POINTS,
  PRODUCTS,
  RAWS,
  SHIFT_BONUS,
  SHIFT_REWARD,
  SHIFT_SIZE,
  SHIFT_STREAK_CAP,
  SHIFT_SWAPS,
  TASKS,
  PRODUCT_ORDER,
  START_COINS,
  STORM_EVERY,
  STORM_WARNING,
  UNITS,
  UNIT_UPGRADE_COST,
  WELLS,
  XOM_USD,
  type Choke,
  type Product,
  type Raw,
  type TaskKind,
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

export type Task = { kind: TaskKind; target: number; progress: number; claimed: boolean; product?: Raw };

/** Today's Daily Shift (UTC day), and the streak of full shifts on consecutive days. */
export type Shift = { day: number; tasks: Task[]; swaps: number; bonusClaimed: boolean; streak: number; lastFull: number };

export type Storm = { phase: "brace"; endsAt: number; order: number[]; step: number } | null;

export type ForemanJob = "collect" | "sell" | "contracts" | "cap" | "brace";

/** What the foreman did since you last read his report. */
export type ForemanReport = { since: number; bbl: number; coins: number; contracts: number; storms: number; capped: number; away: boolean };

export type Foreman = {
  /** Hired until this time (ms); free rigs ignore it. */
  until: number;
  jobs: Record<ForemanJob, boolean>;
  /** Sells once storage is this full, 0 to 1. */
  sellAt: number;
  /** Leaves enough crude in storage for the refinery units to keep cooking. */
  keepForUnits: boolean;
  nextAt: number;
  report: ForemanReport;
  /** The report has news you haven't opened yet. */
  unseen: boolean;
};

export type Game = {
  version: 1;
  savedAt: number;
  /** In-game money for drilling, units and upgrades. It never leaves the game. */
  coins: number;
  /** XOM earned by exporting barrels, and how many barrels of today's quota are used. */
  xom: number;
  exported: { day: number; bbl: number };
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
  /** Missing on saves from before Daily Shift; the next tick deals one. */
  shift?: Shift;
  /** Missing until the rig first meets its foreman. */
  foreman?: Foreman;
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
/** Whole barrels waiting in every wellhead, ready to collect. */
export const barrelsWaiting = (g: Game) => g.slots.reduce((n, s) => (s.kind === "well" ? n + Math.floor(s.held) : n), 0);
/** What selling everything in storage pays right now. */
export const storageValue = (g: Game) => PRODUCT_ORDER.reduce((sum, p) => sum + Math.round(g.storage[p] * price(g, p)), 0);

/* ---------------- rig foreman ---------------- */

const FOREMAN_JOBS: ForemanJob[] = ["collect", "sell", "contracts", "cap", "brace"];
const emptyReport = (since: number): ForemanReport => ({ since, bbl: 0, coins: 0, contracts: 0, storms: 0, capped: 0, away: false });

function foremanOf(g: Game, now: number): Foreman {
  g.foreman ??= {
    until: 0,
    jobs: Object.fromEntries(FOREMAN_JOBS.map((j) => [j, true])) as Record<ForemanJob, boolean>,
    sellAt: 0.8,
    keepForUnits: true,
    nextAt: now + FOREMAN_ROUND * 1000,
    report: emptyReport(now),
    unseen: false,
  };
  return g.foreman;
}

export const foremanFree = (g: Game) => g.level >= FOREMAN_FREE_LEVEL;
/** Is the foreman on the rig at `at`? */
export const foremanOn = (g: Game, at: number) => foremanFree(g) || (g.foreman?.until ?? 0) > at;
/** One day of the foreman for this rig, and three. */
export const foremanPrice = (g: Game) => {
  const day = FOREMAN_DAY[Math.min(g.level, FOREMAN_DAY.length) - 1];
  return { day, three: Math.round(day * 2.5) };
};

/** Crude the refinery units need on hand to keep cooking for a while. */
function unitReserve(g: Game) {
  const keep = zeroes();
  g.slots.forEach((s, i) => {
    if (i >= levelInfo(g).slots || s.kind !== "unit") return;
    const r = UNITS[s.unit].recipes[s.recipe];
    keep[r.input] += r.inQty * 4;
  });
  return keep;
}

/** One round: cap blown wells, collect, fill contracts and sell, by the same rules a player plays by. */
function foremanRound(g: Game, now: number, away: boolean) {
  const f = foremanOf(g, now);
  const rep = f.report;
  if (f.jobs.cap)
    g.slots.forEach((s, i) => {
      if (i >= levelInfo(g).slots || s.kind !== "well" || !s.blown) return;
      s.blown = false;
      s.pressure = 20;
      s.choke = "normal";
      rep.capped++;
    });
  if (f.jobs.collect)
    for (const s of g.slots) {
      if (s.kind !== "well") continue;
      const take = Math.min(Math.floor(s.held), storageFree(g));
      if (take < 1) continue;
      s.held -= take;
      g.storage[s.product] += take;
      rep.bbl += take;
    }
  if (f.jobs.contracts)
    for (const c of [...g.contracts]) {
      if (c.expiresAt <= now || g.storage[c.product] < c.qty) continue;
      g.storage[c.product] -= c.qty;
      g.coins += c.reward;
      g.contractsFilled++;
      g.contracts = g.contracts.filter((x) => x.id !== c.id);
      rep.contracts++;
      rep.coins += c.reward;
    }
  if (f.jobs.sell && storageUsed(g) >= levelInfo(g).storage * f.sellAt) {
    const keep = f.keepForUnits ? unitReserve(g) : zeroes();
    for (const p of PRODUCT_ORDER) {
      const qty = Math.max(0, g.storage[p] - keep[p]);
      if (!qty) continue;
      const value = Math.round(qty * price(g, p));
      g.storage[p] -= qty;
      g.coins += value;
      rep.coins += value;
    }
  }
  if (away) rep.away = true;
  if (rep.bbl || rep.coins || rep.contracts || rep.capped) f.unseen = true;
}

/**
 * While the game was closed (or the tab sat in the background): the deck runs at Safe up to each of his
 * rounds, on his own clock, for as long as he's hired. Returns the seconds he covered.
 */
function foremanAway(g: Game, from: number, seconds: number) {
  const f = foremanOf(g, from);
  const end = from + seconds * 1000;
  let at = from;
  while (at < end && foremanOn(g, at)) {
    const round = Math.max(f.nextAt, at);
    const stop = Math.min(round, end);
    runDeck(g, (stop - at) / 1000, stop, false);
    at = stop;
    if (at >= round) {
      foremanRound(g, at, true);
      f.nextAt = at + FOREMAN_ROUND_AWAY * 1000;
    }
  }
  return (at - from) / 1000;
}

/** In a storm he gets to the valves after a couple of seconds and, like anyone, sometimes misses one. */
function foremanBrace(g: Game, now: number, rng: Rng) {
  const s = g.storm;
  if (!s || now < s.endsAt - (BRACE_SECONDS - 2.5) * 1000) return;
  const held = rng() < FOREMAN_BRACE ? s.order.length : 2 + Math.floor(rng() * 2);
  s.step = held;
  const wasHeld = g.stormsHeld;
  endStorm(g, now, false);
  if (g.stormsHeld > wasHeld) foremanOf(g, now).report.storms++;
}

/* ---------------- daily shift ---------------- */

const kindsFor = (level: number) => (Object.keys(TASKS) as TaskKind[]).filter((k) => level >= (TASKS[k].min ?? 1) && level <= (TASKS[k].max ?? LEVELS.length));

function dealTask(level: number, kind: TaskKind, rng: Rng): Task {
  const t: Task = { kind, target: TASKS[kind].target(level), progress: 0, claimed: false };
  if (kind === "sellRaw") t.product = RAWS[Math.floor(rng() * RAWS.length)];
  return t;
}

function dealShift(g: Game, day: number, rng: Rng) {
  const pool = kindsFor(g.level);
  const kinds: TaskKind[] = [];
  while (kinds.length < SHIFT_SIZE && pool.length) kinds.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  const prev = g.shift;
  g.shift = {
    day,
    tasks: kinds.map((k) => dealTask(g.level, k, rng)),
    swaps: SHIFT_SWAPS,
    bonusClaimed: false,
    streak: prev?.streak ?? 0,
    lastFull: prev?.lastFull ?? -1,
  };
}

/** Moves today's tasks forward. `product` narrows the tasks that ask for one product. */
function bump(g: Game, kind: TaskKind, amount: number, product?: Product) {
  for (const t of g.shift?.tasks ?? []) {
    if (t.kind !== kind || t.claimed || (t.product && t.product !== product)) continue;
    t.progress = Math.min(t.target, t.progress + amount);
  }
}

export const taskLabel = (t: Task) => TASKS[t.kind].label(t.target, t.product);
export const taskDone = (t: Task) => t.progress >= t.target;
export const shiftReward = (g: Game) => SHIFT_REWARD[g.level - 1];
/** The streak that counts today: it lapses after a day without a full shift. */
export const shiftStreak = (g: Game, now: number) => (g.shift && g.shift.lastFull >= dayOf(now) - 1 ? g.shift.streak : 0);
/** Bonus for finishing the whole shift today, with the streak it makes. */
export function shiftBonus(g: Game, now: number) {
  const s = g.shift;
  const today = dayOf(now);
  const streak = s && s.lastFull === today ? s.streak : s && s.lastFull === today - 1 ? s.streak + 1 : 1;
  const pct = 10 * Math.min(streak, SHIFT_STREAK_CAP);
  return { streak, pct, coins: Math.round(shiftReward(g) * SHIFT_BONUS * (1 + pct / 100)) };
}
/** Tasks finished but not yet claimed, plus the bonus once every task is claimed. */
export const shiftReady = (g: Game) =>
  (g.shift?.tasks.filter((t) => taskDone(t) && !t.claimed).length ?? 0) + (g.shift && !g.shift.bonusClaimed && g.shift.tasks.every((t) => t.claimed) ? 1 : 0);
/** Seconds until the next shift is dealt, at 00:00 UTC. */
export const shiftResetIn = (now: number) => ((dayOf(now) + 1) * 86_400_000 - now) / 1000;

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
    xom: 0,
    exported: { day: dayOf(now), bbl: 0 },
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
      if (live && s.choke === "overdrive") bump(g, "overdrive", dt);
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
          if (live) bump(g, "refine", 1);
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

/** `byYou` is false when the foreman braced: the bonus is paid, but no points and no shift progress. */
function endStorm(g: Game, now: number, byYou = true) {
  if (!g.storm) return;
  const held = g.storm.step / g.storm.order.length;
  if (held === 1) {
    const bonus = 10 + 10 * g.level;
    g.coins += bonus;
    g.stormsHeld++;
    if (byYou) {
      g.points += POINTS.storm;
      bump(g, "storm", 1);
    }
    log(g, now, `${byYou ? "Rig held" : "Your foreman held the rig"} through the storm. Bonus +${bonus} coins.`);
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
  if (g.shift?.day !== dayOf(now)) dealShift(g, dayOf(now), rng);

  if (dt > 30) {
    // offline: production at Safe, capped, then pick up the clocks from now. A foreman on the rig keeps
    // it going for longer, on rounds; once he's off, the rest runs like any closed tab.
    const worked = foremanOn(g, g.savedAt) ? foremanAway(g, g.savedAt, Math.min(dt, FOREMAN_AWAY_CAP)) : 0;
    if (worked < OFFLINE_CAP) runDeck(g, Math.min(dt, OFFLINE_CAP) - worked, now, false);
    if (g.foreman) g.foreman.nextAt = Math.min(g.foreman.nextAt, now + FOREMAN_ROUND * 1000);
    g.nextMarketAt = Math.max(g.nextMarketAt, now);
    g.nextContractAt = Math.max(g.nextContractAt, now);
    g.nextStormAt = Math.max(g.nextStormAt, now + 60_000);
    g.contracts = g.contracts.filter((c) => c.expiresAt > now);
    g.storm = null;
    log(g, now, worked ? "Welcome back. Your foreman kept the rig running while you were away." : "Welcome back. Your wells kept pumping on Safe while you were away.");
    dt = 0;
  }

  if (dt > 0) runDeck(g, dt, now, true);
  runMarket(g, now, rng);
  runContracts(g, now, rng);
  const foreman = foremanOn(g, now) ? foremanOf(g, now) : null;
  if (foreman?.jobs.brace) foremanBrace(g, now, rng);
  if (g.storm && now >= g.storm.endsAt) endStorm(g, now);
  if (!g.storm && now >= g.nextStormAt) startStorm(g, now, rng);
  if (foreman && now >= foreman.nextAt) {
    foremanRound(g, now, false);
    foreman.nextAt = now + FOREMAN_ROUND * 1000;
  }
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
    bump(g, "drill", 1);
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
    bump(g, "collect", take);
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
      bump(g, "collect", take);
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
    if (drillDone) bump(g, "capHand", 1);
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
    bump(g, "build", 1);
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
    bump(g, "build", 1);
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
    bump(g, "sell", qty);
    bump(g, "sellRaw", qty, p);
    bump(g, "earn", value);
    log(g, now, `Sold ${qty} bbl ${PRODUCTS[p].name.toLowerCase()} at ${g.index[p].toFixed(2)}×: +${value} coins.`);
    return `Sold ${qty} bbl for +${value} coins`;
  });
}

/** Sells every product in storage at its current price. */
export function sellAll(prev: Game, now: number): Result {
  return act(prev, now, (g) => {
    const qty = storageUsed(g);
    if (!qty) return "!Nothing to sell.";
    const value = storageValue(g);
    for (const p of PRODUCT_ORDER) {
      bump(g, "sellRaw", g.storage[p], p);
      g.storage[p] = 0;
    }
    g.coins += value;
    bump(g, "sell", qty);
    bump(g, "earn", value);
    log(g, now, `Sold all storage, ${qty} bbl: +${value} coins.`);
    return `Sold ${qty} bbl for +${value} coins`;
  });
}

/** Barrels left in today's export quota (UTC day). */
export const exportLeft = (g: Game, now: number) => (g.exported.day === dayOf(now) ? Math.max(0, EXPORT_DAILY_BBL - g.exported.bbl) : EXPORT_DAILY_BBL);

/** XOM paid for a number of exported barrels, at the reference XOM price. */
export const xomFor = (bbl: number) => ((bbl / EXPORT_BBL) * EXPORT_USD) / XOM_USD;

/** Ship barrels out through the export terminal for XOM, up to the daily quota. */
export function exportBarrels(prev: Game, now: number, p: Product): Result {
  return act(prev, now, (g) => {
    const have = g.storage[p];
    if (!have) return "!Nothing to export.";
    const left = exportLeft(g, now);
    if (left <= 0) return `!Today's export quota of ${EXPORT_DAILY_BBL.toLocaleString("en-US")} bbl is full. It resets at 00:00 UTC.`;
    const qty = Math.min(have, left);
    const earned = xomFor(qty);
    if (g.exported.day !== dayOf(now)) g.exported = { day: dayOf(now), bbl: 0 };
    g.storage[p] -= qty;
    g.xom += earned;
    g.exported.bbl += qty;
    bump(g, "export", qty);
    log(g, now, `Exported ${qty} bbl ${PRODUCTS[p].name.toLowerCase()}: +${earned.toFixed(8)} XOM.`);
    return `Exported ${qty} bbl for +${earned.toFixed(8)} XOM`;
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
    bump(g, "contract", 1);
    bump(g, "earn", c.reward);
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
    bump(g, "build", 1);
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

/* ---------------- daily shift actions ---------------- */

export function claimTask(prev: Game, now: number, i: number): Result {
  return act(prev, now, (g) => {
    const t = g.shift?.tasks[i];
    if (!t) return "!That task is gone.";
    if (t.claimed) return "!Already claimed.";
    if (!taskDone(t)) return "!Finish the task first.";
    const coins = shiftReward(g);
    t.claimed = true;
    g.coins += coins;
    log(g, now, `Shift task done: ${taskLabel(t)}. +${coins} coins.`);
    return `Task done: +${coins} coins`;
  });
}

/** The bonus for a full shift, which also extends the streak. */
export function claimShift(prev: Game, now: number): Result {
  return act(prev, now, (g) => {
    const s = g.shift;
    if (!s) return "!No shift yet.";
    if (s.bonusClaimed) return "!Today's bonus is already claimed.";
    if (!s.tasks.every((t) => t.claimed)) return "!Claim every task first.";
    const bonus = shiftBonus(g, now);
    s.bonusClaimed = true;
    s.streak = bonus.streak;
    s.lastFull = dayOf(now);
    g.coins += bonus.coins;
    log(g, now, `Full shift! Day ${bonus.streak} streak: +${bonus.coins} coins.`);
    return `Full shift! +${bonus.coins} coins · ${bonus.streak}-day streak`;
  });
}

/** Swaps one unfinished task for another kind, SHIFT_SWAPS times a day. */
export function swapTask(prev: Game, now: number, i: number, rng: Rng = Math.random): Result {
  return act(prev, now, (g) => {
    const s = g.shift;
    const t = s?.tasks[i];
    if (!s || !t) return "!That task is gone.";
    if (s.swaps < 1) return "!No swaps left today.";
    if (t.claimed || taskDone(t)) return "!That task is already done.";
    const pool = kindsFor(g.level).filter((k) => !s.tasks.some((x) => x.kind === k));
    if (!pool.length) return "!No other tasks to swap in.";
    s.tasks[i] = dealTask(g.level, pool[Math.floor(rng() * pool.length)], rng);
    s.swaps--;
    return "Task swapped";
  });
}

/* ---------------- rig foreman actions ---------------- */

/** Hires the foreman for one or three days, adding to any time left. Free rigs don't need to. */
export function hireForeman(prev: Game, now: number, days: 1 | 3): Result {
  return act(prev, now, (g) => {
    if (foremanFree(g)) return "!Your foreman works for free from rig level " + FOREMAN_FREE_LEVEL + ".";
    const cost = days === 3 ? foremanPrice(g).three : foremanPrice(g).day;
    if (g.coins < cost) return `!Hiring him for ${days === 3 ? "3 days" : "a day"} costs ${cost.toLocaleString("en-US")} coins.`;
    const f = foremanOf(g, now);
    g.coins -= cost;
    f.until = Math.max(f.until, now) + days * 86_400_000;
    f.nextAt = now + 5_000;
    log(g, now, `Foreman hired for ${days === 3 ? "3 days" : "a day"}.`);
    return "Your foreman is on the rig";
  });
}

/** Changes his jobs or how full storage gets before he sells. */
export function setForeman(prev: Game, now: number, patch: { jobs?: Partial<Record<ForemanJob, boolean>>; sellAt?: number; keepForUnits?: boolean }): Result {
  return act(prev, now, (g) => {
    const f = foremanOf(g, now);
    if (patch.jobs) f.jobs = { ...f.jobs, ...patch.jobs };
    if (patch.sellAt !== undefined) f.sellAt = clamp(patch.sellAt, 0.2, 1);
    if (patch.keepForUnits !== undefined) f.keepForUnits = patch.keepForUnits;
  });
}

/** You've read his report: start a fresh one. */
export function readForemanReport(prev: Game, now: number): Result {
  return act(prev, now, (g) => {
    const f = foremanOf(g, now);
    f.report = emptyReport(now);
    f.unseen = false;
  });
}
