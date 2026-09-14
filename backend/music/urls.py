from django.urls import re_path

from . import views


def api(route, view, name):
    """Register a route whose trailing slash is optional.

    Next.js proxies the browser's ``/api/...`` calls to Django, and its rewrite
    rule strips the trailing slash on the way through. Requiring one spelling
    would therefore mean every request either takes an extra redirect (GET) or
    fails outright (POST — Django refuses to redirect a body it would lose), so
    both forms have to resolve to the same view.
    """
    return re_path(rf"^{route}/?$", view, name=name)


urlpatterns = [
    api("health", views.health, "health"),
    # catalogue
    api("search", views.search, "search"),
    api("discover", views.discover, "discover"),
    api("radio", views.radio, "radio"),
    # personalised
    api("recommendations", views.recommendations, "recommendations"),
    api("history", views.history, "history"),
    api("history/clear", views.clear_history, "clear_history"),
    # likes
    api("liked", views.liked_songs, "liked_songs"),
    api("like", views.like_song, "like_song"),
    api("unlike", views.unlike_song, "unlike_song"),
    # playlists
    api("playlists", views.playlists, "playlists"),
    re_path(r"^playlists/(?P<playlist_id>\d+)/?$", views.playlist_detail, name="playlist_detail"),
    re_path(
        r"^playlists/(?P<playlist_id>\d+)/songs/?$", views.playlist_songs, name="playlist_songs"
    ),
    re_path(
        r"^playlists/(?P<playlist_id>\d+)/songs/(?P<song_id>[^/]+)/?$",
        views.playlist_song_detail,
        name="playlist_song_detail",
    ),
    re_path(
        r"^playlists/(?P<playlist_id>\d+)/reorder/?$", views.playlist_reorder, name="playlist_reorder"
    ),
    # songs
    re_path(r"^songs/(?P<song_id>[^/]+)/?$", views.song_detail, name="song_detail"),
    re_path(r"^songs/(?P<song_id>[^/]+)/stream/?$", views.song_stream, name="song_stream"),
    re_path(r"^songs/(?P<song_id>[^/]+)/download/?$", views.song_download, name="song_download"),
    # aliases kept for the pre-Next React app
    api("song", views.legacy_song, "legacy_song"),
    api("download", views.legacy_download, "legacy_download"),
    api("search/combined", views.legacy_combined_search, "legacy_combined_search"),
]
