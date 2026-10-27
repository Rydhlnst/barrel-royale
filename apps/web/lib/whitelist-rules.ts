// Whitelist rules shared by the page, the form and the API: points, tiers and
// input checks. Numbers are proposals, like the other bracketed figures.

export const POINTS_JOIN = 10;
export const POINTS_REFERRAL = 5;

/** Rank cut-offs at snapshot. */
export const tiers = [
  { name: "OG Roughneck", upTo: 500, perks: ["Guaranteed spot in the rig mint", "Closed alpha access", "OG badge in the game"] },
  { name: "Crew", upTo: 2500, perks: ["Whitelist mint window before public", "Alpha waitlist"] },
  { name: "Deckhand", upTo: Infinity, perks: ["First in line for the public mint", "Launch updates"] },
] as const;

export const tierFor = (rank: number) => tiers.find((t) => rank <= t.upTo)!.name;

export const patterns = {
  wallet: /^0x[0-9a-fA-F]{40}$/,
  x: /^@?[A-Za-z0-9_]{1,15}$/,
  email: /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/,
  code: /^[A-Z2-9]{6}$/,
};

export type Spot = { code: string; referrals: number; points: number; rank: number; total: number; tier: string };
