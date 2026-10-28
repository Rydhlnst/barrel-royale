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
  { cost: 100, slots: 8, storage: 100 },
  { cost: 260, slots: 10, storage: 140 },
  { cost: 600, slots: 12, storage: 180 },
  { cost: 1200, slots: 12, storage: 240 },
  { cost: 2000, slots: 12, storage: 320 },
  { cost: 3200, slots: 12, storage: 420 },
  { cost: 5000, slots: 12, storage: 540 },
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
