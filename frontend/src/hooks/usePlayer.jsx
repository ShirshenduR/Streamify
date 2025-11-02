import {
  downloadSong,
  getLikedSongs,
  likeSong as likeSongApi,
  searchSongs,
  unlikeSong as unlikeSongApi,
} from "@/utils/api";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [likedSongs, setLikedSongs] = useState([]);
  const [playedSongIds, setPlayedSongIds] = useState([]);
  const [history, setHistory] = useState([]); // Add history stack
  const audioRef = useRef(new window.Audio());
  const [volume, setVolume] = useState(1); // 100% volume
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // set audio volume
  const setAudioVolume = (v) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  // get liked songs
  useEffect(() => {
    getLikedSongs().then((data) => setLikedSongs(data.songs || []));
  }, []);

  // play song
  const playSong = useCallback(
    async (song, songs = null, isPrev = false) => {
      console.log("Play song", song);
      let songToPlay = song;
      if (!song.id || typeof song.id !== "string" || song.id.startsWith("http")) {
        return;
      }
      if (song.id) {
        const data = await downloadSong(song.id, song.source);
        const url = data.url || data.downloadUrl || data.audioUrl;
        if (!url) {
          return;
        }
        songToPlay = { ...song, url };
      }
      let newPlaylist = songs;
      let newIndex = 0;
      if (songs && Array.isArray(songs)) {
        newPlaylist = songs.filter((s, idx, arr) => arr.findIndex((ss) => ss.id === s.id) === idx);
        newIndex = newPlaylist.findIndex((s) => s.id === song.id);
        setPlaylist(newPlaylist);
        setCurrentIndex(newIndex);
      } else {
        setPlaylist([songToPlay]);
        setCurrentIndex(0);
      }
      if (!isPrev && currentSong) {
        setHistory((prev) => [...prev, currentSong]);
      }
      setCurrentSong(songToPlay);
      setPlayedSongIds((prev) => [...prev, songToPlay.id]);
      const audio = audioRef.current;
      audio.src = songToPlay.url;
      audio.currentTime = 0;
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    },
    [currentSong]
  );

  // like song
  const likeSongAndSync = useCallback(
    async (song) => {
      const isAlreadyLiked = likedSongs.some((s) => s.id === song.id);
      if (isAlreadyLiked) {
        await unlikeSongApi(song);
      } else {
        await likeSongApi(song);
      }
      getLikedSongs().then((data) => setLikedSongs(data.songs || []));
    },
    [likedSongs]
  );

  // unlike song
  const unlikeSongAndSync = useCallback(async (song) => {
    await unlikeSongApi(song);
    getLikedSongs().then((data) => setLikedSongs(data.songs || []));
  }, []);

  // pause song
  const pauseSong = useCallback(() => {
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  // resume song
  const resumeSong = useCallback(() => {
    audioRef.current.play();
    setIsPlaying(true);
  }, []);

  // get random song
  const getRandomSimilarSong = useCallback(
    async (currentSong) => {
      let query = "";
      if (currentSong && currentSong.artist) {
        query = currentSong.artist.split(",")[0];
      } else if (currentSong && currentSong.title) {
        query = currentSong.title.split(" ")[0];
      } else {
        query = "top";
      }
      let results = await searchSongs(query);
      results = results.filter(
        (s) => s.source === "jiosaavn" && s.id !== currentSong.id && !playedSongIds.includes(s.id)
      );
      if (results.length === 0) {
        results = await searchSongs("top");
        results = results.filter(
          (s) => s.source === "jiosaavn" && s.id !== currentSong.id && !playedSongIds.includes(s.id)
        );
      }
      if (results.length > 0) {
        return results[Math.floor(Math.random() * results.length)];
      }
      return null;
    },
    [playedSongIds]
  );

  // next song
  const nextSong = useCallback(async () => {
    if (currentSong) {
      const next = await getRandomSimilarSong(currentSong);
      if (next) {
        await playSong(next);
      }
    }
  }, [currentSong, playSong, getRandomSimilarSong]);

  // prev song
  const prevSong = useCallback(async () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory((h) => h.slice(0, -1));
      await playSong(prev, null, true);
    } else if (currentSong) {
      const prev = await getRandomSimilarSong(currentSong);
      if (prev) {
        await playSong(prev, null, true);
      }
    }
  }, [history, currentSong, playSong, getRandomSimilarSong]);

  // seek song
  const seek = useCallback((time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  // update on next song
  useEffect(() => {
    const audio = audioRef.current;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => nextSong();
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [nextSong]);

  // handle current song change
  useEffect(() => {
    if ("mediaSession" in navigator && currentSong) {
      let albumArt = null;
      if (currentSong.cover && currentSong.cover.startsWith("http")) {
        albumArt = currentSong.cover;
      } else if (currentSong.imageUrl && currentSong.imageUrl.startsWith("http")) {
        albumArt = currentSong.imageUrl;
      } else if (currentSong.image && currentSong.image.startsWith("http")) {
        albumArt = currentSong.image;
      } else {
        albumArt = "https://upload.wikimedia.org/wikipedia/commons/4/4f/Music_note.png";
      }
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentSong.title || "",
        artist: currentSong.artist || "",
        album: currentSong.album || "",
        artwork: [
          { src: albumArt, sizes: "512x512", type: "image/png" },
          { src: albumArt, sizes: "256x256", type: "image/png" },
          { src: albumArt, sizes: "128x128", type: "image/png" },
        ],
      });
      navigator.mediaSession.setActionHandler("play", resumeSong);
      navigator.mediaSession.setActionHandler("pause", pauseSong);
      navigator.mediaSession.setActionHandler("previoustrack", prevSong);
      navigator.mediaSession.setActionHandler("nexttrack", nextSong);
    }
  }, [currentSong, isPlaying, resumeSong, pauseSong, prevSong, nextSong]);

  // return provider context
  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        playSong,
        pauseSong,
        resumeSong,
        nextSong,
        prevSong,
        seek,
        duration,
        currentTime,
        playlist,
        currentIndex,
        likedSongs,
        likeSong: likeSongAndSync,
        unlikeSong: unlikeSongAndSync,
        audioRef, // expose audioRef
        volume, // expose current volume
        setAudioVolume, // expose volume setter
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

// use player hook
export function usePlayer() {
  return useContext(PlayerContext);
}

export default PlayerProvider;
