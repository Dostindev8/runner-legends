#nullable enable
using UnityEngine;

namespace RunnerLegends.Presentation.ResponsiveUI
{
    /// <summary>
    /// Purpose: Reads <see cref="Screen.safeArea"/> into normalized / pixel insets for notch devices.
    /// Dependencies: UnityEngine.Screen.
    /// Date: 2026-08-10
    /// </summary>
    public static class SafeAreaInsets
    {
        public readonly struct Insets
        {
            public readonly float Left;
            public readonly float Right;
            public readonly float Top;
            public readonly float Bottom;
            public readonly Rect SafeAreaPixels;

            public Insets(float left, float right, float top, float bottom, Rect safeAreaPixels)
            {
                Left = left;
                Right = right;
                Top = top;
                Bottom = bottom;
                SafeAreaPixels = safeAreaPixels;
            }
        }

        /// <summary>Pixel insets from screen edges to the safe rect.</summary>
        public static Insets ReadPixels()
        {
            Rect safe = Screen.safeArea;
            float left = safe.xMin;
            float right = Screen.width - safe.xMax;
            float bottom = safe.yMin;
            float top = Screen.height - safe.yMax;
            return new Insets(
                left: Mathf.Max(0f, left),
                right: Mathf.Max(0f, right),
                top: Mathf.Max(0f, top),
                bottom: Mathf.Max(0f, bottom),
                safeAreaPixels: safe);
        }

        /// <summary>Insets normalized to [0,1] of screen width/height (for anchors).</summary>
        public static Insets ReadNormalized()
        {
            Insets px = ReadPixels();
            float w = Mathf.Max(1f, Screen.width);
            float h = Mathf.Max(1f, Screen.height);
            return new Insets(
                left: px.Left / w,
                right: px.Right / w,
                top: px.Top / h,
                bottom: px.Bottom / h,
                safeAreaPixels: px.SafeAreaPixels);
        }

        /// <summary>Applies safe-area padding to a full-screen RectTransform (anchor stretch).</summary>
        public static void ApplyToRectTransform(RectTransform rect)
        {
            if (rect == null) return;
            Insets n = ReadNormalized();
            rect.anchorMin = new Vector2(n.Left, n.Bottom);
            rect.anchorMax = new Vector2(1f - n.Right, 1f - n.Top);
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;
        }
    }
}
