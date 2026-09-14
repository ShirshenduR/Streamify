"use client";

import { useCallback, useMemo } from "react";

import { useAuth } from "./useAuth";
import { useLikedSongs, useToggleLike } from "@/lib/queries";

/**
 * Single source of truth for "is this track liked?".
 *
 * The liked list lives in the React Query cache, so the heart in the player, the
 * now-playing sheet and every list share one optimistic update path.
 */
export function useLikeState() {
  const { uid } = useAuth();
  const likedQuery = useLikedSongs(uid);
  const toggleLike = useToggleLike(uid);

  const likedIds = useMemo(
    () => new Set((likedQuery.data?.songs ?? []).map((song) => song.id)),
    [likedQuery.data]
  );

  const isLiked = useCallback((songId) => likedIds.has(songId), [likedIds]);

  const toggle = useCallback(
    (song) => {
      if (!song?.id || !uid) return;
      toggleLike.mutate({ song, liked: likedIds.has(song.id) });
    },
    [toggleLike, likedIds, uid]
  );

  return {
    likedSongs: likedQuery.data?.songs ?? [],
    likedIds,
    isLiked,
    toggle,
    isLoading: likedQuery.isLoading,
  };
}
