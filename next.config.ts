import type { NextConfig } from "next";

/**
 * Next.js configuration for the Vente Site Engine template.
 *
 * Notes:
 * - `transpilePackages` covers three.js ecosystem packages that ship ESM/JSX.
 * - AVIF/WebP enabled for `next/image` so the asset pipeline output is served
 *   in modern formats with automatic fallback.
 * - No telemetry, no analytics, no secrets. Everything opt-in via env.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    formats: ["image/avif", "image/webp"],
    // Remote patterns are intentionally empty: a client site adds only the
    // hosts it actually uses. Local /public assets need no config.
    remotePatterns: [],
    // The template's own placeholder art is SVG. Allowed with a strict CSP so
    // the optimizer will serve them. Client sites replace these with raster
    // photos; keep this only if you intentionally serve trusted SVGs.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // three / R3F / drei ship untranspiled modern syntax in a few subpaths.
  transpilePackages: [
    "three",
    "@react-three/fiber",
    "@react-three/drei",
    "@react-three/postprocessing",
    "postprocessing",
    "maath",
  ],

  experimental: {
    // Keep heavy 3D/animation libs out of the server bundle where possible.
    optimizePackageImports: ["lucide-react", "motion", "@react-three/drei"],
  },
};

export default nextConfig;
