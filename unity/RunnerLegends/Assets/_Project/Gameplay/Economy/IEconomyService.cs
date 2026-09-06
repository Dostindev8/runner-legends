#nullable enable
namespace RunnerLegends.Gameplay.Economy
{
    public interface IEconomyService
    {
        int Coins { get; }
        int MaxCombo { get; }
        float ComboMultiplier { get; }
        float SuperCharge01 { get; }
        bool IsSuperReady { get; }

        void ResetRun();
        void AddCoin();
        void Tick(float dt);
        void BuffCombo(float multiplier, float seconds);
        bool TryConsumeSuper();

        int GetUpgradeLevel(UpgradeBranch branch);
        bool CanUpgrade(UpgradeBranch branch);
        bool TryUpgrade(UpgradeBranch branch);
    }
}
