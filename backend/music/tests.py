"""Tests for the Streamify API.

The upstream music API is rate limited, so the parsing and recommendation logic is
covered with fixtures and monkeypatched responses rather than live calls. That
keeps the suite fast, deterministic and runnable offline.
"""

import json
import os
import time
from unittest import mock

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from . import upstream, views
from .models import LikedSong, ListeningHistory, Playlist, PlaylistSong

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
                "language": "hindi",
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
        self.assertEqual(normalised["language"], "hindi")
        self.assertEqual(normalised["source"], "jiosaavn")

    def test_language_is_empty_rather_than_missing_when_absent(self):
        """The UI reads this field, so it must always be a string."""
        self.assertEqual(upstream._normalise({"id": "x"})["language"], "")

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
        # Keyed off the configured seed query rather than a literal, so changing
        # the seeds cannot quietly turn this into a test of nothing.
        buckets = {views.MOODS[0]["query"]: [song("p1", "Pop Star")]}
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


class UpstreamCooldownTests(TestCase):
    """The upstream is a WAF-fronted third party that bans whole networks.

    Retrying into a block keeps it alive and makes every shelf look broken, so a
    refusal must open a cooldown instead.
    """

    def setUp(self):
        upstream.clear_cooldown()
        with upstream._cache_lock:
            upstream._cache.clear()

    def tearDown(self):
        upstream.clear_cooldown()
        with upstream._cache_lock:
            upstream._cache.clear()

    @staticmethod
    def _blocked_response():
        return mock.Mock(status_code=429, ok=False, text="error code: 1027", headers={})

    def test_a_refusal_opens_a_cooldown_and_stops_further_calls(self):
        with mock.patch.object(
            upstream.requests, "get", return_value=self._blocked_response()
        ) as get:
            self.assertEqual(upstream.search("kesariya", 1), [])
            self.assertEqual(get.call_count, 1)
            # Short-circuits: the block is not hammered.
            self.assertEqual(upstream.search("kesariya", 1), [])
            self.assertEqual(get.call_count, 1)

        state = upstream.availability()
        self.assertFalse(state["available"])
        self.assertGreater(state["retryIn"], 0)
        self.assertIn("1027", state["reason"] or "")

    def test_a_network_error_also_opens_a_cooldown(self):
        with mock.patch.object(
            upstream.requests, "get", side_effect=upstream.requests.ConnectionError("boom")
        ):
            self.assertEqual(upstream.search("anything", 1), [])
        self.assertFalse(upstream.availability()["available"])

    def test_a_server_error_opens_a_cooldown(self):
        response = mock.Mock(status_code=503, ok=False, text="unavailable", headers={})
        with mock.patch.object(upstream.requests, "get", return_value=response):
            self.assertEqual(upstream.search("anything", 1), [])
        self.assertFalse(upstream.availability()["available"])

    def test_clear_cooldown_reports_healthy_again(self):
        upstream._open_cooldown("HTTP 429: error code: 1027")
        self.assertFalse(upstream.availability()["available"])

        upstream.clear_cooldown()

        self.assertTrue(upstream.availability()["available"])
        self.assertIsNone(upstream.availability()["reason"])

    def test_empty_results_use_the_short_ttl(self):
        """A failed lookup must not sit in the cache for the full TTL."""
        with mock.patch.object(upstream, "_request", return_value={"data": {"results": []}}):
            upstream.search("nothing-here", 1)

        expires_at = upstream._cache["search:nothing-here:1"][0]
        self.assertLessEqual(expires_at - time.time(), upstream.EMPTY_RESULT_TTL + 1)

    def test_refresh_bypasses_the_cooldown_but_a_plain_request_does_not(self):
        upstream._open_cooldown("HTTP 429: error code: 1027")
        with mock.patch.object(
            upstream.requests, "get", side_effect=upstream.requests.ConnectionError("x")
        ) as get:
            self.client.get("/api/search/?q=test")
            self.assertEqual(get.call_count, 0, "a cooled-down request must not hit the network")

            self.client.get("/api/search/?q=test&refresh=1")
            self.assertEqual(get.call_count, 1, "refresh=1 should retry immediately")

    def test_the_api_reports_the_outage_to_the_client(self):
        upstream._open_cooldown("HTTP 429: error code: 1027")
        payload = self.client.get("/api/search/?q=test").json()
        self.assertTrue(payload["unavailable"])
        self.assertGreater(payload["retryIn"], 0)


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


class CatalogueUrlTests(TestCase):
    """The catalogue host is configurable, and that is load-bearing.

    JioSaavn scopes its search index by region: from outside India the search
    endpoint returns unlicensed instrumental covers and omits the licensed
    originals. Deployments therefore have to be able to point at a host running
    in India, while still working unconfigured.
    """

    def test_defaults_to_the_api_bundled_in_the_container(self):
        without = {key: value for key, value in os.environ.items() if key != "SAAVN_API_URL"}
        with mock.patch.dict(os.environ, without, clear=True):
            self.assertEqual(upstream._catalogue_url(), "http://127.0.0.1:8123/api")

    def test_follows_the_configured_url(self):
        with mock.patch.dict(os.environ, {"SAAVN_API_URL": "https://example.test/api"}):
            self.assertEqual(upstream._catalogue_url(), "https://example.test/api")

    def test_trailing_slash_does_not_double_up(self):
        """Paths are appended to this, so a stray slash would give //search/songs."""
        with mock.patch.dict(os.environ, {"SAAVN_API_URL": "https://example.test/api/"}):
            self.assertEqual(upstream._catalogue_url(), "https://example.test/api")

    def test_an_empty_value_falls_back_to_the_bundled_api(self):
        """An unset variable on Render arrives as an empty string."""
        with mock.patch.dict(os.environ, {"SAAVN_API_URL": ""}):
            self.assertEqual(upstream._catalogue_url(), "http://127.0.0.1:8123/api")


class IndexTests(TestCase):
    """Guard the indexes behind the hot read paths.

    Every one of these reads is "filter by owner, ordered by a timestamp", so a
    plain foreign-key index would still sort in memory. The declarations are easy
    to drop by accident and nothing else would fail, so assert them directly.
    """

    def test_owner_scoped_reads_declare_a_composite_index(self):
        expected = {
            LikedSong: ("user", "-added_at"),
            ListeningHistory: ("user", "-last_played"),
            Playlist: ("user", "-created_at"),
        }
        for model, fields in expected.items():
            declared = [tuple(index.fields) for index in model._meta.indexes]
            self.assertIn(fields, declared, f"{model.__name__} lost its index")

    def test_playlist_songs_are_indexed_for_reading_and_lookup(self):
        declared = [tuple(index.fields) for index in PlaylistSong._meta.indexes]
        # Ordered read of one playlist.
        self.assertIn(("playlist", "position"), declared)
        # Add / remove / reorder look a track up inside one playlist.
        self.assertIn(("playlist", "song_id"), declared)


class ShelfQualityTests(TestCase):
    """Seeded browse queries repeat artists badly; shelves must not look broken."""

    def test_one_artist_cannot_fill_a_shelf(self):
        songs = [song(f"d{index}", "Derrol") for index in range(5)]
        songs.append(song("other", "Someone Else"))
        capped = views._cap_per_artist(songs, limit=4)
        self.assertEqual([s["artist"] for s in capped], ["Derrol", "Derrol", "Someone Else"])

    def test_the_cap_respects_the_limit(self):
        songs = [song(str(index), f"Artist {index}") for index in range(10)]
        self.assertEqual(len(views._cap_per_artist(songs, limit=3)), 3)

    def test_the_lead_artist_is_what_counts(self):
        """'A, B' and 'A, C' are the same act taking two slots, not two acts."""
        songs = [
            song("1", "Arijit Singh, Pritam"),
            song("2", "Arijit Singh, Shreya Ghoshal"),
            song("3", "Arijit Singh, Someone"),
        ]
        self.assertEqual(len(views._cap_per_artist(songs, limit=5)), 2)

    def test_cap_tolerates_missing_artists(self):
        songs = [song("1", ""), song("2", ""), song("3", "Real")]
        self.assertEqual(len(views._cap_per_artist(songs, limit=5)), 3)

    def test_discover_applies_the_cap_to_every_section(self):
        repeated = [song(f"s{index}", "Same Artist") for index in range(8)]
        buckets = {section["query"]: repeated for section in views.DISCOVER_SECTIONS}
        with mock.patch.object(upstream, "search_many", return_value=buckets):
            payload = self.client.get("/api/discover/?limit=6").json()

        self.assertTrue(payload["sections"], "expected at least one shelf")
        for section in payload["sections"]:
            artists = [item["artist"] for item in section["songs"]]
            self.assertLessEqual(artists.count("Same Artist"), 2, section["title"])

    def test_international_queries_are_present(self):
        """Regression guard: these were measured, so tidying them away would
        quietly make the whole browse experience India-only again."""
        queries = " ".join(section["query"] for section in views.DISCOVER_SECTIONS)
        self.assertIn("english", queries)
        self.assertIn("rock", queries)
        # The phrasings that were tested and rejected, because they resolve back
        # into the Indian catalogue.
        self.assertNotIn("international hits", queries)
        self.assertNotIn("global hits", queries)

    def test_mood_tiles_keep_their_labels(self):
        """The frontend keys its gradient tiles off the labels."""
        labels = [mood["label"] for mood in views.MOODS]
        for expected in ("Pop", "Rock", "Indie", "Electronic", "Bollywood"):
            self.assertIn(expected, labels)
