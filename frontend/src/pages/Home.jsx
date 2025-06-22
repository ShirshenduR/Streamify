import React, { useEffect, useState, useRef } from 'react';
import SongCard from '../components/SongCard';
import { searchSongs } from '../utils/api';
import './Home.css';
import { usePlayer } from '../context/usePlayer';
import SearchBar from '../components/SearchBar';

export default function Home({ showSearch, setShowSearch }) {
  const [randomSongs, setRandomSongs] = useState([]);
  const { playSong } = usePlayer();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    searchSongs(randomLetter).then(setRandomSongs);
  }, []);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  useEffect(() => {
    if (searchQuery) {
      searchSongs(searchQuery).then(setSearchResults);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  return (
    <div className="home-page">
      {showSearch && (
        <div className="search-overlay-home">
          <div className="search-overlay-backdrop" onClick={() => setShowSearch(false)} />
          <div className="search-overlay-modal">
            <SearchBar 
              query={searchQuery} 
              setQuery={setSearchQuery} 
              inputRef={searchInputRef}
            />
            <div className="search-overlay-results">
              {searchResults.length === 0 && searchQuery && <div className="no-results">No results found</div>}
              {searchResults.map(song => (
                <SongCard key={song.id} song={song} onClick={s => { playSong(s); setShowSearch(false); }} />
              ))}
            </div>
          </div>
        </div>
      )}
      <h2 className="section-title">Recommended For You</h2>
      <div className="song-grid">
        {randomSongs.map(song => (
          <SongCard key={song.id} song={song} onClick={playSong} />
        ))}
      </div>
    </div>
  );
}
