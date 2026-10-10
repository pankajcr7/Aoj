import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The membership card PDF (download route and approval email) reads these from disk at runtime.
  outputFileTracingIncludes: { "/**": ["./public/logo.jpeg", "./public/General-Secretary-Sign.png"] },
};

export default nextConfig;
