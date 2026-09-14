"""API views.

Identity: the frontend authenticates with Firebase (Google) in the browser and
sends the resulting UID as ``user_id``. Verifying a Firebase ID token server-side
would require a service-account secret, which this project deliberately does not
ship, so the UID is trusted as the identity. That keeps the app deployable with
the env keys it already has, but it does mean these endpoints must not be put
behind anything sensitive: anyone who knows a UID can read and write that
library. Read endpoints never create users; write endpoints create one on
demand so a library exists to attach rows to.
"""

import logging
from collections import defaultdict
from urllib.parse import quote

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.db.models import Count, F, Max
from django.http import HttpResponseRedirect, JsonResponse, StreamingHttpResponse
from django.utils import timezone
from django.utils.text import slugify
from rest_framework.decorators import api_view

from . import upstream
from .models import LikedSong, ListeningHistory, Playlist, PlaylistSong

logger = logging.getLogger(__name__)

MAX_LIMIT = 60

# Queries behind the home page shelves. Seeded searches keep "discover" content
# available for every user, including brand new ones.
DISCOVER_SECTIONS = (
    {"key": "trending", "title": "Trending now", "query": "top hits"},
    {"key": "chill", "title": "Chill vibes", "query": "chill songs"},
    {"key": "workout", "title": "Workout", "query": "workout songs"},
    {"key": "romantic", "title": "Romance", "query": "romantic songs"},
    {"key": "lofi", "title": "Lo-fi & focus", "query": "lofi beats"},
    {"key": "party", "title": "Party starters", "query": "party hits"},
)

MOODS = (
    {"label": "Pop", "query": "pop hits"},
    {"label": "Hip-Hop", "query": "hip hop hits"},
    {"label": "Rock", "query": "rock classics"},
    {"label": "Lo-fi", "query": "lofi beats"},
    {"label": "Chill", "query": "chill songs"},
    {"label": "Workout", "query": "workout songs"},
    {"label": "Romance", "query": "romantic songs"},
    {"label": "Party", "query": "party hits"},
    {"label": "Indie", "query": "indie songs"},
    {"label": "Electronic", "query": "electronic dance"},
    {"label": "Bollywood", "query": "bollywood hits"},
    {"label": "Focus", "query": "study focus music"},
)


# --------------------------------------------------------------------------- #
# helpers
# --------------------------------------------------------------------------- #


def _limit(raw, default=24, maximum=MAX_LIMIT):
    try:
        value = int(raw)
    except (TypeError, ValueError):
        return default
    return max(1, min(value, maximum))


def _uid_from(request, payload=None):
    uid = None
    if isinstance(payload, dict):
        uid = payload.get("user_id") or payload.get("userId")
    if not uid:
        uid = request.query_params.get("user_id")
    if not uid:
        return None
    uid = str(uid).strip()[:150]
    return uid or None


def _lookup_user(request, payload=None):
    """Read-only identity lookup. Never creates rows."""
    uid = _uid_from(request, payload)
    if not uid:
        return None
    return get_user_model().objects.filter(username=uid).first()


def _user_from(request, payload=None):
    """Identity lookup that provisions a user so writes have something to own."""
    uid = _uid_from(request, payload)
    if not uid:
        return None
    User = get_user_model()
    try:
        user, _ = User.objects.get_or_create(username=uid)
    except IntegrityError:  # concurrent first request for the same uid
        user = User.objects.filter(username=uid).first()
    return user


def _upstream_state():
    """Tell the client whether the music service is refusing us, and for how long.

    Without this the UI can only report "no results", which is a lie when the
    truth is that the upstream is blocked or down.
    """
    state = upstream.availability()
    return {
        "unavailable": not state["available"],
        "retryIn": state["retryIn"],
        # The upstream's own words ("HTTP 429: error code: 1027") are useful while
        # debugging but are infrastructure detail, so they stay in DEBUG.
        "upstreamReason": state["reason"] if settings.DEBUG else None,
    }


def _maybe_retry(request):
    """An explicit retry from the UI clears the cooldown, so a block that has
    lifted is picked up immediately instead of after the cooldown expires."""
    if request.GET.get("refresh"):
        upstream.clear_cooldown()


def _dedupe(songs):
    seen = set()
    unique = []
    for song in songs:
        if not song or not song.get("id") or song["id"] in seen:
            continue
        seen.add(song["id"])
        unique.append(song)
    return unique


def _split_artists(value):
    if not value:
        return []
    names = []
    for chunk in str(value).split(","):
        name = chunk.strip()
        if name and name not in names:
            names.append(name)
    return names


def _song_payload(song_id, title, artist, cover, **extra):
    payload = {
        "id": song_id,
        "title": title,
        "artist": artist,
        "cover": cover,
        "source": "jiosaavn",
    }
    payload.update(extra)
    return payload


def _playlist_summary(playlist, song_count=None):
    return {
        "id": playlist.id,
        "name": playlist.name,
        "createdAt": playlist.created_at,
        "songCount": playlist.songs.count() if song_count is None else song_count,
    }


def _playlist_detail(playlist):
    songs = [
        _song_payload(row.song_id, row.title, row.artist, row.cover, position=row.position)
        for row in playlist.songs.all()
    ]
    return {"id": playlist.id, "name": playlist.name, "songs": songs, "songCount": len(songs)}


# --------------------------------------------------------------------------- #
# catalogue
# --------------------------------------------------------------------------- #


@api_view(["GET"])
def health(request):
    return JsonResponse({"status": "ok"})


@api_view(["GET"])
def search(request):
    _maybe_retry(request)
    query = (request.GET.get("q") or "").strip()
    if not query:
        return JsonResponse({"query": "", "results": [], **_upstream_state()})
    results = upstream.search(query, _limit(request.GET.get("limit"), default=24))
    return JsonResponse({"query": query, "results": results, **_upstream_state()})


@api_view(["GET"])
def discover(request):
    _maybe_retry(request)
    limit = _limit(request.GET.get("limit"), default=12)
    buckets = upstream.search_many(
        [section["query"] for section in DISCOVER_SECTIONS], per_query=max(limit, 12)
    )
    sections = []
    for section in DISCOVER_SECTIONS:
        songs = _dedupe(buckets.get(section["query"], []))[:limit]
        if songs:
            sections.append({**section, "songs": songs})
    return JsonResponse({"sections": sections, "moods": MOODS, **_upstream_state()})


@api_view(["GET"])
def song_detail(request, song_id):
    detail = upstream.song(song_id)
    if not detail:
        return JsonResponse({"error": "Song not found"}, status=404)
    return JsonResponse(detail)


@api_view(["GET"])
def song_stream(request, song_id):
    url = upstream.stream_url(song_id)
    if not url:
        return JsonResponse({"error": "No playable stream for this track"}, status=404)
    return JsonResponse({"id": song_id, "url": url, "source": "jiosaavn"})


def _chunks(response, chunk_size=64 * 1024):
    try:
        for chunk in response.iter_content(chunk_size=chunk_size):
            if chunk:
                yield chunk
    finally:
        response.close()


@api_view(["GET"])
def song_download(request, song_id):
    """Proxy a track back to the browser as a named file.

    Straight CDN links are cross-origin, so `a[download]` is ignored by the browser
    and the tab just navigates to the audio. Streaming it through here means the
    file arrives with a real name and the correct content type.
    """
    detail = upstream.song(song_id)
    url = detail.get("streamUrl") if detail else None
    if not url:
        return JsonResponse({"error": "No downloadable stream for this track"}, status=404)

    title = (detail.get("title") or "Streamify track").strip()
    artist = (detail.get("artist") or "").strip()
    readable = f"{title} - {artist}".strip(" -") or "Streamify track"
    ascii_name = slugify(readable)[:80] or "streamify-track"

    remote = upstream.open_stream(url)
    if remote is None:
        # Still useful: let the browser open the raw url directly.
        return HttpResponseRedirect(url)

    response = StreamingHttpResponse(_chunks(remote), content_type="audio/mpeg")
    response["Content-Disposition"] = (
        f'attachment; filename="{ascii_name}.mp3"; '
        f"filename*=UTF-8''{quote(readable, safe='')}.mp3"
    )
    length = remote.headers.get("Content-Length")
    if length:
        response["Content-Length"] = length
    return response


@api_view(["GET"])
def radio(request):
    """Endless playback: given the track that just finished, suggest what's next."""
    _maybe_retry(request)
    limit = _limit(request.GET.get("limit"), default=12)
    artist = (request.GET.get("artist") or "").strip()
    title = (request.GET.get("title") or "").strip()
    exclude = {value for value in (request.GET.get("exclude") or "").split(",") if value}

    queries = _split_artists(artist)[:2]
    if title:
        queries.append(title)
    if not queries:
        queries = ["top hits"]

    buckets = upstream.search_many(queries, per_query=limit + len(exclude) + 6)
    pool = []
    for query in queries:
        pool.extend(buckets.get(query, []))
    songs = [song for song in _dedupe(pool) if song["id"] not in exclude][:limit]

    quality = "artist" if artist else "generic"
    return JsonResponse(
        {
            "seed": {"artist": artist, "title": title},
            "quality": quality,
            "results": songs,
            **_upstream_state(),
        }
    )


# --------------------------------------------------------------------------- #
# recommendations
# --------------------------------------------------------------------------- #


def _artist_weights(user):
    """How much this user likes each artist, from plays and likes.

    Plays dominate because they show intent even when nothing was liked, and a
    track played thirty times says far more than one that was liked and skipped.
    """
    weights = defaultdict(float)
    for entry in ListeningHistory.objects.filter(user=user)[:300]:
        for artist in _split_artists(entry.artist):
            weights[artist] += 1.0 + 1.5 * min(entry.play_count, 20)
    for entry in LikedSong.objects.filter(user=user)[:300]:
        for artist in _split_artists(entry.artist):
            weights[artist] += 3.0
    return weights


def _interleave(buckets, artists, limit, exclude):
    """Round-robin the per-artist results so one artist cannot flood the list."""
    queues = {artist: list(buckets.get(artist) or []) for artist in artists}
    results = []
    seen = set(exclude)
    while len(results) < limit:
        progressed = False
        for artist in artists:
            queue = queues[artist]
            while queue:
                candidate = queue.pop(0)
                if candidate["id"] in seen:
                    continue
                seen.add(candidate["id"])
                candidate["reason"] = f"Because you like {artist}"
                results.append(candidate)
                progressed = True
                break
            if len(results) >= limit:
                break
        if not progressed:
            break
    return results


def _cold_start(limit):
    """A brand new library still deserves a decent shelf."""
    queries = [mood["query"] for mood in MOODS[:4]]
    buckets = upstream.search_many(queries, per_query=max(limit, 12))
    pool = []
    for query in queries:
        pool.extend(buckets.get(query, []))
    return _dedupe(pool)[:limit]


def build_recommendations(user, limit):
    artists = [
        artist
        for artist, _ in sorted(_artist_weights(user).items(), key=lambda kv: (-kv[1], kv[0]))[:6]
    ]
    if not artists:
        return {"personalized": False, "basedOn": [], "results": _cold_start(limit)}

    exclude = set(LikedSong.objects.filter(user=user).values_list("song_id", flat=True))
    exclude |= set(ListeningHistory.objects.filter(user=user).values_list("song_id", flat=True))

    buckets = upstream.search_many(artists, per_query=14)
    results = _interleave(buckets, artists, limit, exclude)
    if not results:
        return {"personalized": False, "basedOn": [], "results": _cold_start(limit)}
    return {"personalized": True, "basedOn": artists, "results": results}


@api_view(["GET"])
def recommendations(request):
    _maybe_retry(request)
    limit = _limit(request.GET.get("limit"), default=24)
    user = _lookup_user(request)
    if not user:
        payload = {"personalized": False, "basedOn": [], "results": _cold_start(limit)}
    else:
        payload = build_recommendations(user, limit)
    return JsonResponse({**payload, **_upstream_state()})


# --------------------------------------------------------------------------- #
# likes
# --------------------------------------------------------------------------- #


@api_view(["GET"])
def liked_songs(request):
    user = _lookup_user(request)
    if not user:
        return JsonResponse({"songs": []})
    songs = [
        _song_payload(row.song_id, row.title, row.artist, row.cover, likedAt=row.added_at)
        for row in LikedSong.objects.filter(user=user)
    ]
    return JsonResponse({"songs": songs})


@api_view(["POST"])
def like_song(request):
    user = _user_from(request, request.data)
    if not user:
        return JsonResponse({"error": "user_id is required"}, status=400)
    song_id = str(request.data.get("song_id") or "").strip()
    title = str(request.data.get("title") or "").strip()
    artist = str(request.data.get("artist") or "").strip()
    if not song_id or not title or not artist:
        return JsonResponse({"error": "song_id, title and artist are required"}, status=400)

    LikedSong.objects.get_or_create(
        user=user,
        song_id=song_id,
        defaults={
            "title": title[:255],
            "artist": artist[:255],
            "cover": request.data.get("cover") or None,
        },
    )
    return JsonResponse({"status": "liked", "id": song_id}, status=201)


@api_view(["POST", "DELETE"])
def unlike_song(request):
    payload = request.data if request.method == "POST" else None
    user = _lookup_user(request, payload)
    if not user:
        return JsonResponse({"error": "user_id is required"}, status=400)
    song_id = str(
        (payload.get("song_id") if isinstance(payload, dict) else None)
        or request.query_params.get("song_id")
        or ""
    ).strip()
    if not song_id:
        return JsonResponse({"error": "song_id is required"}, status=400)
    LikedSong.objects.filter(user=user, song_id=song_id).delete()
    return JsonResponse({"status": "unliked", "id": song_id})


# --------------------------------------------------------------------------- #
# listening history
# --------------------------------------------------------------------------- #


@api_view(["GET", "POST"])
def history(request):
    """GET the recent plays, POST to record one."""
    if request.method == "POST":
        return _record_play(request)

    user = _lookup_user(request)
    if not user:
        return JsonResponse({"songs": []})
    limit = _limit(request.GET.get("limit"), default=30)
    songs = [
        _song_payload(
            row.song_id,
            row.title,
            row.artist,
            row.cover,
            playCount=row.play_count,
            lastPlayed=row.last_played,
        )
        for row in ListeningHistory.objects.filter(user=user)[:limit]
    ]
    return JsonResponse({"songs": songs})


def _record_play(request):
    """Plain helper, not a second DRF view: DRF refuses a Request passed into
    another decorated view, and /history/ handles both verbs anyway."""
    user = _user_from(request, request.data)
    if not user:
        return JsonResponse({"error": "user_id is required"}, status=400)
    song_id = str(request.data.get("song_id") or "").strip()
    if not song_id:
        return JsonResponse({"error": "song_id is required"}, status=400)

    title = str(request.data.get("title") or "").strip()[:255] or "Unknown title"
    artist = str(request.data.get("artist") or "").strip()[:255] or "Unknown artist"
    entry, created = ListeningHistory.objects.get_or_create(
        user=user,
        song_id=song_id,
        defaults={"title": title, "artist": artist, "cover": request.data.get("cover") or None},
    )
    if created:
        plays = 1
    else:
        ListeningHistory.objects.filter(pk=entry.pk).update(
            play_count=F("play_count") + 1, last_played=timezone.now()
        )
        entry.refresh_from_db(fields=["play_count"])
        plays = entry.play_count
    return JsonResponse({"status": "recorded", "plays": plays}, status=201)


@api_view(["POST", "DELETE"])
def clear_history(request):
    payload = request.data if request.method == "POST" else None
    user = _lookup_user(request, payload)
    if not user:
        return JsonResponse({"error": "user_id is required"}, status=400)
    deleted, _ = ListeningHistory.objects.filter(user=user).delete()
    return JsonResponse({"status": "cleared", "deleted": deleted})


# --------------------------------------------------------------------------- #
# playlists
# --------------------------------------------------------------------------- #


@api_view(["GET", "POST"])
def playlists(request):
    payload = request.data if request.method == "POST" else None
    if request.method == "POST":
        user = _user_from(request, payload)
        if not user:
            return JsonResponse({"error": "user_id is required"}, status=400)
        name = str(request.data.get("name") or "").strip()
        if not name:
            return JsonResponse({"error": "name is required"}, status=400)
        playlist = Playlist.objects.create(user=user, name=name[:255])
        return JsonResponse(_playlist_summary(playlist, song_count=0), status=201)

    user = _lookup_user(request)
    if not user:
        return JsonResponse({"playlists": []})
    rows = Playlist.objects.filter(user=user).annotate(song_count=Count("songs"))
    return JsonResponse(
        {"playlists": [_playlist_summary(row, song_count=row.song_count) for row in rows]}
    )


def _owned_playlist(request, playlist_id, payload=None):
    """Fetch a playlist the caller owns, or the response to send instead.

    Looked up by uid rather than by User row so a uid with no library yet gets a
    plain 404 (a playlist that is not theirs) instead of a misleading "user_id is
    required".
    """
    uid = _uid_from(request, payload)
    if not uid:
        return None, JsonResponse({"error": "user_id is required"}, status=400)
    playlist = Playlist.objects.filter(pk=playlist_id, user__username=uid).first()
    if not playlist:
        return None, JsonResponse({"error": "Playlist not found"}, status=404)
    return playlist, None


@api_view(["GET", "PATCH", "DELETE"])
def playlist_detail(request, playlist_id):
    payload = request.data if request.method == "PATCH" else None
    playlist, error = _owned_playlist(request, playlist_id, payload)
    if error:
        return error

    if request.method == "DELETE":
        playlist.delete()
        return JsonResponse({"status": "deleted", "id": playlist_id})

    if request.method == "PATCH":
        name = str(request.data.get("name") or "").strip()
        if name:
            playlist.name = name[:255]
            playlist.save(update_fields=["name"])

    return JsonResponse(_playlist_detail(playlist))


@api_view(["POST"])
def playlist_songs(request, playlist_id):
    playlist, error = _owned_playlist(request, playlist_id, request.data)
    if error:
        return error

    song_id = str(request.data.get("song_id") or "").strip()
    if not song_id:
        return JsonResponse({"error": "song_id is required"}, status=400)
    if playlist.songs.filter(song_id=song_id).exists():
        return JsonResponse(_playlist_detail(playlist))

    highest = playlist.songs.aggregate(highest=Max("position"))["highest"] or 0
    PlaylistSong.objects.create(
        playlist=playlist,
        song_id=song_id,
        title=str(request.data.get("title") or "").strip()[:255] or "Unknown title",
        artist=str(request.data.get("artist") or "").strip()[:255] or "Unknown artist",
        cover=request.data.get("cover") or None,
        position=highest + 1,
    )
    return JsonResponse(_playlist_detail(playlist), status=201)


@api_view(["DELETE", "POST"])
def playlist_song_detail(request, playlist_id, song_id):
    payload = request.data if request.method == "POST" else None
    playlist, error = _owned_playlist(request, playlist_id, payload)
    if error:
        return error
    playlist.songs.filter(song_id=song_id).delete()
    return JsonResponse(_playlist_detail(playlist))


@api_view(["POST"])
def playlist_reorder(request, playlist_id):
    playlist, error = _owned_playlist(request, playlist_id, request.data)
    if error:
        return error

    order = request.data.get("order")
    if not isinstance(order, list):
        return JsonResponse({"error": "order must be a list of song ids"}, status=400)
    for index, song_id in enumerate(order):
        playlist.songs.filter(song_id=str(song_id)).update(position=index)
    return JsonResponse(_playlist_detail(playlist))


# --------------------------------------------------------------------------- #
# backwards-compatible aliases for the pre-Next frontend
# --------------------------------------------------------------------------- #


@api_view(["GET"])
def legacy_song(request):
    detail = upstream.song(request.GET.get("id") or "")
    if not detail:
        return JsonResponse({"error": "Song not found"}, status=404)
    return JsonResponse(detail)


@api_view(["GET"])
def legacy_download(request):
    url = upstream.stream_url(request.GET.get("id") or "")
    if not url:
        return JsonResponse({"error": "No playable stream for this track"}, status=404)
    return JsonResponse({"url": url})


@api_view(["GET"])
def legacy_combined_search(request):
    return JsonResponse({"results": upstream.search(request.GET.get("q") or "", 24)})
