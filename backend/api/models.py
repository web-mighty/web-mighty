from django.db import models
from django.db.utils import Error as ModelError
from django.contrib.auth.models import User


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    nickname = models.CharField(max_length=100)
    avatar = models.ImageField(upload_to='avatars/')
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
