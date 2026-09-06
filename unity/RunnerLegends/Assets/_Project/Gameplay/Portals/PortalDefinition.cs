#nullable enable
using System;

namespace RunnerLegends.Gameplay.Portals
{
    /// <summary>
    /// Purpose: Immutable portal routing data — entry/target world ids and anti-reentry cooldown.
    /// Dependencies: <see cref="PortalKind"/>.
    /// Date: 2026-08-10
    /// </summary>
    public sealed class PortalDefinition
    {
        public string PortalId { get; }
        public PortalKind Kind { get; }
        public string EntryWorldId { get; }
        public string TargetWorldId { get; }
        public float CooldownSeconds { get; }

        public PortalDefinition(
            string portalId,
            PortalKind kind,
            string entryWorldId,
            string targetWorldId,
            float cooldownSeconds = 1.25f)
        {
            if (string.IsNullOrWhiteSpace(portalId))
                throw new ArgumentException("Portal id is required.", nameof(portalId));
            if (string.IsNullOrWhiteSpace(entryWorldId))
                throw new ArgumentException("Entry world id is required.", nameof(entryWorldId));
            if (string.IsNullOrWhiteSpace(targetWorldId))
                throw new ArgumentException("Target world id is required.", nameof(targetWorldId));

            PortalId = portalId;
            Kind = kind;
            EntryWorldId = entryWorldId;
            TargetWorldId = targetWorldId;
            CooldownSeconds = cooldownSeconds < 0f ? 0f : cooldownSeconds;
        }
    }
}
