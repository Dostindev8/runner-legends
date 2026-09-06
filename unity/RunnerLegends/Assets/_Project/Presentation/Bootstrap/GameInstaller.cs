#nullable enable
using RunnerLegends.Core.Events;
using RunnerLegends.Core.Time;
using RunnerLegends.Gameplay.Characters;
using RunnerLegends.Gameplay.Combat;
using RunnerLegends.Gameplay.Economy;
using RunnerLegends.Presentation.Camera;
using RunnerLegends.Presentation.Input;
using UnityEngine;

namespace RunnerLegends.Presentation.Bootstrap
{
    /// <summary>
    /// Composition root (poor-man's DI). Constructs every service once and injects it via
    /// constructor/Construct methods. NO FindObjectOfType, NO mutable static singletons —
    /// this is the single place that knows how the object graph is wired (GDD 4.2 / prompt §2).
    /// </summary>
    [DefaultExecutionOrder(-1000)]
    public sealed class GameInstaller : MonoBehaviour
    {
        [SerializeField] private CharacterStatsSO _startingCharacter = null!;
        [SerializeField] private CameraShakeService _cameraShake = null!;
        [SerializeField] private RunnerController _runner = null!;

        private GameClock _clock = null!;
        private UnityInputReader _input = null!;

        private void Awake()
        {
            IEventBus bus = new EventBus();
            _clock = new GameClock();
            _input = new UnityInputReader();
            ICombatSystem combat = new CombatSystem();
            IEconomyService economy = new EconomyService(bus);

            _cameraShake.Construct(bus);
            _runner.Construct(_clock, _input, economy, combat, _startingCharacter, bus);
        }

        private void Update()
        {
            _input.Poll();
            _clock.Tick(Time.deltaTime);
            _runner.TickFrame();
        }

        /// <summary>UI hook for the on-screen SÚPER button.</summary>
        public void OnSuperButton() => _input.RequestSuper();
    }
}
