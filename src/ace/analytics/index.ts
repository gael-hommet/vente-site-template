/**
 * ace-analytics — typed, consent-friendly analytics. `track()` fans out to the
 * provider named by NEXT_PUBLIC_ANALYTICS_PROVIDER; nothing is enabled by
 * default and no tracker is bundled. Event names form a closed set — adding
 * one is a deliberate engine change, not a string typo.
 */

export { track } from "@/lib/analytics/track";
export type { AnalyticsEventName, AnalyticsPayload } from "@/types";
