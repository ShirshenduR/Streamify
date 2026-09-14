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

    def __str__(self):
        return f"{self.title} ({self.play_count} plays)"


class Playlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="playlists")
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

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

    def __str__(self):
        return f"{self.title} in {self.playlist.name}"
