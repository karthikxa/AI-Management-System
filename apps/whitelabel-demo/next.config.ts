import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // The entire data layer is the @zed/sdk workspace package (TS source) — transpile it.
  transpilePackages: ['@zed/sdk'],
};

export default config;
