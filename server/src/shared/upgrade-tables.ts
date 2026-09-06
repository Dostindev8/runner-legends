/**
 * Server copy of the upgrade economy (GDD 8.3). MUST stay in sync with the Unity
 * UpgradeTables.cs — both derive from the same GDD numbers. Totals: 2500/3000/3500.
 */
export type UpgradeBranch = 'speed' | 'comboPower' | 'superRecharge';

export const UPGRADE_COSTS: Record<UpgradeBranch, number[]> = {
  speed: [300, 400, 500, 650, 650],
  comboPower: [400, 500, 600, 700, 800],
  superRecharge: [500, 600, 700, 800, 900],
};

export const MAX_UPGRADE_LEVEL = 5;

export function nextLevelCost(branch: UpgradeBranch, currentLevel: number): number {
  const costs = UPGRADE_COSTS[branch];
  return currentLevel < 0 || currentLevel >= costs.length ? Number.POSITIVE_INFINITY : costs[currentLevel];
}
