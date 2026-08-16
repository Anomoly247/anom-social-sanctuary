/**
 * Product features that depend on another administrator-controlled feature.
 * Required safety systems such as reporting and blocking are intentionally
 * omitted: they are server-enforced platform safeguards, not owner toggles.
 */
export const CONFIGURABLE_FEATURE_PREREQUISITES = {
  activity_feed_ratings: ["activity_feed"],
} as const;

export function getUnmetConfigurablePrerequisites(
  flagKey: string,
  flags: Record<string, boolean>,
): string[] {
  const prerequisites = CONFIGURABLE_FEATURE_PREREQUISITES[
    flagKey as keyof typeof CONFIGURABLE_FEATURE_PREREQUISITES
  ] ?? [];

  return prerequisites.filter((prerequisite) => !flags[prerequisite]);
}
