#nullable enable
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace RunnerLegends.Infrastructure.Streaming
{
    /// <summary>
    /// Purpose: Stub Addressables-style world streaming — predictive load within 3s of a portal;
    /// unload source when past budget (GDD §11).
    /// Dependencies: <see cref="IWorldStreamingService"/>.
    /// Date: 2026-08-10
    /// </summary>
    /// <remarks>
    /// This is an in-memory stub so Gameplay/Presentation can wire portal flow without Unity
    /// Addressables packages present in the Editor. Replace the body with Addressables.LoadAssetAsync
    /// / Release when URP 3D Addressables are enabled — do not rewrite callers.
    /// </remarks>
    public sealed class WorldStreamingService : IWorldStreamingService
    {
        private readonly HashSet<string> _loaded = new(StringComparer.Ordinal);
        private readonly HashSet<string> _prefetchQueued = new(StringComparer.Ordinal);
        private readonly int _maxResidentWorlds;

        public float PredictiveLoadHorizonSeconds { get; }

        /// <summary>GDD §11: unload source when past budget (resident world count).</summary>
        public int MaxResidentWorlds => _maxResidentWorlds;

        public int ResidentCount => _loaded.Count;

        public WorldStreamingService(float predictiveLoadHorizonSeconds = 3f, int maxResidentWorlds = 2)
        {
            PredictiveLoadHorizonSeconds = predictiveLoadHorizonSeconds <= 0f ? 3f : predictiveLoadHorizonSeconds;
            _maxResidentWorlds = maxResidentWorlds < 1 ? 1 : maxResidentWorlds;
        }

        public bool IsWorldLoaded(string worldId)
        {
            if (string.IsNullOrWhiteSpace(worldId)) return false;
            return _loaded.Contains(worldId);
        }

        public void NotifyApproachingPortal(string targetWorldId, float secondsUntilArrival)
        {
            if (string.IsNullOrWhiteSpace(targetWorldId)) return;
            if (secondsUntilArrival > PredictiveLoadHorizonSeconds) return;
            if (_loaded.Contains(targetWorldId) || _prefetchQueued.Contains(targetWorldId)) return;

            _prefetchQueued.Add(targetWorldId);
            // Fire-and-forget stub; real Addressables path would track AsyncOperationHandle.
            _ = PrefetchWorldAsync(targetWorldId);
        }

        public Task PrefetchWorldAsync(string worldId, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(worldId))
                return Task.CompletedTask;

            cancellationToken.ThrowIfCancellationRequested();
            // Stub: mark as loaded immediately. Addressables would await LoadSceneAsync / LoadAssetAsync here.
            _loaded.Add(worldId);
            _prefetchQueued.Remove(worldId);
            return Task.CompletedTask;
        }

        public Task UnloadWorldIfOverBudgetAsync(string worldId, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(worldId))
                return Task.CompletedTask;

            cancellationToken.ThrowIfCancellationRequested();

            // GDD §11 — unload source when past budget after the destination is resident.
            if (_loaded.Count > _maxResidentWorlds && _loaded.Contains(worldId))
            {
                _loaded.Remove(worldId);
                // Addressables.Release / UnloadSceneAsync would go here.
            }

            return Task.CompletedTask;
        }
    }
}
