from django.contrib import admin

from .models import LikedSong, ListeningHistory, Playlist, PlaylistSong


@admin.register(LikedSong)
class LikedSongAdmin(admin.ModelAdmin):
    list_display = ("title", "artist", "user", "added_at")
    search_fields = ("title", "artist", "song_id", "user__username")
    list_filter = ("added_at",)


@admin.register(ListeningHistory)
class ListeningHistoryAdmin(admin.ModelAdmin):
    list_display = ("title", "artist", "user", "play_count", "last_played")
    search_fields = ("title", "artist", "song_id", "user__username")
    list_filter = ("last_played",)


class PlaylistSongInline(admin.TabularInline):
    model = PlaylistSong
    extra = 0


@admin.register(Playlist)
class PlaylistAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "created_at")
    search_fields = ("name", "user__username")
    inlines = (PlaylistSongInline,)
