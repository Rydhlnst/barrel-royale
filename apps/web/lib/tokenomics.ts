// RigUpgrader's class costs, as the docs and litepaper quote them.

/** Cumulative $ROYAL cost of each class from Jack-up; holders pay only the difference. */
export const CLASS_COSTS = [
  { name: "Jack-up", mult: "1.00×", cost: 0 },
  { name: "Semi-sub", mult: "1.25×", cost: 2_000 },
  { name: "Drillship", mult: "1.50×", cost: 5_000 },
  { name: "Ultra-deepwater", mult: "2.00×", cost: 12_000 },
] as const;

