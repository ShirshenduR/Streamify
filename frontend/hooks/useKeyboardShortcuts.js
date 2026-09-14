"use client";

import { useEffect, useRef } from "react";

import { usePlayer } from "./usePlayer";

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/**
 * Global media keys, in the style of a desktop music player.
 *
 * Space / K  play-pause · ← → seek 5s · Shift + ← → previous/next
 * ↑ ↓ volume · M mute · S shuffle · R repeat · L like
 */
export function useKeyboardShortcuts({ onToggleLike } = {}) {
  const player = usePlayer();
  const playerRef = useRef(player);

  // Keeps the listener stable: it would otherwise be re-bound on every
  // timeupdate tick during playback.
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  const likeRef = useRef(onToggleLike);
  useEffect(() => {
    likeRef.current = onToggleLike;
  }, [onToggleLike]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (EDITABLE_TAGS.has(target.tagName) || target.isContentEditable)
      ) {
        return;
      }

      const actions = playerRef.current;
      switch (event.key) {
        case " ":
        case "k":
          event.preventDefault();
          actions.toggle();
          break;
        case "ArrowRight":
          event.preventDefault();
          if (event.shiftKey) actions.next();
          else actions.seekBy(5);
          break;
        case "ArrowLeft":
          event.preventDefault();
          if (event.shiftKey) actions.previous();
          else actions.seekBy(-5);
          break;
        case "ArrowUp":
          event.preventDefault();
          actions.setVolume(actions.volume + actions.volumeStep);
          break;
        case "ArrowDown":
          event.preventDefault();
          actions.setVolume(actions.volume - actions.volumeStep);
          break;
        case "m":
          actions.toggleMute();
          break;
        case "s":
          actions.toggleShuffle();
          break;
        case "r":
          actions.cycleRepeat();
          break;
        case "l":
          if (actions.currentSong && likeRef.current) likeRef.current(actions.currentSong);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
