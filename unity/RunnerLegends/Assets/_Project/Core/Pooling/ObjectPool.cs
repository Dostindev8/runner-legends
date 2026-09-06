#nullable enable
using System;
using System.Collections.Generic;

namespace RunnerLegends.Core.Pooling
{
    public interface IPoolable { void OnSpawned(); void OnDespawned(); }

    /// <summary>
    /// Generic pool. GDD 3.3 / 11: zero Instantiate/Destroy and zero GC.Alloc in
    /// gameplay. Grows on demand and logs via the injected warn callback (no crash).
    /// </summary>
    public sealed class ObjectPool<T> where T : class
    {
        private readonly Func<T> _factory;
        private readonly Action<string>? _warn;
        private readonly Stack<T> _free = new();
        private readonly List<T> _active = new();
        private readonly int _softCap;

        public ObjectPool(Func<T> factory, int prewarm = 0, int softCap = int.MaxValue, Action<string>? warn = null)
        {
            _factory = factory ?? throw new ArgumentNullException(nameof(factory));
            _softCap = softCap;
            _warn = warn;
            for (int i = 0; i < prewarm; i++) _free.Push(_factory());
        }

        public IReadOnlyList<T> Active => _active;

        public T Spawn()
        {
            if (_free.Count == 0)
            {
                if (_active.Count >= _softCap)
                    _warn?.Invoke($"ObjectPool<{typeof(T).Name}> exceeded soft cap {_softCap}; growing.");
                _free.Push(_factory());
            }
            var item = _free.Pop();
            _active.Add(item);
            (item as IPoolable)?.OnSpawned();
            return item;
        }

        public void Despawn(T item)
        {
            if (!_active.Remove(item)) return;
            (item as IPoolable)?.OnDespawned();
            _free.Push(item);
        }

        public void Clear()
        {
            for (int i = _active.Count - 1; i >= 0; i--) Despawn(_active[i]);
        }
    }
}
