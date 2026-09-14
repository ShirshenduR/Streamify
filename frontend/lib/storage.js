/** localStorage helpers that never throw (Safari private mode, disabled storage). */

export function readStore(key, fallback = null) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeStore(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded or storage disabled — preferences are best-effort */
  }
}

export function removeStore(key) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export const STORE_KEYS = {
  volume: "streamify:volume",
  muted: "streamify:muted",
  repeat: "streamify:repeat",
  shuffle: "streamify:shuffle",
  recentSearches: "streamify:recent-searches",
  installDismissed: "streamify:install-dismissed",
  position: (songId) => `streamify:position:${songId}`,
};

export function pushRecentSearch(term, limit = 8) {
  const value = String(term ?? "").trim();
  if (!value) return readStore(STORE_KEYS.recentSearches, []);
  const existing = readStore(STORE_KEYS.recentSearches, []);
  const list = Array.isArray(existing) ? existing : [];
  const next = [value, ...list.filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(
    0,
    limit
  );
  writeStore(STORE_KEYS.recentSearches, next);
  return next;
}
