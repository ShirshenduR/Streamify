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
    
    const fetchJioSaavnSongs = async () => {
      let allSongs = [];
      for (let i = 0; i < 3; i++) { 
        const randomLetter = letters[Math.floor(Math.random() * letters.length)];
        const results = await searchSongs(randomLetter);
        
        allSongs = allSongs.concat(results.filter(song => song.source === 'jiosaavn'));
      }
     
      const uniqueSongs = Array.from(new Map(allSongs.map(s => [s.id, s])).values());
      setRandomSongs(uniqueSongs.slice(0, 18)); // Show up to 18 unique JioSaavn songs
    };
    fetchJioSaavnSongs();
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

  useEffect(() => {
    if (showSearch) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showSearch]);

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
      <div className="home-content">
        <h2 className="section-title">Recommended For You</h2>
        <div className="song-grid">
          {randomSongs.map(song => (
            <SongCard key={song.id} song={song} onClick={playSong} />
          ))}
        </div>
      </div>
    </div>
  );
}
