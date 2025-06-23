import React, { useState, useRef, useCallback, useEffect } from 'react';
import PlayerContext from './PlayerContext';
import { downloadSong, getLikedSongs, likeSong as likeSongApi, unlikeSong as unlikeSongApi, searchSongs } from '../utils/api';

export function PlayerProvider({ children }) {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [likedSongs, setLikedSongs] = useState([]);
  const [playedSongIds, setPlayedSongIds] = useState([]);
  const [history, setHistory] = useState([]); // Add history stack
  const audioRef = useRef(new window.Audio());
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    getLikedSongs().then(data => setLikedSongs(data.songs || []));
  }, []);

  const playSong = useCallback(async (song, songs = null, isPrev = false) => {
    let songToPlay = song;
    if (!song.id || typeof song.id !== 'string' || song.id.startsWith('http')) {
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
      newPlaylist = songs.filter((s, idx, arr) => arr.findIndex(ss => ss.id === s.id) === idx);
      newIndex = newPlaylist.findIndex(s => s.id === song.id);
      setPlaylist(newPlaylist);
      setCurrentIndex(newIndex);
    } else {
      setPlaylist([songToPlay]);
      setCurrentIndex(0);
    }
    if (!isPrev && currentSong) {
      setHistory(prev => [...prev, currentSong]);
    }
    setCurrentSong(songToPlay);
    setPlayedSongIds(prev => [...prev, songToPlay.id]);
    const audio = audioRef.current;
    audio.src = songToPlay.url;
    audio.currentTime = 0;
    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, [currentSong]);

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

  const getRandomSimilarSong = useCallback(async (currentSong) => {
    let query = '';
    if (currentSong && currentSong.artist) {
      query = currentSong.artist.split(',')[0];
    } else if (currentSong && currentSong.title) {
      query = currentSong.title.split(' ')[0];
    } else {
      query = 'top';
    }
    let results = await searchSongs(query);
    results = results.filter(s => s.source === 'jiosaavn' && s.id !== currentSong.id && !playedSongIds.includes(s.id));
    if (results.length === 0) {
      results = await searchSongs('top');
      results = results.filter(s => s.source === 'jiosaavn' && s.id !== currentSong.id && !playedSongIds.includes(s.id));
    }
    if (results.length > 0) {
      return results[Math.floor(Math.random() * results.length)];
    }
    return null;
  }, [playedSongIds]);

  const nextSong = useCallback(async () => {
    if (currentSong) {
      const next = await getRandomSimilarSong(currentSong);
      if (next) {
        await playSong(next);
      }
    }
  }, [currentSong, playSong, getRandomSimilarSong]);

  const prevSong = useCallback(async () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(h => h.slice(0, -1));
      await playSong(prev, null, true);
    } else if (currentSong) {
      const prev = await getRandomSimilarSong(currentSong);
      if (prev) {
        await playSong(prev, null, true);
      }
    }
  }, [history, currentSong, playSong, getRandomSimilarSong]);

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
