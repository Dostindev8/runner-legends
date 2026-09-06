#nullable enable
using NUnit.Framework;
using RunnerLegends.Gameplay.Camera3D;

namespace RunnerLegends.Tests
{
    /// <summary>
    /// Purpose: Unit tests for pure camera-rig math (look-ahead, ease-in-out, blend duration clamp).
    /// Dependencies: NUnit, CameraRigMath, CameraRigController.
    /// Date: 2026-08-10
    /// </summary>
    public sealed class CameraRigMathTests
    {
        [Test]
        public void ClampBlendDuration_StaysWithin_0_6_to_1_0()
        {
            Assert.AreEqual(0.6f, CameraRigMath.ClampBlendDuration(0.1f), 0.0001f);
            Assert.AreEqual(0.6f, CameraRigMath.ClampBlendDuration(0.6f), 0.0001f);
            Assert.AreEqual(0.85f, CameraRigMath.ClampBlendDuration(0.85f), 0.0001f);
            Assert.AreEqual(1.0f, CameraRigMath.ClampBlendDuration(1.0f), 0.0001f);
            Assert.AreEqual(1.0f, CameraRigMath.ClampBlendDuration(2.5f), 0.0001f);
        }

        [Test]
        public void EaseInOut01_IsSymmetricAndClamped()
        {
            Assert.AreEqual(0f, CameraRigMath.EaseInOut01(-1f), 0.0001f);
            Assert.AreEqual(0f, CameraRigMath.EaseInOut01(0f), 0.0001f);
            Assert.AreEqual(0.5f, CameraRigMath.EaseInOut01(0.5f), 0.0001f);
            Assert.AreEqual(1f, CameraRigMath.EaseInOut01(1f), 0.0001f);
            Assert.AreEqual(1f, CameraRigMath.EaseInOut01(2f), 0.0001f);
            Assert.Less(CameraRigMath.EaseInOut01(0.25f), 0.25f);
            Assert.Greater(CameraRigMath.EaseInOut01(0.75f), 0.75f);
        }

        [Test]
        public void LookAheadOffsetX_ScalesWithSpeed()
        {
            float slow = CameraRigMath.LookAheadOffsetX(2f, baseLookAhead: 1f, speedScale: 1f);
            float fast = CameraRigMath.LookAheadOffsetX(10f, baseLookAhead: 1f, speedScale: 1f);
            Assert.AreEqual(2f, slow, 0.0001f);
            Assert.AreEqual(10f, fast, 0.0001f);
            Assert.AreEqual(0f, CameraRigMath.LookAheadOffsetX(-5f, 1f, 1f), 0.0001f);
        }

        [Test]
        public void BlendPosition_Midpoint_UsesEaseInOut()
        {
            CameraRigMath.BlendPosition(0, 0, 0, 10, 10, 10, 0.5f, out float x, out float y, out float z);
            Assert.AreEqual(5f, x, 0.0001f);
            Assert.AreEqual(5f, y, 0.0001f);
            Assert.AreEqual(5f, z, 0.0001f);
        }

        [Test]
        public void CameraRigController_LookAhead_ThenSetPieceBlend()
        {
            var rig = new CameraRigController(followRate: 100f, baseLookAhead: 1f, lookAheadSpeedScale: 1f);
            var target = new CameraRigTarget(0f, 0f, 0f, speed: 4f);
            rig.SnapTo(target);
            Assert.AreEqual(CameraRigState.LookAhead, rig.State);
            Assert.AreEqual(4f, rig.PositionX, 0.01f);

            float trauma = 0f;
            rig.TraumaRequested += a => trauma = a;
            rig.RequestTrauma(0.5f);
            Assert.AreEqual(0.5f, trauma, 0.0001f);

            rig.BeginSetPiece(20f, 5f, -10f, durationSeconds: 0.2f); // clamps to 0.6s
            Assert.AreEqual(CameraRigState.SetPiece, rig.State);
            rig.Tick(0.3f, target);
            Assert.AreEqual(CameraRigState.SetPiece, rig.State);
            Assert.Greater(rig.PositionX, 4f);
            Assert.Less(rig.PositionX, 20f);
        }
    }
}
