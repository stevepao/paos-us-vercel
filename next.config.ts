import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  // Keep Worker-native SMTP off the Next/OpenNext esbuild graph so
  // `cloudflare:sockets` is resolved by workerd at runtime.
  serverExternalPackages: ["@workermailer/smtp"],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "paos.us",
      },
      {
        protocol: "https",
        hostname: "api.paos.us",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

// Only for `next dev` — bindings/preview helpers; skip during `next build`.
if (process.env.NODE_ENV === "development") {
  void import("@opennextjs/cloudflare").then(
    ({ initOpenNextCloudflareForDev }) => {
      initOpenNextCloudflareForDev();
    },
  );
}
