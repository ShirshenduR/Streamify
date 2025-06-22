import React, { useRef } from 'react';
import { usePlayer } from '../context/usePlayer';
import { downloadSong } from '../utils/api';
import './Nowplaying.css';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Nowplaying({ open, onClose }) {
  const {
    currentSong,
    isPlaying,
    pauseSong,
    resumeSong,
    nextSong,
    prevSong,
    seek,
    duration,
    currentTime,
    playlist,
    currentIndex,
    likedSongs,
    likeSong
  } = usePlayer();
  const barRef = useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const [dragProgress, setDragProgress] = React.useState(0);
  const [downloading, setDownloading] = React.useState(false);
  const [likeAnimating, setLikeAnimating] = React.useState(false);
  const [playbackError, setPlaybackError] = React.useState(null);
  const [jiosaavnAlternative, setJiosaavnAlternative] = React.useState(null);

  const progress = dragging
    ? dragProgress
    : duration > 0
    ? (currentTime / duration) * 100
    : 0;

  const updateProgress = (clientX) => {
    const rect = barRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    setDragProgress(percent * 100);
  };

  const handleSeek = (e) => {
    if (!duration) return;
    updateProgress(e.clientX);
    const rect = barRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    seek(percent * duration);
  };

  const handleDrag = React.useCallback((e) => {
    if (!dragging) return;
    if (e.type === 'touchmove') {
      updateProgress(e.touches[0].clientX);
    } else {
      updateProgress(e.clientX);
    }
  }, [dragging]);

  const handleDragEnd = React.useCallback((e) => {
    if (!duration) return;
    setDragging(false);
    const rect = barRef.current.getBoundingClientRect();
    const x = (e.type === 'touchend' ? e.changedTouches[0].clientX : e.clientX) - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    seek(percent * duration);
  }, [duration, seek]);

  React.useEffect(() => {
    if (!dragging) return;
    const move = (e) => handleDrag(e);
    const up = (e) => handleDragEnd(e);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [dragging, handleDrag, handleDragEnd]);

  const isLiked = currentSong && likedSongs.some(s => s.id === currentSong.id);

  const handleDownload = async () => {
    if (!currentSong) return;
    setDownloading(true);
    try {
      const data = await downloadSong(currentSong.id, currentSong.source);
      const url = data.url || data.downloadUrl || data.audioUrl;
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentSong.title} - ${currentSong.artist}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleLike = async () => {
    if (!currentSong) return;
    setLikeAnimating(true);
    await likeSong(currentSong);
    setTimeout(() => setLikeAnimating(false), 500);
  };

  // Try to play song, handle YTMusic error and search JioSaavn fallback
  React.useEffect(() => {
    setPlaybackError(null);
    setJiosaavnAlternative(null);
    if (!currentSong) return;
    if (currentSong.source === 'ytmusic') {
      // Listen for playback error event (customize as per your player logic)
      const audio = document.querySelector('audio');
      if (!audio) return;
      const onError = async () => {
        setPlaybackError('YouTube Music is currently unavailable due to restrictions.');
        // Search for JioSaavn alternative
        const { searchSongs } = await import('../utils/api');
        const results = await searchSongs(`${currentSong.title} ${currentSong.artist}`);
        const jio = results.find(s => s.source === 'jiosaavn');
        if (jio) setJiosaavnAlternative(jio);
      };
      audio.addEventListener('error', onError);
      return () => audio.removeEventListener('error', onError);
    }
  }, [currentSong]);

  if (!open) return null;

  const modalContentStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: window.innerWidth < 600 ? '1.2rem' : '2.5rem',
    padding: window.innerWidth < 600 ? '1.2rem 0 0 0' : '3.5rem 0 0 0',
  };

  return (
    <div className={`nowplaying-overlay open`}>
      <div className="nowplaying-backdrop" onClick={onClose} />
      <div className="nowplaying-modal" style={{backdropFilter:'blur(16px)',background:'rgba(35,24,24,0.85)',boxShadow:'0 8px 32px rgba(0,0,0,0.25)'}}>
        <button style={{position:'absolute',right:24,top:24,fontSize:'2rem',color:'#ecc9c9',background:'none',border:'none',cursor:'pointer',zIndex:2}} onClick={onClose}>&times;</button>
        <div style={modalContentStyle}>
          <div className="nowplaying-artwork" style={{ backgroundImage: `url(${currentSong?.cover || ''})` }} />
          <div className="text-center" style={{margin:'0 auto',maxWidth:'90%'}}>
            <p className="nowplaying-track-title" style={{margin:'0 auto',textAlign:'center'}}>{currentSong?.title || ''}</p>
            <p className="nowplaying-track-artist" style={{margin:'0 auto',textAlign:'center'}}>{currentSong?.artist || ''}</p>
            <p className="nowplaying-track-source" style={{margin:'0 auto',textAlign:'center',color:'#ecc9c9',fontSize:'0.9rem'}}>
              {currentSong?.source === 'ytmusic' ? 'YouTube Music' : 'JioSaavn'}
            </p>
          </div>
          <div style={{width:'100%'}}>
            <div
              className="nowplaying-progress-bar"
              ref={barRef}
              onClick={handleSeek}
              onMouseDown={() => setDragging(true)}
              onTouchStart={() => setDragging(true)}
            >
              <div className="nowplaying-progress-current" style={{ width: `${progress}%` }} />
              <div className="nowplaying-progress-knob" style={{ left: `calc(${progress}% )`, '--knob-left': `${progress}%` }} />
              <div className="nowplaying-progress-remaining" style={{ width: `${100 - progress}%` }} />
            </div>
            <div className="nowplaying-progress-times">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          <div className="nowplaying-controls">
            <button className="nowplaying-btn size-10" onClick={prevSong} disabled={currentIndex <= 0} aria-label="Previous">
              <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" fill="currentColor" viewBox="0 0 256 256"><path d="M208,47.88V208.12a16,16,0,0,1-24.43,13.43L64,146.77V216a8,8,0,0,1-16,0V40a8,8,0,0,1,16,0v69.23L183.57,34.45A15.95,15.95,0,0,1,208,47.88Z"></path></svg>
            </button>
            <button className="nowplaying-btn size-10" onClick={() => seek(Math.max(0, currentTime - 10))} aria-label="Rewind">
              <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" fill="currentColor" viewBox="0 0 256 256"><path d="M232,71.84V184.16a15.92,15.92,0,0,1-24.48,13.34L128,146.86v37.3a15.92,15.92,0,0,1-24.48,13.34L15.33,141.34a15.8,15.8,0,0,1,0-26.68L103.52,58.5A15.91,15.91,0,0,1,128,71.84v37.3L207.52,58.5A15.91,15.91,0,0,1,232,71.84Z"></path></svg>
            </button>
            <button className="nowplaying-btn nowplaying-btn-play size-16"
              onClick={isPlaying ? pauseSong : resumeSong}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="40px" height="40px" fill="currentColor" viewBox="0 0 256 256"><path d="M96,216a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0V208A8,8,0,0,1,96,216Zm72-168a8,8,0,0,0-8,8V208a8,8,0,0,0,16,0V56A8,8,0,0,0,168,48Z"></path></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="40px" height="40px" fill="currentColor" viewBox="0 0 256 256"><path d="M240,128a15.74,15.74,0,0,1-7.6,13.51L88.32,229.65a16,16,0,0,1-16.2.3A15.86,15.86,0,0,1,64,216.13V39.87a15.86,15.86,0,0,1,8.12-13.82,16,16,0,0,1,16.2.3L232.4,114.49A15.74,15.74,0,0,1,240,128Z"></path></svg>
              )}
            </button>
            <button className="nowplaying-btn size-10" onClick={() => seek(Math.min(duration, currentTime + 10))} aria-label="FastForward">
              <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" fill="currentColor" viewBox="0 0 256 256"><path d="M248,128a15.76,15.76,0,0,1-7.33,13.34L152.48,197.5A15.91,15.91,0,0,1,128,184.16v-37.3L48.48,197.5A15.91,15.91,0,0,1,24,184.16V71.84A15.91,15.91,0,0,1,48.48,58.5L128,109.14V71.84A15.91,15.91,0,0,1,152.48,58.5l88.19,56.16A15.76,15.76,0,0,1,248,128Z"></path></svg>
            </button>
            <button className="nowplaying-btn size-10" onClick={() => nextSong()} disabled={currentIndex >= playlist.length - 1} aria-label="Next">
              <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" fill="currentColor" viewBox="0 0 256 256"><path d="M208,40V216a8,8,0,0,1-16,0V146.77L72.43,221.55A15.95,15.95,0,0,1,48,208.12V47.88A15.95,15.95,0,0,1,72.43,34.45L192,109.23V40a8,8,0,0,1,16,0Z"></path></svg>
            </button>
          </div>
          <div style={{display:'flex',justifyContent:'center',gap:window.innerWidth<600?'0.7rem':'2.5rem',marginTop:window.innerWidth<600?'1.2rem':'2.5rem',marginBottom:window.innerWidth<600?'1.2rem':'2.5rem'}}>
            <button
              className={`nowplaying-pill-btn${isLiked ? ' liked' : ''}${likeAnimating ? ' like-anim' : ''}`}
              onClick={handleLike}
              aria-label={isLiked ? 'Unlike' : 'Like'}
            >
              {isLiked ? (
                <svg width="32" height="32" viewBox="0 0 64 64" fill="#fff" xmlns="http://www.w3.org/2000/svg">
                  <g id="Icon-Like">
                    <path fill="#fff" d="M42 32.4c0-3.2-2.5-4.9-6-4.9H25.9c0.7-2.7 1.1-5.3 1.1-7.5c0-8.7-2.4-10.5-4.5-10.5c-1.4 0-2.4 0.1-3.8 1c-0.4 0.2-0.6 0.6-0.7 1l-1.5 8.1c-1.6 4.3-5.7 8-9 10.5v21.4c1.1 0 2.5 0.6 3.8 1.3c1.6 0.8 3.3 1.6 5.2 1.6h14.3c3 0 5.2-2.4 5.2-4.5c0-0.4 0-0.8-0.1-1.1c1.9-0.7 3.1-2.3 3.1-4.1c0-0.9-0.2-1.7-0.5-2.3c1.1-0.8 2.3-2.1 2.3-3.7c0-0.8-0.4-1.8-1-2.5C41.1 35.2 42 33.8 42 32.4z"/>
                    <path fill="#fff" d="M38.9 32.4c0 1.9-2 2.1-2.3 3c-0.3 1 1.2 1.4 1.2 3.2c0 1.9-2.3 1.9-2.6 2.8c-0.4 1.1 0.7 1.5 0.7 3.3c0 0.1 0 0.2 0 0.3c-0.3 1.5-2.6 1.6-3 2.2c-0.4 0.7 0.1 1.1 0.1 2.7c0 0.9-1 1.5-2.2 1.5H16.5c-1.1 0-2.5-0.6-3.8-1.3c-1.2-0.6-2.4-1.2-3.7-1.5v-15.9c3.7-2.8 8.5-7.1 10.4-12.3c0-0.1 0-0.2 0.1-0.2l1.4-7.5c0.5-0.2 0.9-0.2 1.7-0.2c0.3 0 1.5 1.8 1.5 7.5c0 2.2-0.4 4.7-1.2 7.5h-0.4c-0.8 0-1.5 0.7-1.5 1.5c0 0.8 0.7 1.5 1.5 1.5h8.5C36.5 30.5 38.9 31.2 38.9 32.4z"/>
                  </g>
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 64 64" fill="none" stroke="#fff" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
                  <g id="Icon-Like">
                    <path d="M42 32.4c0-3.2-2.5-4.9-6-4.9H25.9c0.7-2.7 1.1-5.3 1.1-7.5c0-8.7-2.4-10.5-4.5-10.5c-1.4 0-2.4 0.1-3.8 1c-0.4 0.2-0.6 0.6-0.7 1l-1.5 8.1c-1.6 4.3-5.7 8-9 10.5v21.4c1.1 0 2.5 0.6 3.8 1.3c1.6 0.8 3.3 1.6 5.2 1.6h14.3c3 0 5.2-2.4 5.2-4.5c0-0.4 0-0.8-0.1-1.1c1.9-0.7 3.1-2.3 3.1-4.1c0-0.9-0.2-1.7-0.5-2.3c1.1-0.8 2.3-2.1 2.3-3.7c0-0.8-0.4-1.8-1-2.5C41.1 35.2 42 33.8 42 32.4z"/>
                    <path d="M38.9 32.4c0 1.9-2 2.1-2.3 3c-0.3 1 1.2 1.4 1.2 3.2c0 1.9-2.3 1.9-2.6 2.8c-0.4 1.1 0.7 1.5 0.7 3.3c0 0.1 0 0.2 0 0.3c-0.3 1.5-2.6 1.6-3 2.2c-0.4 0.7 0.1 1.1 0.1 2.7c0 0.9-1 1.5-2.2 1.5H16.5c-1.1 0-2.5-0.6-3.8-1.3c-1.2-0.6-2.4-1.2-3.7-1.5v-15.9c3.7-2.8 8.5-7.1 10.4-12.3c0-0.1 0-0.2 0.1-0.2l1.4-7.5c0.5-0.2 0.9-0.2 1.7-0.2c0.3 0 1.5 1.8 1.5 7.5c0 2.2-0.4 4.7-1.2 7.5h-0.4c-0.8 0-1.5 0.7-1.5 1.5c0 0.8 0.7 1.5 1.5 1.5h8.5C36.5 30.5 38.9 31.2 38.9 32.4z"/>
                  </g>
                </svg>
              )}
              <span className="truncate">{isLiked ? 'Liked' : 'Like'}</span>
            </button>
            <button
              className={`nowplaying-pill-btn${downloading ? ' downloading' : ''}`}
              onClick={handleDownload}
              disabled={downloading}
              aria-label="Download"
            >
              {/* Download SVG */}
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24" style={{marginRight:8,verticalAlign:'middle'}}><path d="M12 16a1 1 0 0 1-1-1V5a1 1 0 1 1 2 0v10a1 1 0 0 1-1 1zm-7 2a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1z"/></svg>
              <span className="truncate">{downloading ? 'Downloading...' : 'Download'}</span>
            </button>
          </div>
          {playbackError && (
            <div style={{color:'#ffb3b3',background:'#2a1a1a',padding:'1rem',borderRadius:'8px',margin:'1rem 0',textAlign:'center'}}>
              <p>{playbackError}</p>
              {jiosaavnAlternative ? (
                <button style={{marginTop:'0.5rem'}} onClick={() => window.location.reload()}>
                  Play on JioSaavn
                </button>
              ) : (
                <p>Try searching for this song on JioSaavn or another source.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
