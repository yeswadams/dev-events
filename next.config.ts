import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 eperimental: {
  turbopackFileSystemCacheForDev: true,
 }
};

export default nextConfig;
