from django.urls import path
from . import views

urlpatterns = [
    path('search/', views.search_songs, name='search_songs'),
    path('song/', views.song_details, name='song_details'),
    path('download/', views.download_song, name='download_song'),
    # Placeholder endpoints for likes and playlists
    path('like/', views.like_song, name='like_song'),
    path('unlike/', views.unlike_song, name='unlike_song'),
    path('liked/', views.liked_songs, name='liked_songs'),
    path('playlists/', views.playlists, name='playlists'),
    path('playlists/<str:playlist_id>/', views.playlist_detail, name='playlist_detail'),
]
