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
    { 
      id: 'liked', 
      name: 'Liked Songs', 
      description: `${likedSongs.length} liked songs`, 
      image: '', 
      songs: likedSongs,
      isLiked: true 
    },
    ...filteredPlaylists.map(p => ({ ...p, songs: [], isLiked: false }))
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
            <div className={`library-songs-header ${currentPlaylist.isLiked ? 'liked-songs-header' : ''}`}>
              <div className="library-songs-title">{currentPlaylist.name}</div>
              <div className="library-songs-subtitle">
                {currentPlaylist.isLiked ? (
                  <>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style={{marginRight: '8px'}}>
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    Your collection of favorite tracks
                  </>
                ) : (
                  `${songsToShow.length} songs`
                )}
              </div>
            </div>
            {songsToShow.length === 0 && (
              <div className="library-empty">
                {currentPlaylist.isLiked ? (
                  <>
                    <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24" style={{marginBottom: '16px', opacity: 0.5}}>
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    <div>No liked songs yet</div>
                    <div style={{fontSize: '14px', marginTop: '8px', opacity: 0.7}}>Start liking songs to build your collection</div>
                  </>
                ) : (
                  'No songs found.'
                )}
              </div>
            )}
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
