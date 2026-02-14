import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  sassOptions: {
    includePaths: ['./src/styles'],
  },
};

export default nextConfig;
