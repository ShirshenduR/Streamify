"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addSongToPlaylist,
  clearHistory,
  createPlaylist,
  deletePlaylist,
  getDiscover,
  getHistory,
  getLikedSongs,
  getPlaylist,
  getPlaylists,
  getRecommendations,
  likeSong,
  removeSongFromPlaylist,
  renamePlaylist,
  reorderPlaylist,
  searchSongs,
  unlikeSong,
} from "./api";

/* -------------------------------------------------------------------------- */
/* queries                                                                    */
/* -------------------------------------------------------------------------- */

export const queryKeys = {
  discover: (limit) => ["discover", limit],
  search: (term, limit) => ["search", term, limit],
  recommendations: (userId, limit) => ["recommendations", userId, limit],
  liked: (userId) => ["liked", userId],
  history: (userId) => ["history", userId],
  playlists: (userId) => ["playlists", userId],
  playlist: (userId, playlistId) => ["playlist", userId, playlistId],
};

const FIVE_MINUTES = 5 * 60 * 1000;

export function useDiscover(limit = 12, refresh = 0) {
  return useQuery({
    queryKey: [...queryKeys.discover(limit), refresh],
    queryFn: ({ signal }) => getDiscover({ limit, signal, refresh: refresh > 0 }),
    staleTime: 10 * FIVE_MINUTES,
  });
}

export function useSearch(term, { limit = 24, enabled = true, refresh = 0 } = {}) {
  const trimmed = term.trim();
  return useQuery({
    queryKey: [...queryKeys.search(trimmed, limit), refresh],
    queryFn: ({ signal }) => searchSongs(trimmed, { limit, signal, refresh: refresh > 0 }),
    enabled: enabled && trimmed.length >= 2,
    staleTime: FIVE_MINUTES,
    placeholderData: (previous) => previous,
  });
}

export function useRecommendations(userId, limit = 24, refresh = 0) {
  return useQuery({
    queryKey: [...queryKeys.recommendations(userId, limit), refresh],
    queryFn: ({ signal }) =>
      getRecommendations(userId, { limit, signal, refresh: refresh > 0 }),
    enabled: Boolean(userId),
    staleTime: FIVE_MINUTES,
  });
}

export function useLikedSongs(userId) {
  return useQuery({
    queryKey: queryKeys.liked(userId),
    queryFn: ({ signal }) => getLikedSongs(userId, { signal }),
    enabled: Boolean(userId),
    staleTime: FIVE_MINUTES,
  });
}

export function useHistory(userId, limit = 30) {
  return useQuery({
    queryKey: queryKeys.history(userId),
    queryFn: ({ signal }) => getHistory(userId, { limit, signal }),
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
  });
}

export function usePlaylists(userId) {
  return useQuery({
    queryKey: queryKeys.playlists(userId),
    queryFn: ({ signal }) => getPlaylists(userId, { signal }),
    enabled: Boolean(userId),
    staleTime: FIVE_MINUTES,
  });
}

export function usePlaylist(userId, playlistId) {
  return useQuery({
    queryKey: queryKeys.playlist(userId, playlistId),
    queryFn: ({ signal }) => getPlaylist(userId, playlistId, { signal }),
    enabled: Boolean(userId) && Boolean(playlistId),
    staleTime: FIVE_MINUTES,
  });
}

/* -------------------------------------------------------------------------- */
/* mutations                                                                  */
/* -------------------------------------------------------------------------- */

/** Like/unlike with an optimistic update so the heart never lags behind the tap. */
export function useToggleLike(userId) {
  const queryClient = useQueryClient();
  const key = queryKeys.liked(userId);

  return useMutation({
    mutationFn: ({ song, liked }) => (liked ? unlikeSong(userId, song) : likeSong(userId, song)),
    onMutate: async ({ song, liked }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (current) => {
        const songs = current?.songs ?? [];
        const nextSongs = liked
          ? songs.filter((item) => item.id !== song.id)
          : [{ ...song, source: "jiosaavn", likedAt: new Date().toISOString() }, ...songs];
        return { ...(current ?? {}), songs: nextSongs };
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData(key, context.previous);
    },
    onSuccess: () => {
      // Liked artists feed the recommender, so its cached page is now stale.
      queryClient.invalidateQueries({ queryKey: ["recommendations", userId] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useCreatePlaylist(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name) => createPlaylist(userId, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.playlists(userId) }),
  });
}

export function useRenamePlaylist(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, name }) => renamePlaylist(userId, playlistId, name),
    onSuccess: (_data, { playlistId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.playlist(userId, playlistId) });
    },
  });
}

export function useDeletePlaylist(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playlistId) => deletePlaylist(userId, playlistId),
    onSuccess: (_data, playlistId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists(userId) });
      queryClient.removeQueries({ queryKey: queryKeys.playlist(userId, playlistId) });
    },
  });
}

export function useAddToPlaylist(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, song }) => addSongToPlaylist(userId, playlistId, song),
    onSuccess: (_data, { playlistId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.playlist(userId, playlistId) });
    },
  });
}

export function useRemoveFromPlaylist(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, songId }) => removeSongFromPlaylist(userId, playlistId, songId),
    onSuccess: (_data, { playlistId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.playlist(userId, playlistId) });
    },
  });
}

export function useReorderPlaylist(userId) {
  const queryClient = useQueryClient();
  const key = (playlistId) => queryKeys.playlist(userId, playlistId);
  return useMutation({
    mutationFn: ({ playlistId, order }) => reorderPlaylist(userId, playlistId, order),
    onMutate: async ({ playlistId, songs }) => {
      await queryClient.cancelQueries({ queryKey: key(playlistId) });
      const previous = queryClient.getQueryData(key(playlistId));
      if (songs) queryClient.setQueryData(key(playlistId), (current) => ({ ...current, songs }));
      return { previous, playlistId };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(key(context.playlistId), context.previous);
      }
    },
    onSettled: (_data, _error, { playlistId }) => {
      queryClient.invalidateQueries({ queryKey: key(playlistId) });
    },
  });
}

export function useClearHistory(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clearHistory(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.history(userId) });
      queryClient.invalidateQueries({ queryKey: ["recommendations", userId] });
    },
  });
}
