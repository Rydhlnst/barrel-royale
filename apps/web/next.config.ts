import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // a self-contained server in .next/standalone, which the Docker image runs
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // D:\Projects\Freelance has its own lockfile and postcss config; without this
    // Turbopack takes that folder as the root and picks them up. Tailwind runs
    // through postcss.config.mjs here: the @tailwindcss/turbopack loader kept
    // serving stale CSS in dev.
    root: path.join(__dirname),
  },
};

export default nextConfig;
