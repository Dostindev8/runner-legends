#nullable enable
using System;
using RunnerLegends.Core.Events;

namespace RunnerLegends.Gameplay.Economy
{
    /// <summary>
    /// Run-scoped economy + persistent upgrades (GDD 8.3 / 9). Pure C#: no UnityEngine,
    /// fully unit-tested. Super charge floor guarantees the GDD 8.2 minimum charge time.
    /// </summary>
    public sealed class EconomyService : IEconomyService
    {
        private readonly IEventBus? _bus;
        private readonly float _chargePerCoin;
        private readonly float _chargePerSecond;
        private readonly int[] _levels = new int[3];

        private float _comboTimer;

        public int Coins { get; private set; }
        public int MaxCombo { get; private set; } = 1;
        public float ComboMultiplier { get; private set; } = 1f;
        public float SuperCharge01 { get; private set; }
        public bool IsSuperReady => SuperCharge01 >= 1f;

        // Default per-second rate = 1/45 so the super needs >= 45s of active play with no
        // coins (GDD 8.2 floor). Coins add a small earned boost on top.
        public EconomyService(IEventBus? bus = null, float chargePerCoin = 0.01f, float chargePerSecond = 1f / 45f)
        {
            _bus = bus;
            _chargePerCoin = chargePerCoin;
            _chargePerSecond = chargePerSecond;
        }

        public void ResetRun()
        {
            Coins = 0; SuperCharge01 = 0f; ComboMultiplier = 1f; MaxCombo = 1; _comboTimer = 0f;
        }

        public void AddCoin()
        {
            Coins += (int)Math.Round(ComboMultiplier);
            SuperCharge01 = Clamp01(SuperCharge01 + _chargePerCoin);
            _bus?.Publish(new CoinCollectedEvent(Coins));
        }

        public void Tick(float dt)
        {
            if (dt <= 0f) return;
            SuperCharge01 = Clamp01(SuperCharge01 + _chargePerSecond * dt);
            if (_comboTimer > 0f)
            {
                _comboTimer -= dt;
                if (_comboTimer <= 0f) ComboMultiplier = 1f;
            }
        }

        public void BuffCombo(float multiplier, float seconds)
        {
            if (multiplier < 1f) multiplier = 1f;
            ComboMultiplier = multiplier;
            _comboTimer = seconds;
            if (multiplier > MaxCombo) MaxCombo = (int)multiplier;
        }

        public bool TryConsumeSuper()
        {
            if (!IsSuperReady) return false;
            SuperCharge01 = 0f;
            return true;
        }

        public int GetUpgradeLevel(UpgradeBranch branch) => _levels[(int)branch];

        public bool CanUpgrade(UpgradeBranch branch)
        {
            int lvl = _levels[(int)branch];
            return lvl < UpgradeTables.MaxLevel && Coins >= UpgradeTables.NextLevelCost(branch, lvl);
        }

        public bool TryUpgrade(UpgradeBranch branch)
        {
            if (!CanUpgrade(branch)) return false;
            int lvl = _levels[(int)branch];
            Coins -= UpgradeTables.NextLevelCost(branch, lvl);
            _levels[(int)branch] = lvl + 1;
            return true;
        }

        private static float Clamp01(float v) => v < 0f ? 0f : v > 1f ? 1f : v;
    }
}
