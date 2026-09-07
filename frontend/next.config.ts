import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  allowedDevOrigins: [
    "192.168.1.7",
    "192.168.1.7:3000",
    "localhost:3000",
    "127.0.0.1:3000",
    "192.168.*.*",
    "10.*.*.*",
    "172.*.*.*",
  ],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:4000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl.replace(/\/+$/, '')}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
