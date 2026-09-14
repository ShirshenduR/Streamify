"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getRadio, recordPlay, resolveStreamUrl } from "@/lib/api";
import { REPEAT_MODES } from "@/lib/site";
import { readStore, STORE_KEYS, writeStore } from "@/lib/storage";

import { useAuth } from "./useAuth";

const PlayerContext = createContext(null);

const POSITION_SAVE_INTERVAL_MS = 5000;
const RESUME_AFTER_SECONDS = 15;
const RADIO_BATCH = 6;
const MAX_RADIO_EXCLUDES = 40;
const RECORD_DEDUPE_MS = 5000;
const VOLUME_STEP = 0.05;

const clamp01 = (value) => Math.min(1, Math.max(0, value));

function dedupeById(list) {
  const seen = new Set();
  return list.filter((song) => {
    if (!song?.id || seen.has(song.id)) return false;
    seen.add(song.id);
    return true;
  });
}

/** Fisher-Yates around the current track, which stays at position 0. */
function shuffleAround(list, startIndex) {
  const current = list[startIndex];
  const rest = list.filter((_, position) => position !== startIndex);
  for (let i = rest.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [current, ...rest];
}

export function PlayerProvider({ children }) {
  const { uid } = useAuth();

  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(-1);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [repeat, setRepeat] = useState("off");
  const [shuffle, setShuffle] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);
  const [sleepEndsAt, setSleepEndsAt] = useState(null);
  const [isLoadingRadio, setIsLoadingRadio] = useState(false);
  const [audioReady, setAudioReady] = useState(false);

  const audioRef = useRef(null);
  const queueRef = useRef([]);
  const indexRef = useRef(-1);
  const currentSongRef = useRef(null);
  const originalQueueRef = useRef(null);
  const playedIdsRef = useRef(new Set());
  const lastRecordRef = useRef({ id: null, at: 0 });
  const lastPositionSaveRef = useRef(0);
  const sleepTimeoutRef = useRef(null);
  const nextRef = useRef(() => {});

  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  /* ---------------------------------------------------------------- audio --- */

  useEffect(() => {
    const audio = new window.Audio();
    audio.preload = "metadata";
    audioRef.current = audio;
    setAudioReady(true);
    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, []);

  /* ----------------------------------------------------------- preferences -- */

  // Read after mount so the server-rendered markup and the first client render
  // agree; localStorage is not available while rendering on the server.
  useEffect(() => {
    const storedRepeat = readStore(STORE_KEYS.repeat, "off");
    if (REPEAT_MODES.includes(storedRepeat)) setRepeat(storedRepeat);
    setShuffle(Boolean(readStore(STORE_KEYS.shuffle, false)));
    const storedVolume = Number(readStore(STORE_KEYS.volume, 1));
    if (Number.isFinite(storedVolume)) setVolumeState(clamp01(storedVolume));
    setMuted(Boolean(readStore(STORE_KEYS.muted, false)));
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted, audioReady]);

  /* -------------------------------------------------------------- playback -- */

  const loadRadio = useCallback(async (seed) => {
    if (!seed?.id) return [];
    setIsLoadingRadio(true);
    try {
      const exclude = [...playedIdsRef.current].slice(-MAX_RADIO_EXCLUDES);
      const data = await getRadio({
        artist: seed.artist,
        title: seed.title,
        exclude,
        limit: RADIO_BATCH,
      });
      const known = new Set(queueRef.current.map((song) => song.id));
      const fresh = (data?.results ?? []).filter((song) => song?.id && !known.has(song.id));
      if (fresh.length > 0) {
        const merged = [...queueRef.current, ...fresh];
        queueRef.current = merged;
        setQueue(merged);
      }
      return fresh;
    } catch {
      return [];
    } finally {
      setIsLoadingRadio(false);
    }
  }, []);

  const recordPlayOnce = useCallback(
    (song) => {
      if (!uid || !song?.id) return;
      const now = Date.now();
      const last = lastRecordRef.current;
      if (last.id === song.id && now - last.at < RECORD_DEDUPE_MS) return;
      lastRecordRef.current = { id: song.id, at: now };
      // Best-effort: history powers recommendations, but a failure here must
      // never disturb playback.
      recordPlay(uid, song).catch(() => {});
    },
    [uid]
  );

  const startSong = useCallback(
    async (song) => {
      const audio = audioRef.current;
      if (!audio || !song?.id) return;

      setIsLoading(true);
      setPlaybackError(null);
      playedIdsRef.current.add(song.id);

      try {
        const url = await resolveStreamUrl(song);
        if (!url) throw new Error("No playable stream was found for this track.");

        const resumeAt = Number(readStore(STORE_KEYS.position(song.id), 0)) || 0;
        const playable = { ...song, url };

        currentSongRef.current = playable;
        setCurrentSong(playable);
        setDuration(Number(song.duration) || 0);
        setCurrentTime(0);
        setBuffered(0);

        audio.src = url;
        audio.currentTime = 0;

        if (resumeAt > RESUME_AFTER_SECONDS) {
          audio.addEventListener(
            "loadedmetadata",
            function resumeOnce() {
              audio.removeEventListener("loadedmetadata", resumeOnce);
              if (Number.isFinite(audio.duration) && resumeAt < audio.duration - 10) {
                audio.currentTime = resumeAt;
                setCurrentTime(resumeAt);
              }
            },
            { once: true }
          );
        }

        await audio.play();
        setIsPlaying(true);
        setIsLoading(false);
        recordPlayOnce(song);
      } catch (error) {
        setIsLoading(false);
        setIsPlaying(false);
        setPlaybackError({
          message:
            error?.name === "NotAllowedError"
              ? "Your browser blocked playback. Press play to start."
              : (error?.message ?? "Playback failed."),
          song,
        });
      }
    },
    [recordPlayOnce]
  );

  const play = useCallback(
    async (song, list = null) => {
      if (!song?.id) return;

      // Tapping the track that is already loaded toggles instead of restarting.
      if (currentSongRef.current?.id === song.id) {
        const audio = audioRef.current;
        if (audio?.paused) {
          audio.play().then(() => setIsPlaying(true)).catch(() => {});
        } else {
          audio?.pause();
        }
        return;
      }

      let nextQueue;
      let nextIndex;

      if (Array.isArray(list) && list.length > 0) {
        nextQueue = dedupeById(list);
        nextIndex = nextQueue.findIndex((item) => item.id === song.id);
        if (nextIndex === -1) {
          nextQueue = [song, ...nextQueue];
          nextIndex = 0;
        }
      } else {
        nextQueue = [song];
        nextIndex = 0;
      }

      if (shuffle && nextQueue.length > 1) {
        originalQueueRef.current = nextQueue;
        nextQueue = shuffleAround(nextQueue, nextIndex);
        nextIndex = 0;
      } else {
        originalQueueRef.current = null;
      }

      queueRef.current = nextQueue;
      indexRef.current = nextIndex;
      setQueue(nextQueue);
      setIndex(nextIndex);
      await startSong(song);
    },
    [shuffle, startSong]
  );

  const jumpTo = useCallback(
    async (target) => {
      const list = queueRef.current;
      if (target < 0 || target >= list.length) return;
      indexRef.current = target;
      setIndex(target);
      await startSong(list[target]);
    },
    [startSong]
  );

  const next = useCallback(async () => {
    const list = queueRef.current;
    const position = indexRef.current;
    const audio = audioRef.current;
    if (list.length === 0) return;

    if (repeat === "one") {
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      return;
    }

    if (position < list.length - 1) {
      await jumpTo(position + 1);
      return;
    }

    if (repeat === "all") {
      await jumpTo(0);
      return;
    }

    // Queue exhausted: keep playing by building a radio from what just finished.
    const seed = currentSongRef.current ?? list[list.length - 1];
    const appended = await loadRadio(seed);
    if (appended.length > 0) {
      indexRef.current = position + 1;
      setIndex(position + 1);
      await startSong(appended[0]);
    } else {
      setIsPlaying(false);
    }
  }, [repeat, jumpTo, loadRadio, startSong]);

  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  const previous = useCallback(async () => {
    const audio = audioRef.current;
    const position = indexRef.current;

    // Standard behaviour: restart the track unless we're near its start.
    if (audio && audio.currentTime > 5) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    if (position > 0) {
      await jumpTo(position - 1);
    } else if (audio) {
      audio.currentTime = 0;
      setCurrentTime(0);
    }
  }, [jumpTo]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.src) {
      if (currentSongRef.current) startSong(currentSongRef.current);
      return;
    }
    audio.play().catch(() => {
      setPlaybackError({
        message: "Your browser blocked playback. Press play to start.",
        song: currentSongRef.current,
      });
    });
  }, [startSong]);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else resume();
  }, [isPlaying, pause, resume]);

  const seek = useCallback((time) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(time)) return;
    const target = Math.min(Math.max(0, time), Number.isFinite(audio.duration) ? audio.duration : time);
    audio.currentTime = target;
    setCurrentTime(target);
  }, []);

  const seekBy = useCallback(
    (delta) => {
      const audio = audioRef.current;
      if (!audio) return;
      seek(audio.currentTime + delta);
    },
    [seek]
  );

  /* ----------------------------------------------------------- audio wiring -- */

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.buffered.length > 0) {
        setBuffered(audio.buffered.end(audio.buffered.length - 1));
      }
      const now = Date.now();
      if (now - lastPositionSaveRef.current > POSITION_SAVE_INTERVAL_MS) {
        lastPositionSaveRef.current = now;
        const song = currentSongRef.current;
        if (song?.id) writeStore(STORE_KEYS.position(song.id), Math.floor(audio.currentTime));
      }
    };
    const onDurationChange = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onPlaying = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setPlaybackError(null);
    };
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onEnded = () => {
      const song = currentSongRef.current;
      if (song?.id) writeStore(STORE_KEYS.position(song.id), 0);
      nextRef.current();
    };
    const onError = () => {
      // Ignore the error fired by `audio.removeAttribute("src")` during cleanup.
      if (!audio.src) return;
      setIsLoading(false);
      setIsPlaying(false);
      setPlaybackError({
        message: "This track could not be played. The audio source is unavailable.",
        song: currentSongRef.current,
      });
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("loadedmetadata", onDurationChange);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("loadedmetadata", onDurationChange);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [audioReady]);

  /* ------------------------------------------------------------- media keys -- */

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator) || !currentSong) return;
    const artwork = currentSong.cover || "/icons/icon-512.png";
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: currentSong.title || "Unknown title",
      artist: currentSong.artist || "Unknown artist",
      album: currentSong.album || "Streamify",
      artwork: [
        { src: artwork, sizes: "96x96", type: "image/png" },
        { src: artwork, sizes: "512x512", type: "image/png" },
      ],
    });

    const handlers = {
      play: () => resume(),
      pause: () => pause(),
      previoustrack: () => previous(),
      nexttrack: () => next(),
      seekbackward: () => seekBy(-10),
      seekforward: () => seekBy(10),
      seekto: (details) => {
        if (typeof details?.seekTime === "number") seek(details.seekTime);
      },
    };

    for (const [action, handler] of Object.entries(handlers)) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        /* the browser does not support this action */
      }
    }
  }, [currentSong, resume, pause, previous, next, seek, seekBy]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (typeof navigator.mediaSession.setPositionState !== "function") return;
    if (!Number.isFinite(duration) || duration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        position: Math.min(currentTime, duration),
        playbackRate: 1,
      });
    } catch {
      /* position out of range during a seek — harmless */
    }
  }, [currentTime, duration]);

  /* -------------------------------------------------------------- controls -- */

  const setVolume = useCallback(
    (value) => {
      const nextVolume = clamp01(Number(value));
      setVolumeState(nextVolume);
      writeStore(STORE_KEYS.volume, nextVolume);
      if (nextVolume > 0 && muted) {
        setMuted(false);
        writeStore(STORE_KEYS.muted, false);
      }
    },
    [muted]
  );

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      writeStore(STORE_KEYS.muted, !current);
      return !current;
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((current) => {
      const enable = !current;
      writeStore(STORE_KEYS.shuffle, enable);
      const list = queueRef.current;
      const position = indexRef.current;

      if (enable && list.length > 1) {
        originalQueueRef.current = list;
        const shuffled = shuffleAround(list, position);
        queueRef.current = shuffled;
        indexRef.current = 0;
        setQueue(shuffled);
        setIndex(0);
      } else if (!enable && originalQueueRef.current) {
        const restored = originalQueueRef.current;
        const activeId = list[position]?.id;
        const restoredIndex = Math.max(
          0,
          restored.findIndex((song) => song.id === activeId)
        );
        originalQueueRef.current = null;
        queueRef.current = restored;
        indexRef.current = restoredIndex;
        setQueue(restored);
        setIndex(restoredIndex);
      }
      return enable;
    });
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeat((current) => {
      const nextMode = REPEAT_MODES[(REPEAT_MODES.indexOf(current) + 1) % REPEAT_MODES.length];
      writeStore(STORE_KEYS.repeat, nextMode);
      return nextMode;
    });
  }, []);

  const addToQueue = useCallback((song) => {
    if (!song?.id) return;
    const list = queueRef.current;
    if (list.some((item) => item.id === song.id)) return;
    const merged = [...list, song];
    queueRef.current = merged;
    setQueue(merged);
  }, []);

  const playNext = useCallback((song) => {
    if (!song?.id) return;
    const list = [...queueRef.current];
    const position = indexRef.current;
    const filtered = list.filter((item) => item.id !== song.id);
    const insertAt = position < 0 ? 0 : Math.min(position + 1, filtered.length);
    filtered.splice(insertAt, 0, song);
    queueRef.current = filtered;
    setQueue(filtered);
  }, []);

  const removeFromQueue = useCallback((target) => {
    const list = queueRef.current;
    if (target < 0 || target >= list.length) return;
    const filtered = list.filter((_, position) => position !== target);
    const currentPosition = indexRef.current;
    let nextPosition = currentPosition;
    if (target < currentPosition) nextPosition = currentPosition - 1;
    else if (target === currentPosition) nextPosition = Math.min(currentPosition, filtered.length - 1);
    queueRef.current = filtered;
    indexRef.current = nextPosition;
    setQueue(filtered);
    setIndex(nextPosition);
  }, []);

  const clearQueue = useCallback(() => {
    const active = currentSongRef.current;
    const list = active ? [active] : [];
    queueRef.current = list;
    indexRef.current = list.length > 0 ? 0 : -1;
    setQueue(list);
    setIndex(list.length > 0 ? 0 : -1);
  }, []);

  const startRadioFrom = useCallback(
    async (seed) => {
      if (!seed?.id) return;
      const fresh = await loadRadio(seed);
      if (fresh.length > 0) await play(fresh[0], fresh);
      else play(seed, [seed]);
    },
    [loadRadio, play]
  );

  const setSleepTimer = useCallback(
    (minutes) => {
      if (sleepTimeoutRef.current) {
        clearTimeout(sleepTimeoutRef.current);
        sleepTimeoutRef.current = null;
      }
      if (!minutes) {
        setSleepEndsAt(null);
        return;
      }
      setSleepEndsAt(Date.now() + minutes * 60_000);
      sleepTimeoutRef.current = setTimeout(() => {
        audioRef.current?.pause();
        setSleepEndsAt(null);
        sleepTimeoutRef.current = null;
      }, minutes * 60_000);
    },
    []
  );

  useEffect(
    () => () => {
      if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
    },
    []
  );

  const dismissError = useCallback(() => setPlaybackError(null), []);

  const value = useMemo(
    () => ({
      queue,
      index,
      currentSong,
      isPlaying,
      isLoading,
      playbackError,
      dismissError,
      duration,
      currentTime,
      buffered,
      repeat,
      shuffle,
      volume,
      muted,
      sleepEndsAt,
      isLoadingRadio,
      volumeStep: VOLUME_STEP,
      play,
      jumpTo,
      next,
      previous,
      pause,
      resume,
      toggle,
      seek,
      seekBy,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      addToQueue,
      playNext,
      removeFromQueue,
      clearQueue,
      startRadioFrom,
      setSleepTimer,
      isCurrent: (songId) => currentSong?.id === songId,
    }),
    [
      queue,
      index,
      currentSong,
      isPlaying,
      isLoading,
      playbackError,
      dismissError,
      duration,
      currentTime,
      buffered,
      repeat,
      shuffle,
      volume,
      muted,
      sleepEndsAt,
      isLoadingRadio,
      play,
      jumpTo,
      next,
      previous,
      pause,
      resume,
      toggle,
      seek,
      seekBy,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      addToQueue,
      playNext,
      removeFromQueue,
      clearQueue,
      startRadioFrom,
      setSleepTimer,
    ]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used inside PlayerProvider");
  return context;
}

/**
 * Non-throwing variant for components that can render outside the provider —
 * the ambient background is also used on the signed-out login screen.
 */
export function usePlayerOptional() {
  return useContext(PlayerContext);
}
