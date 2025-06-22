from django.urls import path
from . import views

urlpatterns = [
    path('search/', views.search_songs, name='search_songs'),
    path('search/combined/', views.combined_search, name='combined_search'),
    path('song/', views.song_details, name='song_details'),
    path('download/', views.download_song, name='download_song'),
    path('ytmusic/search/', views.search_ytmusic_view, name='search_ytmusic'),
    path('ytmusic/song/', views.ytmusic_song_details, name='ytmusic_song_details'),
    path('ytmusic/download/', views.ytmusic_download_song, name='ytmusic_download_song'),
    path('like/', views.like_song, name='like_song'),
    path('unlike/', views.unlike_song, name='unlike_song'),
    path('liked/', views.liked_songs, name='liked_songs'),
    path('playlists/', views.playlists, name='playlists'),
    path('playlists/<str:playlist_id>/', views.playlist_detail, name='playlist_detail'),
]
