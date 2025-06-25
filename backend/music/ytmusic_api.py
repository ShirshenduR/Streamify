from ytmusicapi import YTMusic
import yt_dlp
import os
import json
import logging
import tempfile
from dotenv import load_dotenv

load_dotenv()

# Load minified JSON headers from .env
headers_json = os.getenv("YTMUSIC_HEADERS")
yt = None
if headers_json:
    try:
        headers_dict = json.loads(headers_json)
        yt = YTMusic(auth=headers_dict)
    except Exception as e:
        logging.error(f"Failed to initialize YTMusic with env headers: {e}")
        yt = YTMusic()
else:
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

def write_cookies_txt_from_env(cookie_string):
    cookies = [c.strip() for c in cookie_string.split(';') if '=' in c]
    lines = []
    for c in cookies:
        name, value = c.split('=', 1)
        # Format: domain, flag, path, secure, expiration, name, value
        lines.append(
            '\tmusic.youtube.com\tTRUE\t/\tTRUE\t9999999999\t{}\t{}'.format(name.strip(), value.strip())
        )
    content = '# Netscape HTTP Cookie File\n' + '\n'.join(lines)
    tmp = tempfile.NamedTemporaryFile('w+', delete=False)
    tmp.write(content)
    tmp.flush()
    return tmp.name

def get_ytmusic_download(video_id):
    ytm_url = f'https://music.youtube.com/watch?v={video_id}'
    ydl_opts = {
        'format': 'bestaudio/best',
        'quiet': True,
        'skip_download': True,
        'forceurl': True,
        'noplaylist': True,
    }
    cookie_string = os.environ.get('YTMUSIC_COOKIE')
    cookie_file = None
    if cookie_string:
        cookie_file = write_cookies_txt_from_env(cookie_string)
        ydl_opts['cookies'] = cookie_file
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(ytm_url, download=False)
            url = info['url'] if 'url' in info else None
            return {'url': url}
        except Exception as e:
            return {'error': str(e)}
        finally:
            if cookie_file:
                os.unlink(cookie_file)
