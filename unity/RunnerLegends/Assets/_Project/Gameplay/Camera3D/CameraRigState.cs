#nullable enable
namespace RunnerLegends.Gameplay.Camera3D
{
    /// <summary>
    /// Purpose: Finite states for the v3.0 3D camera rig (Mario 3D Edition).
    /// Dependencies: None (pure enum).
    /// Date: 2026-08-10
    /// </summary>
    public enum CameraRigState
    {
        Follow = 0,
        LookAhead = 1,
        SetPiece = 2,
        PortalTransition = 3
    }
}
