// Names, links and addresses in one place. Play points at the current prototype;
// X is a placeholder until the account exists.

const addr = (v: string | undefined) => (v && /^0x[0-9a-fA-F]{40}$/.test(v) ? v : null);

export const site = {
  name: "Barrel Royale",
  token: "$ROYAL",
  reward: "XOM",
  tagline: "Pump crude. Earn Exxon.",
  url: "https://barrelroyale.io",
  title: "Barrel Royale · Pump crude. Earn Exxon.",
  description:
    "An offshore drilling game on Robinhood Chain. Drill wells, refine and sell barrels at prices that track the energy market, and claim weekly XOM stock tokens for the oil your rig produces.",
  links: {
    play: "/play",
    docs: "/docs",
    litepaper: "/litepaper",
    roadmap: "/roadmap",
    whitelist: "/whitelist",
    x: "#",
  },
  /**
   * The $ROYAL contract address, shown with a copy button. Empty until launch:
   * set NEXT_PUBLIC_ROYAL_CA (inlined at build time) and redeploy.
   */
  ca: addr(process.env.NEXT_PUBLIC_ROYAL_CA),
  explorer: "https://robinhoodchain.blockscout.com",
} as const;
