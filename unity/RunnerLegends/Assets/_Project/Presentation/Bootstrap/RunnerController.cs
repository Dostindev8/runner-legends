#nullable enable
using RunnerLegends.Core.Events;
using RunnerLegends.Core.Input;
using RunnerLegends.Core.Time;
using RunnerLegends.Gameplay.Characters;
using RunnerLegends.Gameplay.Combat;
using RunnerLegends.Gameplay.Economy;
using RunnerLegends.Gameplay.Movement;
using UnityEngine;

namespace RunnerLegends.Presentation.Bootstrap
{
    /// <summary>
    /// Thin Unity glue: advances the pure gameplay systems each frame and reflects state
    /// onto the transform. Holds no business rules itself (those live in the tested
    /// Gameplay layer). Injected by <see cref="GameInstaller"/>.
    /// </summary>
    public sealed class RunnerController : MonoBehaviour
    {
        [SerializeField] private Transform _playerRoot = null!;
        [SerializeField] private float _groundY = 0f;

        private IGameClock _clock = null!;
        private IInputReader _input = null!;
        private IEconomyService _economy = null!;
        private ICombatSystem _combat = null!;
        private CharacterStatsSO _character = null!;
        private IEventBus _bus = null!;
        private PlayerMovementStateMachine _fsm = null!;

        private bool _isGroundBelow = true;
        private float _iframe;

        public int Hp { get; private set; }

        public void Construct(IGameClock clock, IInputReader input, IEconomyService economy,
            ICombatSystem combat, CharacterStatsSO character, IEventBus bus)
        {
            _clock = clock; _input = input; _economy = economy; _combat = combat;
            _character = character; _bus = bus;
            _fsm = new PlayerMovementStateMachine(_character.ToMovementConfig(), _groundY, _bus);
            Hp = _character.MaxHp;
            _economy.ResetRun();
        }

        /// <summary>Called by the world view to signal a pit under the player.</summary>
        public void SetGroundBelow(bool value) => _isGroundBelow = value;

        public void TickFrame()
        {
            float dt = _clock.DeltaTime; // 0 during stop-frames

            _fsm.Tick(dt, _input, _isGroundBelow);
            _economy.Tick(dt);
            if (_iframe > 0f) _iframe -= dt;

            if (_input.ConsumeSuperPressed()) TryFireSuper();

            var p = _playerRoot.localPosition;
            _playerRoot.localPosition = new Vector3(p.x, _fsm.PositionY, p.z);
        }

        public void TakeDamage()
        {
            if (_iframe > 0f) return;
            var super = _character.SuperAttack;
            _iframe = _combat.ClampInvincibility(super != null ? super.InvincibilitySeconds : 1f);
            Hp--;
            _clock.Freeze(0.06f); // stop-frame on hit
            _bus.Publish(new PlayerHurtEvent(Hp));
            if (Hp <= 0) _bus.Publish(new PlayerDiedEvent(false));
        }

        private void TryFireSuper()
        {
            var super = _character.SuperAttack;
            if (super == null || !_economy.TryConsumeSuper()) return;
            _ = _combat.CalculateSuperDamage(super, _economy.MaxCombo); // applied to enemies by combat view
            _economy.BuffCombo(super.ComboMultiplierGranted, super.EffectDurationSeconds);
            _clock.Freeze(0.09f);
            _bus.Publish(new SuperActivatedEvent(0));
        }
    }
}
