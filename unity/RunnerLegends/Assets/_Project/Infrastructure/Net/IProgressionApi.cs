#nullable enable
using System.Threading.Tasks;

namespace RunnerLegends.Infrastructure.Net
{
    public readonly struct ApiResult<T>
    {
        public readonly bool Ok;
        public readonly T? Value;
        public readonly string? Error;
        private ApiResult(bool ok, T? value, string? error){ Ok = ok; Value = value; Error = error; }
        public static ApiResult<T> Success(T v) => new(true, v, null);
        public static ApiResult<T> Fail(string e) => new(false, default, e);
    }

    public interface IProgressionApi
    {
        Task<ApiResult<string>> GetProfileAsync(string playerId);
        Task<ApiResult<bool>> PushProgressAsync(string playerId, string jsonPayload);
    }
}
