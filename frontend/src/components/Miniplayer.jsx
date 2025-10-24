import './Miniplayer.css';
import { useState } from 'react';
import Nowplaying from './Nowplaying';
import { usePlayer } from '../context/usePlayer';

export default function MiniPlayer() {
  const { currentSong, isPlaying, pauseSong, resumeSong, likedSongs, likeSong, volume, setAudioVolume } = usePlayer();
  const [showNowPlaying, setShowNowPlaying] = useState(false);

  const handleVolumeChange = (e) => {
  const newVolume = parseFloat(e.target.value);
  setAudioVolume(newVolume);
  };

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!currentSong) return;
    if (isPlaying) {
      pauseSong();
    } else {
      resumeSong();
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!currentSong) return;
    await likeSong(currentSong);
  };

  const handleOpenNowPlaying = (e) => {
    e?.stopPropagation?.();
    setShowNowPlaying(true);
  };

  const handleCloseNowPlaying = () => {
    setShowNowPlaying(false);
  };

  const isLiked = currentSong && likedSongs.some(s => s.id === currentSong.id);

  return (
    <>
      <div className="mini-player" onClick={handleOpenNowPlaying} style={{ cursor: 'pointer' }}>
        <div className="mini-meta">
          {currentSong ? (
            <>
              <img src={currentSong.cover} alt={currentSong.title} className="mini-cover" />
              <div className="mini-text">
                <p className="mini-title">{currentSong.title}</p>
                <p className="mini-artist">{currentSong.artist}</p>
                <p className="mini-source">{currentSong.source === 'ytmusic' ? 'YouTube Music' : 'JioSaavn'}</p>
              </div>
            </>
          ) : (
            <div className="mini-text">
              <p className="mini-title">No song playing</p>
            </div>
          )}
        </div>
        <div className="mini-controls" onClick={e => e.stopPropagation()}>

          {/* Volume control with speaker */}
  <div className="volume-container">
    <button 
      className="volume-icon" 
      onClick={() => setAudioVolume(volume > 0 ? 0 : 1)} 
      aria-label={volume > 0 ? 'Mute' : 'Unmute'}
    >
      {volume > 0 ? (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff">
          <path d="M3 10v4h4l5 5V5l-5 5H3z"/>
        </svg>
      ) : (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.06c1.48-.74 2.5-2.26 2.5-4.03zM3 10v4h4l5 5V5l-5 5H3z"/>
          <line x1="19" y1="5" x2="5" y2="19" stroke="#fff" strokeWidth="2"/>
        </svg>
      )}
    </button>

    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={volume}
      onChange={handleVolumeChange}
      className="volume-slider"
      style={{ background: `linear-gradient(to right, #fff 0%, #fff ${volume*100}%, rgba(255,255,255,0.3) ${volume*100}%, rgba(255,255,255,0.3) 100%)` }}

    />
  </div>
          <button className={`mini-like${isLiked ? ' liked' : ''}`} onClick={handleLike} disabled={!currentSong} aria-label={isLiked ? 'Unlike' : 'Like'}>
            {isLiked ? (
              <svg width="28" height="28" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style={{display:'block',margin:'auto'}}>
                <g id="Icon-Like">
                  <path d="M42 32.4c0-3.2-2.5-4.9-6-4.9H25.9c0.7-2.7 1.1-5.3 1.1-7.5c0-8.7-2.4-10.5-4.5-10.5c-1.4 0-2.4 0.1-3.8 1c-0.4 0.2-0.6 0.6-0.7 1l-1.5 8.1c-1.6 4.3-5.7 8-9 10.5v21.4c1.1 0 2.5 0.6 3.8 1.3c1.6 0.8 3.3 1.6 5.2 1.6h14.3c3 0 5.2-2.4 5.2-4.5c0-0.4 0-0.8-0.1-1.1c1.9-0.7 3.1-2.3 3.1-4.1c0-0.9-0.2-1.7-0.5-2.3c1.1-0.8 2.3-2.1 2.3-3.7c0-0.8-0.4-1.8-1-2.5C41.1 35.2 42 33.8 42 32.4z" fill="#fff" stroke="#fff" strokeWidth="2.6"/>
                </g>
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style={{display:'block',margin:'auto'}}>
                <g id="Icon-Like">
                  <path d="M42 32.4c0-3.2-2.5-4.9-6-4.9H25.9c0.7-2.7 1.1-5.3 1.1-7.5c0-8.7-2.4-10.5-4.5-10.5c-1.4 0-2.4 0.1-3.8 1c-0.4 0.2-0.6 0.6-0.7 1l-1.5 8.1c-1.6 4.3-5.7 8-9 10.5v21.4c1.1 0 2.5 0.6 3.8 1.3c1.6 0.8 3.3 1.6 5.2 1.6h14.3c3 0 5.2-2.4 5.2-4.5c0-0.4 0-0.8-0.1-1.1c1.9-0.7 3.1-2.3 3.1-4.1c0-0.9-0.2-1.7-0.5-2.3c1.1-0.8 2.3-2.1 2.3-3.7c0-0.8-0.4-1.8-1-2.5C41.1 35.2 42 33.8 42 32.4z" fill="none" stroke="#fff" strokeWidth="2.8"/>
                </g>
              </svg>
            )}
          </button>
          <button className="mini-play" onClick={togglePlay} disabled={!currentSong} aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="4" width="4" height="16" rx="1.5" fill="#fff"/>
                <rect x="15" y="4" width="4" height="16" rx="1.5" fill="#fff"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="6,4 20,12 6,20" fill="#fff"/>
              </svg>
            )}
          </button>
        </div>
      </div>
      <Nowplaying open={showNowPlaying} onClose={handleCloseNowPlaying} />
    </>
  );
}