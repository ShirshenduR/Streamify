import { useState, useEffect } from 'react';
import './Library.css';
import SearchBar from '../components/SearchBar';
import { getPlaylists, getPlaylistDetail, getLikedSongs } from '../utils/api';
import { usePlayer } from '../context/usePlayer';
import PlaylistCard from '../components/PlaylistCard';

export default function Library({ showSearch, setShowSearch }) {
  const [query, setQuery] = useState('');
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [likedSongs, setLikedSongs] = useState([]);
  const { playSong } = usePlayer();

  useEffect(() => {
    getPlaylists().then(data => setPlaylists(data.playlists || []));
    getLikedSongs().then(data => setLikedSongs(data.songs || []));
  }, []);

  useEffect(() => {
    if (selectedPlaylist && selectedPlaylist !== 'liked') {
      getPlaylistDetail(selectedPlaylist).then(data => setPlaylistSongs(data.songs || []));
    }
  }, [selectedPlaylist]);

  const filteredPlaylists = playlists.filter((pl) =>
    pl.name.toLowerCase().includes(query.toLowerCase())
  );

  const allPlaylists = [
    { id: 'liked', name: 'Liked Songs', description: 'Your favorite tracks', image: '', songs: likedSongs },
    ...filteredPlaylists.map(p => ({ ...p, songs: [] }))
  ];

  const showSongs = selectedPlaylist !== null;
  const currentPlaylist = allPlaylists.find(p => p.id === selectedPlaylist) || {};
  const songsToShow = selectedPlaylist === 'liked' ? likedSongs : playlistSongs;

  return (
    <div className="library-root">
      {showSearch && (
        <div className="search-overlay-home">
          <div className="search-overlay-backdrop" onClick={() => setShowSearch(false)} />
          <div className="search-overlay-modal">
            <SearchBar 
              query={query} 
              setQuery={setQuery} 
            />
          </div>
        </div>
      )}
      <div className="library-container">
        <div className="library-header">
          <p className="library-title">Your Library</p>
        </div>
        <div className="library-search-row">
          <SearchBar query={query} setQuery={setQuery} onSearch={() => {}} />
        </div>
        {!showSongs ? (
          <div className="library-list">
            {allPlaylists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onClick={pl => setSelectedPlaylist(pl.id)}
              />
            ))}
          </div>
        ) : (
          <div className="library-songs-list">
            <button className="library-back-btn" onClick={() => setSelectedPlaylist(null)}>&larr; Back</button>
            <div className="library-songs-title">{currentPlaylist.name}</div>
            {songsToShow.length === 0 && <div className="library-empty">No songs found.</div>}
            <div className="library-songs-cards">
              {songsToShow.map(song => (
                <div key={song.id} className="library-song-card" onClick={() => playSong(song, songsToShow)}>
                  <img src={song.cover} alt={song.title} className="library-song-cover" />
                  <div className="library-song-info">
                    <div className="library-song-title">{song.title}</div>
                    <div className="library-song-artist">{song.artist}</div>
                  </div>
                  <button className="library-song-play-btn" aria-label="Play">
                    <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
