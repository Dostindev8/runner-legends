#nullable enable
using System;

namespace RunnerLegends.Gameplay.Difficulty
{
    /// <summary>
    /// Purpose: Applies a difficulty profile to runtime multipliers; gates Legendary behind Expert 3-star.
    /// Dependencies: <see cref="DifficultyId"/>, <see cref="DifficultyProfileSO"/> (optional).
    /// Date: 2026-08-10
    /// </summary>
    public sealed class DifficultyManager
    {
        public DifficultyId ActiveId { get; private set; } = DifficultyId.Normal;
        public DifficultyMultipliers Active { get; private set; } = DifficultyMultipliers.NormalDefaults;

        /// <summary>Legendary unlocks only after clearing Expert with a 3-star rating (GDD v3.0).</summary>
        public static bool IsLegendaryUnlocked(int expertBestStars)
            => expertBestStars >= 3;

        public static bool IsUnlocked(DifficultyId id, int expertBestStars)
        {
            if (id == DifficultyId.Legendary)
                return IsLegendaryUnlocked(expertBestStars);
            return true;
        }

        public bool TryApply(DifficultyProfileSO profile, int expertBestStars, out string? failureReason)
        {
            if (profile == null)
            {
                failureReason = "Profile is null.";
                return false;
            }

            if (!IsUnlocked(profile.Id, expertBestStars))
            {
                failureReason = "Legendary requires Expert 3-star.";
                return false;
            }

            ApplyUnlocked(profile);
            failureReason = null;
            return true;
        }

        /// <summary>Applies multipliers from a profile that is already known to be unlocked (tests / installer).</summary>
        public void ApplyUnlocked(DifficultyProfileSO profile)
        {
            if (profile == null) throw new ArgumentNullException(nameof(profile));
            ActiveId = profile.Id;
            Active = DifficultyMultipliers.FromProfile(profile);
        }

        public void ApplyUnlocked(in DifficultyMultipliers multipliers, DifficultyId id)
        {
            ActiveId = id;
            Active = multipliers;
        }
    }

    /// <summary>Runtime bag of table 7.1 values applied to scroll / feel / spawn / combat / economy.</summary>
    public readonly struct DifficultyMultipliers
    {
        public readonly float Scroll;
        public readonly float Coyote;
        public readonly float Buffer;
        public readonly float Density;
        public readonly float EnemyAtk;
        public readonly float CoinReward;

        public DifficultyMultipliers(
            float scroll,
            float coyote,
            float buffer,
            float density,
            float enemyAtk,
            float coinReward)
        {
            Scroll = scroll;
            Coyote = DifficultyProfileSO.ClampFeelWindow(coyote);
            Buffer = DifficultyProfileSO.ClampFeelWindow(buffer);
            Density = density;
            EnemyAtk = enemyAtk;
            CoinReward = coinReward;
        }

        public static DifficultyMultipliers NormalDefaults => new(
            scroll: 1f,
            coyote: 0.10f,
            buffer: 0.10f,
            density: 1f,
            enemyAtk: 1f,
            coinReward: 1f);

        public static DifficultyMultipliers FromProfile(DifficultyProfileSO profile)
        {
            if (profile == null) throw new ArgumentNullException(nameof(profile));
            return new DifficultyMultipliers(
                scroll: profile.ScrollSpeedMultiplier,
                coyote: profile.CoyoteTime,
                buffer: profile.JumpBufferTime,
                density: profile.SpawnDensityMultiplier,
                enemyAtk: profile.EnemyAttackMultiplier,
                coinReward: profile.CoinRewardMultiplier);
        }
    }
}
