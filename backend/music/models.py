from django.contrib.auth.models import User
from django.db import models


class LikedSong(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="liked_songs")
    song_id = models.CharField(max_length=100)
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    cover = models.URLField(blank=True, null=True)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "song_id")
        ordering = ["-added_at"]
        # Every read is "this user's songs, newest first", so the composite index
        # serves both halves. `unique_together` only covers (user, song_id) and
        # leaves the sort to a filesort.
        indexes = [models.Index(fields=["user", "-added_at"], name="liked_user_added_idx")]

    def __str__(self):
        return f"{self.title} — {self.artist}"


class ListeningHistory(models.Model):
    """Every play a user has made.

    This is the signal behind personalised recommendations: the artists a user
    actually listens to weigh more than the ones they merely liked once.
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="history")
    song_id = models.CharField(max_length=100)
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    cover = models.URLField(blank=True, null=True)
    play_count = models.PositiveIntegerField(default=1)
    last_played = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "song_id")
        ordering = ["-last_played"]
        # Read on every recommendation build: "this user's most recent plays".
        indexes = [models.Index(fields=["user", "-last_played"], name="hist_user_played_idx")]

    def __str__(self):
        return f"{self.title} ({self.play_count} plays)"


class Playlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="playlists")
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        # The library lists a user's playlists, newest first, with a song count.
        indexes = [models.Index(fields=["user", "-created_at"], name="list_user_created_idx")]

    def __str__(self):
        return self.name


class PlaylistSong(models.Model):
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE, related_name="songs")
    song_id = models.CharField(max_length=100)
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    cover = models.URLField(blank=True, null=True)
    position = models.PositiveIntegerField(default=0)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["position", "added_at"]
        indexes = [
            # Reading a playlist is an ordered fetch of its rows; the foreign key
            # index alone would still sort them in memory.
            models.Index(fields=["playlist", "position"], name="plsong_list_pos_idx"),
            # Add/remove/reorder all look a track up inside one playlist.
            models.Index(fields=["playlist", "song_id"], name="plsong_list_song_idx"),
        ]

    def __str__(self):
        return f"{self.title} in {self.playlist.name}"
