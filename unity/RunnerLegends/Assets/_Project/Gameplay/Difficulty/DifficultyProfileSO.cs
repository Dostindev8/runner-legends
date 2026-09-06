#nullable enable
using UnityEngine;

namespace RunnerLegends.Gameplay.Difficulty
{
    /// <summary>
    /// Purpose: ScriptableObject for GDD table 7.1 difficulty fields (designer-tunable).
    /// Dependencies: <see cref="DifficultyId"/>, UnityEngine.ScriptableObject.
    /// Date: 2026-08-10
    /// </summary>
    [CreateAssetMenu(menuName = "Runner Legends/Difficulty Profile", fileName = "Diff_")]
    public sealed class DifficultyProfileSO : ScriptableObject
    {
        /// <summary>Floor for coyote / jump-buffer feel windows (40 ms).</summary>
        public const float MinFeelWindowSeconds = 0.04f;

        [SerializeField] private DifficultyId _id = DifficultyId.Normal;
        [SerializeField] private string _displayName = "Normal";

        [Header("Table 7.1 — feel windows (seconds)")]
        [SerializeField] private float _coyoteTime = 0.10f;
        [SerializeField] private float _jumpBufferTime = 0.10f;

        [Header("Table 7.1 — multipliers")]
        [SerializeField] private float _scrollSpeedMultiplier = 1f;
        [SerializeField] private float _spawnDensityMultiplier = 1f;
        [SerializeField] private float _enemyAttackMultiplier = 1f;
        [SerializeField] private float _coinRewardMultiplier = 1f;

        public DifficultyId Id => _id;
        public string DisplayName => _displayName;
        public float CoyoteTime => _coyoteTime;
        public float JumpBufferTime => _jumpBufferTime;
        public float ScrollSpeedMultiplier => _scrollSpeedMultiplier;
        public float SpawnDensityMultiplier => _spawnDensityMultiplier;
        public float EnemyAttackMultiplier => _enemyAttackMultiplier;
        public float CoinRewardMultiplier => _coinRewardMultiplier;

        /// <summary>Engine-free clamp used by <see cref="OnValidate"/> and EditMode tests.</summary>
        public static float ClampFeelWindow(float seconds)
            => seconds < MinFeelWindowSeconds ? MinFeelWindowSeconds : seconds;

        /// <summary>
        /// Runtime / EditMode helper to populate table 7.1 fields (inspector remains the designer path).
        /// </summary>
        public void Configure(
            DifficultyId id,
            string displayName,
            float coyoteTime,
            float jumpBufferTime,
            float scrollSpeedMultiplier,
            float spawnDensityMultiplier,
            float enemyAttackMultiplier,
            float coinRewardMultiplier)
        {
            _id = id;
            _displayName = displayName ?? string.Empty;
            _coyoteTime = coyoteTime;
            _jumpBufferTime = jumpBufferTime;
            _scrollSpeedMultiplier = scrollSpeedMultiplier;
            _spawnDensityMultiplier = spawnDensityMultiplier;
            _enemyAttackMultiplier = enemyAttackMultiplier;
            _coinRewardMultiplier = coinRewardMultiplier;
            OnValidate();
        }

        private void OnValidate()
        {
            _coyoteTime = ClampFeelWindow(_coyoteTime);
            _jumpBufferTime = ClampFeelWindow(_jumpBufferTime);
            _scrollSpeedMultiplier = Mathf.Max(0.01f, _scrollSpeedMultiplier);
            _spawnDensityMultiplier = Mathf.Max(0.01f, _spawnDensityMultiplier);
            _enemyAttackMultiplier = Mathf.Max(0.01f, _enemyAttackMultiplier);
            _coinRewardMultiplier = Mathf.Max(0.01f, _coinRewardMultiplier);
        }
    }
}
