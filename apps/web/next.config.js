/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const withPWA = require('next-pwa')({
  dest:            'public',
  disable:         process.env.NODE_ENV === 'development',
  register:        true,
  skipWaiting:     true,
  sw:              'sw.js',
  publicExcludes:  ['!icons/**/*'],
  buildExcludes:   [/middleware-manifest\.json$/],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Transpile monorepo packages
  transpilePackages: ['@hrms/types', '@hrms/email-templates'],

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname:  '*.supabase.co',
        pathname:  '/storage/v1/object/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Path aliases (mirrors tsconfig.json)
  // Note: handled by tsconfig — Next.js reads them automatically

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-Content-Type-Options',     value: 'nosniff' },
          { key: 'Referrer-Policy',             value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',          value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",  // unsafe-eval needed by Next.js dev
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL} wss://*.supabase.co ${process.env.NEXT_PUBLIC_SOCKET_URL}`,
              "img-src 'self' blob: data: https://*.supabase.co",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(withPWA(nextConfig));
