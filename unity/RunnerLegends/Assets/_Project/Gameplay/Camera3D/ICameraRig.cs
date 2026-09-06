#nullable enable
using System;

namespace RunnerLegends.Gameplay.Camera3D
{
    /// <summary>
    /// Purpose: Contract for the v3.0 camera rig (follow / look-ahead / set-piece / portal).
    /// Dependencies: <see cref="CameraRigState"/>; optional trauma consumers via <see cref="TraumaRequested"/>.
    /// Date: 2026-08-10
    /// </summary>
    public interface ICameraRig
    {
        CameraRigState State { get; }

        /// <summary>World-space camera position after the last <see cref="Tick"/>.</summary>
        float PositionX { get; }
        float PositionY { get; }
        float PositionZ { get; }

        /// <summary>Raised when the rig wants screenshake trauma (0–1). Presentation wires this to CameraShakeService.</summary>
        event Action<float>? TraumaRequested;

        void Tick(float dt, in CameraRigTarget target);

        /// <summary>Blend into a fixed framing over <paramref name="durationSeconds"/> (clamped 0.6–1.0s).</summary>
        void BeginSetPiece(float frameX, float frameY, float frameZ, float durationSeconds);

        void BeginPortalTransition(float exitX, float exitY, float exitZ, float durationSeconds);

        void RequestTrauma(float amount01);
    }

    /// <summary>Snapshot of the followed actor for one frame (engine-free).</summary>
    public readonly struct CameraRigTarget
    {
        public readonly float X;
        public readonly float Y;
        public readonly float Z;
        public readonly float Speed;

        public CameraRigTarget(float x, float y, float z, float speed)
        {
            X = x;
            Y = y;
            Z = z;
            Speed = speed;
        }
    }
}
