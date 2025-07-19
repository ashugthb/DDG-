import type { NextConfig } from "next";

// Allow deploying the app on GitHub Pages by reading the base path from
// NEXT_PUBLIC_BASE_PATH. When exporting, the output will be static so it can
// be hosted via GitHub Pages.
const repoBase = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: repoBase,
  assetPrefix: repoBase ? `${repoBase}/` : undefined,
};

export default nextConfig;
