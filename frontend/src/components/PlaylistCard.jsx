import React from 'react';
import './PlaylistCard.css';

export default function PlaylistCard({ playlist, onClick }) {
  // Get up to 4 most recent songs for album art collage
  const covers = (playlist.songs || []).slice(-4).reverse().map(s => s.cover);
  return (
    <div className="playlist-card" onClick={() => onClick(playlist)}>
      <div className="playlist-art-collage">
        {covers.length === 0 ? (
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
        <div className="playlist-count">{playlist.songs?.length || 0} songs</div>
      </div>
    </div>
  );
}
