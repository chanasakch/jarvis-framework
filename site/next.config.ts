import type { NextConfig } from "next";

// Static export for GitHub Pages. basePath is only set when deploying to a project
// page (https://org.github.io/repo/); leave SITE_BASE_PATH unset for a user/org page
// or a custom domain (see site/README.md and .github/workflows/site.yml).
const basePath = process.env.SITE_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  // Next asks for this to also apply to non-HTML assets when basePath is set.
  assetPrefix: basePath ? `${basePath}/` : undefined,
  trailingSlash: true,
  images: {
    // No image optimization server exists on static hosting.
    unoptimized: true,
  },
  typescript: {
    // The build script always runs `tsc --noEmit` first; don't duplicate the check
    // (and don't let it silently mask a distinct next-build-only failure).
    ignoreBuildErrors: false,
  },
  // Next 16 dropped the built-in `eslint` build-step config entirely; lint runs as its
  // own script/CI step instead (package.json "lint" / .github/workflows/site.yml).
};

export default nextConfig;
