// The Oil Bonus rules both the browser and the server read: the message a wallet signs to join the queue,
// and the states the panel shows. The amount itself is OIL_BONUS in lib/game/content.ts.

export const bonusMessage = (wallet: string, issued: string) => `Sign up for the Barrel Royale Oil Bonus\n\nWallet: ${wallet.toLowerCase()}\nIssued: ${issued}`;

export type BonusStatus =
  /** not signed up yet */
  | { state: "open" }
  /** in line; `place` is how many signed-up wallets are ahead, plus one */
  | { state: "queued"; place: number }
  /** in a round the multisig hasn't posted yet */
  | { state: "posting"; week: number }
  /** posted; claims open at `opensAt` */
  | { state: "posted"; week: number; opensAt: number }
  /** claim it now with this amount and proof */
  | { state: "claimable"; week: number; amount: string; proof: string[] }
  | { state: "claimed"; week: number }
  /** the round's 12-week claim window ran out */
  | { state: "expired"; week: number };
