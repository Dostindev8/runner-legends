#nullable enable
using System;
using System.Collections.Generic;

namespace RunnerLegends.Core.Events
{
    /// <summary>Allocation-free-on-publish typed event bus (handlers cached per type).</summary>
    public sealed class EventBus : IEventBus
    {
        private readonly Dictionary<Type, Delegate> _handlers = new();

        public void Subscribe<T>(Action<T> handler) where T : struct
        {
            if (handler == null) throw new ArgumentNullException(nameof(handler));
            _handlers.TryGetValue(typeof(T), out var existing);
            _handlers[typeof(T)] = (Action<T>?)existing + handler;
        }

        public void Unsubscribe<T>(Action<T> handler) where T : struct
        {
            if (handler == null) return;
            if (_handlers.TryGetValue(typeof(T), out var existing))
                _handlers[typeof(T)] = (Action<T>?)existing - handler;
        }

        public void Publish<T>(in T evt) where T : struct
        {
            if (_handlers.TryGetValue(typeof(T), out var d) && d is Action<T> action)
                action.Invoke(evt);
        }
    }

    // ---- Gameplay event contracts (value types => no GC on publish) ----------
    public readonly struct PlayerJumpedEvent { }
    public readonly struct PlayerLandedEvent { public readonly float ImpactVelocity; public PlayerLandedEvent(float v){ ImpactVelocity = v; } }
    public readonly struct PlayerHurtEvent { public readonly int RemainingHp; public PlayerHurtEvent(int hp){ RemainingHp = hp; } }
    public readonly struct PlayerDiedEvent { public readonly bool FellIntoPit; public PlayerDiedEvent(bool fell){ FellIntoPit = fell; } }
    public readonly struct CoinCollectedEvent { public readonly int Total; public CoinCollectedEvent(int total){ Total = total; } }
    public readonly struct SuperActivatedEvent { public readonly int EnemiesCleared; public SuperActivatedEvent(int n){ EnemiesCleared = n; } }
}
