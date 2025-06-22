// All backend API calls for Streamify
import { auth } from './firebaseconfig';

const API_BASE = import.meta.env.VITE_BACKEND_API_URL || '';

async function getToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
}

export async function searchSongs(query) {
  const res = await fetch(`${API_BASE}/api/search/?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  if (data && data.data && Array.isArray(data.data.results)) {
    return data.data.results.map(song => ({
      id: song.id,
      title: song.name,
      artist: song.artists?.primary?.map(a => a.name).join(', ') || '',
      cover: song.image?.find(img => img.quality === '150x150')?.url || song.image?.[0]?.url || '',
    }));
  }
  return [];
}

export async function getSongDetails(id) {
  const res = await fetch(`${API_BASE}/api/song/?id=${encodeURIComponent(id)}`);
  return res.json();
}

export async function downloadSong(id) {
  const res = await fetch(`${API_BASE}/api/download/?id=${encodeURIComponent(id)}`);
  return res.json();
}

export async function likeSong(song) {
  const user = auth.currentUser;
  const userId = user ? user.uid : null;
  if (!userId) throw new Error('User not logged in');
  const res = await fetch(`${API_BASE}/api/like/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      song_id: song.id,
      title: song.title,
      artist: song.artist,
      cover: song.cover,
      user_id: userId,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to like song');
  }
}

export async function unlikeSong(song) {
  const user = auth.currentUser;
  const userId = user ? user.uid : null;
  if (!userId) throw new Error('User not logged in');
  const res = await fetch(`${API_BASE}/api/unlike/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      song_id: song.id,
      user_id: userId,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to unlike song');
  }
}

export async function getLikedSongs() {
  const user = auth.currentUser;
  const userId = user ? user.uid : null;
  if (!userId) return { songs: [] };
  const res = await fetch(`${API_BASE}/api/liked/?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) return { songs: [] };
  return res.json();
}

export async function getPlaylists() {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/api/playlists/`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.json();
}

export async function createPlaylist(name) {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/api/playlists/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function getPlaylistDetail(id) {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/api/playlists/${id}/`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.json();
}

export async function updatePlaylist(id, data) {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/api/playlists/${id}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}
