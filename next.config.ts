import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/account/kit/:id/shipping-label',
        destination: '/account/kit/:id/digital-kit',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
