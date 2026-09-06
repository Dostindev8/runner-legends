#nullable enable
using System;

namespace RunnerLegends.Gameplay.Portals
{
    /// <summary>
    /// Purpose: Portal enter/exit with anti-reentry cooldown; persists run player state (never resets the run).
    /// Dependencies: <see cref="PortalDefinition"/>, <see cref="PortalKind"/>.
    /// Date: 2026-08-10
    /// </summary>
    public sealed class PortalController
    {
        private readonly PortalDefinition _definition;
        private float _cooldownRemaining;
        private bool _isInside;
        private PortalPlayerSnapshot? _persisted;

        public PortalDefinition Definition => _definition;
        public bool IsInside => _isInside;
        public bool IsOnCooldown => _cooldownRemaining > 0f;
        public float CooldownRemaining => _cooldownRemaining;
        public PortalPlayerSnapshot? PersistedPlayerState => _persisted;

        public event Action<PortalEnterResult>? Entered;
        public event Action<PortalExitResult>? Exited;

        public PortalController(PortalDefinition definition)
        {
            _definition = definition ?? throw new ArgumentNullException(nameof(definition));
        }

        public void Tick(float dt)
        {
            if (dt <= 0f) return;
            if (_cooldownRemaining > 0f)
                _cooldownRemaining = Math.Max(0f, _cooldownRemaining - dt);
        }

        /// <summary>
        /// Attempts to enter the portal. Persists the provided player snapshot for the destination
        /// world. Does <b>not</b> reset coins/combo/HP/run distance — callers must keep the same run services.
        /// </summary>
        public bool TryEnter(in PortalPlayerSnapshot playerState, out PortalEnterResult result)
        {
            if (_isInside)
            {
                result = new PortalEnterResult(false, "Already inside portal.", _definition, playerState);
                return false;
            }

            if (_cooldownRemaining > 0f)
            {
                result = new PortalEnterResult(false, "Anti-reentry cooldown active.", _definition, playerState);
                return false;
            }

            _isInside = true;
            _persisted = playerState;
            _cooldownRemaining = _definition.CooldownSeconds;
            result = new PortalEnterResult(true, null, _definition, playerState);
            Entered?.Invoke(result);
            return true;
        }

        /// <summary>Exits the portal and returns the persisted snapshot so the run continues uninterrupted.</summary>
        public bool TryExit(out PortalExitResult result)
        {
            if (!_isInside)
            {
                result = new PortalExitResult(false, "Not inside portal.", _definition, _persisted);
                return false;
            }

            _isInside = false;
            var snap = _persisted;
            result = new PortalExitResult(true, null, _definition, snap);
            Exited?.Invoke(result);
            return true;
        }
    }

    /// <summary>
    /// Run-scoped player state carried across worlds. Intentionally excludes a "reset run" flag —
    /// portal travel must not wipe economy or combat progress mid-run.
    /// </summary>
    public readonly struct PortalPlayerSnapshot
    {
        public readonly int Hp;
        public readonly int Coins;
        public readonly float SuperCharge01;
        public readonly float ComboMultiplier;
        public readonly float RunDistance;
        public readonly string CharacterId;

        public PortalPlayerSnapshot(
            int hp,
            int coins,
            float superCharge01,
            float comboMultiplier,
            float runDistance,
            string characterId)
        {
            Hp = hp;
            Coins = coins;
            SuperCharge01 = superCharge01;
            ComboMultiplier = comboMultiplier;
            RunDistance = runDistance;
            CharacterId = characterId ?? string.Empty;
        }
    }

    public readonly struct PortalEnterResult
    {
        public readonly bool Success;
        public readonly string? FailureReason;
        public readonly PortalDefinition Definition;
        public readonly PortalPlayerSnapshot PlayerState;

        public PortalEnterResult(bool success, string? failureReason, PortalDefinition definition, PortalPlayerSnapshot playerState)
        {
            Success = success;
            FailureReason = failureReason;
            Definition = definition;
            PlayerState = playerState;
        }
    }

    public readonly struct PortalExitResult
    {
        public readonly bool Success;
        public readonly string? FailureReason;
        public readonly PortalDefinition Definition;
        public readonly PortalPlayerSnapshot? PlayerState;

        public PortalExitResult(bool success, string? failureReason, PortalDefinition definition, PortalPlayerSnapshot? playerState)
        {
            Success = success;
            FailureReason = failureReason;
            Definition = definition;
            PlayerState = playerState;
        }
    }
}
