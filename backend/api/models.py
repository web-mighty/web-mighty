from django.db import models
from django.db.utils import Error as ModelError
from django.contrib.auth.models import User
from django.dispatch import receiver
from django.db.models.signals import pre_save, post_delete
from django.core.cache import cache
from backend.settings import BASE_DIR, DEFAULT_AVATAR_NAME
from django.core.files import File
from websocket.consumers.consumer_utils import new_room_data
import os


class Room(models.Model):
    room_id = models.CharField(max_length=40, unique=True)
    title = models.CharField(max_length=100)
    is_private = models.BooleanField()
    password = models.CharField(max_length=120)
    created = models.DateTimeField(auto_now=True)
    player_count = models.SmallIntegerField(default=0)

    # Options
    player_number = models.SmallIntegerField(default=0)

    class Meta:
        ordering = ('created',)

    @classmethod
    @receiver(pre_save, sender='api.Room')
    def room_save_handler(sender, instance, **kwargs):
        room_id = instance.room_id
        room = cache.get('room:' + room_id)

        if room:
            return

        player_number = instance.player_number

        room_data = new_room_data(
            room_id=room_id,
            player_number=player_number,
        )

        cache.set('room:' + room_id, room_data)

    @classmethod
    @receiver(post_delete, sender='api.Room')
    def room_delete_handler(sender, instance, **kwargs):
        cache.delete('room:' + instance.room_id)


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    nickname = models.CharField(max_length=100)
    avatar = models.ImageField(upload_to='avatar')
    created = models.DateTimeField(auto_now=True)


class GameHistory(models.Model):
    SPADE = 'S'
    DIAMOND = 'D'
    CLUB = 'C'
    HEART = 'H'
    NO_GIRUDA = 'N'
    GIRUDA_CHOICE = (
        (SPADE, 'Spade'),
        (DIAMOND, 'Diamond'),
        (CLUB, 'Club'),
        (HEART, 'Heart'),
        (NO_GIRUDA, 'No Giruda'),
    )
    play_date = models.DateTimeField(auto_now=True)
    players = models.ManyToManyField(User, related_name='game_histories')
    president = models.ForeignKey(User, related_name='president_histories')
    friend = models.ForeignKey(User, null=True, related_name='friend_histories')
    bid = models.SmallIntegerField()
    giruda = models.CharField(max_length=1, choices=GIRUDA_CHOICE)
    score = models.SmallIntegerField()


def create_user(**kwargs):
    try:
        new_user = User.objects.create_user(
            username=kwargs['username'],
            password=kwargs['password'],
            email=kwargs['email'],
            is_active=kwargs.get('is_active', True),
        )

        with open(os.path.join(BASE_DIR, 'static', DEFAULT_AVATAR_NAME), 'rb') as f:
            avatar_file = File(f)
            avatar_file.name = '_'.join([kwargs['username'], DEFAULT_AVATAR_NAME])
            Profile.objects.create(
                user=new_user,
                nickname=kwargs['nickname'],
                avatar=avatar_file,
            )
        return new_user
    except ModelError:
        return None
