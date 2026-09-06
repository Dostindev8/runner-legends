#nullable enable
namespace RunnerLegends.Core.Input
{
    /// <summary>
    /// One-hand input contract (GDD: single tap/hold). Concrete implementation lives
    /// in Presentation (uses Unity Input System in "Fast" mode). Kept as an interface
    /// so the movement FSM can be unit-tested without the engine runtime.
    /// </summary>
    public interface IInputReader
    {
        /// <summary>True on the frame a jump was requested (edge). Consumed by the FSM.</summary>
        bool ConsumeJumpPressed();
        /// <summary>True while the jump input is held (for variable-height jump).</summary>
        bool JumpHeld { get; }
        /// <summary>True on the frame the jump input was released.</summary>
        bool ConsumeJumpReleased();
        /// <summary>True on the frame the super was requested.</summary>
        bool ConsumeSuperPressed();
    }
}
