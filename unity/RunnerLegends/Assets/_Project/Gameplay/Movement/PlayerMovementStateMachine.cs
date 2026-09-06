#nullable enable
using System;
using RunnerLegends.Core.Events;
using RunnerLegends.Core.Input;

namespace RunnerLegends.Gameplay.Movement
{
    /// <summary>
    /// Explicit vertical movement FSM implementing GDD 3.1 game feel: coyote time,
    /// jump buffering and variable-height jump. Pure C# (no UnityEngine) so it can be
    /// unit-tested frame-by-frame (see MovementStateMachineTests). Convention: Y grows
    /// downward is NOT used here — Y grows upward, ground plane at GroundY, feet = PositionY.
    /// </summary>
    public sealed class PlayerMovementStateMachine
    {
        private readonly MovementConfig _cfg;
        private readonly IEventBus? _bus;

        private float _coyoteTimer;
        private float _bufferTimer;
        private bool _wasAirborneLastTick;

        public MovementState State { get; private set; } = MovementState.Grounded;
        public float PositionY { get; private set; }       // feet height above world origin
        public float VelocityY { get; private set; }
        public bool OnGround { get; private set; } = true;
        public float GroundY { get; }

        public PlayerMovementStateMachine(in MovementConfig cfg, float groundY = 0f, IEventBus? bus = null)
        {
            _cfg = cfg;
            GroundY = groundY;
            PositionY = groundY;
            _bus = bus;
        }

        public void ResetTo(float groundY)
        {
            PositionY = groundY;
            VelocityY = 0f;
            State = MovementState.Grounded;
            OnGround = true;
            _coyoteTimer = 0f;
            _bufferTimer = 0f;
            _wasAirborneLastTick = false;
        }

        /// <param name="isGroundBelow">World tells us if solid ground is under the player (false over a pit).</param>
        public void Tick(float dt, IInputReader input, bool isGroundBelow)
        {
            if (dt <= 0f) return; // frozen frame (stop-frames) — no gameplay integration

            if (input.ConsumeJumpPressed()) _bufferTimer = _cfg.JumpBufferTime;
            _bufferTimer = MathMax0(_bufferTimer - dt);

            bool supported = isGroundBelow && PositionY <= GroundY + 0.02f && VelocityY <= 0f;
            if (supported)
            {
                OnGround = true;
                State = MovementState.Grounded;
                _coyoteTimer = _cfg.CoyoteTime;
                PositionY = GroundY;
                VelocityY = 0f;
            }
            else
            {
                OnGround = false;
                State = MovementState.Airborne;
                _coyoteTimer = MathMax0(_coyoteTimer - dt);
            }

            // Buffered jump + coyote grace
            bool canJump = OnGround || _coyoteTimer > 0f;
            if (_bufferTimer > 0f && canJump)
            {
                VelocityY = _cfg.JumpVelocity;
                _bufferTimer = 0f;
                _coyoteTimer = 0f;
                OnGround = false;
                State = MovementState.Airborne;
                _bus?.Publish(new PlayerJumpedEvent());
            }

            // Variable jump height: releasing early cuts upward velocity
            if (input.ConsumeJumpReleased() && VelocityY > 0f)
                VelocityY *= _cfg.JumpCutMultiplier;

            // Integrate
            VelocityY -= _cfg.Gravity * dt;              // gravity pulls down (Y up)
            PositionY += VelocityY * dt;

            if (PositionY <= GroundY && isGroundBelow)
            {
                PositionY = GroundY;
                if (_wasAirborneLastTick)
                    _bus?.Publish(new PlayerLandedEvent(MathAbs(VelocityY)));
                VelocityY = 0f;
                OnGround = true;
                State = MovementState.Grounded;
            }

            _wasAirborneLastTick = !OnGround;
        }

        private static float MathMax0(float v) => v < 0f ? 0f : v;
        private static float MathAbs(float v) => v < 0f ? -v : v;
    }
}
