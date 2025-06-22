import React, { useState, useRef, useCallback, useEffect } from 'react';
import PlayerContext from './PlayerContext';
import { downloadSong, getLikedSongs, likeSong as likeSongApi, unlikeSong as unlikeSongApi } from '../utils/api';

export function PlayerProvider({ children }) {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [likedSongs, setLikedSongs] = useState([]);
  const audioRef = useRef(new window.Audio());
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    getLikedSongs().then(data => setLikedSongs(data.songs || []));
  }, []);

  const playSong = useCallback(async (song, songs = null) => {
    let songToPlay = song;
    if (!song.id || typeof song.id !== 'string' || song.id.startsWith('http')) {
      return;
    }
    if (song.id) {
      const data = await downloadSong(song.id);
      const url = data.url || data.downloadUrl || data.audioUrl;
      if (!url) {
        return;
      }
      songToPlay = { ...song, url };
    }
    if (songs && Array.isArray(songs)) {
      setPlaylist(songs);
      setCurrentIndex(songs.findIndex(s => s.id === song.id));
    } else {
      setPlaylist([songToPlay]);
      setCurrentIndex(0);
    }
    setCurrentSong(songToPlay);
    const audio = audioRef.current;
    audio.src = songToPlay.url;
    audio.currentTime = 0;
    audio.play();
    setIsPlaying(true);
  }, []);

  const likeSongAndSync = useCallback(async (song) => {
    const isAlreadyLiked = likedSongs.some(s => s.id === song.id);
    if (isAlreadyLiked) {
      await unlikeSongApi(song);
    } else {
      await likeSongApi(song);
    }
    getLikedSongs().then(data => setLikedSongs(data.songs || []));
  }, [likedSongs]);

  const unlikeSongAndSync = useCallback(async (song) => {
    await unlikeSongApi(song);
    getLikedSongs().then(data => setLikedSongs(data.songs || []));
  }, []);

  const pauseSong = useCallback(() => {
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  const resumeSong = useCallback(() => {
    audioRef.current.play();
    setIsPlaying(true);
  }, []);

  const nextSong = useCallback(() => {
    if (playlist.length > 0 && currentIndex < playlist.length - 1) {
      playSong(playlist[currentIndex + 1], playlist);
    }
  }, [playlist, currentIndex, playSong]);

  const prevSong = useCallback(() => {
    if (playlist.length > 0 && currentIndex > 0) {
      playSong(playlist[currentIndex - 1], playlist);
    }
  }, [playlist, currentIndex, playSong]);

  const seek = useCallback((time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => nextSong();
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [nextSong]);

  return (
    <PlayerContext.Provider value={{
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
      unlikeSong: unlikeSongAndSync
    }}>
      {children}
    </PlayerContext.Provider>
  );
}
