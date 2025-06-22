from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class LikedSong(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='liked_songs')
    song_id = models.CharField(max_length=100)
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    cover = models.URLField(blank=True, null=True)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'song_id')

class Playlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='playlists')
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

class PlaylistSong(models.Model):
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE, related_name='songs')
    song_id = models.CharField(max_length=100)
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    cover = models.URLField(blank=True, null=True)
    added_at = models.DateTimeField(auto_now_add=True)
