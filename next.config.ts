import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Dev only: lets a phone on the same Wi-Fi load the dev server's scripts
  // from this Mac's network address. Update it if the address changes.
  allowedDevOrigins: ["192.168.8.49"],
};

export default nextConfig;
