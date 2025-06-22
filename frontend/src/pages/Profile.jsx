import './Profile.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getLikedSongs } from '../utils/api';

export default function Profile({ onPlaySong }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [likedSongs, setLikedSongs] = useState([]);

  useEffect(() => {
    getLikedSongs().then(data => setLikedSongs(data.songs || []));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="profile-root">
      <div className="profile-container">
        <div className="profile-header">
          <div
            className="profile-avatar"
            style={{ backgroundImage: `url('${currentUser?.photoURL}')` }}
          />
          <div className="profile-info">
            <p className="profile-name">{currentUser?.displayName}</p>
            <p className="profile-email">{currentUser?.email}</p>
          </div>
          <button className="profile-logout" onClick={handleLogout}>Logout</button>
        </div>
        <h2 className="profile-liked-title">Liked Songs</h2>
        <div className="profile-liked-list">
          {likedSongs.map(song => (
            <div
              className="profile-liked-song"
              key={song.id}
              onClick={() => onPlaySong && onPlaySong(song)}
              style={{ cursor: 'pointer' }}
            >
              <div
                className="profile-liked-cover"
                style={{ backgroundImage: `url('${song.cover}')` }}
              />
              <div className="profile-liked-info">
                <p className="profile-liked-title-text">{song.title}</p>
                <p className="profile-liked-artist">{song.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
