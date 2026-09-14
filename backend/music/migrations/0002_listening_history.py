from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("music", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ListeningHistory",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("song_id", models.CharField(max_length=100)),
                ("title", models.CharField(max_length=255)),
                ("artist", models.CharField(max_length=255)),
                ("cover", models.URLField(blank=True, null=True)),
                ("play_count", models.PositiveIntegerField(default=1)),
                ("last_played", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="history",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-last_played"],
                "unique_together": {("user", "song_id")},
            },
        ),
        migrations.AddField(
            model_name="playlistsong",
            name="position",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AlterModelOptions(
            name="likedsong",
            options={"ordering": ["-added_at"]},
        ),
        migrations.AlterModelOptions(
            name="playlist",
            options={"ordering": ["-created_at"]},
        ),
        migrations.AlterModelOptions(
            name="playlistsong",
            options={"ordering": ["position", "added_at"]},
        ),
    ]
