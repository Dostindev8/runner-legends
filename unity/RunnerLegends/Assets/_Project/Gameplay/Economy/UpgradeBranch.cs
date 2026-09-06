#nullable enable
namespace RunnerLegends.Gameplay.Economy
{
    /// <summary>Character upgrade branches (GDD 8.3). Hard level cap prevents power creep.</summary>
    public enum UpgradeBranch { Speed, ComboPower, SuperRecharge }

    public static class UpgradeTables
    {
        public const int MaxLevel = 5;

        // Per-level coin costs. Sums match GDD 8.3 totals exactly (verified by tests):
        // Speed 2500, ComboPower 3000, SuperRecharge 3500.
        public static readonly int[] SpeedCosts        = { 300, 400, 500, 650, 650 };
        public static readonly int[] ComboPowerCosts   = { 400, 500, 600, 700, 800 };
        public static readonly int[] SuperRechargeCosts= { 500, 600, 700, 800, 900 };

        public static int[] CostsFor(UpgradeBranch b) => b switch
        {
            UpgradeBranch.Speed => SpeedCosts,
            UpgradeBranch.ComboPower => ComboPowerCosts,
            _ => SuperRechargeCosts
        };

        /// <summary>Coin cost to go from <paramref name="currentLevel"/> to +1 (0-indexed level).</summary>
        public static int NextLevelCost(UpgradeBranch b, int currentLevel)
        {
            var costs = CostsFor(b);
            return currentLevel < 0 || currentLevel >= costs.Length ? int.MaxValue : costs[currentLevel];
        }
    }
}
