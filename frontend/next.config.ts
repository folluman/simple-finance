import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const isDev = process.env.NODE_ENV === 'development';

    return [
      {
        source: '/api/:path*',
        destination: isDev 
          ? 'http://localhost:3001/api/:path*' 
          : 'https://simple-finance-wenu.onrender.com/api/:path*', 
      },
    ]
  },
};

export default nextConfig;