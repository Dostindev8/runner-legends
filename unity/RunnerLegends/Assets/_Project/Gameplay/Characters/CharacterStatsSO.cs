#nullable enable
using RunnerLegends.Gameplay.Movement;
using UnityEngine;

namespace RunnerLegends.Gameplay.Characters
{
    /// <summary>
    /// Per-character tuning (GDD 5 + 8.1). Designers tune balance here without touching
    /// code (GDD requirement). Produces an engine-free <see cref="MovementConfig"/> so
    /// the movement FSM stays unit-testable.
    /// </summary>
    [CreateAssetMenu(menuName = "Runner Legends/Character Stats", fileName = "Char_")]
    public sealed class CharacterStatsSO : ScriptableObject
    {
        [SerializeField] private string _characterId = "kori_voltz";
        [SerializeField] private string _displayName = "Kori Voltz";

        [Header("Base stats (GDD 8.1, scale 1-5)")]
        [SerializeField, Range(1, 5)] private int _speed = 3;
        [SerializeField, Range(1, 5)] private int _jump = 3;
        [SerializeField, Range(1, 5)] private int _comboPower = 4;

        [Header("Movement feel (GDD 3.1)")]
        [SerializeField] private float _gravity = 2050f;
        [SerializeField] private float _baseJumpVelocity = 790f;
        [SerializeField, Range(0f, 1f)] private float _jumpCutMultiplier = 0.42f;
        [SerializeField] private float _coyoteTime = 0.10f;      // GDD: 100ms
        [SerializeField] private float _jumpBufferTime = 0.10f;  // GDD: 100ms
        [SerializeField] private float _runSpeedStart = 6.5f;
        [SerializeField] private float _runSpeedMax = 11f;
        [SerializeField, Min(1)] private int _maxHp = 3;

        [SerializeField] private SuperAttackSO? _superAttack;

        public string CharacterId => _characterId;
        public string DisplayName => _displayName;
        public int Speed => _speed;
        public int Jump => _jump;
        public int ComboPower => _comboPower;
        public SuperAttackSO? SuperAttack => _superAttack;
        public int MaxHp => _maxHp;

        public MovementConfig ToMovementConfig()
        {
            // Jump stat lightly scales jump height (feel per archetype).
            float jumpMul = 1f + (_jump - 3) * 0.06f;
            return new MovementConfig(
                gravity: _gravity,
                jumpVelocity: _baseJumpVelocity * jumpMul,
                jumpCutMultiplier: _jumpCutMultiplier,
                coyoteTime: _coyoteTime,
                jumpBufferTime: _jumpBufferTime,
                maxHp: _maxHp);
        }

        private void OnValidate()
        {
            _coyoteTime = Mathf.Max(0f, _coyoteTime);
            _jumpBufferTime = Mathf.Max(0f, _jumpBufferTime);
            _runSpeedMax = Mathf.Max(_runSpeedMax, _runSpeedStart);
        }
    }
}
