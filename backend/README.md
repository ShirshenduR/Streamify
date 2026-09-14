# Streamify — Django API

The backend is a **cached proxy and a small library store** in front of the hosted JioSaavn API.

- `upstream.py` — talks to the **bundled** JioSaavn API on `127.0.0.1:8123`, normalises its payloads
  into one shape, and caches the results in-process (the upstream is rate limited, and every user
  asks for the same searches). It previously called the shared public instance, which WAF-bans whole
  networks; self-hosting is why search and playback work at all.
- `views.py` — the HTTP surface: catalogue, likes, listening history, playlists, recommendations.
- `models.py` — `LikedSong`, `ListeningHistory`, `Playlist`, `PlaylistSong`.

It runs beside Next.js inside one container, on loopback. See the root `README.md` for the full
architecture and API reference.

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env               # DJANGO_SECRET_KEY, optionally DATABASE_URL
python manage.py migrate
python manage.py runserver         # http://127.0.0.1:8000
```

## Environment

| Variable                              | Notes                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------- |
| `DJANGO_SECRET_KEY` or `SECRET_KEY`   | Either name works. Required when `DEBUG` is off                          |
| `DEBUG`                               | Defaults to `True`. Parsed properly, so `"False"` really turns it off    |
| `DATABASE_URL`                        | Postgres. Omitted → SQLite at `backend/db.sqlite3`                       |

## Tests

```bash
python manage.py test music
```

26 tests covering payload parsing, the optional-trailing-slash routing, likes, history, playlist
ownership and the recommendation scoring. The upstream API is stubbed throughout, so the suite is
fast, offline and unaffected by rate limits.

## Notes

- Routers/routes: every path accepts an **optional trailing slash** (`/api/health` and
  `/api/health/`). The Next proxy strips trailing slashes, and Django will not redirect a POST body,
  so both spellings must resolve.
- Every user-scoped endpoint takes a `user_id` (the Firebase UID). Read endpoints never create rows;
  write endpoints provision the user on demand.
- `AnonRateThrottle` is set to `600/min` — these endpoints proxy a third-party API and should not be
  a free amplifier.
- Static files are served by WhiteNoise so the Django admin is usable under Gunicorn.
