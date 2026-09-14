"""Tests for the Streamify API.

The upstream music API is rate limited, so the parsing and recommendation logic is
covered with fixtures and monkeypatched responses rather than live calls. That
keeps the suite fast, deterministic and runnable offline.
"""

import json
from unittest import mock

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from . import upstream, views
from .models import LikedSong, ListeningHistory, PlaylistSong

SAMPLE_PAYLOAD = {
    "success": True,
    "data": {
        "total": 1,
        "start": 1,
        "results": [
            {
                "id": "3IoDK8qI",
                "name": "Kesariya",
                "duration": 268,
                "album": {"id": "11", "name": "Brahmastra"},
                "artists": {
                    "primary": [
                        {"id": "1", "name": "Arijit Singh"},
                        {"id": "2", "name": "Amitabh Bhattacharya"},
                    ]
                },
                "image": [
                    {"quality": "50x50", "url": "http://c.saavncdn.com/50.jpg"},
                    {"quality": "500x500", "url": "http://c.saavncdn.com/500.jpg"},
                ],
                "downloadUrl": [
                    {"quality": "96kbps", "url": "http://aac.saavncdn.com/96.mp4"},
                    {"quality": "320kbps", "url": "http://aac.saavncdn.com/320.mp4"},
                ],
            }
        ],
    },
}


def song(song_id, artist, **extra):
    payload = {
        "id": song_id,
        "title": f"Title {song_id}",
        "artist": artist,
        "cover": "https://c.saavncdn.com/x.jpg",
        "duration": 200,
        "album": "Album",
        "source": "jiosaavn",
        "streamUrl": None,
    }
    payload.update(extra)
    return payload


class NormalisationTests(TestCase):
    def test_extract_songs_handles_every_envelope(self):
        results = SAMPLE_PAYLOAD["data"]["results"]
        self.assertEqual(upstream._extract_songs(SAMPLE_PAYLOAD), results)
        self.assertEqual(upstream._extract_songs({"data": results}), results)
        self.assertEqual(upstream._extract_songs({"data": results[0]}), results)
        self.assertEqual(upstream._extract_songs(None), [])
        self.assertEqual(upstream._extract_songs({"data": {"total": 0}}), [])

    def test_normalise_maps_the_fields_the_frontend_uses(self):
        normalised = upstream._normalise(SAMPLE_PAYLOAD["data"]["results"][0])

        self.assertEqual(normalised["id"], "3IoDK8qI")
        self.assertEqual(normalised["title"], "Kesariya")
        self.assertEqual(normalised["artist"], "Arijit Singh, Amitabh Bhattacharya")
        self.assertEqual(normalised["duration"], 268)
        self.assertEqual(normalised["album"], "Brahmastra")
        self.assertEqual(normalised["source"], "jiosaavn")

    def test_prefers_the_largest_cover_and_the_best_quality_stream(self):
        normalised = upstream._normalise(SAMPLE_PAYLOAD["data"]["results"][0])
        # Both CDN urls arrive over http and must be upgraded (https pages block http audio).
        self.assertEqual(normalised["cover"], "https://c.saavncdn.com/500.jpg")
        self.assertEqual(normalised["streamUrl"], "https://aac.saavncdn.com/320.mp4")

    def test_normalise_rejects_junk(self):
        self.assertIsNone(upstream._normalise(None))
        self.assertIsNone(upstream._normalise({"name": "no id"}))
        self.assertIsNone(upstream._normalise("not a dict"))

    def test_normalise_survives_missing_or_broken_fields(self):
        normalised = upstream._normalise({"id": "abc", "duration": "not-a-number"})
        self.assertEqual(normalised["duration"], 0)
        self.assertEqual(normalised["artist"], "")
        self.assertEqual(normalised["cover"], "")
        self.assertIsNone(normalised["streamUrl"])

    def test_force_https_only_touches_http(self):
        self.assertEqual(upstream._force_https("http://x/y"), "https://x/y")
        self.assertEqual(upstream._force_https("https://x/y"), "https://x/y")
        self.assertIsNone(upstream._force_https(None))


class CacheTests(TestCase):
    def test_cached_results_are_copies(self):
        """Callers decorate results (reasons, exclusions) — the cache must not see it."""
        payload = json.loads(json.dumps(SAMPLE_PAYLOAD))
        with mock.patch.object(upstream, "_request", return_value=payload):
            first = upstream.search("kesariya", 5)
            self.assertEqual(len(first), 1)
            first[0]["reason"] = "Because you like Arijit Singh"
            first[0]["id"] = "mutated"

            second = upstream.search("kesariya", 5)
            self.assertEqual(second[0]["id"], "3IoDK8qI")
            self.assertNotIn("reason", second[0])

    def test_blank_query_never_hits_the_network(self):
        with mock.patch.object(upstream, "_request") as request:
            self.assertEqual(upstream.search("   "), [])
            request.assert_not_called()


class RoutingTests(TestCase):
    def test_health_answers_with_and_without_a_trailing_slash(self):
        """The Next proxy strips the trailing slash, so both spellings must work."""
        self.assertEqual(self.client.get("/api/health/").status_code, 200)
        self.assertEqual(self.client.get("/api/health").status_code, 200)
        self.assertEqual(self.client.get(reverse("health")).json(), {"status": "ok"})

    def test_nested_routes_resolve_with_and_without_a_trailing_slash(self):
        """The proxy strips the slash, so nested routes must match either way."""
        user = get_user_model().objects.create_user("route-user")
        playlist = user.playlists.create(name="Mix")

        for path in (f"/api/playlists/{playlist.id}", f"/api/playlists/{playlist.id}/"):
            response = self.client.get(path, {"user_id": "route-user"})
            self.assertEqual(response.status_code, 200, path)

        for path in (f"/api/playlists/{playlist.id}/songs", f"/api/playlists/{playlist.id}/songs/"):
            response = self.client.post(
                path,
                data=json.dumps(
                    {"user_id": "route-user", "song_id": f"s{len(path)}", "title": "T", "artist": "A"}
                ),
                content_type="application/json",
            )
            self.assertEqual(response.status_code, 201, path)

    def test_post_is_not_redirected(self):
        """A redirect here would silently drop the body."""
        response = self.client.post(
            "/api/history/",
            data=json.dumps({"user_id": "poster", "song_id": "s1", "title": "T", "artist": "A"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)


class LibraryTests(TestCase):
    def post_json(self, path, payload):
        return self.client.post(path, data=json.dumps(payload), content_type="application/json")

    def test_like_unlike_round_trip(self):
        self.assertEqual(
            self.post_json("/api/like/", {"user_id": "u1", "song_id": "s1", "title": "T", "artist": "A"}).status_code,
            201,
        )
        # Liking twice is idempotent.
        self.post_json("/api/like/", {"user_id": "u1", "song_id": "s1", "title": "T", "artist": "A"})
        self.assertEqual(len(self.client.get("/api/liked/?user_id=u1").json()["songs"]), 1)

        self.post_json("/api/unlike/", {"user_id": "u1", "song_id": "s1"})
        self.assertEqual(self.client.get("/api/liked/?user_id=u1").json()["songs"], [])

    def test_like_requires_a_title_and_artist(self):
        response = self.post_json("/api/like/", {"user_id": "u1", "song_id": "s1"})
        self.assertEqual(response.status_code, 400)

    def test_unknown_user_reads_return_empty_instead_of_creating_rows(self):
        """Random uids hitting the read endpoints must not bloat the user table."""
        before = get_user_model().objects.count()
        self.assertEqual(self.client.get("/api/liked/?user_id=ghost").json(), {"songs": []})
        self.assertEqual(self.client.get("/api/playlists/?user_id=ghost").json(), {"playlists": []})
        self.assertEqual(get_user_model().objects.count(), before)

    def test_history_counts_repeat_plays(self):
        for _ in range(3):
            self.post_json(
                "/api/history/",
                {"user_id": "u2", "song_id": "s9", "title": "T", "artist": "A"},
            )
        songs = self.client.get("/api/history/?user_id=u2").json()["songs"]
        self.assertEqual(len(songs), 1)
        self.assertEqual(songs[0]["playCount"], 3)
        self.assertEqual(ListeningHistory.objects.get(song_id="s9").play_count, 3)

    def test_clearing_history_removes_every_row(self):
        self.post_json("/api/history/", {"user_id": "u3", "song_id": "s1", "title": "T", "artist": "A"})
        self.post_json("/api/history/clear/", {"user_id": "u3"})
        self.assertEqual(self.client.get("/api/history/?user_id=u3").json()["songs"], [])

    def test_playlist_lifecycle(self):
        created = self.post_json("/api/playlists/", {"user_id": "u4", "name": "Road trip"})
        self.assertEqual(created.status_code, 201)
        playlist_id = created.json()["id"]

        added = self.post_json(
            f"/api/playlists/{playlist_id}/songs/",
            {"user_id": "u4", "song_id": "s1", "title": "T", "artist": "A"},
        )
        self.assertEqual(added.status_code, 201)
        self.assertEqual(len(added.json()["songs"]), 1)

        # Adding the same track twice must not duplicate it.
        again = self.post_json(
            f"/api/playlists/{playlist_id}/songs/",
            {"user_id": "u4", "song_id": "s1", "title": "T", "artist": "A"},
        )
        self.assertEqual(len(again.json()["songs"]), 1)

        for index, song_id in enumerate(["s2", "s3"]):
            self.post_json(
                f"/api/playlists/{playlist_id}/songs/",
                {"user_id": "u4", "song_id": song_id, "title": "T", "artist": "A"},
            )

        reordered = self.post_json(
            f"/api/playlists/{playlist_id}/reorder/",
            {"user_id": "u4", "order": ["s3", "s1", "s2"]},
        )
        self.assertEqual([s["id"] for s in reordered.json()["songs"]], ["s3", "s1", "s2"])

        removed = self.client.delete(f"/api/playlists/{playlist_id}/songs/s1/?user_id=u4")
        self.assertEqual([s["id"] for s in removed.json()["songs"]], ["s3", "s2"])

        renamed = self.client.patch(
            f"/api/playlists/{playlist_id}/",
            data=json.dumps({"user_id": "u4", "name": "Renamed"}),
            content_type="application/json",
        )
        self.assertEqual(renamed.json()["name"], "Renamed")

        self.assertEqual(
            self.client.delete(f"/api/playlists/{playlist_id}/?user_id=u4").status_code, 200
        )
        self.assertEqual(PlaylistSong.objects.count(), 0)

    def test_playlists_are_private_to_their_owner(self):
        playlist_id = self.post_json(
            "/api/playlists/", {"user_id": "owner", "name": "Mine"}
        ).json()["id"]

        self.assertEqual(self.client.get("/api/playlists/?user_id=intruder").json()["playlists"], [])
        self.assertEqual(
            self.client.get(f"/api/playlists/{playlist_id}/?user_id=intruder").status_code, 404
        )
        self.assertEqual(
            self.client.delete(f"/api/playlists/{playlist_id}/?user_id=intruder").status_code, 404
        )


class RecommendationTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user("listener")

    def test_artist_weights_combine_likes_and_plays(self):
        LikedSong.objects.create(user=self.user, song_id="a", title="T", artist="Arijit Singh")
        ListeningHistory.objects.create(
            user=self.user, song_id="b", title="T", artist="Arijit Singh, Shreya Ghoshal", play_count=4
        )
        weights = views._artist_weights(self.user)

        # 3 for the like, plus (1 + 1.5 * 4) = 7 for the plays.
        self.assertEqual(weights["Arijit Singh"], 10)
        self.assertEqual(weights["Shreya Ghoshal"], 7)

    def test_recommendations_round_robin_and_skip_known_tracks(self):
        LikedSong.objects.create(user=self.user, song_id="liked-1", title="T", artist="Alpha")
        ListeningHistory.objects.create(
            user=self.user, song_id="heard-1", title="T", artist="Beta", play_count=5
        )

        buckets = {
            "Alpha": [song("liked-1", "Alpha"), song("a1", "Alpha"), song("a2", "Alpha")],
            "Beta": [song("b1", "Beta"), song("b2", "Beta")],
        }
        with mock.patch.object(upstream, "search_many", return_value=buckets):
            result = views.build_recommendations(self.user, limit=4)

        self.assertTrue(result["personalized"])
        # Beta leads: a like is worth 3, but five plays are 1 + 1.5 * 5 = 8.5.
        self.assertEqual(result["basedOn"], ["Beta", "Alpha"])

        ids = [item["id"] for item in result["results"]]
        self.assertNotIn("liked-1", ids)
        self.assertNotIn("heard-1", ids)
        # Round robin: one from each artist, then back to the first.
        self.assertEqual(ids, ["b1", "a1", "b2", "a2"])
        self.assertTrue(all(item["reason"].startswith("Because you like") for item in result["results"]))

    def test_cold_start_falls_back_to_seeded_searches(self):
        buckets = {"pop hits": [song("p1", "Pop Star")]}
        with mock.patch.object(upstream, "search_many", return_value=buckets):
            result = views.build_recommendations(self.user, limit=4)

        self.assertFalse(result["personalized"])
        self.assertEqual(result["basedOn"], [])
        self.assertEqual([item["id"] for item in result["results"]], ["p1"])

    def test_recommendations_endpoint_teaches_the_caller_what_it_did(self):
        LikedSong.objects.create(user=self.user, song_id="liked-1", title="T", artist="Alpha")
        with mock.patch.object(
            upstream, "search_many", return_value={"Alpha": [song("a1", "Alpha")]}
        ):
            response = self.client.get("/api/recommendations/?user_id=listener&limit=2")

        payload = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertTrue(payload["personalized"])
        self.assertEqual(payload["basedOn"], ["Alpha"])

    def test_endless_radio_excludes_what_was_just_played(self):
        buckets = {"Alpha": [song("played", "Alpha"), song("fresh", "Alpha")]}
        with mock.patch.object(upstream, "search_many", return_value=buckets):
            response = self.client.get("/api/radio/?artist=Alpha&exclude=played&limit=5")

        ids = [item["id"] for item in response.json()["results"]]
        self.assertEqual(ids, ["fresh"])


class HelperTests(TestCase):
    def test_split_artists_dedupes_and_trims(self):
        self.assertEqual(views._split_artists("A, B ,A,, "), ["A", "B"])
        self.assertEqual(views._split_artists(None), [])
        self.assertEqual(views._split_artists(""), [])

    def test_limit_is_clamped(self):
        self.assertEqual(views._limit(None, default=24), 24)
        self.assertEqual(views._limit("not-a-number", default=24), 24)
        self.assertEqual(views._limit("10"), 10)
        self.assertEqual(views._limit("0"), 1)
        self.assertEqual(views._limit("9999"), views.MAX_LIMIT)

    def test_dedupe_preserves_order_and_drops_junk(self):
        songs = [song("b", "A"), song("a", "A"), song("b", "A"), None, {"id": ""}]
        self.assertEqual([s["id"] for s in views._dedupe(songs)], ["b", "a"])
