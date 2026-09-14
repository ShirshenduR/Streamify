import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Django runs inside the same container as Next (see the root Dockerfile), so
 * every /api call is proxied on the server side. That keeps the browser talking
 * to a single origin: no CORS, no extra service, one deployable web service.
 *
 * VITE_BACKEND_API_URL keeps its existing name and is only read here, at server
 * start, to decide the proxy target. The default is where Django listens.
 */
const backendOrigin = (process.env.VITE_BACKEND_API_URL || "http://127.0.0.1:8000").replace(
  /\/+$/,
  ""
);

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  poweredByHeader: false,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  // Pinned so the standalone bundle is traced from this directory rather than
  // from whichever lockfile happens to sit higher up the filesystem.
  outputFileTracingRoot: projectRoot,
  // Without this, Next 308-redirects any URL with a trailing slash to the
  // slash-less form *before* rewrites run — which silently broke every
  // `/api/.../` call to Django. Django's URLconf keeps its trailing slashes, so
  // the proxy must pass them through untouched.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return {
      // afterFiles => real app routes (like /api/config) win over the proxy,
      // everything else under these prefixes is handed to Django.
      afterFiles: [
        { source: "/api/:path*", destination: `${backendOrigin}/api/:path*` },
        // Django's admin lives on the same origin too, otherwise it would be
        // unreachable in the single-service deployment. Its assets come from
        // WhiteNoise under /static/.
        { source: "/admin/:path*", destination: `${backendOrigin}/admin/:path*` },
        { source: "/static/:path*", destination: `${backendOrigin}/static/:path*` },
      ],
    };
  },
  async headers() {
    // Next is the public server, so the browser-facing security headers belong
    // here rather than in Django (which only ever sees the proxy's loopback hop).
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      // Ignored over plain http, so it is safe to send unconditionally.
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
    ];

    return [
      { source: "/:path*", headers: security },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
