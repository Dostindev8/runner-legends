#nullable enable
using UnityEngine;
using UnityEngine.UI;

namespace RunnerLegends.Presentation.ResponsiveUI
{
    /// <summary>
    /// Purpose: Canvas Scaler helpers (Scale With Screen Size) and v3.0 breakpoint matrix.
    /// Dependencies: UnityEngine.UI.CanvasScaler, <see cref="SafeAreaInsets"/>.
    /// Date: 2026-08-10
    /// </summary>
    public sealed class ResponsiveCanvasController : MonoBehaviour
    {
        /// <summary>Logical breakpoints (CSS-like width bands) for ResponsiveQA captures.</summary>
        public static readonly int[] BreakpointsPx = { 360, 391, 431, 601, 901 };

        [SerializeField] private CanvasScaler? _scaler;
        [SerializeField] private Vector2 _referenceResolution = new Vector2(1080f, 1920f);
        [SerializeField] private float _matchWidthOrHeight = 0.5f;
        [SerializeField] private RectTransform? _safeAreaRoot;

        public CanvasScaler? Scaler => _scaler;

        private void Awake()
        {
            if (_scaler == null)
                _scaler = GetComponent<CanvasScaler>();
            ConfigureScaleWithScreenSize();
            if (_safeAreaRoot != null)
                SafeAreaInsets.ApplyToRectTransform(_safeAreaRoot);
        }

        private void OnRectTransformDimensionsChange()
        {
            if (_safeAreaRoot != null)
                SafeAreaInsets.ApplyToRectTransform(_safeAreaRoot);
        }

        public void ConfigureScaleWithScreenSize()
        {
            if (_scaler == null) return;
            _scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            _scaler.referenceResolution = _referenceResolution;
            _scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
            _scaler.matchWidthOrHeight = Mathf.Clamp01(_matchWidthOrHeight);
        }

        /// <summary>Returns the active breakpoint band index for the current screen width.</summary>
        public static int ResolveBreakpointIndex(float widthPx)
        {
            int band = 0;
            for (int i = 0; i < BreakpointsPx.Length; i++)
            {
                if (widthPx >= BreakpointsPx[i])
                    band = i;
                else
                    break;
            }
            return band;
        }

        public static int ResolveBreakpointWidth(float widthPx)
            => BreakpointsPx[ResolveBreakpointIndex(widthPx)];

        /// <summary>True when width sits in the same band as <paramref name="breakpointPx"/>.</summary>
        public static bool IsWithinBand(float widthPx, int breakpointPx)
            => ResolveBreakpointWidth(widthPx) == breakpointPx;
    }
}
