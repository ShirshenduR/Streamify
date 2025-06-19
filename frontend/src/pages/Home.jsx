import { useState } from 'react';
import SearchBar from '../components/SearchBar';
import MiniPlayer from '../components/Miniplayer';
import './Home.css';

const songs = [
  {
    title: 'Midnight Groove',
    artist: 'DJ Echo',
    cover: 'https://via.placeholder.com/80x80.png?text=1',
  },
  {
    title: 'Electric Dreams',
    artist: 'Synthwave Collective',
    cover: 'https://via.placeholder.com/80x80.png?text=2',
  },
  {
    title: 'Urban Pulse',
    artist: 'Beat Maestro',
    cover: 'https://via.placeholder.com/80x80.png?text=3',
  },
  {
    title: 'Ocean Drive',
    artist: 'Tropical Beats',
    cover: 'https://via.placeholder.com/80x80.png?text=4',
  },
  {
    title: 'Starlight Serenade',
    artist: 'Celestial Harmonies',
    cover: 'https://via.placeholder.com/80x80.png?text=5',
  },
  {
    title: 'Rhythmic Journey',
    artist: 'Global Rhythms',
    cover: 'https://via.placeholder.com/80x80.png?text=6',
  },
];

export default function Home() {
  const [query, setQuery] = useState('');
  const filteredSongs = songs.filter((song) =>
    song.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="home-page">
      <SearchBar query={query} setQuery={setQuery} />

      <div className="section-wrapper">
        <h3 className="top-results-heading">Top Results</h3>
        {filteredSongs.map((song, index) => (
          <div className="song-card" key={index}>
            <div className="song-info">
              <p className="song-label">Song</p>
              <p className="song-title">{song.title}</p>
              <p className="song-artist">{song.artist}</p>
            </div>
            <img className="song-cover" src={song.cover} alt={song.title} />
          </div>
        ))}
      </div>

      {filteredSongs.length > 0 && (
        <div className="mini-player-wrapper">
          <MiniPlayer song={filteredSongs[0]} />
        </div>
      )}
    </div>
  );
}