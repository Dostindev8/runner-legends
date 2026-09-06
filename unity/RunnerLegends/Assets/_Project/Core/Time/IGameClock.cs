#nullable enable
namespace RunnerLegends.Core.Time
{
    /// <summary>
    /// Central time source. Gameplay reads <see cref="DeltaTime"/> (scaled + frozen),
    /// presentation reads <see cref="UnscaledDeltaTime"/>. Enables juice stop-frames
    /// (GDD 3.1) without any system touching UnityEngine.Time directly.
    /// </summary>
    public interface IGameClock
    {
        float DeltaTime { get; }
        float UnscaledDeltaTime { get; }
        float TimeScale { get; set; }
        bool IsFrozen { get; }
        /// <summary>Freeze gameplay for <paramref name="seconds"/> of real time (stop-frames).</summary>
        void Freeze(float seconds);
        /// <summary>Advance the clock by one real frame; call once per Update from the composition root.</summary>
        void Tick(float rawDeltaTime);
    }
}
