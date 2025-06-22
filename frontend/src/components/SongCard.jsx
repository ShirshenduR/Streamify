import React from 'react';
import './SongCard.css';

export default function SongCard({ song, onClick }) {
  return (
    <div className="song-card-spotify" onClick={() => onClick(song)}>
      <div className="song-card-img-wrap">
        <img className="song-card-img" src={song.cover} alt={song.title} />
      </div>
      <div className="song-card-meta">
        <div className="song-card-title">{song.title}</div>
        <div className="song-card-artist">{song.artist}</div>
      </div>
    </div>
  );
}
