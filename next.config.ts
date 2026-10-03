import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The membership card PDF reads the logo from disk at runtime.
  outputFileTracingIncludes: { "/api/card/*": ["./public/logo.jpeg"] },
};

export default nextConfig;
