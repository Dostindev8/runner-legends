#nullable enable
using NUnit.Framework;
using RunnerLegends.Gameplay.Movement;

namespace RunnerLegends.Tests
{
    public sealed class MovementStateMachineTests
    {
        private const float Dt = 1f / 60f;

        private static MovementConfig Cfg() => new MovementConfig(
            gravity: 2000f, jumpVelocity: 800f, jumpCutMultiplier: 0.42f,
            coyoteTime: 0.10f, jumpBufferTime: 0.10f, maxHp: 3);

        [Test]
        public void CoyoteTime_AllowsJump_ShortlyAfterLeavingGround()
        {
            var fsm = new PlayerMovementStateMachine(Cfg(), 0f);
            var input = new FakeInputReader();

            fsm.Tick(Dt, input, isGroundBelow: true);   // establish grounded + coyote window
            Assert.IsTrue(fsm.OnGround);

            // Walk off a ledge: ground disappears. Within 100ms, request a jump.
            fsm.Tick(Dt, input, isGroundBelow: false);   // ~16ms airborne, coyote still active
            input.PressJump();
            fsm.Tick(Dt, input, isGroundBelow: false);

            Assert.Greater(fsm.VelocityY, 0f, "coyote time should permit the jump");
        }

        [Test]
        public void CoyoteTime_Expires_AfterWindow()
        {
            var fsm = new PlayerMovementStateMachine(Cfg(), 0f);
            var input = new FakeInputReader();
            fsm.Tick(Dt, input, isGroundBelow: true);

            // Stay airborne well beyond the 100ms coyote window (~12 frames).
            for (int i = 0; i < 12; i++) fsm.Tick(Dt, input, isGroundBelow: false);
            input.PressJump();
            fsm.Tick(Dt, input, isGroundBelow: false);

            Assert.LessOrEqual(fsm.VelocityY, 0f, "jump must NOT fire after coyote expired");
        }

        [Test]
        public void JumpBuffering_AutoJumps_OnLanding()
        {
            var fsm = new PlayerMovementStateMachine(Cfg(), 0f);
            var input = new FakeInputReader();

            fsm.Tick(Dt, input, isGroundBelow: true);
            input.PressJump();
            fsm.Tick(Dt, input, isGroundBelow: true);    // initial jump -> airborne ascending
            Assert.Greater(fsm.VelocityY, 0f);

            // Fall back down; press jump just before landing (buffer window).
            bool bufferedPress = false;
            for (int i = 0; i < 200; i++)
            {
                if (!bufferedPress && fsm.VelocityY < 0f && fsm.PositionY < 0.25f && fsm.PositionY > 0.01f)
                {
                    input.PressJump();
                    bufferedPress = true;
                }
                fsm.Tick(Dt, input, isGroundBelow: true);
                if (bufferedPress && fsm.VelocityY > 0f) break; // auto-jumped on landing
            }

            Assert.IsTrue(bufferedPress, "test should have issued a buffered press");
            Assert.Greater(fsm.VelocityY, 0f, "buffered jump should fire at contact");
        }

        [Test]
        public void VariableJump_ReleaseCutsUpwardVelocity()
        {
            var fsm = new PlayerMovementStateMachine(Cfg(), 0f);
            var input = new FakeInputReader();
            fsm.Tick(Dt, input, isGroundBelow: true);
            input.PressJump();
            fsm.Tick(Dt, input, isGroundBelow: true);
            float full = fsm.VelocityY;

            input.ReleaseJump();
            fsm.Tick(Dt, input, isGroundBelow: false);
            // After release, upward velocity is cut then reduced further by gravity.
            Assert.Less(fsm.VelocityY, full * 0.6f, "early release must reduce jump height");
        }
    }
}
