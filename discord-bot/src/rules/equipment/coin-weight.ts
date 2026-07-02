export const COINS_PER_POUND = 10;

// Source: OSRIC coin encumbrance convention. TODO(osric-pdf): verify final DRG1e/OSRIC coin-weight rule before deployment handout.
export function coinWeight(coins: Record<string, unknown>): number {
  const totalCoins = ["pp", "gp", "ep", "sp", "cp"].reduce((total, coin) => total + Number(coins[coin] ?? 0), 0);
  return totalCoins / COINS_PER_POUND;
}
