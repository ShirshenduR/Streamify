import { APP_DESCRIPTION, APP_NAME } from "@/lib/site";

export default function manifest() {
  return {
    name: `${APP_NAME} — music streaming`,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: "/home",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    orientation: "portrait-primary",
    background_color: "#08080B",
    theme_color: "#08080B",
    categories: ["music", "entertainment"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/streamify-logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "Search", short_name: "Search", url: "/search" },
      { name: "For you", short_name: "For you", url: "/for-you" },
      { name: "Library", short_name: "Library", url: "/library" },
    ],
  };
}
