const isDev = process.env.NODE_ENV !== "production";

const imagekitHost = (() => {
  try {
    return new URL(process.env.IMAGEKIT_URL_ENDPOINT).hostname;
  } catch {
    return "ik.imagekit.io";
  }
})();

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval' " : ""}https://checkout.razorpay.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://${imagekitHost} https://ik.imagekit.io https://*.razorpay.com`,
  `media-src 'self' blob: https://${imagekitHost} https://ik.imagekit.io`,
  "font-src 'self' data:",
  "connect-src 'self' https://upload.imagekit.io https://*.razorpay.com",
  "frame-src https://api.razorpay.com https://checkout.razorpay.com https://www.youtube.com https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: imagekitHost }],
  },
  async rewrites() {
    return [{ source: "/health", destination: "/api/health" }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
