import type { NextConfig } from 'next'

// Allow overriding API hostname via env so Vercel env vars control it.
// e.g. NEXT_PUBLIC_API_HOST=lendora-api.onrender.com
const apiHost = process.env['NEXT_PUBLIC_API_HOST'] ?? 'localhost'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      // Placeholder / stock images used in seed data
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'loremflickr.com' },
      { protocol: 'https', hostname: 'live.staticflickr.com' },
      { protocol: 'https', hostname: '*.staticflickr.com' },
      // Cloudinary CDN (production uploads)
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // API server (static /uploads in dev, or Render host in prod)
      { protocol: 'https', hostname: apiHost },
      // Local development
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'http',  hostname: 'localhost', port: '4000' },
      { protocol: 'http',  hostname: '127.0.0.1' },
      { protocol: 'http',  hostname: '127.0.0.1', port: '4000' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
}

export default nextConfig
