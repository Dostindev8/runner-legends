#nullable enable
using RunnerLegends.Core.Input;
using UnityEngine;
using UnityEngine.InputSystem;

namespace RunnerLegends.Presentation.Input
{
    /// <summary>
    /// Concrete one-hand input using the Input System (GDD: tap/hold, &lt;16ms). Lives in
    /// Presentation because Core must stay engine-package-free. Poll edges via Poll() once
    /// per frame from the composition root, before ticking gameplay.
    /// </summary>
    public sealed class UnityInputReader : IInputReader
    {
        private bool _jumpPressed;
        private bool _jumpReleased;
        private bool _superPressed;
        private bool _prevHeld;

        public bool JumpHeld { get; private set; }

        public void Poll()
        {
            bool held = ReadJumpHeld();
            if (held && !_prevHeld) _jumpPressed = true;
            if (!held && _prevHeld) _jumpReleased = true;
            JumpHeld = held;
            _prevHeld = held;

            if (ReadSuperEdge()) _superPressed = true;
        }

        public bool ConsumeJumpPressed()   { var v = _jumpPressed;   _jumpPressed = false;   return v; }
        public bool ConsumeJumpReleased()  { var v = _jumpReleased;  _jumpReleased = false;  return v; }
        public bool ConsumeSuperPressed()  { var v = _superPressed;  _superPressed = false;  return v; }

        private static bool ReadJumpHeld()
        {
            var kb = Keyboard.current;
            if (kb != null && (kb.spaceKey.isPressed || kb.upArrowKey.isPressed || kb.wKey.isPressed)) return true;
            var touch = Touchscreen.current;
            if (touch != null && touch.primaryTouch.press.isPressed) return true;
            var mouse = Mouse.current;
            return mouse != null && mouse.leftButton.isPressed;
        }

        private static bool ReadSuperEdge()
        {
            var kb = Keyboard.current;
            return kb != null && (kb.eKey.wasPressedThisFrame || kb.leftShiftKey.wasPressedThisFrame);
        }

        /// <summary>UI super button hooks here.</summary>
        public void RequestSuper() => _superPressed = true;
    }
}
