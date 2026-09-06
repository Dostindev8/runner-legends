#nullable enable
using NUnit.Framework;
using RunnerLegends.Gameplay.Characters;
using RunnerLegends.Gameplay.Combat;
using UnityEngine;

namespace RunnerLegends.Tests
{
    public sealed class CombatDamageTests
    {
        // Default SuperAttackSO ships with _baseDamage = 100 (see SuperAttackSO).
        private static SuperAttackSO MakeSuper() => ScriptableObject.CreateInstance<SuperAttackSO>();

        [Test]
        public void Damage_NoCombo_EqualsBase()
        {
            var combat = new CombatSystem();
            var super = MakeSuper();
            Assert.AreEqual(super.BaseDamage, combat.CalculateSuperDamage(super, 0), 0.001f);
        }

        [Test]
        public void Damage_ScalesWithCombo_GDD_8_2()
        {
            var combat = new CombatSystem();
            var super = MakeSuper();
            // base * (1 + 0.1 * combo); combo 10 => 2x
            Assert.AreEqual(200f, combat.CalculateSuperDamage(super, 10), 0.001f);
            Assert.AreEqual(150f, combat.CalculateSuperDamage(super, 5), 0.001f);
        }

        [Test]
        public void Invincibility_IsClampedTo3Seconds()
        {
            var combat = new CombatSystem();
            Assert.AreEqual(3f, combat.ClampInvincibility(5f), 0.001f);
            Assert.AreEqual(0f, combat.ClampInvincibility(-1f), 0.001f);
            Assert.AreEqual(2f, combat.ClampInvincibility(2f), 0.001f);
        }
    }
}
