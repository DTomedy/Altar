import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.flutterwave.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://res.cloudinary.com",
      "font-src 'self' data:",
      "connect-src 'self' https://api.flutterwave.com https://checkout.flutterwave.com",
      "frame-src 'self' https://checkout.flutterwave.com",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  serverExternalPackages: ['jsonwebtoken', 'bcryptjs'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
