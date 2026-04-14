import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["localhost"],
  },
  // bcrypt, multer 등 네이티브 모듈은 번들링 제외
  serverExternalPackages: ["bcrypt", "multer", "@mapbox/node-pre-gyp"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
