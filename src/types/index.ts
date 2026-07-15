/**
 * Shared domain + engine types for the Vente Site Engine.
 */

/** Rendering quality tiers. Drives DPR, effects, texture sizes, media strategy. */
export type QualityTier = "ULTRA" | "BALANCED" | "LITE";

/** How a given "controlled video" experience should be delivered. */
export type CinematicEngine =
  | "webgl" // true 3D via R3F
  | "image-sequence" // canvas frame scrubbing
  | "video-scrub" // native <video> currentTime scrub
  | "parallax" // 2.5D layered photo
  | "static"; // poster / no motion

/** Device + user capability snapshot used to pick a quality tier. */
export interface DeviceProfile {
  tier: QualityTier;
  webgl: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  coarsePointer: boolean;
  deviceMemoryGb: number | null;
  hardwareConcurrency: number | null;
  dpr: number;
}

/** Local business categories we ship SEO generators for. */
export type BusinessCategory =
  | "AutomotiveBusiness"
  | "AutoDealer"
  | "HealthAndBeautyBusiness"
  | "BeautySalon"
  | "Restaurant"
  | "Hotel"
  | "ProfessionalService"
  | "LocalBusiness";

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface PostalAddress {
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
}

export interface OpeningHours {
  /** Day names per schema.org, e.g. "Monday". */
  dayOfWeek: string[];
  opens: string; // "09:00"
  closes: string; // "18:00"
}

/** Central, source-of-truth business config for a single client site. */
export interface BusinessConfig {
  name: string;
  legalName?: string;
  category: BusinessCategory;
  description: string;
  url: string;
  telephone?: string;
  email?: string;
  address?: PostalAddress;
  geo?: GeoPoint;
  openingHours?: OpeningHours[];
  priceRange?: string;
  sameAs?: string[]; // social profiles
  /**
   * VERIFIED public facts only. Ratings/reviews/awards MUST come from the
   * client brief with confirmed sources — never invented. Left undefined here.
   */
  areaServed?: string[];
}

/** Analytics event names (closed set — see src/lib/analytics). */
export type AnalyticsEventName =
  | "page_view"
  | "cta_clicked"
  | "phone_clicked"
  | "directions_clicked"
  | "booking_started"
  | "booking_completed"
  | "form_started"
  | "form_submitted"
  | "service_viewed"
  | "product_viewed"
  | "cinematic_scene_started"
  | "cinematic_scene_completed";

export type AnalyticsPayload = Record<string, string | number | boolean | undefined>;
