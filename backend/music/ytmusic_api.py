from ytmusicapi import YTMusic
import yt_dlp

yt = YTMusic()

def search_ytmusic(query):
    try:
        results = yt.search(query, filter='songs')
        return {'result': [
            {
                'videoId': s.get('videoId'),
                'title': s.get('title'),
                'artists': ', '.join([a['name'] for a in s.get('artists', [])]),
                'thumbnails': s.get('thumbnails', []),
                'album': s.get('album', {}).get('name', ''),
                'duration': s.get('duration'),
            }
            for s in results if s.get('videoId')
        ]}
    except Exception as e:
        return {'error': str(e)}

def get_ytmusic_song(video_id):
    try:
        info = yt.get_song(video_id)
        return info
    except Exception as e:
        return {'error': str(e)}

def get_ytmusic_download(video_id):
    ytm_url = f'https://music.youtube.com/watch?v={video_id}'
    ydl_opts = {
        'format': 'bestaudio/best',
        'quiet': True,
        'skip_download': True,
        'forceurl': True,
        'noplaylist': True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(ytm_url, download=False)
            url = info['url'] if 'url' in info else None
            return {'url': url}
        except Exception as e:
            return {'error': str(e)}
