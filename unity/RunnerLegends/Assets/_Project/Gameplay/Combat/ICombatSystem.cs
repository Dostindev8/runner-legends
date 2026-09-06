#nullable enable
using RunnerLegends.Gameplay.Characters;

namespace RunnerLegends.Gameplay.Combat
{
    public interface ICombatSystem
    {
        /// <summary>GDD 8.2: damage = base * (1 + 0.1 * comboCount).</summary>
        float CalculateSuperDamage(SuperAttackSO super, int comboCount);
        /// <summary>GDD 8.2: granted i-frames are always clamped to a 3s ceiling.</summary>
        float ClampInvincibility(float requestedSeconds);
    }
}
