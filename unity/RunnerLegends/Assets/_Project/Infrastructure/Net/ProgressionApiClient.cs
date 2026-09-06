#nullable enable
using System;
using System.Threading.Tasks;
using UnityEngine.Networking;

namespace RunnerLegends.Infrastructure.Net
{
    /// <summary>
    /// REST client for the NestJS progression backend. Every call is wrapped in try/catch
    /// with an explicit failure result (prompt §2 + §6): the caller degrades gracefully
    /// (offline play stays valid; never a frozen screen).
    /// </summary>
    public sealed class ProgressionApiClient : IProgressionApi
    {
        private readonly string _baseUrl;
        private readonly Func<string?> _bearerProvider;
        private readonly int _timeoutSeconds;

        public ProgressionApiClient(string baseUrl, Func<string?> bearerProvider, int timeoutSeconds = 8)
        {
            _baseUrl = baseUrl.TrimEnd('/');
            _bearerProvider = bearerProvider;
            _timeoutSeconds = timeoutSeconds;
        }

        public async Task<ApiResult<string>> GetProfileAsync(string playerId)
        {
            try
            {
                using var req = UnityWebRequest.Get($"{_baseUrl}/players/{playerId}");
                Authorize(req);
                var body = await SendAsync(req);
                return body != null ? ApiResult<string>.Success(body) : ApiResult<string>.Fail(req.error ?? "unknown");
            }
            catch (Exception e) { return ApiResult<string>.Fail(e.Message); }
        }

        public async Task<ApiResult<bool>> PushProgressAsync(string playerId, string jsonPayload)
        {
            try
            {
                using var req = new UnityWebRequest($"{_baseUrl}/players/{playerId}/progress", "POST")
                {
                    uploadHandler = new UploadHandlerRaw(System.Text.Encoding.UTF8.GetBytes(jsonPayload)),
                    downloadHandler = new DownloadHandlerBuffer()
                };
                req.SetRequestHeader("Content-Type", "application/json");
                Authorize(req);
                var body = await SendAsync(req);
                return body != null ? ApiResult<bool>.Success(true) : ApiResult<bool>.Fail(req.error ?? "unknown");
            }
            catch (Exception e) { return ApiResult<bool>.Fail(e.Message); }
        }

        private void Authorize(UnityWebRequest req)
        {
            req.timeout = _timeoutSeconds;
            var token = _bearerProvider();
            if (!string.IsNullOrEmpty(token)) req.SetRequestHeader("Authorization", $"Bearer {token}");
        }

        private static Task<string?> SendAsync(UnityWebRequest req)
        {
            var tcs = new TaskCompletionSource<string?>();
            var op = req.SendWebRequest();
            op.completed += _ =>
            {
                bool ok = req.result == UnityWebRequest.Result.Success;
                tcs.TrySetResult(ok ? req.downloadHandler.text : null);
            };
            return tcs.Task;
        }
    }
}
