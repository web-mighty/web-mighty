from django.db import models
from django.db.utils import Error as ModelError
from django.contrib.auth.models import User
from django.dispatch import receiver
from django.db.models.signals import pre_save, post_delete
from django.core.cache import cache


class Room(models.Model):
    room_id = models.CharField(max_length=40, unique=True)
    title = models.CharField(max_length=100)
    is_private = models.BooleanField()
    password = models.CharField(max_length=64)
    created = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('created',)

    @classmethod
    @receiver(pre_save, sender='api.Room')
    def room_save_handler(sender, instance, **kwargs):
        room_id = instance.room_id
        room_data = {
            'room_id': room_id,
            'users': [],
        }
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
    friend = models.ForeignKey(User, related_name='friend_histories')
    giruda = models.CharField(max_length=1, choices=GIRUDA_CHOICE)
    bid = models.SmallIntegerField()
    score = models.SmallIntegerField()


def create_user(**kwargs):
    try:
        new_user = User.objects.create_user(
            username=kwargs['username'],
            password=kwargs['password'],
            email=kwargs['email'],
        )

        Profile.objects.create(
            user=new_user,
            nickname=kwargs['nickname'],
        )
        return new_user
    except ModelError:
        return None
