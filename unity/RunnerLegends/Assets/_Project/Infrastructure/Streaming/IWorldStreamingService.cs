#nullable enable
using System;
using System.Threading;
using System.Threading.Tasks;

namespace RunnerLegends.Infrastructure.Streaming
{
    /// <summary>
    /// Purpose: Contract for predictive world streaming (Addressables-style) around portals.
    /// Dependencies: None (async Task API only).
    /// Date: 2026-08-10
    /// </summary>
    public interface IWorldStreamingService
    {
        /// <summary>Seconds ahead of portal contact at which predictive load should start (GDD default 3s).</summary>
        float PredictiveLoadHorizonSeconds { get; }

        bool IsWorldLoaded(string worldId);

        Task PrefetchWorldAsync(string worldId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Unloads a source world once resident memory / loaded-world count exceeds the budget
        /// (GDD §11 — unload source when past budget after portal transit).
        /// </summary>
        Task UnloadWorldIfOverBudgetAsync(string worldId, CancellationToken cancellationToken = default);

        void NotifyApproachingPortal(string targetWorldId, float secondsUntilArrival);
    }
}
