#nullable enable
using System;

namespace RunnerLegends.Gameplay.Camera3D
{
    /// <summary>
    /// Purpose: Pure, allocation-free camera math for look-ahead and set-piece blends (unit-testable).
    /// Dependencies: None (System only).
    /// Date: 2026-08-10
    /// </summary>
    public static class CameraRigMath
    {
        public const float SetPieceDurationMin = 0.6f;
        public const float SetPieceDurationMax = 1.0f;

        /// <summary>Clamps set-piece / portal blend duration to the GDD window [0.6, 1.0] seconds.</summary>
        public static float ClampBlendDuration(float durationSeconds)
        {
            if (durationSeconds < SetPieceDurationMin) return SetPieceDurationMin;
            if (durationSeconds > SetPieceDurationMax) return SetPieceDurationMax;
            return durationSeconds;
        }

        /// <summary>Smoothstep ease-in-out on [0,1].</summary>
        public static float EaseInOut01(float t)
        {
            if (t <= 0f) return 0f;
            if (t >= 1f) return 1f;
            return t * t * (3f - 2f * t);
        }

        /// <summary>
        /// Look-ahead offset along +X proportional to horizontal speed.
        /// <paramref name="baseLookAhead"/> is the offset at reference speed 1.
        /// </summary>
        public static float LookAheadOffsetX(float speed, float baseLookAhead, float speedScale = 1f)
        {
            float s = Math.Max(0f, speed) * Math.Max(0f, speedScale);
            return baseLookAhead * s;
        }

        /// <summary>Linear interpolate then ease for set-piece framing.</summary>
        public static void BlendPosition(
            float fromX, float fromY, float fromZ,
            float toX, float toY, float toZ,
            float t01,
            out float x, out float y, out float z)
        {
            float e = EaseInOut01(t01);
            x = fromX + (toX - fromX) * e;
            y = fromY + (toY - fromY) * e;
            z = fromZ + (toZ - fromZ) * e;
        }

        /// <summary>Exponential follow toward a desired position (frame-rate independent).</summary>
        public static float FollowAxis(float current, float desired, float followRate, float dt)
        {
            if (dt <= 0f || followRate <= 0f) return current;
            float t = 1f - (float)Math.Exp(-followRate * dt);
            return current + (desired - current) * t;
        }
    }
}
