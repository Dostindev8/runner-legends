#nullable enable
using System;

namespace RunnerLegends.Gameplay.Camera3D
{
    /// <summary>
    /// Purpose: Pure camera-rig controller — look-ahead by speed, set-piece ease-in-out blends, trauma hook.
    /// Dependencies: <see cref="ICameraRig"/>, <see cref="CameraRigMath"/>, <see cref="CameraRigState"/>.
    /// Date: 2026-08-10
    /// </summary>
    /// <remarks>
    /// Presentation may wrap this in a thin MonoBehaviour that feeds Transform targets and
    /// forwards <see cref="TraumaRequested"/> to the existing CameraShakeService (do not rewrite that service).
    /// </remarks>
    public sealed class CameraRigController : ICameraRig
    {
        private readonly float _followRate;
        private readonly float _baseLookAhead;
        private readonly float _lookAheadSpeedScale;
        private readonly float _followOffsetY;
        private readonly float _followOffsetZ;

        private float _blendElapsed;
        private float _blendDuration = CameraRigMath.SetPieceDurationMin;
        private float _blendFromX, _blendFromY, _blendFromZ;
        private float _blendToX, _blendToY, _blendToZ;

        public CameraRigState State { get; private set; } = CameraRigState.Follow;

        public float PositionX { get; private set; }
        public float PositionY { get; private set; }
        public float PositionZ { get; private set; }

        public event Action<float>? TraumaRequested;

        public CameraRigController(
            float followRate = 8f,
            float baseLookAhead = 1.25f,
            float lookAheadSpeedScale = 0.12f,
            float followOffsetY = 2.2f,
            float followOffsetZ = -8f)
        {
            _followRate = followRate;
            _baseLookAhead = baseLookAhead;
            _lookAheadSpeedScale = lookAheadSpeedScale;
            _followOffsetY = followOffsetY;
            _followOffsetZ = followOffsetZ;
        }

        public void SnapTo(in CameraRigTarget target)
        {
            float look = CameraRigMath.LookAheadOffsetX(target.Speed, _baseLookAhead, _lookAheadSpeedScale);
            PositionX = target.X + look;
            PositionY = target.Y + _followOffsetY;
            PositionZ = target.Z + _followOffsetZ;
            State = target.Speed > 0.01f ? CameraRigState.LookAhead : CameraRigState.Follow;
        }

        public void Tick(float dt, in CameraRigTarget target)
        {
            if (dt < 0f) dt = 0f;

            if (State == CameraRigState.SetPiece || State == CameraRigState.PortalTransition)
            {
                _blendElapsed += dt;
                float t01 = _blendDuration <= 0f ? 1f : Math.Min(1f, _blendElapsed / _blendDuration);
                CameraRigMath.BlendPosition(
                    _blendFromX, _blendFromY, _blendFromZ,
                    _blendToX, _blendToY, _blendToZ,
                    t01,
                    out float x, out float y, out float z);
                PositionX = x;
                PositionY = y;
                PositionZ = z;

                if (t01 >= 1f)
                {
                    State = CameraRigState.Follow;
                    SnapTo(target);
                }
                return;
            }

            float look = CameraRigMath.LookAheadOffsetX(target.Speed, _baseLookAhead, _lookAheadSpeedScale);
            float desiredX = target.X + look;
            float desiredY = target.Y + _followOffsetY;
            float desiredZ = target.Z + _followOffsetZ;

            PositionX = CameraRigMath.FollowAxis(PositionX, desiredX, _followRate, dt);
            PositionY = CameraRigMath.FollowAxis(PositionY, desiredY, _followRate, dt);
            PositionZ = CameraRigMath.FollowAxis(PositionZ, desiredZ, _followRate, dt);

            State = look > 0.001f ? CameraRigState.LookAhead : CameraRigState.Follow;
        }

        public void BeginSetPiece(float frameX, float frameY, float frameZ, float durationSeconds)
            => BeginBlend(CameraRigState.SetPiece, frameX, frameY, frameZ, durationSeconds);

        public void BeginPortalTransition(float exitX, float exitY, float exitZ, float durationSeconds)
            => BeginBlend(CameraRigState.PortalTransition, exitX, exitY, exitZ, durationSeconds);

        public void RequestTrauma(float amount01)
        {
            if (amount01 <= 0f) return;
            float clamped = amount01 > 1f ? 1f : amount01;
            TraumaRequested?.Invoke(clamped);
        }

        private void BeginBlend(CameraRigState state, float toX, float toY, float toZ, float durationSeconds)
        {
            State = state;
            _blendElapsed = 0f;
            _blendDuration = CameraRigMath.ClampBlendDuration(durationSeconds);
            _blendFromX = PositionX;
            _blendFromY = PositionY;
            _blendFromZ = PositionZ;
            _blendToX = toX;
            _blendToY = toY;
            _blendToZ = toZ;
        }
    }
}
