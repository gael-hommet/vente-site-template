/**
 * ACE — Aurexia Cinematic Engine. Top-level identity barrel.
 *
 * Import the modules by path, not from here (keeps client/server boundaries
 * and bundles clean):
 *
 *   @/ace/core       contracts, registries, version
 *   @/ace/config     Design Language (presets, resolver, <DesignLanguageStyle/>)
 *   @/ace/ui         UI primitives façade
 *   @/ace/motion     GSAP/Motion/Lenis orchestration + Motion Library
 *   @/ace/scenes     adaptive WebGL chain + Scene Library
 *   @/ace/media      media components + anti-CLS contracts
 *   @/ace/content    verified vs [À CONFIRMER] content values
 *   @/ace/seo        metadata + JSON-LD derived from business.ts
 *   @/ace/forms      shared zod schemas + delivery adapter contract
 *   @/ace/analytics  typed env-gated tracking
 *   @/ace/testing    test-only helpers (never import from app code)
 */

export { ACE_NAME, ACE_SHORT_NAME, ACE_VERSION, ACE_MODULES, type AceModuleId } from "./core";
