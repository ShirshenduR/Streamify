export const APP_NAME = "Streamify";
export const APP_TAGLINE = "Stream and download millions of songs";
export const APP_DESCRIPTION =
  "Streamify is a free, ad-free music streaming web app. Search millions of songs, build playlists, get personalised recommendations and download tracks for offline listening.";

export const NAV_LINKS = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/search", label: "Search", icon: "search" },
  { href: "/for-you", label: "For you", icon: "sparkles" },
  { href: "/library", label: "Library", icon: "library" },
];

export const MOBILE_NAV_LINKS = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/search", label: "Search", icon: "search" },
  { href: "/for-you", label: "For you", icon: "sparkles" },
  { href: "/library", label: "Library", icon: "library" },
];

/**
 * Gradients for the mood tiles. Keyed by the mood label the API returns, with a
 * deterministic fallback so a new server-side mood still renders nicely.
 */
export const MOOD_GRADIENTS = {
  Pop: "from-violet-500 to-fuchsia-500",
  "Hip-Hop": "from-amber-500 to-orange-600",
  Rock: "from-rose-500 to-red-600",
  "Lo-fi": "from-teal-500 to-emerald-600",
  Chill: "from-sky-500 to-indigo-500",
  Workout: "from-lime-500 to-green-600",
  Romance: "from-pink-500 to-rose-600",
  Party: "from-fuchsia-500 to-purple-600",
  Indie: "from-cyan-500 to-blue-600",
  Electronic: "from-indigo-500 to-violet-600",
  Bollywood: "from-orange-500 to-pink-600",
  Focus: "from-slate-500 to-zinc-600",
};

export const FALLBACK_GRADIENTS = [
  "from-violet-500 to-fuchsia-500",
  "from-sky-500 to-indigo-500",
  "from-rose-500 to-red-600",
  "from-teal-500 to-emerald-600",
  "from-amber-500 to-orange-600",
  "from-fuchsia-500 to-purple-600",
];

export function gradientFor(label = "") {
  if (MOOD_GRADIENTS[label]) return MOOD_GRADIENTS[label];
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) hash = (hash * 31 + label.charCodeAt(i)) % 997;
  return FALLBACK_GRADIENTS[hash % FALLBACK_GRADIENTS.length];
}

export const REPEAT_MODES = ["off", "all", "one"];
