// Game content: products, wells, refinery units, rig levels and timings.
// Times are in seconds and tuned for a short browser session.

export type Raw = "light" | "heavy" | "gas";
export type Refined = "diesel" | "jet" | "lng";
export type Product = Raw | Refined;

export const PRODUCTS: Record<Product, { name: string; ref: string; base: number; color: string; shine: string }> = {
  light: { name: "Light crude", ref: "WTI", base: 1.67, color: "#3b3b3b", shine: "#f2b21d" },
  gas: { name: "Natural gas", ref: "Henry Hub", base: 2.83, color: "#3e8ede", shine: "#bfe0ff" },
  heavy: { name: "Heavy crude", ref: "WCS", base: 4.33, color: "#5a3a22", shine: "#c98a4b" },
  diesel: { name: "Diesel", ref: "ULSD", base: 6.67, color: "#2f9e57", shine: "#a6e3b8" },
  jet: { name: "Jet fuel", ref: "Jet A", base: 11.67, color: "#d0442f", shine: "#f7b2a6" },
  lng: { name: "LNG", ref: "JKM", base: 15.83, color: "#7a4fc0", shine: "#d3c2f2" },
};

export const PRODUCT_ORDER: Product[] = ["light", "gas", "heavy", "diesel", "jet", "lng"];
export const RAWS: Raw[] = ["light", "heavy", "gas"];

/** Drilling cost, barrels per second at Normal, and how many barrels the wellhead holds. */
export const WELLS: Record<Raw, { cost: number; rate: number; holds: number }> = {
  light: { cost: 5, rate: 0.175, holds: 15 },
  gas: { cost: 8, rate: 0.14, holds: 15 },
  heavy: { cost: 12, rate: 0.11, holds: 15 },
};

export type Choke = "safe" | "normal" | "overdrive";

/** Output multiplier, the pressure each setting drifts toward, and how fast (points per second). */
export const CHOKES: Record<Choke, { label: string; output: number; target: number; speed: number }> = {
  safe: { label: "Safe", output: 0.8, target: 30, speed: 6 },
  normal: { label: "Normal", output: 1, target: 60, speed: 4 },
  overdrive: { label: "Overdrive", output: 1.5, target: 130, speed: 3.5 },
};

export const BLOWOUT_AT = 100;
export const WARN_AT = 85;
export const CAP_COST = 15;

export type UnitKind = "distillation" | "cracker" | "liquefier";

export const UNITS: Record<UnitKind, { name: string; cost: number; recipes: { input: Raw; inQty: number; output: Refined; seconds: number; minLevel: number }[] }> = {
  distillation: {
    name: "Distillation",
    cost: 60,
    recipes: [
      { input: "light", inQty: 2, output: "diesel", seconds: 6, minLevel: 1 },
      { input: "light", inQty: 3, output: "jet", seconds: 12, minLevel: 2 },
    ],
  },
  cracker: { name: "Cracker", cost: 80, recipes: [{ input: "heavy", inQty: 2, output: "diesel", seconds: 8, minLevel: 1 }] },
  liquefier: { name: "Liquefier", cost: 120, recipes: [{ input: "gas", inQty: 3, output: "lng", seconds: 15, minLevel: 1 }] },
};

export const UNIT_UPGRADE_COST = [0, 0, 90, 180];

/** Rig levels 1–8: upgrade cost, deck slots, storage. Past level 4 the deck is full, so levels add storage. */
export const LEVELS = [
  { cost: 0, slots: 6, storage: 60 },
  { cost: 250, slots: 8, storage: 100 },
  { cost: 1_100, slots: 10, storage: 140 },
  { cost: 4_500, slots: 12, storage: 180 },
  { cost: 15_000, slots: 12, storage: 240 },
  { cost: 40_000, slots: 12, storage: 320 },
  { cost: 90_000, slots: 12, storage: 420 },
  { cost: 180_000, slots: 12, storage: 540 },
];

export const START_COINS = 60;
export const MARKET_EVERY = 4;
export const CONTRACT_EVERY = 45;
export const CONTRACT_SLOTS = 3;
export const STORM_EVERY = 150;
export const STORM_WARNING = 15;
export const BRACE_SECONDS = 8;
export const OFFLINE_CAP = 2 * 60 * 60;

export const POINTS = { barrel: 1, contract: 5, storm: 5 };

/**
 * The export terminal turns barrels straight into XOM: every 300 bbl of any
 * product earns $0.001 worth of XOM at the current XOM price, up to a daily
 * quota of barrels per rig. Selling on the market pays in-game coins instead.
 */
export const EXPORT_BBL = 300;
export const EXPORT_USD = 0.001;
export const EXPORT_DAILY_BBL = 5_000;

/** Reference XOM price for the browser game; the on-chain game reads the Chainlink feed. */
export const XOM_USD = 115;

/**
 * Daily Shift: every UTC day a rig gets SHIFT_SIZE tasks drawn at random from
 * this pool, with targets that grow with the rig level. Each task pays coins
 * when claimed; finishing the whole shift pays a bonus that grows with the
 * streak of full shifts on consecutive days.
 */
export type TaskKind =
  | "drill"
  | "collect"
  | "sell"
  | "sellRaw"
  | "earn"
  | "contract"
  | "storm"
  | "refine"
  | "overdrive"
  | "capHand"
  | "export"
  | "build";

export const SHIFT_SIZE = 5;
export const SHIFT_SWAPS = 1;
export const SHIFT_STREAK_CAP = 10;
/** Coins per task by rig level; the full-shift bonus is SHIFT_BONUS times this, plus 10% per streak day. */
export const SHIFT_REWARD = [25, 40, 80, 150, 300, 500, 800, 1_200];
export const SHIFT_BONUS = 3;

/**
 * Rig Foreman: a crew boss who runs the rig on rounds, online and while the game is closed. Free from
 * FOREMAN_FREE_LEVEL; below it he's hired for coins by the day. He works by the same rules as you: the
 * same storage, the same prices, the same contracts. His work earns no points and moves no Daily Shift
 * task, so the shift and the crew scores stay yours.
 */
export const FOREMAN_FREE_LEVEL = 6;
/** Coins for one day of the foreman, by rig level 1–5. Three days cost 2.5 days. */
export const FOREMAN_DAY = [150, 300, 600, 1_200, 2_500];
/** Seconds between rounds while you're playing, and while the game is closed. */
export const FOREMAN_ROUND = 180;
export const FOREMAN_ROUND_AWAY = 600;
/** While the game is closed he keeps the rig running this long, at Safe, without storms or blowouts. */
export const FOREMAN_AWAY_CAP = 6 * 60 * 60;
/** Chance he closes every valve in a storm; otherwise he gets two or three of four, like anyone. */
export const FOREMAN_BRACE = 0.85;

/**
 * Tanker Day: every TANKER_EVERY hours (on the UTC clock, so every rig sees the same ship) a tanker berths
 * at the rig for TANKER_STAY seconds and buys one product in bulk at a fixed premium over its base price.
 * Load what you have; fill the whole order for a bonus on top. The foreman leaves the tanker to you.
 */
export const TANKER_EVERY = 4;
export const TANKER_STAY = 20 * 60;
/** The premium is drawn between these, the same for everyone on that ship. */
export const TANKER_PREMIUM = [2, 2.5] as const;
/** Bonus for filling the whole order, as a share of what the order pays. */
export const TANKER_BONUS = 0.25;
export const TANKER_NAMES = ["MT Royal Crown", "MT Gulf Runner", "MT Salt Baron", "MT Northern Star", "MT Black Pearl", "MT Iron Tide"];

export const TASKS: Record<TaskKind, { target: (level: number) => number; label: (n: number, product?: Raw) => string; min?: number; max?: number }> = {
  drill: { target: (l) => 2 + Math.floor(l / 3), label: (n) => `Strike ${n} new wells`, max: 3 },
  collect: { target: (l) => 20 + 30 * l, label: (n) => `Collect ${n} bbl from your wells` },
  sell: { target: (l) => 20 + 30 * l, label: (n) => `Sell ${n} bbl on the market` },
  sellRaw: { target: (l) => 10 + 15 * l, label: (n, p) => `Sell ${n} bbl of ${PRODUCTS[p ?? "light"].name.toLowerCase()}` },
  earn: { target: (l) => [50, 120, 300, 700, 1_500, 2_500, 4_000, 6_000][l - 1], label: (n) => `Earn ${n.toLocaleString("en-US")} coins from sales and contracts` },
  contract: { target: (l) => (l < 4 ? 2 : 3), label: (n) => `Fill ${n} Dispatch contracts` },
  storm: { target: (l) => (l < 4 ? 1 : 2), label: (n) => (n === 1 ? "Hold the rig through a storm" : `Hold the rig through ${n} storms`) },
  refine: { target: (l) => 4 + 3 * l, label: (n) => `Refine ${n} bbl of diesel, jet fuel or LNG`, min: 2 },
  overdrive: { target: (l) => 60 + 15 * l, label: (n) => `Pump on Overdrive for ${n} seconds` },
  capHand: { target: () => 1, label: () => "Cap a blowout with the capping drill", min: 2 },
  export: { target: (l) => 20 + 20 * l, label: (n) => `Export ${n} bbl for XOM` },
  build: { target: () => 1, label: () => "Build or upgrade a refinery unit, or the rig", max: 5 },
};
