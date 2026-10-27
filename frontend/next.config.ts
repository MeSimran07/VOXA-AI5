import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  typescript: {
    // Skip type checking during build (handled locally, saves RAM on EC2)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
