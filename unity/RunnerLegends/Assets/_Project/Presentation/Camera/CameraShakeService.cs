#nullable enable
using RunnerLegends.Core.Events;
using UnityEngine;

namespace RunnerLegends.Presentation.Camera
{
    /// <summary>
    /// Single entry point for screenshake (GDD 3.1) with exponential trauma decay. Any
    /// system adds trauma indirectly by publishing gameplay events; no shake logic is
    /// duplicated per feature. Attach to the main camera; injected via the installer.
    /// </summary>
    public sealed class CameraShakeService : MonoBehaviour
    {
        [SerializeField] private float _maxOffset = 0.35f;
        [SerializeField] private float _decayPerSecond = 1.6f;
        [SerializeField] private float _frequency = 26f;

        private IEventBus? _bus;
        private float _trauma;
        private float _seed;
        private Vector3 _origin;

        public void Construct(IEventBus bus)
        {
            _bus = bus;
            _bus.Subscribe<PlayerLandedEvent>(_ => AddTrauma(0.14f));
            _bus.Subscribe<PlayerHurtEvent>(_ => AddTrauma(0.55f));
            _bus.Subscribe<PlayerDiedEvent>(_ => AddTrauma(0.8f));
            _bus.Subscribe<SuperActivatedEvent>(_ => AddTrauma(1f));
        }

        public void AddTrauma(float amount) => _trauma = Mathf.Clamp01(_trauma + amount);

        private void Awake() { _origin = transform.localPosition; _seed = Random.value * 100f; }

        private void LateUpdate()
        {
            float t = Time.unscaledTime * _frequency + _seed;
            float shake = _trauma * _trauma * _maxOffset; // quadratic feel
            transform.localPosition = _origin + new Vector3(Mathf.Sin(t) * shake, Mathf.Cos(t * 1.3f) * shake, 0f);
            _trauma = Mathf.Max(0f, _trauma - _decayPerSecond * Time.unscaledDeltaTime);
        }
    }
}
