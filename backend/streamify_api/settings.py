"""Django settings for the Streamify API.

Every value that was configurable before keeps its original env key name.
"""

import logging
import os
from pathlib import Path

import dj_database_url
from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


def _flag(name, default=False):
    """Env values arrive as strings, and bool("False") is True — parse properly."""
    raw = os.environ.get(name)
    if raw is None or raw.strip() == "":
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


DEBUG = _flag("DEBUG", default=True)

# The shipped .env template documents SECRET_KEY while older deployments set
# DJANGO_SECRET_KEY. Accept either rather than make anyone rename a secret.
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY") or os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    if not DEBUG:
        raise ImproperlyConfigured("Set DJANGO_SECRET_KEY (or SECRET_KEY) in the environment.")
    SECRET_KEY = "django-insecure-development-only-key"
    logging.getLogger(__name__).warning(
        "SECRET_KEY is unset; falling back to the insecure development key."
    )

ALLOWED_HOSTS = [".onrender.com", "localhost", "127.0.0.1", "[::1]"]

# Next.js serves the browser and proxies /api/* to this process over loopback, so
# Django normally only ever sees the hosts above. These entries additionally
# allow a directly-addressed Django (local dev, other Render services).
CSRF_TRUSTED_ORIGINS = [
    "https://*.onrender.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

# The browser is same-origin with Next in every supported setup, so CORS is only
# widened for local development instead of being open to the world.
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_ALLOWED_ORIGIN_REGEXES = [r"^https://[\w-]+\.onrender\.com$"]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "music",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "streamify_api.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "streamify_api.wsgi.application"

# A Render Postgres instance (DATABASE_URL) is what makes a library survive a
# deploy; SQLite stays the zero-config local default.
DATABASES = {
    "default": dj_database_url.config(
        default=os.environ.get("DATABASE_URL", "sqlite:///" + str(BASE_DIR / "db.sqlite3")),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
# Compressed, not manifest-hashed: a missing asset reference should degrade to a
# 404 in the admin, never break the whole deploy with MissingFileError.
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedStaticFilesStorage"},
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Render terminates TLS in front of the container.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
if not DEBUG:
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework.authentication.SessionAuthentication",),
    "DEFAULT_RENDERER_CLASSES": ("rest_framework.renderers.JSONRenderer",),
    # These endpoints proxy a third-party API, so keep a ceiling on how hard a
    # single anonymous client can push it.
    "DEFAULT_THROTTLE_CLASSES": ("rest_framework.throttling.AnonRateThrottle",),
    "DEFAULT_THROTTLE_RATES": {"anon": "600/min"},
}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {"simple": {"format": "[{levelname}] {name}: {message}", "style": "{"}},
    "handlers": {"console": {"class": "logging.StreamHandler", "formatter": "simple"}},
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "django.request": {"handlers": ["console"], "level": "ERROR", "propagate": False},
    },
}

# --------------------------------------------------------------------------- #
# Data-loss guard
# --------------------------------------------------------------------------- #

# SQLite is the zero-config local default, but on a host with an ephemeral
# filesystem — Render included — the container is replaced on every deploy, so
# likes, playlists and listening history silently start from empty each time.
# That is invisible until someone notices their library has vanished, so say it
# loudly at startup instead. Deliberately a warning and not a hard failure:
# refusing to boot would take /api/health down with it and fail the deploy.
if not DEBUG and DATABASES["default"]["ENGINE"].endswith("sqlite3"):
    logging.getLogger(__name__).warning(
        "DATABASE_URL is not set, so this deployment is running on SQLite. On a host "
        "with an ephemeral filesystem every deploy resets the database and the whole "
        "library is lost. Attach a Postgres instance and set DATABASE_URL to persist it."
    )
