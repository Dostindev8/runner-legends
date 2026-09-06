#nullable enable
namespace RunnerLegends.Gameplay.Movement
{
    /// <summary>Immutable, engine-free movement tuning consumed by the FSM (testable).</summary>
    public readonly struct MovementConfig
    {
        public readonly float Gravity;
        public readonly float JumpVelocity;
        public readonly float JumpCutMultiplier;
        public readonly float CoyoteTime;
        public readonly float JumpBufferTime;
        public readonly int MaxHp;

        public MovementConfig(float gravity, float jumpVelocity, float jumpCutMultiplier,
            float coyoteTime, float jumpBufferTime, int maxHp)
        {
            Gravity = gravity;
            JumpVelocity = jumpVelocity;
            JumpCutMultiplier = jumpCutMultiplier;
            CoyoteTime = coyoteTime;
            JumpBufferTime = jumpBufferTime;
            MaxHp = maxHp;
        }
    }

    public enum MovementState { Grounded, Airborne }
}
