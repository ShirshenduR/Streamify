/**
 * Single entry point for the backend API.
 *
 * Every call is same-origin (`/api/...`): the Next server proxies to Django, so
 * there is no CORS involved and no backend URL needs to reach the browser.
 */

const JSON_HEADERS = { "Content-Type": "application/json" };

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, { method = "GET", body, signal, query } = {}) {
  const search = query ? `?${new URLSearchParams(query).toString()}` : "";
  const response = await fetch(`/api${path}${search}`, {
    method,
    signal,
    headers: body === undefined ? undefined : JSON_HEADERS,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const payload = await response.json();
      if (payload?.error) message = payload.error;
    } catch {
      /* non-JSON error body; keep the generic message */
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return null;
  return response.json();
}

/* -------------------------------------------------------------------------- */
/* catalogue                                                                  */
/* -------------------------------------------------------------------------- */

export function searchSongs(query, { limit = 24, signal } = {}) {
  return request("/search/", { query: { q: query, limit }, signal });
}

export function getDiscover({ limit = 12, signal } = {}) {
  return request("/discover/", { query: { limit }, signal });
}

export function getSong(songId, { signal } = {}) {
  return request(`/songs/${encodeURIComponent(songId)}/`, { signal });
}

export function getStreamUrl(songId, { signal } = {}) {
  return request(`/songs/${encodeURIComponent(songId)}/stream/`, { signal });
}

export function getRadio({ artist, title, exclude = [], limit = 10 } = {}) {
  return request("/radio/", {
    query: {
      artist: artist || "",
      title: title || "",
      exclude: exclude.join(","),
      limit,
    },
  });
}

export function downloadUrl(songId) {
  return `/api/songs/${encodeURIComponent(songId)}/download/`;
}

/**
 * Resolve a playable URL for a track.
 *
 * Search results already carry a CDN url, so the common path needs no request at
 * all; anything coming from the database (likes, playlists, history) does.
 */
export async function resolveStreamUrl(song) {
  if (song?.streamUrl) return song.streamUrl;
  if (!song?.id) throw new Error("This track cannot be played.");
  const data = await getStreamUrl(song.id);
  return data?.url || null;
}

/* -------------------------------------------------------------------------- */
/* personalised                                                               */
/* -------------------------------------------------------------------------- */

export function getRecommendations(userId, { limit = 24, signal } = {}) {
  return request("/recommendations/", { query: { user_id: userId, limit }, signal });
}

export function getHistory(userId, { limit = 30, signal } = {}) {
  return request("/history/", { query: { user_id: userId, limit }, signal });
}

export function recordPlay(userId, song) {
  return request("/history/", {
    method: "POST",
    body: {
      user_id: userId,
      song_id: song.id,
      title: song.title,
      artist: song.artist,
      cover: song.cover,
    },
  });
}

export function clearHistory(userId) {
  return request("/history/clear/", { method: "POST", body: { user_id: userId } });
}

/* -------------------------------------------------------------------------- */
/* likes                                                                      */
/* -------------------------------------------------------------------------- */

export function getLikedSongs(userId, { signal } = {}) {
  return request("/liked/", { query: { user_id: userId }, signal });
}

export function likeSong(userId, song) {
  return request("/like/", {
    method: "POST",
    body: {
      user_id: userId,
      song_id: song.id,
      title: song.title,
      artist: song.artist,
      cover: song.cover,
    },
  });
}

export function unlikeSong(userId, song) {
  return request("/unlike/", { method: "POST", body: { user_id: userId, song_id: song.id } });
}

/* -------------------------------------------------------------------------- */
/* playlists                                                                  */
/* -------------------------------------------------------------------------- */

export function getPlaylists(userId, { signal } = {}) {
  return request("/playlists/", { query: { user_id: userId }, signal });
}

export function createPlaylist(userId, name) {
  return request("/playlists/", { method: "POST", body: { user_id: userId, name } });
}

export function getPlaylist(userId, playlistId, { signal } = {}) {
  return request(`/playlists/${playlistId}/`, { query: { user_id: userId }, signal });
}

export function renamePlaylist(userId, playlistId, name) {
  return request(`/playlists/${playlistId}/`, {
    method: "PATCH",
    body: { user_id: userId, name },
  });
}

export function deletePlaylist(userId, playlistId) {
  return request(`/playlists/${playlistId}/`, {
    method: "DELETE",
    query: { user_id: userId },
  });
}

export function addSongToPlaylist(userId, playlistId, song) {
  return request(`/playlists/${playlistId}/songs/`, {
    method: "POST",
    body: {
      user_id: userId,
      song_id: song.id,
      title: song.title,
      artist: song.artist,
      cover: song.cover,
    },
  });
}

export function removeSongFromPlaylist(userId, playlistId, songId) {
  return request(`/playlists/${playlistId}/songs/${encodeURIComponent(songId)}/`, {
    method: "DELETE",
    query: { user_id: userId },
  });
}

export function reorderPlaylist(userId, playlistId, order) {
  return request(`/playlists/${playlistId}/reorder/`, {
    method: "POST",
    body: { user_id: userId, order },
  });
}
