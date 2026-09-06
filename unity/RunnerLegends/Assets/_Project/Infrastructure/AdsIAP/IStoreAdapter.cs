#nullable enable
using System.Threading.Tasks;

namespace RunnerLegends.Infrastructure.AdsIAP
{
    public enum PurchaseState { Success, Cancelled, Failed, Pending }

    public readonly struct PurchaseResult
    {
        public readonly PurchaseState State;
        public readonly string ProductId;
        public readonly string? Error;
        public PurchaseResult(PurchaseState s, string id, string? error = null){ State = s; ProductId = id; Error = error; }
    }

    /// <summary>
    /// Adapter over Apple App Store / Google Play (GDD 4.2). Keeps store SDKs out of
    /// gameplay; every purchase resolves to an explicit state so UX always gives feedback
    /// (GDD Fase 4 DoD: no purchase flow leaves the player without success/error).
    /// </summary>
    public interface IStoreAdapter
    {
        Task<PurchaseResult> PurchaseAsync(string productId);
        Task<bool> RestorePurchasesAsync();
        Task<bool> ShowRewardedAdAsync(); // revive / doubler (video reward)
    }
}
