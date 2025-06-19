import './MiniPlayer.css';
import { useState } from 'react';

export default function MiniPlayer({ song }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="mini-player">
      <div className="mini-meta">
        <img src={song.cover} alt={song.title} className="mini-cover" />
        <div className="mini-text">
          <p className="mini-title">{song.title}</p>
          <p className="mini-artist">{song.artist}</p>
        </div>
      </div>
      <div className="mini-controls">
        <button className="mini-like">🤍</button>
        <button className="mini-play" onClick={togglePlay}>
          {isPlaying ? '⏸' : '▶'}
        </button>
      </div>
    </div>
  );
}