import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Add this to allow CORS from your backend
  allowedDevOrigins: ["http://localhost:8080"],
};

export default nextConfig;
