/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable output standalone for Docker
  output: 'standalone',
  
  // Disable image optimization in development
  images: {
    unoptimized: process.env.NODE_ENV !== 'production',
  },
  
  // Configure environment variables that should be exposed to the browser
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
};

export default nextConfig;
