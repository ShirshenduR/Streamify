# 🎧 Streamify

**Streamify** is a modern, open-source music streaming platform that lets you search, play, and download music for free — ad-free. Built using **React + Vite** and **Django REST**, it features a sleek dark UI, Google login, liked songs, and playlist management.

> This project is intended for **educational purposes only** and uses the [unofficial JioSaavn API by @sumitkolhe](https://github.com/sumitkolhe/jiosaavn-api) to fetch and stream music data.

---

## ✨ Features

* 🔐 Google login (via Firebase)
* 🔍 Search for songs, albums, artists
* ▶️ Stream music with smooth player UI
* ⬇️ Download tracks with 1-click
* ❤️ Like/unlike songs
* 📂 Create & manage custom playlists
* 🌓 Dark themed UI (Figma designed)
* 📱 Fully responsive frontend

---

## 🧑‍💻 Tech Stack

| Layer     | Stack                                                                 |
| --------- | --------------------------------------------------------------------- |
| Frontend  | React, Vite, Plain CSS, React Icons                                  |
| Backend   | Django, Django REST Framework                                         |
| Auth      | Firebase Authentication (Google login)                                |
| Music API | [Unofficial JioSaavn API](https://github.com/sumitkolhe/jiosaavn-api) |

---

## 📁 Project Structure

```
streamify/
├── backend/               # Django backend
│   ├── streamify_api/     # Django app (search, stream, auth, likes)
│   ├── manage.py
│   └── .env               # Environment variables (backend)
└── frontend/              # React + Vite frontend
    ├── components/
    ├── pages/
    ├── App.jsx
    └── .env               # Environment variables (frontend)
```

---

## 🚀 Getting Started

### 🔧 Frontend Setup (React + Vite)

```bash
git clone https://github.com/YOUR_USERNAME/streamify.git
cd streamify/streamify-frontend

npm install
npm run dev
```

> Create a `.env` file inside `streamify-frontend/` with your Firebase config:

```env
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_APP.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
...
```

Use them in code like:

```js
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  ...
};
```

---

### ⚙️ Backend Setup (Django + Django REST)

```bash
cd ../backend

python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

pip install -r requirements.txt

python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

Create `.env` in `backend/` to store environment variables like:

```env
DEBUG=True
SECRET_KEY=your-secret
```

---

## 🔌 JioSaavn API Setup

> You are using the **hosted API**, so no need to self-host.

Use these endpoints:

```http
GET https://saavn.dev/api/search/songs?query=kesariya
GET https://saavn.dev/api/songs?id=SONG_ID
```

---

## 🧠 Backend API Overview

| Endpoint                    | Method   | Description              |
| --------------------------- | -------- | ------------------------ |
| `/api/search?q=`            | GET      | Search for songs         |
| `/api/song?id=`             | GET      | Get stream URL + details |
| `/api/download?id=`         | GET      | Download link to song    |
| `/api/like`                 | POST     | Add song to liked list   |
| `/api/liked`                | GET      | Get user's liked songs   |
| `/api/playlists`            | GET/POST | Get or create playlists  |
| `/api/playlists/<id>`       | PATCH    | Update playlist name     |
| `/api/playlists/<id>/songs` | POST     | Add song to playlist     |

> All endpoints are secured and require Firebase user tokens for authentication.

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

* 🎧 API: [Sumit Kolhe's JioSaavn API](https://github.com/sumitkolhe/jiosaavn-api)
* 📚 Icons: [Lucide Icons](https://lucide.dev)

---

## 📜 License

MIT License

---

## 💡 Contributing Ideas

* Add lyrics integration
* Enable queue & shuffle play
* Create public profile pages
* Add audio visualizer

PRs are welcome!

---

Built with ❤️ by Shirshendu for fun, learning & passion for music.
