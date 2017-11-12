from django.core.cache import cache
from datetime import datetime
from .models import Room
from django.dispatch import receiver
from django.db.models.signals import pre_save, post_delete
import hashlib
import uuid


@receiver(pre_save, sender=Room)
def room_save_handler(sender, **kwargs):
    pass


@receiver(post_delete, sender=Room)
def room_delete_handler(sender, **kwargs):
    pass


def get_room_list(page, count_per_page):
    rooms = Room.objects.all()
    start = page * count_per_page
    end = (page + 1) * count_per_page
    selected_rooms = rooms[start:end].values('room_id', 'title', 'is_private')

    return selected_rooms


def create_room(**kwargs):
    room_id = str(uuid.uuid4())
    title = kwargs.get('title', None)
    password = kwargs.get('password', None)

    if password is not None:
        password = hashlib.sha256(
            bytes(password, encoding='utf=8')).hexdigest()
    else:
        password = ''

    if not all([title, ]):
        return False

    new_room = Room(
        room_id=room_id,
        title=title,
        password=password,
        is_private=bool(password),
    )

    new_room.save()

    result_data = {
        'room_id': room_id,
        'title': title,
        'is_private': bool(password),
    }

    return result_data
