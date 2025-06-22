# Streamify Django Backend

This Django REST backend proxies requests to the hosted JioSaavn API and provides endpoints for:
- Song search
- Song details
- Download
- User likes (placeholder)
- Playlists (placeholder)

## Endpoints
- `/api/search?q=...` — Search for songs
- `/api/song?id=...` — Get song details
- `/api/download?id=...` — Get download link
- `/api/like` — Like a song (POST)
- `/api/liked` — Get liked songs
- `/api/playlists` — Get or create playlists
- `/api/playlists/<id>` — Playlist details

## Setup
1. Create and activate a virtual environment:
   ```sh
   python -m venv venv
   source venv/bin/activate
   ```
2. Install dependencies:
   ```sh
   pip install django djangorestframework requests
   ```
3. Run migrations:
   ```sh
   python manage.py migrate
   ```
4. Start the server:
   ```sh
   python manage.py runserver
   ```

## Notes
- The backend acts as a secure proxy to the JioSaavn API.
- Add your user authentication and playlist logic as needed.
