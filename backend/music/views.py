from django.shortcuts import render
import requests
from django.http import JsonResponse
from rest_framework.decorators import api_view
from .models import LikedSong, Playlist, PlaylistSong
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt

JIOSAAVN_API = 'https://saavn.dev/api'

@api_view(['GET'])
def search_songs(request):
    query = request.GET.get('q')
    resp = requests.get(f'{JIOSAAVN_API}/search/songs', params={'query': query})
    return JsonResponse(resp.json(), safe=False)

@api_view(['GET'])
def song_details(request):
    song_id = request.GET.get('id')
    resp = requests.get(f'{JIOSAAVN_API}/songs', params={'id': song_id})
    return JsonResponse(resp.json(), safe=False)

@api_view(['GET'])
def download_song(request):
    song_id = request.GET.get('id')
    if not song_id:
        return JsonResponse({'error': 'No song id provided'}, status=400)
    api_url = f'{JIOSAAVN_API}/songs/{song_id}'
    resp = requests.get(api_url)
    data = resp.json()
    url = None
    if data and isinstance(data, dict) and 'data' in data and isinstance(data['data'], list) and len(data['data']) > 0:
        song = data['data'][0]
        download_urls = song.get('downloadUrl')
        if isinstance(download_urls, list):
            qualities = ['320kbps', '160kbps', '96kbps', '48kbps', '12kbps']
            for q in qualities:
                for item in download_urls:
                    if item.get('quality') == q and item.get('url'):
                        url = item['url']
                        break
                if url:
                    break
            if not url and len(download_urls) > 0:
                url = download_urls[0].get('url')
        if not url:
            url = (
                song.get('media_url') or
                song.get('perma_url') or
                (song.get('url') if isinstance(song.get('url'), str) else None)
            )
    return JsonResponse({'url': url})

@api_view(['POST'])
@csrf_exempt
def like_song(request):
    data = request.data
    song_id = data.get('song_id')
    title = data.get('title')
    artist = data.get('artist')
    cover = data.get('cover')
    user = request.user if request.user.is_authenticated else None
    if not user:
        user_id = data.get('user_id')
        if user_id:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                user = User.objects.get(username=user_id)
            except User.DoesNotExist:
                user = User.objects.create_user(username=user_id[:150], password=None)
    if not user:
        return JsonResponse({'error': 'User required'}, status=400)
    if not song_id:
        return JsonResponse({'error': 'song_id required'}, status=400)
    if not title:
        return JsonResponse({'error': 'title required'}, status=400)
    if not artist:
        return JsonResponse({'error': 'artist required'}, status=400)
    LikedSong.objects.get_or_create(
        user=user,
        song_id=song_id,
        defaults={'title': title, 'artist': artist, 'cover': cover}
    )
    return JsonResponse({'status': 'liked'}, status=201)

@api_view(['POST', 'DELETE'])
@csrf_exempt
def unlike_song(request):
    data = request.data if request.method == 'POST' else request.GET
    song_id = data.get('song_id')
    user_id = data.get('user_id')
    if not user_id or not song_id:
        return JsonResponse({'error': 'user_id and song_id required'}, status=400)
    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        user = User.objects.get(username=user_id)
    except Exception:
        return JsonResponse({'error': 'User not found'}, status=400)
    from .models import LikedSong
    LikedSong.objects.filter(user=user, song_id=song_id).delete()
    return JsonResponse({'status': 'unliked'})

@api_view(['GET'])
@csrf_exempt
def liked_songs(request):
    user = request.user if request.user.is_authenticated else None
    user_id = request.GET.get('user_id')
    if not user and user_id:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(username=user_id)
        except Exception:
            user = None
    if not user:
        return JsonResponse({'songs': []})
    liked = LikedSong.objects.filter(user=user).order_by('-added_at')
    songs = [
        {
            'id': s.song_id,
            'title': s.title,
            'artist': s.artist,
            'cover': s.cover
        } for s in liked
    ]
    return JsonResponse({'songs': songs})

@api_view(['GET', 'POST'])
@csrf_exempt
def playlists(request):
    user = request.user if request.user.is_authenticated else None
    if request.method == 'POST':
        name = request.data.get('name')
        playlist = Playlist.objects.create(user=user, name=name)
        return JsonResponse({'id': playlist.id, 'name': playlist.name})
    user_playlists = Playlist.objects.filter(user=user)
    data = [
        {'id': p.id, 'name': p.name, 'created_at': p.created_at} for p in user_playlists
    ]
    return JsonResponse({'playlists': data})

@api_view(['GET', 'PATCH'])
@csrf_exempt
def playlist_detail(request, playlist_id):
    user = request.user if request.user.is_authenticated else None
    try:
        playlist = Playlist.objects.get(id=playlist_id, user=user)
    except Playlist.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)
    if request.method == 'PATCH':
        playlist.name = request.data.get('name', playlist.name)
        playlist.save()
    songs = [
        {
            'id': s.song_id,
            'title': s.title,
            'artist': s.artist,
            'cover': s.cover
        } for s in playlist.songs.all()
    ]
    return JsonResponse({'id': playlist.id, 'name': playlist.name, 'songs': songs})
