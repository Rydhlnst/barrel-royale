// Names, links and addresses in one place.

const addr = (v: string | undefined) => (v && /^0x[0-9a-fA-F]{40}$/.test(v) ? v : null);

export const site = {
  name: "Barrel Royale",
  token: "$ROYAL",
  reward: "XOM",
  tagline: "Pump crude. Earn Exxon.",
  url: "https://barrelroyale.io",
  title: "Barrel Royale · Pump crude. Earn Exxon.",
  description:
    "An offshore drilling game on Robinhood Chain. Drill wells, refine and sell barrels at prices that track the energy market, and export your barrels for XOM stock tokens you can claim any time.",
  links: {
    play: "/play",
    docs: "/docs",
    litepaper: "/litepaper",
    roadmap: "/roadmap",
    whitelist: "/whitelist",
    x: "https://x.com/barrelroyale",
  },
  /**
   * The $ROYAL contract address, shown with a copy button. Empty until launch:
   * set NEXT_PUBLIC_ROYAL_CA (inlined at build time) and redeploy.
   */
  ca: addr(process.env.NEXT_PUBLIC_ROYAL_CA),
  /** Once the CA is set, /play opens for wallets holding at least this much $ROYAL (NEXT_PUBLIC_ROYAL_MIN_HOLD). */
  minHold: Number(process.env.NEXT_PUBLIC_ROYAL_MIN_HOLD) > 0 ? Number(process.env.NEXT_PUBLIC_ROYAL_MIN_HOLD) : 1_000_000,
  /** Where players get $ROYAL, such as the launchpad page (NEXT_PUBLIC_ROYAL_BUY_URL). Falls back to the token on the explorer. */
  buyUrl: process.env.NEXT_PUBLIC_ROYAL_BUY_URL || null,
  explorer: "https://robinhoodchain.blockscout.com",
} as const;
