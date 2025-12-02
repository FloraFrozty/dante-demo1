import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Add this to allow CORS from your backend
  allowedDevOrigins: ["https://dante-backend.onrender.com", "http://localhost:8080"],
};

export default nextConfig;
