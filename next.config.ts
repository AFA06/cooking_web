import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
