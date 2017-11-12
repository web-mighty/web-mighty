from django.core.cache import cache
from datetime import datetime
import hashlib
import uuid


def get_all_room():
    all_room = cache.get('room:room_list', {})
    return list(all_room.values())


def get_room(room_id):
    all_room = cache.get('room:room_list', {})
    return all_room.get(room_id, None)


def create_room(**kwargs):
    id = str(uuid.uuid4())
    title = kwargs.get('title', None)
    password = kwargs.get('password', None)
    if password is not None:
        password = hashlib.sha256(
            bytes(password, encoding='utf=8')).hexdigest()

    if not all([title, ]):
        return False

    room_data = {
        'id': id,
        'title': title,
        'password': password,
        'created': datetime.now()
    }

    all_room = cache.get('room:room_list', {})
    all_room[id] = room_data

    cache.set('room:room_list', all_room)
    cache.set('room:' + id, room_data)
    return True
