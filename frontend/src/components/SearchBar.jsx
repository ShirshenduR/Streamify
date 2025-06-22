import React, { useState, useRef, useEffect } from 'react';
import { searchSongs } from '../utils/api';
import { usePlayer } from '../context/usePlayer';
import './SearchBar.css';

export default function SearchBar({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);
  const { playSong } = usePlayer();

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (query) {
      searchSongs(query).then(setResults);
    } else {
      setResults([]);
    }
  }, [query]);

  if (!open) return null;

  return (
    <div className="search-overlay-home">
      <div className="search-overlay-backdrop" onClick={onClose} />
      <div className="search-overlay-modal">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            ref={inputRef}
          />
          {query && (
            <button className="clear-btn" onClick={() => setQuery('')}>
              ✕
            </button>
          )}
        </div>
        <div className="search-overlay-results song-grid">
          {results.length === 0 && query && <div className="no-results">No results found</div>}
          {results.map(song => (
            <div className="song-card-spotify" key={song.id} onClick={() => { playSong(song); onClose(); }}>
              <img className="song-card-img" src={song.cover} alt={song.title} />
              <div className="song-card-meta">
                <div className="song-card-title">{song.title}</div>
                <div className="song-card-artist">{song.artist}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}