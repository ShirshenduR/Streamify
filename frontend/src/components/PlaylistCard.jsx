import React from 'react';
import './PlaylistCard.css';

export default function PlaylistCard({ playlist, onClick }) {
  // Get up to 4 most recent songs for album art collage
  const covers = (playlist.songs || []).slice(-4).reverse().map(s => s.cover);
  
  return (
    <div className={`playlist-card ${playlist.isLiked ? 'liked-playlist' : ''}`} onClick={() => onClick(playlist)}>
      <div className="playlist-art-collage">
        {playlist.isLiked ? (
          <div className="liked-playlist-icon">
            <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        ) : covers.length === 0 ? (
          <div className="playlist-art-placeholder">No Art</div>
        ) : covers.length === 1 ? (
          <img src={covers[0]} alt="cover" className="playlist-art-single" />
        ) : (
          <div className="playlist-art-grid">
            {covers.map((c, i) => (
              <img key={i} src={c} alt="cover" className="playlist-art-img" />
            ))}
          </div>
        )}
      </div>
      <div className="playlist-meta">
        <div className="playlist-title">{playlist.name}</div>
        <div className="playlist-count">{playlist.description || `${playlist.songs?.length || 0} songs`}</div>
      </div>
    </div>
  );
}
