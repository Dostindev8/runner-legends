#nullable enable
using System;

namespace RunnerLegends.Gameplay.World
{
    public enum FeatureType { Pit, Crate, Drone, CoinRiver }

    public readonly struct SpawnDecision
    {
        public readonly FeatureType Type;
        public readonly float Size;      // pit width / crate height (world units)
        public readonly float NextSpacing;
        public SpawnDecision(FeatureType t, float size, float spacing){ Type = t; Size = size; NextSpacing = spacing; }
    }

    /// <summary>
    /// Deterministic-by-seed spawn director (GDD 4.3 / 07). Pure logic so difficulty can
    /// be unit-tested and A/B tuned (GDD 10 Fase 4). Guarantees fairness: pit widths and
    /// crate heights stay within the character's jump envelope.
    /// </summary>
    public sealed class WorldDirector
    {
        private readonly Random _rng;
        private readonly float _maxPitWidth;
        private readonly float _maxCrateHeight;

        public WorldDirector(int seed, float maxPitWidth, float maxCrateHeight)
        {
            _rng = new Random(seed);
            _maxPitWidth = maxPitWidth;
            _maxCrateHeight = maxCrateHeight;
        }

        public SpawnDecision Next()
        {
            double r = _rng.NextDouble();
            if (r < 0.30) return new SpawnDecision(FeatureType.Pit, Range(0.55f, 1f) * _maxPitWidth, Range(4.0f, 6.0f));
            if (r < 0.58) return new SpawnDecision(FeatureType.Crate, Range(0.5f, 1f) * _maxCrateHeight, Range(4.0f, 5.5f));
            if (r < 0.80) return new SpawnDecision(FeatureType.Drone, 0f, Range(3.8f, 5.2f));
            return new SpawnDecision(FeatureType.CoinRiver, 0f, Range(3.2f, 4.5f));
        }

        private float Range(float a, float b) => a + (float)_rng.NextDouble() * (b - a);
    }
}
