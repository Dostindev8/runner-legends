#nullable enable
using System;

namespace RunnerLegends.Core.Time
{
    public sealed class GameClock : IGameClock
    {
        private float _freeze;

        public float DeltaTime { get; private set; }
        public float UnscaledDeltaTime { get; private set; }
        public float TimeScale { get; set; } = 1f;
        public bool IsFrozen => _freeze > 0f;

        public void Freeze(float seconds) => _freeze = Math.Max(_freeze, seconds);

        public void Tick(float rawDeltaTime)
        {
            // clamp spikes so a stall never teleports gameplay through obstacles
            rawDeltaTime = Math.Min(rawDeltaTime, 0.05f);
            UnscaledDeltaTime = rawDeltaTime;

            if (_freeze > 0f)
            {
                _freeze -= rawDeltaTime;
                DeltaTime = 0f; // stop-frames: gameplay paused, rendering continues
                return;
            }
            DeltaTime = rawDeltaTime * TimeScale;
        }
    }
}
