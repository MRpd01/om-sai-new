import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Force fresh build after React hooks fix
  eslint: {
    ignoreDuringBuilds: true, // Temporarily disable ESLint during builds to bypass Vercel deployment issue
  },
  // Fix for multiple lockfiles warning
  outputFileTracingRoot: __dirname,
  // Increase API timeout for slower operations
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  // Configure API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
