// The reward vault's rules, as the XOMRewardVault contract enforces them. The
// docs and the litepaper read these, so the pages and the contract say the same thing.

export const VAULT = {
  /** A week's rewards stay claimable this long, then return to the free balance. */
  claimWeeks: 12,
  /** Delay between scheduling and executing a withdrawal or a change to the export rate or quota. */
  timelockDays: 7,
  /** The most of the free balance the treasury can withdraw in any rolling window. */
  withdrawPct: 20,
  withdrawWindowDays: 30,
  /** The longest claims can be paused; paused time is added to every claim window. */
  pauseDays: 14,
} as const;
