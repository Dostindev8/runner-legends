#nullable enable
using NUnit.Framework;
using RunnerLegends.Gameplay.Difficulty;
using UnityEngine;

namespace RunnerLegends.Tests
{
    /// <summary>
    /// Purpose: Guard GDD table 7.1 feel floors and Legendary unlock gate.
    /// Dependencies: NUnit, DifficultyProfileSO, DifficultyManager.
    /// Date: 2026-08-10
    /// </summary>
    public sealed class DifficultyProfileTests
    {
        [Test]
        public void Coyote_NeverBelow_40ms()
        {
            Assert.AreEqual(0.04f, DifficultyProfileSO.MinFeelWindowSeconds, 0.0001f);
            Assert.AreEqual(0.04f, DifficultyProfileSO.ClampFeelWindow(0f), 0.0001f);
            Assert.AreEqual(0.04f, DifficultyProfileSO.ClampFeelWindow(0.01f), 0.0001f);
            Assert.AreEqual(0.04f, DifficultyProfileSO.ClampFeelWindow(0.039f), 0.0001f);
            Assert.AreEqual(0.10f, DifficultyProfileSO.ClampFeelWindow(0.10f), 0.0001f);
        }

        [Test]
        public void Buffer_NeverBelow_40ms_ViaOnValidatePath()
        {
            var so = ScriptableObject.CreateInstance<DifficultyProfileSO>();
            so.Configure(
                DifficultyId.Hard, "Hard",
                coyoteTime: 0.01f, jumpBufferTime: 0.02f,
                scrollSpeedMultiplier: 1.1f, spawnDensityMultiplier: 1.2f,
                enemyAttackMultiplier: 1.25f, coinRewardMultiplier: 1.1f);

            Assert.GreaterOrEqual(so.CoyoteTime, 0.04f);
            Assert.GreaterOrEqual(so.JumpBufferTime, 0.04f);
            Object.DestroyImmediate(so);
        }

        [Test]
        public void DifficultyMultipliers_ClampCoyoteAndBuffer()
        {
            var m = new DifficultyMultipliers(
                scroll: 1f, coyote: 0.01f, buffer: 0.02f,
                density: 1f, enemyAtk: 1f, coinReward: 1f);
            Assert.GreaterOrEqual(m.Coyote, 0.04f);
            Assert.GreaterOrEqual(m.Buffer, 0.04f);
        }

        [Test]
        public void Legendary_UnlockGate_RequiresExpertThreeStar()
        {
            Assert.IsFalse(DifficultyManager.IsLegendaryUnlocked(0));
            Assert.IsFalse(DifficultyManager.IsLegendaryUnlocked(2));
            Assert.IsTrue(DifficultyManager.IsLegendaryUnlocked(3));
            Assert.IsTrue(DifficultyManager.IsLegendaryUnlocked(4));

            Assert.IsFalse(DifficultyManager.IsUnlocked(DifficultyId.Legendary, expertBestStars: 2));
            Assert.IsTrue(DifficultyManager.IsUnlocked(DifficultyId.Legendary, expertBestStars: 3));
            Assert.IsTrue(DifficultyManager.IsUnlocked(DifficultyId.Expert, expertBestStars: 0));
        }

        [Test]
        public void TryApply_Legendary_Fails_WithoutExpertThreeStar()
        {
            var so = CreateLegendaryProfile();
            var mgr = new DifficultyManager();
            bool ok = mgr.TryApply(so, expertBestStars: 2, out string? reason);
            Assert.IsFalse(ok);
            Assert.IsNotNull(reason);
            Assert.AreEqual(DifficultyId.Normal, mgr.ActiveId);
            Object.DestroyImmediate(so);
        }

        [Test]
        public void TryApply_Legendary_Succeeds_WithExpertThreeStar()
        {
            var so = CreateLegendaryProfile();
            var mgr = new DifficultyManager();
            bool ok = mgr.TryApply(so, expertBestStars: 3, out string? reason);
            Assert.IsTrue(ok);
            Assert.IsNull(reason);
            Assert.AreEqual(DifficultyId.Legendary, mgr.ActiveId);
            Assert.GreaterOrEqual(mgr.Active.Coyote, 0.04f);
            Object.DestroyImmediate(so);
        }

        private static DifficultyProfileSO CreateLegendaryProfile()
        {
            var so = ScriptableObject.CreateInstance<DifficultyProfileSO>();
            so.Configure(
                DifficultyId.Legendary, "Legendary",
                coyoteTime: 0.04f, jumpBufferTime: 0.04f,
                scrollSpeedMultiplier: 1.5f, spawnDensityMultiplier: 1.6f,
                enemyAttackMultiplier: 1.75f, coinRewardMultiplier: 1.5f);
            return so;
        }
    }
}
