/**
 * Server entry point for the bundled JioSaavn API.
 *
 * Streamify runs the JioSaavn API inside its own container so music comes from a
 * service it controls, instead of a shared public instance that rate-limits and
 * IP-bans its callers (saavn.sumit.co answered this project's network with
 * Cloudflare "error code: 1027" on every route).
 *
 * The upstream project (github.com/ShirshenduR/jiosaavn) only *exports* its Hono
 * app — it targets Cloudflare Workers, where the platform supplies the HTTP
 * runtime — and nothing in it ever opens a socket. This is the missing entry
 * point for running it as a plain Node process.
 */

import { serve } from "@hono/node-server";

import app from "./dist/server.js";

// Loopback only. Django calls this server-side; the browser never reaches it, so
// it is not exposed on the container's public port.
const PORT = 8123;
const HOST = "127.0.0.1";

serve({ fetch: app.fetch, port: PORT, hostname: HOST }, (info) => {
  console.log(`[saavn-api] listening on http://${HOST}:${info.port}`);
});
