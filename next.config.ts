import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * What the browser may load on our pages. Next.js needs inline scripts for hydration (and eval in
 * development), the rest is closed down: no plugins, no foreign forms, no framing of our pages, and
 * iframes only for the two video hosts creators can link.
 */
// The browser sends uploads straight to file storage, so that one origin is allowed for requests.
const storageOrigin = process.env.R2_ENDPOINT?.trim() || (process.env.R2_ACCOUNT_ID?.trim() ? `https://${process.env.R2_ACCOUNT_ID.trim()}.r2.cloudflarestorage.com` : "");

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' https:",
  "font-src 'self' data:",
  `connect-src 'self'${storageOrigin ? ` ${storageOrigin}` : ""}${isDev ? " ws: wss:" : ""}`,
  "frame-src https://www.youtube-nocookie.com https://player.vimeo.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Sign-in and recovery pages carry codes and ids in their URLs: never cache them or leak them in a Referer.
        source: "/auth/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
  poweredByHeader: false,
  // Lets a second browser origin (a separate cookie jar) be used against the dev server.
  allowedDevOrigins: ["127.0.0.1"],
  /* config options here */
  images: {
    // Creators link cover images from any https host.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
