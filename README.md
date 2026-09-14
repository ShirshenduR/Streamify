# 🎧 Streamify

**Streamify** is a modern, installable music streaming web app. Search, play, like, download and
build playlists across millions of songs — free and ad-free. Built with **Next.js (App Router)**
for the frontend and **Django REST Framework** for the backend, and shipped as **one Docker image**
so it deploys as a single web service.

All music data comes from the [unofficial JioSaavn API by @sumitkolhe](https://github.com/sumitkolhe/jiosaavn-api).

> This project is for **educational purposes only**. It does not store or redistribute music files,
> and the API it uses is unofficial.

---

## ✨ Features

**Listening**

- 🔍 Search songs, artists and albums with type-ahead suggestions
- ▶️ Continuous playback with a queue, shuffle, repeat-one/repeat-all
- 🎚️ Seek, volume, mute, and **sleep timer**
- 📻 Endless **radio mode** — when the queue runs out, Streamify keeps playing similar tracks
- ⏯️ Resumes each track where you left off
- 📱 **Media Session** integration (lock screen, notification and hardware media keys)
- ⌨️ Keyboard shortcuts (see below)
- ⬇️ 1-click download, streamed through the backend so files arrive properly named

**Your library**

- ❤️ Like/unlike, synced across every screen instantly
- 📂 Playlists: create, rename, delete, add/remove tracks, reorder
- 🕘 Listening history with play counts, and a "jump back in" shelf
- 👤 Profile with listening stats and your top artists

**Discovery**

- ✨ Personalised **"For you"** recommendations that learn from what you play and like
- 🏠 Home shelves: trending, chill, workout, romance, lo-fi, party
- 🌈 Browse by mood

**App**

- 🧊 Frosted-glass design language (translucent panels that blur the artwork behind them)
- 🌓 Dark and light appearance
- 📲 **Installable PWA** — home-screen icon, standalone window, offline shell
- 📱 Mobile-first: safe-area aware, swipe-to-dismiss player, bottom sheets, big touch targets

---

## 🧑‍💻 Tech stack

| Layer     | Stack                                                                    |
| --------- | ------------------------------------------------------------------------ |
| Frontend  | Next.js 15 (App Router), React 19, Tailwind CSS v4, HeroUI, React Query   |
| Backend   | Django 5, Django REST Framework, Gunicorn, WhiteNoise                    |
| Auth      | Firebase Authentication (Google sign-in)                                 |
| Database  | SQLite locally, PostgreSQL in production (`DATABASE_URL`)                 |
| Music API | [Unofficial JioSaavn API](https://github.com/sumitkolhe/jiosaavn-api)      |
| Delivery  | One Docker image — Next.js + Django in the same container                 |

---

## 🏗️ Architecture

The browser only ever talks to **one origin**. Next.js serves the PWA and proxies `/api/*` to
Django, which runs next to it on loopback — so there is no CORS, no second service to deploy and
nothing extra to pay for.

```
                    ┌──────────────── one Render web service (one Docker image) ─────────────────┐
                    │                                                                            │
  browser  ────────▶│  Next.js  :$PORT   ──── /api/* ────▶   Django + Gunicorn  127.0.0.1:8000   │
  (PWA)    HTTPS    │   • pages, player                        • JioSaavn proxy + cache        │
                    │   • /api/config (runtime Firebase cfg)   • likes, playlists, history      │
                    │   • service worker, icons                 • recommendations               │
                    │                                          │                                 │
                    └──────────────────────────────────────────┼─────────────────────────────────┘
                                                               ▼
                                                     saavn.sumit.co (JioSaavn)
```

Two details worth knowing:

- **`/api/config`** serves the Firebase keys to the browser at *runtime*, read from the same
  `VITE_FIREBASE_*` variables the Vite app used. Render injects env vars when the container starts,
  not when the image is built, so baking them in at build time would not work.
- **Trailing slashes are optional** on every API route. Next's proxy strips them, so the Django
  URLconf accepts both `/api/health` and `/api/health/` and never redirects a POST body away.

---

## 📁 Project structure

```
Streamify/
├── frontend/                     # Next.js app (the PWA)
│   ├── app/
│   │   ├── (app)/                # signed-in shell: home, search, for-you, library, profile
│   │   ├── api/config/           # runtime Firebase config
│   │   ├── manifest.js           # PWA manifest
│   │   ├── offline/              # offline fallback page
│   │   ├── globals.css           # design tokens + glass utilities
│   │   └── hero.mjs              # HeroUI theme
│   ├── components/               # layout, player, song, playlist, common
│   ├── hooks/                    # usePlayer, useAuth, useLike, useKeyboardShortcuts
│   ├── lib/                      # api client, queries, firebase, storage, format
│   ├── public/                   # service worker, logo, generated icons
│   └── scripts/generate-icons.mjs
├── backend/                      # Django API
│   ├── music/                    # views, models, upstream client, urls, tests
│   └── streamify_api/            # settings, root urls
├── Dockerfile                    # single image for a single web service
├── docker-entrypoint.sh          # migrations + Django + Next
└── render.yaml                   # optional Render blueprint
```

---

## 🚀 Getting started (local)

You need **Node 20+** and **Python 3.10+**. Two terminals, no Docker required.

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env               # set DJANGO_SECRET_KEY and keep DEBUG=True
python manage.py migrate
python manage.py runserver         # http://127.0.0.1:8000
```

### 2. Frontend

```bash
cd frontend
npm install

cp .env.example .env.local         # add your Firebase keys
npm run dev                        # http://localhost:3000
```

Open <http://localhost:3000>. The dev server proxies `/api/*` to `127.0.0.1:8000` for you.

### 3. Firebase (Google sign-in)

1. Create a project in the [Firebase console](https://console.firebase.google.com/).
2. Enable **Authentication → Google**.
3. Copy the web app config into `frontend/.env.local`.

If the keys are missing the app says so on screen instead of failing silently.

---

## 🔑 Environment variables

Every key name is unchanged from the original setup — nothing to rename, and no new secret is
required.

| Variable                              | Where   | Required | Purpose                                                        |
| ------------------------------------- | ------- | -------- | -------------------------------------------------------------- |
| `VITE_FIREBASE_API_KEY`               | frontend | yes     | Firebase web config (public by design)                          |
| `VITE_FIREBASE_AUTH_DOMAIN`           | frontend | yes     | "                                                               |
| `VITE_FIREBASE_PROJECT_ID`            | frontend | yes     | "                                                               |
| `VITE_FIREBASE_STORAGE_BUCKET`        | frontend | yes     | "                                                               |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`   | frontend | yes     | "                                                               |
| `VITE_FIREBASE_APP_ID`                | frontend | yes     | "                                                               |
| `VITE_BACKEND_API_URL`                | frontend | no      | Proxy target for `/api/*`. Defaults to `http://127.0.0.1:8000`   |
| `DJANGO_SECRET_KEY` (or `SECRET_KEY`) | backend  | prod     | Django secret. Either name is accepted                          |
| `DEBUG`                               | backend  | no       | Defaults to `True`; parsed as a real boolean                    |
| `DATABASE_URL`                        | backend  | prod     | Postgres URL. Omit locally to use SQLite                        |

`NEXT_PUBLIC_*` equivalents are also accepted for the Firebase values if you prefer that
convention, but the `VITE_*` names are what the app reads at runtime.

---

## ☁️ Deploy to Render (single web service)

The repository contains everything needed: `Dockerfile`, `docker-entrypoint.sh` and an optional
`render.yaml`.

**Option A — Blueprint.** Render → **New → Blueprint** → pick this repo. It creates one web service
plus a free Postgres, and prompts you for the secrets listed above.

**Option B — manual.** Render → **New → Web Service** → connect the repo → set **Runtime: Docker**,
**Dockerfile path: `./Dockerfile`**, and add the variables from the table.

Notes:

- Set **`DATABASE_URL`** (the blueprint wires it automatically). A container filesystem is
  ephemeral, so without Postgres your library resets on every deploy.
- The health check path is **`/api/health`**.
- Render terminates TLS and provides `PORT`; the entrypoint starts Django on loopback, waits for it,
  then starts Next on `$PORT`. One container, one URL.
- The Django admin is proxied at **`/admin/`** on the same URL. Create an account once with
  `python manage.py createsuperuser` (inside the container shell) to use it.

Build and run it locally the same way:

```bash
docker build -t streamify .
docker run -p 3000:3000 -e DJANGO_SECRET_KEY=dev-secret -e DEBUG=False streamify
# open http://localhost:3000
```

---

## 🧠 How recommendations work

Recommendations are built from a per-user **artist affinity** score, computed on demand:

```
history play   →  1.0 + 1.5 × min(play_count, 20)   per artist
liked song     →  +3.0                              per artist
```

The top artists are searched in parallel, the results are **interleaved round-robin** so no single
artist can flood the list, anything already liked or played is filtered out, and each track carries
a `reason` ("Because you like …") that the UI displays. A brand-new account gets seeded shelves
instead of an empty page, and the page says so.

Every play is recorded by the player, which is what makes the scores meaningful over time.

---

## 🌐 API reference

Trailing slashes are optional everywhere.

| Method           | Endpoint                              | Purpose                                   |
| ---------------- | ------------------------------------- | ----------------------------------------- |
| `GET`            | `/api/health`                         | Liveness probe used by Render             |
| `GET`            | `/api/search?q=&limit=`               | Search songs                              |
| `GET`            | `/api/discover?limit=`                | Home shelves + mood list                  |
| `GET`            | `/api/radio?artist=&title=&exclude=`  | Endless playback suggestions              |
| `GET`            | `/api/recommendations?user_id=&limit=`| Personalised picks                        |
| `GET`            | `/api/songs/<id>`                     | Track details                             |
| `GET`            | `/api/songs/<id>/stream`              | Resolved stream URL                       |
| `GET`            | `/api/songs/<id>/download`            | Track as an attachment                    |
| `GET`            | `/api/liked?user_id=`                 | Liked songs                               |
| `POST`           | `/api/like`                           | Like a song                               |
| `POST` `DELETE`  | `/api/unlike`                         | Unlike a song                             |
| `GET` `POST`     | `/api/history`                        | Recent plays / record a play              |
| `POST`           | `/api/history/clear`                  | Clear history                             |
| `GET` `POST`     | `/api/playlists`                      | List / create playlists                   |
| `GET` `PATCH` `DELETE` | `/api/playlists/<id>`           | Read / rename / delete a playlist         |
| `POST`           | `/api/playlists/<id>/songs`           | Add a track                               |
| `DELETE` `POST`  | `/api/playlists/<id>/songs/<song_id>` | Remove a track                            |
| `POST`           | `/api/playlists/<id>/reorder`         | Reorder tracks                            |

Older clients keep working: `/api/song?id=`, `/api/download?id=` and `/api/search/combined?q=` are
still served.

Responses are normalised to one shape, so the UI never has to know what the upstream API looked like:

```json
{
  "id": "3IoDK8qI",
  "title": "Kesariya",
  "artist": "Arijit Singh, Amitabh Bhattacharya",
  "cover": "https://c.saavncdn.com/...500x500.jpg",
  "duration": 268,
  "album": "Brahmastra",
  "source": "jiosaavn",
  "streamUrl": "https://aac.saavncdn.com/....mp4"
}
```

---

## ⌨️ Keyboard shortcuts

| Key               | Action                  |
| ----------------- | ----------------------- |
| `Space` / `K`     | Play / pause            |
| `←` / `→`         | Seek 5 seconds          |
| `Shift` + `←` `→` | Previous / next track   |
| `↑` / `↓`         | Volume                  |
| `M`               | Mute                    |
| `S`               | Shuffle                 |
| `R`               | Repeat mode             |
| `L`               | Like the current track  |

---

## 🧪 Tests

```bash
cd backend
python manage.py test music        # 26 tests: parsing, routing, library, recommendations
```

The suite stubs the upstream API, so it runs offline and never depends on a rate limit.

```bash
cd frontend
npm run lint
npm run build
```

---

## ⚠️ Notes and limitations

- **Identity is the Firebase UID, trusted as sent.** Verifying an ID token server-side needs a
  Firebase service-account secret, and this project deliberately ships with none. Treat the API as
  you would any single-user demo: anyone who knows a UID can read and write that library.
- **The upstream API is rate limited.** Responses are cached in-process for 10 minutes and searches
  run through a small thread pool, but a cold start against a throttled API returns empty shelves
  rather than an error.
- **Downloads are proxied** through the backend, so a large library download costs server bandwidth.
- Playback URLs point at a third-party CDN and expire; they are resolved on demand and never stored.
- `db.sqlite3` is a local development convenience and is not part of the deployment.

---

## 🙌 Credits

- 🎧 API: [Sumit Kolhe's JioSaavn API](https://github.com/sumitkolhe/jiosaavn-api)
- 🎨 UI kit: [HeroUI](https://www.heroui.com/) · icons: [Lucide](https://lucide.dev/)
- ⚡ Framework: [Next.js](https://nextjs.org/) · [Django](https://www.djangoproject.com/)

## 📜 License

MIT License.

---

Built with ❤️ by Shirshendu for fun, learning & passion for music.
