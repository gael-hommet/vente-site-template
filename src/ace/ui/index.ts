/**
 * ace-ui — façade over the UI primitives. Client sites and future ACE tooling
 * import primitives from here; the implementation stays in src/components/ui.
 * Everything below consumes the Design Language tokens (never hardcoded
 * colors), so it restyles automatically under any preset.
 */

export * from "@/components/ui";
export { cn } from "@/lib/utils";
