# 🎧 Streamify

**Streamify** is a modern, open-source music streaming platform that lets you search, play, like, and download music for free — ad-free. Built using **React + Vite** for the frontend and **Django REST** for the backend, it features a sleek dark UI, Google login, per-user liked songs, and playlist management. All music data is fetched via the [unofficial JioSaavn API by @sumitkolhe](https://github.com/sumitkolhe/jiosaavn-api), and [YouTube Music](https://music.youtube.com/) via [ytmusicapi](https://github.com/sigma67/ytmusicapi) and [yt-dlp](https://github.com/yt-dlp/yt-dlp).

> This project is for **educational purposes only** and does not store or redistribute music files.

---

## ✨ Features

- 🔐 Google login (via Firebase)
- 🔍 Search for songs, albums, artists (JioSaavn API & YouTube Music)
- ▶️ Stream music with a modern, mobile-friendly player (NowPlaying & MiniPlayer overlays)
- ❤️ Like/unlike songs (per user, synced with backend)
- 📂 Create & manage custom playlists
- ⬇️ Download tracks with 1-click
- 🌓 Dark themed, Figma-inspired UI
- 📱 Fully responsive frontend (mobile-first)
- 🏷️ Library page with liked songs and playlists (Playlist logic not implemented to implement in future)
- 🔄 Real-time like/unlike sync across UI
- 🌎 International music support via YouTube Music (ytmusic api and yt-dlp dont work on hosted use locally)

---

## 🧑‍💻 Tech Stack

| Layer     | Stack                                                                                                                                                                  |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend  | React, Vite, Plain CSS                                                                                                                                                 |
| Backend   | Django, Django REST Framework                                                                                                                                          |
| Auth      | Firebase Authentication (Google login)                                                                                                                                 |
| Music API | [Unofficial JioSaavn API](https://github.com/sumitkolhe/jiosaavn-api), [ytmusicapi](https://github.com/sigma67/ytmusicapi), [yt-dlp](https://github.com/yt-dlp/yt-dlp) |

---

## 📁 Project Structure

```
Streamify/
├── backend/                  # Django backend
│   ├── music/                # Django app (API views, models, urls)
│   ├── streamify_api/        # Django project settings
│   ├── manage.py
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── components/       # UI components (Miniplayer, Nowplaying, Navbar, etc.)
│   │   ├── hooks/          # React hooks (Player, Auth)
│   │   ├── pages/            # App pages (Home, Login, Library)
│   │   ├── utils/            # API, firebaseConfig
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── README.md
└── LICENSE
```

---

## 🚀 Getting Started

### 🔧 Frontend Setup (React + Vite)

> Create a `.env` file inside `frontend/` with your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_BACKEND_API_URL=http://localhost:8000
```

```bash
cd frontend
npm install
npm run dev
```

---

### ⚙️ Backend Setup (Django + Django REST)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

> Create a `.env` in `backend/` to store environment variables like:

```env
DEBUG=True
SECRET_KEY=your-secret
```

---

## 🔌 JioSaavn API Setup

You are using the **hosted API**, so no need to self-host. Endpoints used:

```
GET https://saavn.sumit.co/api/search/songs?query=kesariya
GET https://saavn.sumit.co/api/songs?ids=SONG_ID
```

---

## 🧠 Backend API Overview

| Endpoint               | Method   | Description              |
| ---------------------- | -------- | ------------------------ |
| `/api/search/`         | GET      | Search for songs         |
| `/api/song/`           | GET      | Get stream URL + details |
| `/api/download/`       | GET      | Download link to song    |
| `/api/like/`           | POST     | Like or unlike a song    |
| `/api/unlike/`         | POST     | Remove song from liked   |
| `/api/liked/`          | GET      | Get user's liked songs   |
| `/api/playlists/`      | GET/POST | Get or create playlists  |
| `/api/playlists/<id>/` | PATCH    | Update playlist name     |

---

## 📦 Firebase Setup (Google Login)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a project and enable **Google login**
3. Store credentials in `.env` files in frontend as shown above

---

## 🛑 Disclaimer

This project is intended only for **learning and demonstration**. No music is stored or redistributed by Streamify. API used is unofficial.

---

## 🙌 Credits

- 🎧 API: [Sumit Kolhe's JioSaavn API](https://github.com/sumitkolhe/jiosaavn-api)
- 🎵 YouTube Music integration: [ytmusicapi](https://github.com/sigma67/ytmusicapi) by sigma67
- ⬇️ Audio extraction: [yt-dlp](https://github.com/yt-dlp/yt-dlp) by the yt-dlp contributors

---

## 📜 License

MIT License

---

Built with ❤️ by Shirshendu for fun, learning & passion for music.
