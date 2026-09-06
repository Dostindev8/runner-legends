#nullable enable
using System;
using RunnerLegends.Gameplay.Characters;

namespace RunnerLegends.Gameplay.Combat
{
    public sealed class CombatSystem : ICombatSystem
    {
        public const float MaxInvincibilitySeconds = 3f; // GDD 8.2 hard cap

        public float CalculateSuperDamage(SuperAttackSO super, int comboCount)
        {
            if (super == null) throw new ArgumentNullException(nameof(super));
            int combo = comboCount < 0 ? 0 : comboCount;
            return super.BaseDamage * (1f + super.ComboDamageFactor * combo);
        }

        public float ClampInvincibility(float requestedSeconds)
            => requestedSeconds < 0f ? 0f
             : requestedSeconds > MaxInvincibilitySeconds ? MaxInvincibilitySeconds
             : requestedSeconds;
    }
}
