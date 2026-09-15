"""Cached client for the hosted JioSaavn API.

Everything the app plays comes from here, so the module does three jobs:

1. Normalise the upstream payloads into the single shape the frontend expects.
2. Cache aggressively (the same searches fire from many users) which keeps the
   upstream service happy and makes the UI feel instant.
3. Fan out searches in parallel so endpoints that need several queries at once
   stay fast.
"""

import copy
import logging
import threading
import time
from concurrent.futures import ThreadPoolExecutor

import requests

logger = logging.getLogger(__name__)

# The music catalogue is bundled into this container and reached over loopback
# (see the root Dockerfile and saavn-api/serve.mjs). It used to point at the
# shared public instance, saavn.sumit.co, but that WAF-bans whole networks — it
# answered this project's network with Cloudflare "error code: 1027" on every
# route, including the bare domain. Self-hosting also means the response shape is
# pinned to a commit we control rather than whatever the public instance serves.
#
# Keep the port in step with saavn-api/serve.mjs and docker-entrypoint.sh.
JIOSAAVN_API = "http://127.0.0.1:8123/api"
REQUEST_TIMEOUT = 12
QUALITY_ORDER = ("320kbps", "160kbps", "96kbps", "48kbps", "12kbps")
COVER_SIZES = ("500x500", "150x150")

# How long to stop calling upstream after it refuses us. A WAF block (Cloudflare
# answers 429 with "error code: 1027") is not something to retry through: every
# retry keeps the block alive and makes the whole app feel broken.
COOLDOWN_SECONDS = 120
# Empty results are cached only briefly. They are usually the symptom of a failed
# call, and caching one for the full TTL would keep serving empty shelves long
# after the service recovered.
EMPTY_RESULT_TTL = 30

_cache = {}
_cache_lock = threading.Lock()
# Kept modest on purpose: the hosted API is rate limited, and a big burst of
# parallel searches is what trips it.
_pool = ThreadPoolExecutor(max_workers=4)

_cooldown_lock = threading.Lock()
_cooldown_until = 0.0
_last_error = None


def cooldown_remaining():
    with _cooldown_lock:
        return max(0.0, _cooldown_until - time.time())


def _open_cooldown(reason, seconds=COOLDOWN_SECONDS):
    global _cooldown_until, _last_error
    with _cooldown_lock:
        # Never let a later, milder failure cut an existing cooldown short.
        _cooldown_until = max(_cooldown_until, time.time() + seconds)
        _last_error = reason
    logger.warning("JioSaavn unavailable for %ss: %s", seconds, reason)


def clear_cooldown():
    """Called for an explicit retry: forget the cooldown *and* the empty results.

    Empty entries are the footprint of the failure being retried past, and they
    live on a short TTL. Leaving them would make "Try again" return the same
    emptiness for up to 30 seconds, which is worse than not offering it.
    """
    global _cooldown_until, _last_error
    with _cooldown_lock:
        _cooldown_until = 0.0
        _last_error = None
    with _cache_lock:
        for key, (_, value) in list(_cache.items()):
            if not value:
                _cache.pop(key, None)


def availability():
    """What to tell the client about the upstream right now."""
    remaining = cooldown_remaining()
    with _cooldown_lock:
        reason = _last_error
    return {"available": remaining <= 0, "retryIn": int(remaining), "reason": reason}


def _cache_get(key):
    with _cache_lock:
        entry = _cache.get(key)
    if entry is None:
        return None
    expires_at, value = entry
    if expires_at < time.time():
        with _cache_lock:
            _cache.pop(key, None)
        return None
    # Hand out a copy: callers decorate results with per-user fields (reasons,
    # exclusions) and must never be able to mutate what everyone else sees.
    return copy.deepcopy(value)


def _cache_set(key, value, ttl):
    with _cache_lock:
        if len(_cache) > 512:
            now = time.time()
            for stale_key, (expires_at, _) in list(_cache.items()):
                if expires_at < now:
                    _cache.pop(stale_key, None)
        _cache[key] = (time.time() + ttl, value)
    # Same reasoning as _cache_get: hand back a copy, never the stored object, or
    # the first caller to decorate a result would poison it for everyone else.
    return copy.deepcopy(value)


def cached(key, ttl, factory):
    hit = _cache_get(key)
    # `is not None`, not truthiness: a cached empty list is a real hit.
    if hit is not None:
        return hit
    value = factory()
    return _cache_set(key, value, ttl if value else EMPTY_RESULT_TTL)


def _describe(response):
    """Keep the WAF's own words — "error code: 1027" says it is a block."""
    try:
        detail = (response.text or "").strip().splitlines()[0][:120]
    except Exception:  # a broken connection can fail while reading the body
        detail = ""
    return f"HTTP {response.status_code}: {detail}" if detail else f"HTTP {response.status_code}"


def _request(path, params=None):
    """One upstream GET. Returns None instead of raising, ever.

    When the service refuses us the call is not retried: a cooldown opens and
    further requests short-circuit to None, so the app answers immediately rather
    than stalling on every shelf, and the block gets a chance to lift.
    """
    if cooldown_remaining() > 0:
        return None

    url = f"{JIOSAAVN_API}{path}"
    try:
        response = requests.get(url, params=params, timeout=REQUEST_TIMEOUT)
    except requests.RequestException as exc:
        logger.warning("JioSaavn request failed (%s %s): %s", url, params, exc)
        _open_cooldown(f"{exc.__class__.__name__}")
        return None

    # 403/429 mean "go away" (Cloudflare fronts this API) and 5xx means "not now".
    if response.status_code in (403, 429) or response.status_code >= 500:
        _open_cooldown(_describe(response))
        return None

    if not response.ok:
        logger.warning("JioSaavn returned %s for %s %s", response.status_code, url, params)
        return None

    try:
        return response.json()
    except ValueError:
        logger.warning("JioSaavn returned a non-JSON body for %s %s", url, params)
        return None


def _extract_songs(payload):
    """Pull the song list out of whichever envelope the API returned."""
    if not isinstance(payload, dict):
        return []
    data = payload.get("data")
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("results", "songs"):
            if isinstance(data.get(key), list):
                return data[key]
        if data.get("id"):
            return [data]
    return []


def _force_https(url):
    if isinstance(url, str) and url.startswith("http://"):
        return "https://" + url[len("http://") :]
    return url


def _pick_image(song):
    images = song.get("image") or []
    if not isinstance(images, list):
        return ""
    for size in COVER_SIZES:
        for item in images:
            if isinstance(item, dict) and item.get("quality") == size and item.get("url"):
                return _force_https(item["url"])
    for item in reversed(images):
        if isinstance(item, dict) and item.get("url"):
            return _force_https(item["url"])
    return ""


def _pick_stream_url(song):
    downloads = song.get("downloadUrl")
    if isinstance(downloads, list):
        for quality in QUALITY_ORDER:
            for item in downloads:
                if isinstance(item, dict) and item.get("quality") == quality and item.get("url"):
                    return _force_https(item["url"])
        for item in downloads:
            if isinstance(item, dict) and item.get("url"):
                return _force_https(item["url"])
    if isinstance(downloads, str) and downloads.startswith("http"):
        return _force_https(downloads)
    for key in ("media_url", "url"):
        value = song.get(key)
        if isinstance(value, str) and value.startswith("http"):
            return _force_https(value)
    return None


def _artists(song):
    groups = song.get("artists") or {}
    names = []
    if isinstance(groups, dict):
        for group in ("primary", "all", "featured"):
            for entry in groups.get(group) or []:
                if isinstance(entry, dict) and entry.get("name"):
                    names.append(entry["name"])
            if names:
                break
    if not names and song.get("primaryArtists"):
        names = [n.strip() for n in str(song["primaryArtists"]).split(",") if n.strip()]
    seen = []
    for name in names:
        if name not in seen:
            seen.append(name)
    return ", ".join(seen[:3])


def _normalise(song):
    if not isinstance(song, dict):
        return None
    song_id = song.get("id")
    if not song_id:
        return None
    try:
        duration = int(song.get("duration") or 0)
    except (TypeError, ValueError):
        duration = 0
    album = song.get("album")
    return {
        "id": str(song_id),
        "title": song.get("name") or song.get("title") or "",
        "artist": _artists(song),
        "cover": _pick_image(song),
        "duration": duration,
        "album": album.get("name") if isinstance(album, dict) else (album or ""),
        # JioSaavn is an Indian catalogue first, so the language of a result is
        # often what decides whether it is what the person meant. Kept so the UI
        # — and anyone debugging a search — can tell them apart.
        "language": song.get("language") or "",
        "source": "jiosaavn",
        # Present in search payloads, so most tracks can start playing without a
        # second round trip. Never persisted — these CDN URLs expire.
        "streamUrl": _pick_stream_url(song),
    }


def search(query, limit=20):
    query = (query or "").strip()
    if not query:
        return []

    def factory():
        payload = _request("/search/songs", {"query": query, "limit": max(limit, 10)})
        songs = [n for n in (_normalise(s) for s in _extract_songs(payload)) if n]
        return songs[:limit]

    return cached(f"search:{query.lower()}:{limit}", 600, factory)


def search_many(queries, per_query=12):
    """Run several searches at once. Returns {query: [songs]}."""
    unique = list(dict.fromkeys(q for q in queries if q))
    futures = {query: _pool.submit(search, query, per_query) for query in unique}
    results = {}
    for query, future in futures.items():
        try:
            results[query] = future.result(timeout=25)
        except Exception as exc:  # noqa: BLE001 - one bad query must not kill the page
            logger.warning("search failed for %r: %s", query, exc)
            results[query] = []
    return results


def song(song_id):
    song_id = (song_id or "").strip()
    if not song_id:
        return None

    def factory():
        # The hosted API has moved this parameter around over time; try each
        # spelling before giving up so a single upstream change cannot break
        # playback.
        for params in ({"ids": song_id}, {"id": song_id}):
            for entry in _extract_songs(_request("/songs", params)):
                normalised = _normalise(entry)
                if normalised and normalised["id"] == song_id:
                    return normalised
        for entry in _extract_songs(_request(f"/songs/{song_id}")):
            normalised = _normalise(entry)
            if normalised:
                return normalised
        return None

    return cached(f"song:{song_id}", 900, factory)


def stream_url(song_id):
    detail = song(song_id)
    return detail.get("streamUrl") if detail else None


def open_stream(url, timeout=30):
    """Open a streaming connection to a track's audio. Returns None on failure.

    Used by the download proxy so files arrive with a proper filename instead of
    a bare CDN URL the browser would just navigate to.
    """
    try:
        response = requests.get(url, stream=True, timeout=timeout)
        response.raise_for_status()
        return response
    except requests.RequestException as exc:
        logger.warning("Could not open stream %s: %s", url, exc)
        return None
