#nullable enable
using System;

namespace RunnerLegends.Core.Events
{
    /// <summary>
    /// Strongly-typed publish/subscribe bus. Decouples systems so Gameplay never
    /// references Presentation directly (GDD 4.2 dependency inversion).
    /// </summary>
    public interface IEventBus
    {
        void Subscribe<T>(Action<T> handler) where T : struct;
        void Unsubscribe<T>(Action<T> handler) where T : struct;
        void Publish<T>(in T evt) where T : struct;
    }
}
