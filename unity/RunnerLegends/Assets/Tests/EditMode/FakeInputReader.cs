#nullable enable
using RunnerLegends.Core.Input;

namespace RunnerLegends.Tests
{
    /// <summary>Deterministic input double for frame-by-frame FSM tests.</summary>
    public sealed class FakeInputReader : IInputReader
    {
        private bool _jumpPressed;
        private bool _jumpReleased;
        private bool _superPressed;

        public bool JumpHeld { get; set; }

        public void PressJump()   { _jumpPressed = true; JumpHeld = true; }
        public void ReleaseJump() { _jumpReleased = true; JumpHeld = false; }
        public void PressSuper()  { _superPressed = true; }

        public bool ConsumeJumpPressed()  { var v = _jumpPressed;  _jumpPressed = false;  return v; }
        public bool ConsumeJumpReleased() { var v = _jumpReleased; _jumpReleased = false; return v; }
        public bool ConsumeSuperPressed() { var v = _superPressed; _superPressed = false; return v; }
    }
}
