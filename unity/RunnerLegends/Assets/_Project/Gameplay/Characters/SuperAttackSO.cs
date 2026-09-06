#nullable enable
using UnityEngine;

namespace RunnerLegends.Gameplay.Characters
{
    public enum SuperCategory { OffensiveArea, ExtremeMobility, TimeControl, Transformation }
    public enum SuperDifficulty { Low, Medium, High }

    /// <summary>
    /// Data-driven super attack (GDD 5 + 8.2). Balance caps are enforced in OnValidate
    /// so a designer can never author a value that breaks the fairness rules.
    /// </summary>
    [CreateAssetMenu(menuName = "Runner Legends/Super Attack", fileName = "Super_")]
    public sealed class SuperAttackSO : ScriptableObject
    {
        [SerializeField] private string _displayName = "Explosión Estelar";
        [SerializeField] private SuperCategory _category = SuperCategory.OffensiveArea;
        [SerializeField] private SuperDifficulty _difficulty = SuperDifficulty.Medium;

        [Header("Balance (GDD 8.2 hard caps)")]
        [SerializeField, Min(0f)] private float _baseDamage = 100f;
        [Tooltip("Combo bonus per stack. damage = base * (1 + 0.1 * combo). Fixed by GDD 8.2.")]
        [SerializeField] private float _comboDamageFactor = 0.1f;
        [Tooltip("Seconds of granted i-frames. GDD 8.2: <= 3s.")]
        [SerializeField, Range(0f, 3f)] private float _invincibilitySeconds = 2f;
        [Tooltip("Transformation duration. GDD 8.2: <= 5s.")]
        [SerializeField, Range(0f, 5f)] private float _effectDurationSeconds = 2f;
        [Tooltip("Min active gameplay before it can charge again. GDD 8.2: >= 45s.")]
        [SerializeField, Min(45f)] private float _chargeSeconds = 45f;
        [Tooltip("Extra move speed while active. GDD 8.2: <= 0.5 (50%).")]
        [SerializeField, Range(0f, 0.5f)] private float _speedBoostPct = 0f;
        [SerializeField, Min(1f)] private float _comboMultiplierGranted = 2f;

        public string DisplayName => _displayName;
        public SuperCategory Category => _category;
        public SuperDifficulty Difficulty => _difficulty;
        public float BaseDamage => _baseDamage;
        public float ComboDamageFactor => _comboDamageFactor;
        public float InvincibilitySeconds => _invincibilitySeconds;
        public float EffectDurationSeconds => _effectDurationSeconds;
        public float ChargeSeconds => _chargeSeconds;
        public float SpeedBoostPct => _speedBoostPct;
        public float ComboMultiplierGranted => _comboMultiplierGranted;

        private void OnValidate()
        {
            _invincibilitySeconds = Mathf.Clamp(_invincibilitySeconds, 0f, 3f);
            _effectDurationSeconds = Mathf.Clamp(_effectDurationSeconds, 0f, 5f);
            _chargeSeconds = Mathf.Max(45f, _chargeSeconds);
            _speedBoostPct = Mathf.Clamp(_speedBoostPct, 0f, 0.5f);
            _comboDamageFactor = 0.1f; // locked by GDD 8.2
        }
    }
}
