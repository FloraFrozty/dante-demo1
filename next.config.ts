import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Add this to allow CORS from your backend
  allowedDevOrigins: ["https://dante-demo1.vercel.app", "http://localhost:8080"],
};

export default nextConfig;
