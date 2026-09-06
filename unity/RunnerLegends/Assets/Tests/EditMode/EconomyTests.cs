#nullable enable
using NUnit.Framework;
using RunnerLegends.Gameplay.Economy;

namespace RunnerLegends.Tests
{
    public sealed class EconomyTests
    {
        [Test]
        public void UpgradeTotals_MatchGDD_8_3()
        {
            Assert.AreEqual(2500, Sum(UpgradeTables.SpeedCosts));
            Assert.AreEqual(3000, Sum(UpgradeTables.ComboPowerCosts));
            Assert.AreEqual(3500, Sum(UpgradeTables.SuperRechargeCosts));
        }

        [Test]
        public void Upgrade_DeductsCoins_AndCapsAtLevel5()
        {
            var econ = new EconomyService();
            GiveCoins(econ, 10000);
            for (int i = 0; i < UpgradeTables.MaxLevel; i++)
                Assert.IsTrue(econ.TryUpgrade(UpgradeBranch.Speed), $"upgrade {i} should succeed");
            Assert.AreEqual(5, econ.GetUpgradeLevel(UpgradeBranch.Speed));
            Assert.IsFalse(econ.TryUpgrade(UpgradeBranch.Speed), "no upgrades past level 5 (no power creep)");
            Assert.AreEqual(10000 - 2500, econ.Coins);
        }

        [Test]
        public void Super_Requires_AtLeast_45s_WithoutCoins_GDD_8_2()
        {
            var econ = new EconomyService();
            econ.ResetRun();
            Step(econ, 44f);
            Assert.IsFalse(econ.IsSuperReady, "must not be ready before 45s");
            Step(econ, 2f);
            Assert.IsTrue(econ.IsSuperReady, "ready by ~45s of active play");
            Assert.IsTrue(econ.TryConsumeSuper());
            Assert.IsFalse(econ.IsSuperReady, "meter drains on use");
        }

        [Test]
        public void ComboMultiplier_Expires()
        {
            var econ = new EconomyService();
            econ.BuffCombo(2f, 2f);
            Assert.AreEqual(2f, econ.ComboMultiplier, 0.001f);
            Step(econ, 2.1f);
            Assert.AreEqual(1f, econ.ComboMultiplier, 0.001f);
        }

        private static int Sum(int[] a){ int s = 0; foreach (var x in a) s += x; return s; }
        private static void Step(IEconomyService e, float seconds){ float t = 0; while (t < seconds){ e.Tick(0.05f); t += 0.05f; } }
        private static void GiveCoins(IEconomyService e, int n){ for (int i = 0; i < n; i++) e.AddCoin(); }
    }
}
